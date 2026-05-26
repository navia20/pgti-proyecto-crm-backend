export class TicketArticuloDto {
  id: string;
  ticket_id: string;
  articulo_id: string;
  fue_enviado_al_cliente: boolean;
  agente_id?: string;
  vinculado_en: Date;
}
