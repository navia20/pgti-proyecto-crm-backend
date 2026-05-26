import { IsString } from 'class-validator';

export class CreateArticuloKbDto {
  @IsString()
  titulo: string;

  @IsString()
  contenido: string;

  @IsString()
  categoria: string;
}
