export interface TicketCreadoPayload {
  ticket_id: string;
  asunto: string;
  estado: string;
  prioridad: string;
  canal: string;
  source_project: string | null;
  cliente_identidad_id: string | null;
  email: string | null;
  telefono: string | null;
  agente_id: string | null;
  pedido_id_ref: string | null;
  suscripcion_id_red: string | null;
  fecha_vencimiento_sla: string;
}

export interface TicketAsignadoPayload {
  ticket_id: string;
  agente_id: string;
  estado: string;
}

export interface TicketResueltoPayload {
  ticket_id: string;
  resolved_at: string;
  resolution_time_hours: number;
  within_sla: boolean;
  agente_id: string | null;
  prioridad: string;
}

export interface TicketCerradoPayload {
  ticket_id: string;
  closed_at: string;
  csat_score: number | null;
}

export interface InteraccionCreadaPayload {
  interaccion_id: string;
  ticket_id: string;
  autor_tipo: string;
  autor_id: string;
  contenido: string;
  es_nota_interna: boolean;
  creado_en: string;
}

export interface KbArticuloUsadoPayload {
  ticket_id: string;
  articulo_id: string;
  articulo_titulo: string;
  articulo_categoria: string;
  fue_enviado_al_cliente: boolean;
  agente_id: string | null;
  vinculado_en: string;
}

export interface AnalyticsEventDto {
  source: 'crm';
  event_type: string;
  payload:
    | TicketCreadoPayload
    | TicketAsignadoPayload
    | TicketResueltoPayload
    | TicketCerradoPayload
    | InteraccionCreadaPayload
    | KbArticuloUsadoPayload;
}
