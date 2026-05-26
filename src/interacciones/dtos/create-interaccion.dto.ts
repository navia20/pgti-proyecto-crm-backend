import { IsString, IsEnum, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export enum AuthorTypeEnum {
  CLIENTE = 'cliente',
  AGENTE = 'agente',
  SISTEMA = 'sistema',
}

export class CreateInteraccionDto {
  @IsUUID()
  ticket_id: string;

  @IsEnum(AuthorTypeEnum)
  autor_tipo: AuthorTypeEnum;

  @IsUUID()
  autor_id: string;

  @IsString()
  contenido: string;

  @IsOptional()
  @IsBoolean()
  es_nota_interna?: boolean;
}
