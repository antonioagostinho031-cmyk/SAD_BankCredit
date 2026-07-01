export enum DocumentType {
  BI = 'bi',
  NIF = 'nif',
  COMPROVATIVO_VÍNCULO = 'comprovativo_vinculo',
  COMPROVATIVO_RENDIMENTO = 'comprovativo_rendimento',
  PASSAPORTE = 'passaporte',
  CARTAO_RESIDENTE = 'cartao_residente',
}

export enum DocumentStatus {
  PENDENTE = 'pendente',
  EM_VALIDACAO = 'em_validacao',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  EXPIRADO = 'expirado',
}

export class Document {
  id: string;
  client_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  uploaded_at: Date;
  validated_at: Date;
  validated_by: string;
  expiry_date: Date;
  confidence_score: number;
  validation_notes: string;
  created_at: Date;
  updated_at: Date;
}

export class DocumentValidation {
  id: string;
  document_id: string;
  validation_type: string;
  is_valid: boolean;
  confidence_score: number;
  extracted_data: any;
  validation_errors: string[];
  validated_by_ai: boolean;
  validated_by_user: string;
  validation_date: Date;
  notes: string;
  created_at: Date;
}
