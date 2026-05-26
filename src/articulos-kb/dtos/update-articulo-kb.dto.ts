import { IsString, IsOptional } from 'class-validator';

export class UpdateArticuloKbDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @IsString()
  categoria?: string;
}
