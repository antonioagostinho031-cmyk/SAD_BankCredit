import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { ClientsService } from './clients.service';
import { UpdateDataRequestDto } from './dto/update-data-request.dto';

// Campos do DTO que mapeiam directamente para a tabela clients
const CLIENT_TABLE_FIELDS = new Set([
  'full_name', 'date_of_birth', 'bi_number', 'nif',
  'email', 'phone', 'address', 'city', 'province',
  'job_title',
]);

// employer_name do DTO → employer na tabela clients
const DTO_TO_CLIENT_MAP: Record<string, string> = {
  employer_name: 'employer',
};

@Injectable()
export class ClientsUpdateSimpleService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly clientsService: ClientsService,
  ) {}

  // ── Criar pedido de actualização ─────────────────────────

  async createUpdateRequest(
    clientId: string,
    dto: UpdateDataRequestDto,
    documents: Express.Multer.File[],
  ) {
    const currentData = await this.getClientCurrentData(clientId);

    const documentsInfo = documents.map(doc => ({
      originalName: doc.originalname,
      filename:     doc.filename,
      path:         doc.path,
      mimetype:     doc.mimetype,
      size:         doc.size,
    }));

    const db = this.supabase.getClient();
    const { data: request, error } = await db
      .from('client_update_requests')
      .insert({
        client_id:          clientId,
        requested_data:     dto,
        current_data:       currentData,
        documents_info:     documentsInfo,
        ocr_data:           null,
        validation_results: null,
        confidence_score:   null,
        status:             'pending_review',
        reason:             dto.reason,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Erro ao criar solicitação de actualização');
    }

    return {
      request_id:         request.id,
      status:             'pending_review',
      message:            'Solicitação enviada com sucesso. Aguarde análise do gestor de conta.',
      documents_uploaded: documentsInfo.length,
      fields_to_update:   Object.keys(dto).filter(k => k !== 'reason').length,
    };
  }

  // ── Listar pedidos ────────────────────────────────────────

  async getUpdateRequests(
    userId: string,
    role: string,
    statusFilter?: string,
    clientId?: string | null,
  ) {
    const db = this.supabase.getClient();

    // ── 1. Determinar quais client_ids são visíveis para este utilizador ──
    let allowedClientIds: string[] | null = null;

    if (role === 'gestor') {
      const { data: myClients, error: clientsError } = await db
        .from('clients')
        .select('id')
        .eq('account_manager_id', userId);

      if (clientsError) {
        console.error('[update-requests] erro ao buscar clientes do gestor:', clientsError);
        return [];
      }
      allowedClientIds = (myClients ?? []).map((c: any) => c.id);
      console.log(`[update-requests] gestor ${userId} → ${allowedClientIds.length} cliente(s): ${allowedClientIds}`);
      if (allowedClientIds.length === 0) return [];
    }

    // ── 2. Buscar pedidos (sem join — mais compatível) ────────────────────
    let query = db
      .from('client_update_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (allowedClientIds !== null) query = query.in('client_id', allowedClientIds);
    if (clientId)                  query = query.eq('client_id', clientId);
    if (statusFilter)              query = query.eq('status', statusFilter);

    const { data: requests, error: reqError } = await query;
    if (reqError) { console.error('[update-requests] erro ao buscar pedidos:', reqError); return []; }
    if (!requests || requests.length === 0) return [];

    // ── 3. Enriquecer com dados do cliente (query separada) ───────────────
    const uniqueClientIds = [...new Set(requests.map((r: any) => r.client_id))];
    const { data: clients } = await db
      .from('clients')
      .select('id, full_name, email, phone')
      .in('id', uniqueClientIds);

    const clientMap = new Map((clients ?? []).map((c: any) => [c.id, c]));

    return requests.map((r: any) => ({
      ...r,
      clients: clientMap.get(r.client_id) ?? null,
    }));
  }

  async getUpdateRequest(requestId: string) {
    const db = this.supabase.getClient();
    const { data, error } = await db
      .from('client_update_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !data) throw new NotFoundException('Solicitação não encontrada');
    return data;
  }

  async getDocumentInfo(requestId: string, filename: string) {
    const db = this.supabase.getClient();
    const { data } = await db
      .from('client_update_requests')
      .select('documents_info')
      .eq('id', requestId)
      .single();

    if (!data) throw new NotFoundException('Pedido não encontrado');

    const docs = (data.documents_info as any[]) ?? [];
    const doc = docs.find((d: any) => d.filename === filename);
    if (!doc) throw new NotFoundException('Documento não encontrado');

    return doc as { originalName: string; filename: string; path: string; mimetype: string; size: number };
  }

  // ── Aprovar pedido (gestor) ───────────────────────────────

  /**
   * O gestor confirma que os documentos carregados pelo cliente
   * correspondem ao que foi declarado no formulário.
   *
   * Acções:
   *   1. Aplicar dados declarados ao perfil do cliente
   *   2. Criar/actualizar registo de emprego (employment_data)
   *   3. Marcar pedido como aprovado
   *   4. Reavaliar elegibilidade para crédito
   */
  async approveUpdateRequest(requestId: string, approverId: string) {
    const db = this.supabase.getClient();

    const request = await this.getUpdateRequest(requestId);
    const dto: UpdateDataRequestDto = request.requested_data ?? {};
    const clientId: string = request.client_id;

    // 1. Mapear campos declarados para a tabela clients
    const clientUpdate: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (key === 'reason' || value === undefined || value === null || value === '') continue;

      if (DTO_TO_CLIENT_MAP[key]) {
        clientUpdate[DTO_TO_CLIENT_MAP[key]] = value;
      } else if (CLIENT_TABLE_FIELDS.has(key)) {
        clientUpdate[key] = value;
      }
    }

    // monthly_income também vai para clients (usado como fallback)
    if (dto.monthly_income !== undefined && dto.monthly_income !== '') {
      clientUpdate['monthly_income'] = Number(dto.monthly_income);
    }

    if (Object.keys(clientUpdate).length > 0) {
      const { error: clientErr } = await db
        .from('clients')
        .update(clientUpdate)
        .eq('id', clientId);

      if (clientErr) throw new BadRequestException('Erro ao actualizar perfil do cliente');
    }

    // 2. Criar/actualizar registo de emprego se dados patronais foram declarados
    const employerName  = dto.employer_name?.trim();
    const monthlyIncome = dto.monthly_income ? Number(dto.monthly_income) : null;

    if (employerName && monthlyIncome && monthlyIncome > 0) {
      // Fechar emprego anterior (is_current → false)
      await db
        .from('employment_data')
        .update({ is_current: false, end_date: new Date().toISOString().slice(0, 10) })
        .eq('client_id', clientId)
        .eq('is_current', true);

      // Criar novo registo de emprego corrente
      await db
        .from('employment_data')
        .insert({
          client_id:       clientId,
          employer_name:   employerName,
          job_title:       dto.job_title?.trim() ?? null,
          employment_type: dto.employment_type ?? 'efectivo',
          start_date:      new Date().toISOString().slice(0, 10),
          is_current:      true,
          monthly_income:  monthlyIncome,
        });
    }

    // 3. Marcar pedido como aprovado
    const { error: approveErr } = await db
      .from('client_update_requests')
      .update({
        status:      'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (approveErr) throw new BadRequestException('Erro ao registar aprovação');

    // 4. Reavaliar elegibilidade para crédito
    const evaluation = await this.clientsService.evaluateEligibility(clientId);

    return {
      success:     true,
      message:     'Pedido aprovado e dados actualizados com sucesso',
      eligible:    evaluation.eligible,
      missing:     evaluation.missing.map(r => r.label),
    };
  }

  // ── Rejeitar pedido (gestor) ──────────────────────────────

  async rejectUpdateRequest(requestId: string, reason: string, rejectedBy: string) {
    const db = this.supabase.getClient();

    const { error } = await db
      .from('client_update_requests')
      .update({
        status:           'rejected',
        rejection_reason: reason,
        rejected_by:      rejectedBy,
        rejected_at:      new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) throw new BadRequestException('Erro ao rejeitar solicitação');

    return { success: true, message: 'Solicitação rejeitada' };
  }

  // ── Helper ────────────────────────────────────────────────

  private async getClientCurrentData(clientId: string) {
    const db = this.supabase.getClient();
    const { data, error } = await db
      .from('clients')
      .select('full_name, date_of_birth, bi_number, nif, email, phone, address, employer, job_title, monthly_income')
      .eq('id', clientId)
      .single();

    if (error || !data) throw new NotFoundException('Cliente não encontrado');
    return data;
  }
}
