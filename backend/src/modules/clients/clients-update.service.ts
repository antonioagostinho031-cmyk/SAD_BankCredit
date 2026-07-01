import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { UpdateDataRequestDto } from './dto/update-data-request.dto';
import { OcrService } from '../documents/services/ocr.service';

export interface DataValidationResult {
  field: string;
  formValue: string | null;
  dbValue: string | null;
  ocrValue: string | null;
  isValid: boolean;
  confidence: number;
  mismatch: string | null;
}

@Injectable()
export class ClientsUpdateService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly ocrService: OcrService,
  ) {}

  /**
   * Criar uma solicitação de atualização de dados
   */
  async createUpdateRequest(
    clientId: string,
    dto: UpdateDataRequestDto,
    documents: Express.Multer.File[],
  ) {
    // 1. Buscar dados atuais do cliente
    const currentData = await this.getClientCurrentData(clientId);

    // 2. Processar documentos com OCR
    const ocrResults = await this.processDocuments(documents);

    // 3. VALIDAÇÃO CRÍTICA: Se há BI com OCR, verificar se o nome bate
    if (ocrResults.bi && ocrResults.bi.name && ocrResults.bi.confidence > 50) {
      const ocrName = ocrResults.bi.name.toLowerCase().trim();
      const accountName = currentData.full_name.toLowerCase().trim();
      const similarity = this.calculateSimilarity(ocrName, accountName);
      
      if (similarity < 70) {
        throw new BadRequestException(
          `O nome no BI (${ocrResults.bi.name}) não corresponde ao titular da conta (${currentData.full_name}). ` +
          `Por favor, submeta apenas documentos do titular da conta.`
        );
      }
    }

    // 4. Validar dados: formulário vs banco de dados vs OCR
    const validationResults = await this.validateData(dto, currentData, ocrResults);

    // 5. Calcular score de confiança
    const confidenceScore = this.calculateConfidenceScore(validationResults);

    // 5. Criar registro de solicitação
    const client = this.supabase.getClient();
    const { data: request, error } = await client
      .from('client_update_requests')
      .insert({
        client_id: clientId,
        requested_data: dto,
        current_data: currentData,
        ocr_data: ocrResults,
        validation_results: validationResults,
        confidence_score: confidenceScore,
        status: confidenceScore >= 80 ? 'pending_approval' : 'pending_review',
        reason: dto.reason,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Erro ao criar solicitação de atualização');
    }

    return {
      request_id: request.id,
      status: request.status,
      confidence_score: confidenceScore,
      validation_results: validationResults,
      requires_manual_review: confidenceScore < 80,
    };
  }

  /**
   * Processar documentos submetidos com OCR
   */
  private async processDocuments(documents: Express.Multer.File[]) {
    const results: any = {
      bi: null,
      comprovativo_residencia: null,
      comprovativo_rendimento: null,
    };

    for (const doc of documents) {
      const docType = this.identifyDocumentType(doc.originalname);
      
      if (docType === 'bi') {
        results.bi = await this.ocrService.extractDataFromBI(doc.path);
      } else if (docType === 'comprovativo_rendimento') {
        results.comprovativo_rendimento = await this.ocrService.extractDataFromIncomeProof(doc.path);
      }
    }

    return results;
  }

  /**
   * Identificar tipo de documento pelo nome
   */
  private identifyDocumentType(filename: string): string {
    const lower = filename.toLowerCase();
    
    if (lower.includes('bi') || lower.includes('identidade')) {
      return 'bi';
    } else if (lower.includes('comprovativo') && lower.includes('renda')) {
      return 'comprovativo_rendimento';
    } else if (lower.includes('residencia') || lower.includes('morada')) {
      return 'comprovativo_residencia';
    }
    
    return 'outros';
  }

  /**
   * Validar dados entre formulário, banco de dados e OCR
   */
  private async validateData(
    formData: UpdateDataRequestDto,
    dbData: any,
    ocrData: any,
  ): Promise<DataValidationResult[]> {
    const results: DataValidationResult[] = [];

    // Validar nome
    if (formData.full_name) {
      results.push(
        this.validateField(
          'full_name',
          formData.full_name,
          dbData.full_name,
          ocrData.bi?.name,
        ),
      );
    }

    // Validar BI
    if (formData.bi_number) {
      results.push(
        this.validateField(
          'bi_number',
          formData.bi_number,
          dbData.bi_number,
          ocrData.bi?.bi_number,
        ),
      );
    }

    // Validar NIF
    if (formData.nif) {
      results.push(
        this.validateField(
          'nif',
          formData.nif,
          dbData.nif,
          ocrData.bi?.nif,
        ),
      );
    }

    // Validar data de nascimento
    if (formData.date_of_birth) {
      results.push(
        this.validateField(
          'date_of_birth',
          formData.date_of_birth,
          dbData.date_of_birth,
          ocrData.bi?.date_of_birth,
        ),
      );
    }

    // Validar email
    if (formData.email) {
      results.push(
        this.validateField(
          'email',
          formData.email,
          dbData.email,
          null,
        ),
      );
    }

    // Validar telefone
    if (formData.phone) {
      results.push(
        this.validateField(
          'phone',
          formData.phone,
          dbData.phone,
          null,
        ),
      );
    }

    // Validar morada
    if (formData.address) {
      results.push(
        this.validateField(
          'address',
          formData.address,
          dbData.address,
          null,
        ),
      );
    }

    // Validar empregador
    if (formData.employer_name) {
      results.push(
        this.validateField(
          'employer_name',
          formData.employer_name,
          dbData.employer_name,
          ocrData.comprovativo_rendimento?.employer_name,
        ),
      );
    }

    // Validar rendimento
    if (formData.monthly_income) {
      results.push(
        this.validateField(
          'monthly_income',
          formData.monthly_income,
          dbData.monthly_income?.toString(),
          ocrData.comprovativo_rendimento?.monthly_income?.toString(),
        ),
      );
    }

    return results;
  }

  /**
   * Validar um campo específico
   */
  private validateField(
    field: string,
    formValue: string,
    dbValue: string | null,
    ocrValue: string | null,
  ): DataValidationResult {
    const normalizeValue = (val: string | null) => 
      val ? val.toLowerCase().trim().replace(/\s+/g, ' ') : null;

    const normForm = normalizeValue(formValue);
    const normDb = normalizeValue(dbValue);
    const normOcr = normalizeValue(ocrValue);

    let isValid = true;
    let confidence = 50; // Confiança base moderada
    let mismatch: string | null = null;

    // Verificar compatibilidade entre valores
    if (normOcr) {
      // Se há OCR, comparar formulário com OCR
      const similarity = this.calculateSimilarity(normForm || '', normOcr);
      confidence = similarity;
      
      if (similarity < 80) {
        isValid = false;
        mismatch = `Valor do formulário (${formValue}) difere do documento (${ocrValue})`;
      }
    } else {
      // Se NÃO há dados do OCR para campos críticos, reduzir confiança
      const criticalFields = ['full_name', 'bi_number', 'nif', 'date_of_birth'];
      if (criticalFields.includes(field)) {
        confidence = 30; // Baixa confiança sem OCR para campos críticos
        mismatch = `Documento não foi processado por OCR - requer verificação manual`;
        isValid = false;
      }
    }

    // Se mudou em relação ao banco de dados
    if (normDb && normForm !== normDb) {
      // Verificar se a mudança é significativa
      const dbFormSimilarity = this.calculateSimilarity(normForm || '', normDb);
      
      if (dbFormSimilarity < 70) {
        // Mudança significativa - reduzir confiança
        confidence = Math.min(confidence, 60);
      }
      
      if (!mismatch) {
        mismatch = `Valor alterado de "${dbValue}" para "${formValue}"`;
      }
    }

    return {
      field,
      formValue,
      dbValue,
      ocrValue,
      isValid,
      confidence,
      mismatch,
    };
  }

  /**
   * Calcular similaridade entre duas strings (Levenshtein)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 100;

    const distance = this.levenshteinDistance(longer, shorter);
    return Math.round(((longer.length - distance) / longer.length) * 100);
  }

  /**
   * Calcular distância de Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calcular score de confiança geral
   */
  private calculateConfidenceScore(results: DataValidationResult[]): number {
    if (results.length === 0) return 0;

    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = totalConfidence / results.length;

    const validCount = results.filter((r) => r.isValid).length;
    const validityScore = (validCount / results.length) * 100;

    return Math.round((avgConfidence + validityScore) / 2);
  }

  /**
   * Buscar dados atuais do cliente
   */
  private async getClientCurrentData(clientId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return {
      full_name: data.full_name,
      date_of_birth: data.date_of_birth,
      bi_number: data.bi_number,
      nif: data.nif,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      province: data.province,
      employer_name: data.employer_name,
      monthly_income: data.monthly_income,
    };
  }

  /**
   * Listar solicitações de atualização
   */
  async getUpdateRequests(clientId: string | null, status?: string) {
    const client = this.supabase.getClient();
    
    try {
      console.log('=== GET UPDATE REQUESTS SERVICE ===');
      console.log('Client ID:', clientId);
      console.log('Status filter:', status);
      
      let query = client
        .from('client_update_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Se clientId for fornecido, filtrar por cliente
      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase error fetching update requests:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        
        // Sempre retornar array vazio em caso de erro
        return [];
      }

      console.log('✅ Found', data?.length || 0, 'update requests');
      return data || [];
    } catch (error) {
      console.error('❌ Unexpected error in getUpdateRequests:', error);
      console.error('Error type:', (error as any).constructor?.name);
      console.error('Error stack:', (error as any)?.stack);
      
      // Sempre retornar array vazio
      return [];
    }
  }

  /**
   * Buscar uma solicitação específica
   */
  async getUpdateRequest(requestId: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('client_update_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    return data;
  }

  /**
   * Aprovar solicitação de atualização (apenas admin/analista)
   */
  async approveUpdateRequest(requestId: string, approverId: string) {
    const client = this.supabase.getClient();

    // Buscar solicitação
    const { data: request, error: fetchError } = await client
      .from('client_update_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    // Atualizar dados do cliente
    const { error: updateError } = await client
      .from('clients')
      .update(request.requested_data)
      .eq('id', request.client_id);

    if (updateError) {
      throw new BadRequestException('Erro ao atualizar dados do cliente');
    }

    // Marcar solicitação como aprovada
    const { error: approveError } = await client
      .from('client_update_requests')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (approveError) {
      throw new BadRequestException('Erro ao aprovar solicitação');
    }

    return { success: true, message: 'Dados atualizados com sucesso' };
  }

  /**
   * Rejeitar solicitação de atualização
   */
  async rejectUpdateRequest(requestId: string, reason: string, rejectedBy: string) {
    const client = this.supabase.getClient();

    const { error } = await client
      .from('client_update_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_by: rejectedBy,
        rejected_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      throw new BadRequestException('Erro ao rejeitar solicitação');
    }

    return { success: true, message: 'Solicitação rejeitada' };
  }
}
