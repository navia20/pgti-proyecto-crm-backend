export class MetricaTicketsDto {
  total_tickets: number;
  abiertos: number;
  en_progreso: number;
  resueltos: number;
  cerrados: number;
  promedio_tiempo_resolucion_horas: number;
  tickets_vencidos: number;
  tickets_proximos_vencer: number;
}

export class MetricasPrioridadDto {
  critica: number;
  alta: number;
  media: number;
  baja: number;
}

export class MetricasSLADto {
  total_tickets_con_sla: number;
  ok: number;
  warning: number;
  critical: number;
  porcentaje_cumplimiento: number;
}

export class MetricasKbDto {
  total_articulos: number;
  articulos_utilizados: number;
  articulos_enviados_cliente: number;
  promedio_utilizacion: number;
}

export class ReporteGeneralDto {
  fecha_generacion: Date;
  periodo: { desde: Date; hasta: Date };
  metricas_tickets: MetricaTicketsDto;
  metricas_prioridad: MetricasPrioridadDto;
  metricas_sla: MetricasSLADto;
  metricas_kb: MetricasKbDto;
  tickets_recientes_5: any[];
  agentes_con_mayor_carga: any[];
}
