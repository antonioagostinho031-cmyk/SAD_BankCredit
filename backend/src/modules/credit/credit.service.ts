import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreditRepository } from './credit.repository';
import { ClientsService } from '../clients/clients.service';
import { ScoringService } from '../scoring/scoring.service';
import { RiskService } from '../risk/risk.service';
import { DecisionService } from '../decision/decision.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCreditRequestDto, SimulateCreditDto } from './dto/create-credit-request.dto';
import { CreditStatus } from './entities/credit.entity';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class CreditService {
  constructor(
    private creditRepository: CreditRepository,
    private clientsService: ClientsService,
    private scoringService: ScoringService,
    private riskService: RiskService,
    private decisionService: DecisionService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private supabase: SupabaseService,
  ) {}

  async create(createDto: CreateCreditRequestDto, userId: string, userRole: string) {
    const client = await this.clientsService.findOne(createDto.client_id);

    // Gestor só pode submeter para os clientes que lhe estão atribuídos
    if (userRole === 'gestor' && (client as any).account_manager_id !== userId) {
      throw new ForbiddenException('Apenas pode submeter pedidos para os seus clientes atribuídos');
    }

    if (!client.is_eligible_for_credit) {
      throw new ForbiddenException('Cliente não está elegível para solicitar crédito');
    }

    // Verificar se a conta está actualizada (documentos aprovados: identidade + entidade patronal)
    await this.checkAccountUpdated(createDto.client_id);

    const activeRequests = await this.creditRepository.findByClientId(createDto.client_id);
    const hasActiveRequest = activeRequests.some(r =>
      ['submetido', 'em_analise'].includes(r.status),
    );

    if (hasActiveRequest) {
      throw new BadRequestException('Este cliente já tem um pedido de crédito em análise ou submetido. Aguarde a conclusão antes de submeter um novo pedido.');
    }

    const simulation = this.calculatePayment(
      createDto.requested_amount,
      createDto.term_months,
      this.getBaseInterestRate(createDto.term_months),
    );

    const creditRequest = await this.creditRepository.create({
      client_id: createDto.client_id,
      product_id: createDto.product_id ?? null,
      requested_amount: createDto.requested_amount,
      term_months: createDto.term_months,
      interest_rate: simulation.interest_rate,
      monthly_payment: simulation.monthly_payment,
      purpose: createDto.purpose,
      purpose_description: createDto.purpose_description,
      metadata: createDto.metadata ?? {},
      status: CreditStatus.SUBMETIDO,
      submission_date: new Date().toISOString(),
    });

    await this.auditService.log({
      user_id: userId,
      action: 'credit_request_created',
      entity_type: 'credit_request',
      entity_id: creditRequest.id,
      details: { amount: createDto.requested_amount, term: createDto.term_months },
    });

    await this.notificationsService.send({
      user_id: userId,
      type: 'credit_request_submitted',
      title: 'Pedido de Crédito Submetido',
      message: `O seu pedido de crédito no valor de ${createDto.requested_amount.toLocaleString('pt-AO')} AOA foi submetido e encontra-se em análise.`,
      entity_id: creditRequest.id,
    });

    return creditRequest;
  }

  private async checkAccountUpdated(clientId: string): Promise<void> {
    const { data: docs } = await this.supabase
      .from('documents')
      .select('document_type, status')
      .eq('client_id', clientId)
      .eq('status', 'aprovado');

    const approved = docs ?? [];
    const identityTypes = ['bi', 'passaporte', 'cartao_residente'];
    const employerTypes = ['comprovativo_vinculo', 'comprovativo_rendimento'];

    const hasIdentity = approved.some((d: any) => identityTypes.includes(d.document_type));
    const hasEmployer = approved.some((d: any) => employerTypes.includes(d.document_type));

    if (!hasIdentity || !hasEmployer) {
      const missing: string[] = [];
      if (!hasIdentity) missing.push('documento de identidade verificado (BI, Passaporte ou Cartão de Residente)');
      if (!hasEmployer) missing.push('documento da entidade patronal verificado (Comprovativo de Vínculo ou Rendimento)');
      throw new BadRequestException(
        `A conta não está actualizada. Documentos em falta: ${missing.join('; ')}. Actualize a conta antes de solicitar crédito.`,
      );
    }
  }

  async findAll(filters?: any) {
    return this.creditRepository.findAll(filters);
  }

  async findOne(id: string) {
    const credit = await this.creditRepository.findOne(id);
    if (!credit) {
      throw new NotFoundException('Pedido de crédito não encontrado');
    }
    return credit;
  }

  async findByClientId(clientId: string) {
    return this.creditRepository.findByClientId(clientId);
  }

  async findMyRequests(userId: string) {
    const client = await this.clientsService.findByUserId(userId);
    if (!client) return [];
    return this.creditRepository.findByClientId((client as any).id);
  }

  async getRequestDetails(creditId: string, userId: string) {
    const credit = await this.findOne(creditId);

    // Verificar se o pedido pertence ao cliente autenticado (compara pelo perfil de cliente)
    const clientProfile = await this.clientsService.findByUserId(userId);
    if (!clientProfile || credit.client_id !== clientProfile.id) {
      throw new ForbiddenException('Você não tem permissão para ver este pedido');
    }

    // Buscar informações adicionais
    const analysis = await this.creditRepository.findAnalysisByCreditId(creditId);
    
    // Buscar documentos relacionados (se existir módulo de documentos)
    // const documents = await this.documentsService.findByCreditRequestId(creditId);
    
    // Buscar mensagens/comunicações (se existir)
    // const messages = await this.messagesService.findByCreditRequestId(creditId);

    // Criar timeline baseado no status e datas
    const timeline = this.buildTimeline(credit);

    return {
      id: credit.id,
      requestNumber: `CR-${new Date(credit.submission_date).getFullYear()}-${credit.id.substring(0, 6).toUpperCase()}`,
      status: credit.status,
      productName: this.getProductName(credit.purpose),
      amount: credit.requested_amount,
      approvedAmount: credit.approved_amount,
      term: credit.term_months,
      monthlyPayment: credit.monthly_payment,
      interestRate: credit.interest_rate,
      submittedAt: credit.submission_date,
      analyst: credit.analyst_id ? 'Analista Responsável' : null,
      timeline,
      analysis: analysis || null,
      conditions: credit.conditions,
      rejectionReason: credit.rejection_reason,
      // documents: documents || [],
      // messages: messages || [],
    };
  }

  private buildTimeline(credit: any) {
    const timeline = [];

    // Submetido
    timeline.push({
      stage: 'Submetido',
      date: credit.submission_date,
      status: 'completed',
      description: 'Pedido submetido com sucesso'
    });

    // Análise Preliminar
    if (credit.analyst_id) {
      timeline.push({
        stage: 'Análise Preliminar',
        date: credit.analysis_start_date || credit.submission_date,
        status: 'completed',
        description: 'Documentação verificada'
      });
    }

    // Análise de Crédito
    if (credit.status === 'em_analise' || credit.status === 'aprovado' || credit.status === 'aprovado_condicional' || credit.status === 'rejeitado') {
      timeline.push({
        stage: 'Análise de Crédito',
        date: credit.analysis_start_date,
        status: credit.decision_date ? 'completed' : 'current',
        description: credit.decision_date ? 'Análise concluída' : 'Em avaliação pelo analista'
      });
    }

    // Aprovação Final
    if (credit.decision_date) {
      timeline.push({
        stage: 'Aprovação Final',
        date: credit.decision_date,
        status: 'completed',
        description: credit.status === 'aprovado' ? 'Pedido aprovado' : credit.status === 'rejeitado' ? 'Pedido rejeitado' : 'Decisão tomada'
      });
    } else if (credit.status === 'em_analise') {
      timeline.push({
        stage: 'Aprovação Final',
        date: null,
        status: 'pending',
        description: 'Aguardando conclusão da análise'
      });
    }

    // Desembolso (apenas se aprovado)
    if (credit.status === 'aprovado' || credit.status === 'aprovado_condicional') {
      timeline.push({
        stage: 'Desembolso',
        date: credit.disbursement_date || null,
        status: credit.disbursement_date ? 'completed' : 'pending',
        description: credit.disbursement_date ? 'Fundos transferidos' : 'Aguardando transferência dos fundos'
      });
    }

    return timeline;
  }

  private getProductName(purpose: string): string {
    const productNames: any = {
      pessoal: 'Crédito Pessoal Atlântico',
      habitacao: 'Crédito Habitação',
      automovel: 'Crédito Automóvel',
      consolidacao: 'Crédito Consolidado',
      empresarial: 'Crédito Empresarial',
    };
    return productNames[purpose] || 'Crédito';
  }

  async assignAnalyst(creditId: string, analystId: string, userId: string) {
    const credit = await this.findOne(creditId);

    if (![CreditStatus.SUBMETIDO, CreditStatus.EM_ANALISE].includes(credit.status as CreditStatus)) {
      throw new BadRequestException(`Não é possível atribuir analista a um pedido com status '${credit.status}'`);
    }

    const updated = await this.creditRepository.update(creditId, {
      analyst_id: analystId,
      status: CreditStatus.EM_ANALISE,
      analysis_start_date: new Date().toISOString(),
    });

    await this.auditService.log({
      user_id: userId,
      action: 'credit_analyst_assigned',
      entity_type: 'credit_request',
      entity_id: creditId,
      details: { analyst_id: analystId },
    });

    return updated;
  }

  async analyseCredit(creditId: string, analystId: string) {
    const credit = await this.findOne(creditId);

    if (credit.status !== CreditStatus.EM_ANALISE) {
      throw new BadRequestException(`A análise só pode ser executada em pedidos com status 'em_analise'. Status actual: '${credit.status}'`);
    }

    const client = await this.clientsService.findOne(credit.client_id);

    const scoringResult = await this.scoringService.calculateScore(client);
    const riskAssessment = await this.riskService.assessRisk(client, credit, scoringResult);
    const decision = await this.decisionService.generateDecision(
      scoringResult,
      riskAssessment,
      client,
      credit,
    );

    const analysis = await this.creditRepository.createAnalysis({
      credit_request_id: creditId,
      analyst_id: analystId,
      financial_capacity: scoringResult.financial_score,
      debt_ratio: riskAssessment.debt_ratio,
      income_stability: scoringResult.behavioral_score,
      credit_history_score: scoringResult.credit_history_score,
      document_quality_score: scoringResult.document_score,
      overall_score: scoringResult.total_score,
      recommendation: decision.recommendation,
      analyst_notes: decision.justification,
      analysis_date: new Date().toISOString(),
    });

    return {
      credit,
      client,
      scoring: scoringResult,
      risk: riskAssessment,
      decision,
      analysis,
    };
  }

  async makeDecision(
    creditId: string,
    decision: string,
    userId: string,
    approvedAmount?: number,
    conditions?: string,
    rejectionReason?: string,
  ) {
    const credit = await this.findOne(creditId);

    if (credit.status !== CreditStatus.EM_ANALISE) {
      throw new BadRequestException(`Não é possível tomar uma decisão sobre um pedido com status '${credit.status}'`);
    }

    const statusMap: any = {
      aprovado: CreditStatus.APROVADO,
      aprovado_condicional: CreditStatus.APROVADO_CONDICIONAL,
      rejeitado: CreditStatus.REJEITADO,
      revisao: CreditStatus.EM_ANALISE,
    };

    const newStatus = statusMap[decision];
    if (!newStatus) {
      throw new BadRequestException(`Decisão inválida: '${decision}'. Valores aceites: aprovado, aprovado_condicional, rejeitado, revisao`);
    }

    const updateData: any = {
      status: newStatus,
      decision_date: new Date().toISOString(),
      manager_id: userId,
    };

    if (approvedAmount) updateData.approved_amount = approvedAmount;
    if (conditions) updateData.conditions = conditions;
    if (rejectionReason) updateData.rejection_reason = rejectionReason;

    const updated = await this.creditRepository.update(creditId, updateData);

    await this.auditService.log({
      user_id: userId,
      action: 'credit_decision_made',
      entity_type: 'credit_request',
      entity_id: creditId,
      details: { decision, approved_amount: approvedAmount },
    });

    const notificationMessage = this.buildDecisionMessage(decision, approvedAmount, rejectionReason);
    await this.notificationsService.send({
      user_id: credit.client_id,
      type: 'credit_decision',
      title: 'Decisão sobre o seu Pedido de Crédito',
      message: notificationMessage,
      entity_id: creditId,
    });

    return updated;
  }

  async simulate(simulateDto: SimulateCreditDto) {
    const interestRate = simulateDto.interest_rate || this.getBaseInterestRate(simulateDto.term_months);
    const payment = this.calculatePayment(simulateDto.amount, simulateDto.term_months, interestRate);

    return {
      amount: simulateDto.amount,
      term_months: simulateDto.term_months,
      interest_rate: interestRate,
      monthly_payment: payment.monthly_payment,
      total_amount: payment.total_amount,
      total_interest: payment.total_interest,
      amortization_table: this.generateAmortizationTable(
        simulateDto.amount,
        simulateDto.term_months,
        interestRate,
      ),
    };
  }

  async getAnalysis(creditId: string) {
    await this.findOne(creditId);
    return this.creditRepository.findAnalysisByCreditId(creditId);
  }

  async cancel(creditId: string, userId: string, reason: string) {
    const credit = await this.findOne(creditId);

    const cancellableStatuses = [CreditStatus.SUBMETIDO, CreditStatus.EM_ANALISE];
    if (!cancellableStatuses.includes(credit.status as CreditStatus)) {
      throw new BadRequestException(`Não é possível cancelar um pedido com status '${credit.status}'`);
    }

    const updated = await this.creditRepository.update(creditId, {
      status: CreditStatus.CANCELADO,
      rejection_reason: reason,
    });

    await this.auditService.log({
      user_id: userId,
      action: 'credit_request_cancelled',
      entity_type: 'credit_request',
      entity_id: creditId,
      details: { reason },
    });

    return updated;
  }

  private calculatePayment(amount: number, termMonths: number, annualRate: number) {
    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
      const monthly_payment = amount / termMonths;
      return {
        monthly_payment: Math.round(monthly_payment * 100) / 100,
        total_amount: amount,
        total_interest: 0,
        interest_rate: annualRate,
      };
    }

    const monthly_payment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);

    const total_amount = monthly_payment * termMonths;
    const total_interest = total_amount - amount;

    return {
      monthly_payment: Math.round(monthly_payment * 100) / 100,
      total_amount: Math.round(total_amount * 100) / 100,
      total_interest: Math.round(total_interest * 100) / 100,
      interest_rate: annualRate,
    };
  }

  private generateAmortizationTable(amount: number, termMonths: number, annualRate: number) {
    const monthlyRate = annualRate / 100 / 12;
    const payment = this.calculatePayment(amount, termMonths, annualRate);
    const table = [];
    let balance = amount;

    for (let month = 1; month <= termMonths; month++) {
      const interest = balance * monthlyRate;
      const principal = payment.monthly_payment - interest;
      balance = balance - principal;

      table.push({
        month,
        payment: payment.monthly_payment,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.max(0, Math.round(balance * 100) / 100),
      });
    }

    return table;
  }

  private getBaseInterestRate(termMonths: number): number {
    if (termMonths <= 12) return 18;
    if (termMonths <= 36) return 20;
    if (termMonths <= 60) return 22;
    return 24;
  }

  private buildDecisionMessage(decision: string, approvedAmount?: number, reason?: string): string {
    switch (decision) {
      case 'aprovado':
        return `O seu pedido de crédito foi APROVADO no valor de ${approvedAmount?.toLocaleString('pt-AO')} AOA.`;
      case 'aprovado_condicional':
        return `O seu pedido de crédito foi aprovado condicionalmente. Por favor, contacte o banco para mais informações.`;
      case 'rejeitado':
        return `O seu pedido de crédito foi rejeitado. Motivo: ${reason || 'Não especificado'}.`;
      default:
        return 'O seu pedido de crédito foi actualizado.';
    }
  }
}
