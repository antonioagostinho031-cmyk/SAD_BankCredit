import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min, Max, IsNotEmpty } from 'class-validator'

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(['pessoal', 'habitacao', 'automovel', 'consolidacao', 'empresarial'])
  category: 'pessoal' | 'habitacao' | 'automovel' | 'consolidacao' | 'empresarial'

  @IsNumber()
  @Min(0)
  min_amount: number

  @IsNumber()
  @Min(0)
  max_amount: number

  @IsNumber()
  @Min(1)
  min_term_months: number

  @IsNumber()
  @Min(1)
  max_term_months: number

  @IsNumber()
  @Min(0)
  @Max(100)
  base_interest_rate: number

  @IsNumber()
  @Min(0)
  @Max(100)
  min_interest_rate: number

  @IsNumber()
  @Min(0)
  @Max(100)
  max_interest_rate: number

  @IsNumber()
  @IsOptional()
  min_income?: number

  @IsNumber()
  @IsOptional()
  max_age?: number

  @IsNumber()
  @IsOptional()
  min_age?: number

  @IsBoolean()
  @IsOptional()
  requires_guarantor?: boolean

  @IsBoolean()
  @IsOptional()
  requires_collateral?: boolean

  @IsNumber()
  @IsOptional()
  opening_fee_percent?: number

  @IsNumber()
  @IsOptional()
  opening_fee_fixed?: number

  @IsNumber()
  @IsOptional()
  management_fee_annual?: number

  @IsNumber()
  @IsOptional()
  early_payment_fee?: number

  @IsBoolean()
  @IsOptional()
  active?: boolean

  @IsNumber()
  @IsOptional()
  priority_order?: number
}
