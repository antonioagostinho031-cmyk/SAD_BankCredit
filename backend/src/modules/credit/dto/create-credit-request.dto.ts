import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { CreditPurpose } from '../entities/credit.entity';

export class CreateCreditRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'ID do cliente é obrigatório' })
  client_id: string;

  @IsString()
  @IsOptional()
  product_id?: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Montante solicitado é obrigatório' })
  @Min(100000, { message: 'Montante mínimo é 100.000 AOA' })
  requested_amount: number;

  @IsNumber()
  @IsNotEmpty({ message: 'Prazo é obrigatório' })
  @Min(6, { message: 'Prazo mínimo é 6 meses' })
  @Max(360, { message: 'Prazo máximo é 360 meses' })
  term_months: number;

  @IsEnum(CreditPurpose)
  @IsNotEmpty({ message: 'Finalidade é obrigatória' })
  purpose: CreditPurpose;

  @IsString()
  @IsOptional()
  purpose_description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SimulateCreditDto {
  @IsNumber()
  @IsNotEmpty({ message: 'Montante é obrigatório' })
  @Min(100000, { message: 'Montante mínimo é 100.000 AOA' })
  amount: number;

  @IsNumber()
  @IsNotEmpty({ message: 'Prazo é obrigatório' })
  @Min(6, { message: 'Prazo mínimo é 6 meses' })
  @Max(360, { message: 'Prazo máximo é 360 meses' })
  term_months: number;

  @IsNumber()
  @IsOptional()
  interest_rate?: number;
}
