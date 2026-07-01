import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsRepository {
  constructor(private supabase: SupabaseService) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .insert([
        {
          ...createClientDto,
          registration_status: 'pendente',
          is_eligible_for_credit: false,
          account_balance: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(filters?: any): Promise<Client[]> {
    let query = this.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.registration_status) {
      query = query.eq('registration_status', filters.registration_status);
    }

    if (filters?.is_eligible_for_credit !== undefined) {
      query = query.eq('is_eligible_for_credit', filters.is_eligible_for_credit);
    }
    if (filters?.account_manager_id) {
      query = query.eq('account_manager_id', filters.account_manager_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findOne(id: string): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByUserId(userId: string): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  }

  async findByBI(biNumber: string): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('bi_number', biNumber)
      .single();

    if (error) return null;
    return data;
  }

  async findByNIF(nif: string): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*')
      .eq('nif', nif)
      .single();

    if (error) return null;
    return data;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const { data, error } = await this.supabase
      .from('clients')
      .update(updateClientDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('clients').delete().eq('id', id);

    if (error) throw error;
  }

  async updateEligibility(id: string, isEligible: boolean): Promise<Client> {
    return this.update(id, { is_eligible_for_credit: isEligible });
  }

  async updateRegistrationStatus(id: string, status: string): Promise<Client> {
    return this.update(id, { registration_status: status });
  }

  // ── Eligibility evaluation helpers ───────────────────────

  /** Documentos aprovados do cliente filtrados por tipo */
  async findApprovedDocsByType(clientId: string, types: string[]): Promise<any[]> {
    const { data } = await this.supabase
      .from('documents')
      .select('id, document_type, status, validated_at, confidence_score')
      .eq('client_id', clientId)
      .eq('status', 'aprovado')
      .in('document_type', types);
    return data ?? [];
  }

  /** Validações de um documento — para extrair dados de rendimento */
  async findDocumentValidations(documentId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('document_validations')
      .select('extracted_data, confidence_score, is_valid')
      .eq('document_id', documentId)
      .eq('is_valid', true)
      .order('validation_date', { ascending: false })
      .limit(1);
    return data ?? [];
  }

  /** Dados de emprego correntes do cliente */
  async findCurrentEmployment(clientId: string): Promise<any | null> {
    const { data } = await this.supabase
      .from('employment_data')
      .select('employer_name, job_title, employment_type, start_date, monthly_income, is_current')
      .eq('client_id', clientId)
      .eq('is_current', true)
      .order('start_date', { ascending: false })
      .limit(1)
      .single();
    return data ?? null;
  }
}
