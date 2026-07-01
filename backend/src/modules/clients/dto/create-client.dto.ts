import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum MaritalStatus {
  SOLTEIRO = 'solteiro',
  CASADO = 'casado',
  DIVORCIADO = 'divorciado',
  VIUVO = 'viuvo',
  UNIAO_DE_FACTO = 'uniao_de_facto',
}

export class CreateClientDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  full_name: string;

  @IsString()
  @IsNotEmpty({ message: 'Número do BI é obrigatório' })
  @MinLength(14, { message: 'Número do BI deve ter 14 caracteres' })
  @MaxLength(14, { message: 'Número do BI deve ter 14 caracteres' })
  bi_number: string;

  @IsString()
  @IsNotEmpty({ message: 'NIF é obrigatório' })
  nif: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Data de nascimento é obrigatória' })
  date_of_birth: string;

  @IsEnum(MaritalStatus)
  @IsNotEmpty({ message: 'Estado civil é obrigatório' })
  marital_status: MaritalStatus;

  @IsString()
  @IsNotEmpty({ message: 'Morada é obrigatória' })
  address: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  phone: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Entidade patronal é obrigatória' })
  employer: string;

  @IsString()
  @IsNotEmpty({ message: 'Cargo é obrigatório' })
  job_title: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Rendimento mensal é obrigatório' })
  monthly_income: number;

  @IsString()
  @IsOptional()
  account_number?: string;

  @IsString()
  @IsOptional()
  user_id?: string;
}
