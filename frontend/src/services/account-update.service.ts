import api from './api';

export interface UpdateDataRequestDto {
  full_name?: string;
  date_of_birth?: string;
  bi_number?: string;
  nif?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  employer_name?: string;
  monthly_income?: string;
  reason?: string;
}

export interface DataValidationResult {
  field: string;
  formValue: string | null;
  dbValue: string | null;
  ocrValue: string | null;
  isValid: boolean;
  confidence: number;
  mismatch: string | null;
}

export interface UpdateRequestResponse {
  request_id: string;
  status: string;
  confidence_score: number;
  validation_results: DataValidationResult[];
  requires_manual_review: boolean;
}

export interface UpdateRequest {
  id: string;
  client_id: string;
  requested_data: any;
  current_data: any;
  ocr_data: any;
  validation_results: DataValidationResult[];
  confidence_score: number;
  status: string;
  reason: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

export const accountUpdateService = {
  /**
   * Criar solicitação de atualização de dados
   */
  async createUpdateRequest(
    data: UpdateDataRequestDto,
    documents: File[]
  ): Promise<UpdateRequestResponse> {
    const formData = new FormData();

    // Adicionar dados do formulário
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Adicionar documentos
    documents.forEach((file) => {
      formData.append('documents', file);
    });

    const response = await api.post<UpdateRequestResponse>(
      '/clients/update-request',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * Buscar minhas solicitações de atualização
   */
  async getMyUpdateRequests(status?: string): Promise<UpdateRequest[]> {
    const params = status ? { status } : {};
    const response = await api.get<UpdateRequest[]>('/clients/my-update-requests', {
      params,
    });
    return response.data;
  },

  /**
   * Buscar solicitação específica
   */
  async getUpdateRequest(id: string): Promise<UpdateRequest> {
    const response = await api.get<UpdateRequest>(`/clients/update-request/${id}`);
    return response.data;
  },

  /**
   * Formatar status
   */
  formatStatus(status: string): { label: string; color: string; bgColor: string } {
    const statusMap: Record<string, { label: string; color: string; bgColor: string }> = {
      pending_review: {
        label: 'Em Revisão',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100',
      },
      pending_approval: {
        label: 'Aguardando Aprovação',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
      },
      approved: {
        label: 'Aprovado',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
      },
      rejected: {
        label: 'Rejeitado',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
      },
    };

    return statusMap[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
  },
};
