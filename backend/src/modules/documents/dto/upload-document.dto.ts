import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { DocumentType } from '../entities/document.entity';

export class UploadDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do cliente é obrigatório' })
  client_id: string;

  @IsEnum(DocumentType)
  @IsNotEmpty({ message: 'Tipo de documento é obrigatório' })
  document_type: DocumentType;

  @IsString()
  @IsOptional()
  expiry_date?: string;
}

export class ValidateDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do documento é obrigatório' })
  document_id: string;

  @IsString()
  @IsNotEmpty({ message: 'Status é obrigatório' })
  status: string;

  @IsString()
  @IsOptional()
  validation_notes?: string;
}
