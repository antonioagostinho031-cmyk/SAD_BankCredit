import { IsString, IsDate, IsBoolean, IsOptional, IsNotEmpty, IsUUID } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateFTIDto {
  @IsUUID()
  product_id: string

  @IsString()
  @IsNotEmpty()
  version: string

  @IsDate()
  @Type(() => Date)
  document_date: Date

  @IsDate()
  @Type(() => Date)
  effective_date: Date

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiry_date?: Date

  @IsString()
  @IsNotEmpty()
  product_description: string

  @IsString()
  @IsOptional()
  target_customers?: string

  @IsString()
  @IsOptional()
  eligibility_criteria?: string

  @IsString()
  @IsOptional()
  interest_calculation?: string

  @IsString()
  @IsOptional()
  associated_costs?: string

  @IsString()
  @IsOptional()
  insurance_info?: string

  @IsString()
  @IsOptional()
  early_termination?: string

  @IsString()
  @IsOptional()
  contract_modification?: string

  @IsString()
  @IsOptional()
  dispute_resolution?: string

  @IsString()
  @IsOptional()
  regulatory_info?: string

  @IsString()
  @IsOptional()
  complaints_procedure?: string

  @IsString()
  @IsOptional()
  data_protection?: string

  @IsString()
  @IsOptional()
  full_document_url?: string

  @IsOptional()
  annexes?: any

  @IsBoolean()
  @IsOptional()
  active?: boolean

  @IsBoolean()
  @IsOptional()
  approved?: boolean
}
