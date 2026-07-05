import { IsString, IsOptional, IsEnum } from 'class-validator';

export class AprobarSolicitudDto {
  @IsOptional()
  @IsString()
  asunto?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(['baja', 'media', 'alta', 'critica'] as const)
  prioridad?: 'baja' | 'media' | 'alta' | 'critica';

  @IsOptional()
  @IsEnum(['chat', 'email', 'telefono', 'app'] as const)
  canal?: 'chat' | 'email' | 'telefono' | 'app';
}

export class RechazarSolicitudDto {
  @IsString()
  motivo: string;
}
