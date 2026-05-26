import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateClienteDto {
  @IsString()
  nombre_completo: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  documento_identidad?: string;

  @IsOptional()
  @IsString()
  empresa?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  pais?: string;

  @IsOptional()
  @IsDateString()
  fecha_ultima_compra?: string;

  @IsOptional()
  @IsNumber()
  total_gastado?: number;

  @IsOptional()
  @IsNumber()
  pedidos_totales?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
