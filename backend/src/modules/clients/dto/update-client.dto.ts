import {
  IsString,
  IsEmail,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export enum MaritalStatus {
  SOLTEIRO = 'solteiro',
  CASADO = 'casado',
  DIVORCIADO = 'divorciado',
  VIUVO = 'viuvo',
  UNIAO_DE_FACTO = 'uniao_de_facto',
}

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @MinLength(14, { message: 'Número do BI deve ter 14 caracteres' })
  @MaxLength(14, { message: 'Número do BI deve ter 14 caracteres' })
  @IsOptional()
  bi_number?: string;

  @IsString()
  @IsOptional()
  nif?: string;

  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @IsEnum(MaritalStatus)
  @IsOptional()
  marital_status?: MaritalStatus;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  employer?: string;

  @IsString()
  @IsOptional()
  job_title?: string;

  @IsNumber()
  @IsOptional()
  monthly_income?: number;

  @IsNumber()
  @IsOptional()
  account_balance?: number;

  @IsBoolean()
  @IsOptional()
  is_eligible_for_credit?: boolean;

  @IsString()
  @IsOptional()
  registration_status?: string;

  @IsString()
  @IsOptional()
  account_manager_id?: string;
}
