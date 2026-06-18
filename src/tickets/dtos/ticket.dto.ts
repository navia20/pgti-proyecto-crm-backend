export class TicketDto {
  id!: string;
  asunto!: string;
  estado!: string;
  prioridad!: string;
  canal!: string;
  cliente_id?: number;
  agente_id?: string;
  fecha_vencimiento_sla!: Date;
  pedido_id_ref?: string;
  suscripcion_id_ref?: string;
  creado_en!: Date;
  actualizado_en!: Date;
}
