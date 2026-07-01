import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
  ADMIN = 'admin',
  ANALISTA = 'analista',
  GESTOR = 'gestor',
  SUPERVISOR = 'supervisor',
  CLIENTE = 'cliente',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password é obrigatória' })
  @MinLength(6, { message: 'Password deve ter no mínimo 6 caracteres' })
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: string;
}
