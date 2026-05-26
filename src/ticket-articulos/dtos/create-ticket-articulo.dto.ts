import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class CreateTicketArticuloDto {
  @IsUUID()
  ticket_id: string;

  @IsUUID()
  articulo_id: string;

  @IsOptional()
  @IsBoolean()
  fue_enviado_al_cliente?: boolean;

  @IsOptional()
  @IsUUID()
  agente_id?: string;
}
