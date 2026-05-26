import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';

export enum TicketChannelEnum {
  CHAT = 'chat',
  EMAIL = 'email',
  TELEFONO = 'telefono',
  APP = 'app',
}

export enum TicketPriorityEnum {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  CRITICA = 'critica',
}

export class CreateTicketDto {
  @IsString()
  asunto: string;

  @IsEnum(TicketChannelEnum)
  canal: TicketChannelEnum;

  @IsEnum(TicketPriorityEnum)
  prioridad: TicketPriorityEnum;

  @IsOptional()
  @IsNumber()
  cliente_id?: number;

  @IsOptional()
  @IsString()
  pedido_id_ref?: string;

  @IsOptional()
  @IsString()
  suscripcion_id_ref?: string;

  @IsOptional()
  @IsUUID()
  agente_id?: string;
}
