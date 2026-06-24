import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TicketChannelEnum, TicketPriorityEnum } from './create-ticket.dto';

export enum TicketStatusEnum {
  ABIERTO = 'abierto',
  PROGRESO = 'progreso',
  RESUELTO = 'resuelto',
  CERRADO = 'cerrado',
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  asunto?: string;

  @IsOptional()
  @IsEnum(TicketStatusEnum)
  estado?: TicketStatusEnum;

  @IsOptional()
  @IsEnum(TicketPriorityEnum)
  prioridad?: TicketPriorityEnum;

  @IsOptional()
  @IsEnum(TicketChannelEnum)
  canal?: TicketChannelEnum;

  @IsOptional()
  @IsUUID()
  agente_id?: string;

  @IsOptional()
  @IsString()
  pedido_id_ref?: string;

  @IsOptional()
  @IsString()
  suscripcion_id_ref?: string;

  @IsOptional()
  @IsString()
  pago_id_ref?: string;

  @IsOptional()
  @IsString()
  salud_ref?: string;
}
