import { IsString, IsOptional, IsEmail, IsDateString } from 'class-validator';

export class UpdateDataRequestDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @IsString()
  @IsOptional()
  bi_number?: string;

  @IsString()
  @IsOptional()
  nif?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  employer_name?: string;

  @IsString()
  @IsOptional()
  job_title?: string;

  @IsString()
  @IsOptional()
  employment_type?: string;

  @IsString()
  @IsOptional()
  monthly_income?: string;

  @IsString()
  @IsOptional()
  reason?: string; // Razão da atualização
}
