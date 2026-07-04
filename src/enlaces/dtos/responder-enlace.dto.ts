import { IsString, MinLength } from 'class-validator';

export class ResponderEnlaceDto {
  @IsString()
  @MinLength(1)
  contenido: string;
}
