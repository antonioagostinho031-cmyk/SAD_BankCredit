import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  ANALISTA = 'analista',
  GESTOR = 'gestor',
  SUPERVISOR = 'supervisor',
  CLIENTE = 'cliente',
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6, { message: 'Password deve ter no mínimo 6 caracteres' })
  @IsOptional()
  password?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
