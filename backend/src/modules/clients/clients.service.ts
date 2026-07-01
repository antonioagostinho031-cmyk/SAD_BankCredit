import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClientsRepository } from './clients.repository';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { SupabaseService } from '../../database/supabase.service';

// ── Elegibilidade ─────────────────────────────────────────────────────────────

export interface EligibilityRequirement {
  code: string;
  label: string;
  status: 'met' | 'missing';
  detail?: string;
}

export interface EligibilityEvaluation {
  eligible: boolean;
  verified_income: number | null;
  missing: EligibilityRequirement[];
  met: EligibilityRequirement[];
  checked_at: string;
}

const IDENTITY_DOC_TYPES  = ['bi', 'passaporte', 'cartao_residente'];
const EMPLOYER_DOC_TYPES  = ['comprovativo_vinculo', 'comprovativo_rendimento'];

export interface AccountUpdateStatus {
  has_updated_account: boolean;
  missing_identity: boolean;
  missing_employer: boolean;
}

@Injectable()
export class ClientsService {
  constructor(
    private clientsRepository: ClientsRepository,
    private supabase: SupabaseService,
  ) {}

  async create(createClientDto: CreateClientDto) {
    const existingByBI = await this.clientsRepository.findByBI(createClientDto.bi_number);
    if (existingByBI) {
      throw new BadRequestException('Já existe um cliente com este número de BI');
    }

    const existingByNIF = await this.clientsRepository.findByNIF(createClientDto.nif);
    if (existingByNIF) {
      throw new BadRequestException('Já existe um cliente com este NIF');
    }

    return this.clientsRepository.create(createClientDto);
  }

  async findAll(filters?: any) {
    return this.clientsRepository.findAll(filters);
  }

  async findOne(id: string) {
    const client = await this.clientsRepository.findOne(id);
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async findByUserId(userId: string) {
    return this.clientsRepository.findByUserId(userId);
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    await this.findOne(id);

    if (updateClientDto.bi_number) {
      const existing = await this.clientsRepository.findByBI(updateClientDto.bi_number);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Já existe um cliente com este número de BI');
      }
    }

    if (updateClientDto.nif) {
      const existing = await this.clientsRepository.findByNIF(updateClientDto.nif);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Já existe um cliente com este NIF');
      }
    }

    return this.clientsRepository.update(id, updateClientDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.clientsRepository.remove(id);
  }

  async updateEligibility(id: string, isEligible: boolean) {
    await this.findOne(id);
    return this.clientsRepository.updateEligibility(id, isEligible);
  }

  async updateRegistrationStatus(id: string, status: string) {
    await this.findOne(id);
    return this.clientsRepository.updateRegistrationStatus(id, status);
  }

  async getClientStats(id: string) {
    const client = await this.findOne(id);
    return {
      client,
      stats: {
        account_balance:     client.account_balance,
        monthly_income:      client.monthly_income,
        is_eligible:         client.is_eligible_for_credit,
        registration_status: client.registration_status,
      },
    };
  }

  // ── Avaliação automática de elegibilidade ─────────────────

  /**
   * Avalia se o cliente cumpre os requisitos mínimos para crédito.
   *
   * Requisitos:
   *   1. Número de BI registado no perfil
   *   2. Dados da entidade patronal verificados e actualizados
   *      (employment_data com is_current=true, employer_name e monthly_income > 0)
   *      → confirmado pelo gestor ao aprovar o pedido de actualização de conta
   *
   * Actualiza automaticamente `is_eligible_for_credit` e `registration_status`.
   */
  async evaluateEligibility(clientId: string): Promise<EligibilityEvaluation> {
    const met: EligibilityRequirement[]     = [];
    const missing: EligibilityRequirement[] = [];

    const client = await this.clientsRepository.findOne(clientId);
    if (!client) throw new NotFoundException('Cliente não encontrado');

    // ── Requisito 1: Documento de identidade (BI registado) ───────────────────
    if (client.bi_number && client.bi_number.trim().length > 0) {
      met.push({
        code:   'identity',
        label:  'Bilhete de Identidade',
        status: 'met',
        detail: `BI: ${client.bi_number}`,
      });
    } else {
      missing.push({
        code:   'identity',
        label:  'Bilhete de Identidade',
        status: 'missing',
        detail: 'Número de BI não registado. Submeta um pedido de actualização de conta com o BI.',
      });
    }

    // ── Requisito 2: Dados de entidade patronal verificados ───────────────────
    const employment = await this.clientsRepository.findCurrentEmployment(clientId);
    const hasEmployment = !!(
      employment &&
      employment.employer_name &&
      employment.employer_name.trim().length > 0 &&
      (employment.monthly_income ?? 0) > 0
    );

    if (hasEmployment) {
      met.push({
        code:   'employer_data',
        label:  'Dados da entidade patronal',
        status: 'met',
        detail: `${employment.employer_name}${employment.job_title ? ' — ' + employment.job_title : ''} | ${Math.round(employment.monthly_income).toLocaleString('pt-AO')} AOA/mês`,
      });
    } else {
      missing.push({
        code:   'employer_data',
        label:  'Dados da entidade patronal',
        status: 'missing',
        detail: 'Submeta um pedido de actualização de conta com os dados do empregador, rendimento mensal e a declaração da empresa. Aguarda aprovação do gestor.',
      });
    }

    // ── Determinar elegibilidade e actualizar perfil ──────────────────────────
    const eligible      = missing.length === 0;
    const verifiedIncome = hasEmployment ? (employment.monthly_income as number) : null;

    if (eligible) {
      const update: any = { is_eligible_for_credit: true, registration_status: 'aprovado' };
      // Sincronizar monthly_income do perfil com o valor verificado
      if (verifiedIncome && verifiedIncome > 0) {
        update.monthly_income = verifiedIncome;
      }
      await this.clientsRepository.update(clientId, update);
    } else {
      // Apenas actualizar para incompleto se ainda não estava aprovado manualmente
      const shouldDowngrade = client.registration_status !== 'aprovado' || !client.is_eligible_for_credit;
      if (shouldDowngrade) {
        await this.clientsRepository.update(clientId, {
          is_eligible_for_credit: false,
          registration_status:    'incompleto',
        });
      }
    }

    return {
      eligible,
      verified_income: verifiedIncome,
      missing,
      met,
      checked_at: new Date().toISOString(),
    };
  }

  // ── Verificação de conta actualizada (documentos aprovados) ───────────────

  async getAccountUpdateStatus(clientId: string): Promise<AccountUpdateStatus> {
    const { data: docs } = await this.supabase
      .from('documents')
      .select('document_type, status')
      .eq('client_id', clientId)
      .eq('status', 'aprovado');

    const approved = docs ?? [];
    const hasIdentity = approved.some((d: any) => IDENTITY_DOC_TYPES.includes(d.document_type));
    const hasEmployer = approved.some((d: any) => EMPLOYER_DOC_TYPES.includes(d.document_type));

    return {
      has_updated_account: hasIdentity && hasEmployer,
      missing_identity: !hasIdentity,
      missing_employer: !hasEmployer,
    };
  }
}
