import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { TicketPriorityEnum } from './create-ticket.dto';

export enum TicketSourceEnum {
  PEDIDOS = 'pedidos',
  SUSCRIPCIONES = 'suscripciones',
  IOT = 'iot',
  PAGOS = 'pagos',
  INVENTARIO = 'inventario',
  SALUD = 'salud',
}

export class CreateTicketExternoDto {
  @IsString()
  asunto: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(TicketPriorityEnum)
  prioridad: TicketPriorityEnum;

  @IsEnum(TicketSourceEnum)
  sistema_origen: TicketSourceEnum;

  @IsString()
  sistema_id: string;

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
  @IsString()
  contexto?: string;
}
