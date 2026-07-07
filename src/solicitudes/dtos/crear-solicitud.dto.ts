import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CrearSolicitudDto {
  @IsString()
  nombre: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsString()
  asunto: string;

  @IsString()
  descripcion: string;
}
