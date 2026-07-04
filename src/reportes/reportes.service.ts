import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TicketEntity } from '../tickets/entities/ticket.entity';
import { InteraccionEntity } from '../interacciones/entities/interaccion.entity';
import { ArticuloKbEntity } from '../articulos-kb/entities/articulo-kb.entity';
import { TicketArticuloEntity } from '../ticket-articulos/entities/ticket-articulo.entity';
import {
  MetricaTicketsDto,
  MetricasPrioridadDto,
  MetricasSLADto,
  MetricasKbDto,
  ReporteGeneralDto,
} from './dtos/reporte.dto';

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    @InjectRepository(TicketEntity)
    private readonly ticketsRepository: Repository<TicketEntity>,
    @InjectRepository(InteraccionEntity)
    private readonly interaccionesRepository: Repository<InteraccionEntity>,
    @InjectRepository(ArticuloKbEntity)
    private readonly articulosRepository: Repository<ArticuloKbEntity>,
    @InjectRepository(TicketArticuloEntity)
    private readonly ticketArticulosRepository: Repository<TicketArticuloEntity>,
  ) {}

  async obtenerReporteGeneral(dias: number = 30): Promise<ReporteGeneralDto> {
    const ahora = new Date();
    const hace_dias = new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000);

    const metricas_tickets = await this.obtenerMetricasTickets();
    const metricas_prioridad = await this.obtenerMetricasPrioridad();
    const metricas_sla = await this.obtenerMetricasSLA();
    const metricas_kb = await this.obtenerMetricasKB();

    const ticketsRecientes = await this.ticketsRepository
      .find({
        order: { creado_en: 'DESC' },
        take: 5,
      })
      .catch(() => []);

    return {
      fecha_generacion: ahora,
      periodo: { desde: hace_dias, hasta: ahora },
      metricas_tickets,
      metricas_prioridad,
      metricas_sla,
      metricas_kb,
      tickets_recientes_5: ticketsRecientes,
      agentes_con_mayor_carga: [],
    };
  }

  async obtenerMetricasTickets(): Promise<MetricaTicketsDto> {
    const tickets = await this.ticketsRepository.find();

    const abiertos = tickets.filter((t) => t.estado === 'abierto').length;
    const en_progreso = tickets.filter((t) => t.estado === 'progreso').length;
    const resueltos = tickets.filter((t) => t.estado === 'resuelto').length;
    const cerrados = tickets.filter((t) => t.estado === 'cerrado').length;

    const promedio_tiempo_resolucion_horas =
      resueltos > 0
        ? tickets
            .filter((t) => t.estado === 'resuelto')
            .reduce(
              (acc, t) =>
                acc +
                (t.actualizado_en.getTime() - t.creado_en.getTime()) /
                  (1000 * 60 * 60),
              0,
            ) / resueltos
        : 0;

    const ahora = new Date();
    const tickets_vencidos = tickets.filter(
      (t) => t.fecha_vencimiento_sla < ahora && t.estado !== 'cerrado',
    ).length;
    const tickets_proximos_vencer = tickets.filter(
      (t) =>
        t.fecha_vencimiento_sla > ahora &&
        t.fecha_vencimiento_sla <
          new Date(ahora.getTime() + 24 * 60 * 60 * 1000) &&
        t.estado !== 'cerrado',
    ).length;

    return {
      total_tickets: tickets.length,
      abiertos,
      en_progreso,
      resueltos,
      cerrados,
      promedio_tiempo_resolucion_horas:
        Math.round(promedio_tiempo_resolucion_horas * 100) / 100,
      tickets_vencidos,
      tickets_proximos_vencer,
    };
  }

  async obtenerMetricasPrioridad(): Promise<MetricasPrioridadDto> {
    const tickets = await this.ticketsRepository.find();

    return {
      critica: tickets.filter((t) => t.prioridad === 'critica').length,
      alta: tickets.filter((t) => t.prioridad === 'alta').length,
      media: tickets.filter((t) => t.prioridad === 'media').length,
      baja: tickets.filter((t) => t.prioridad === 'baja').length,
    };
  }

  async obtenerMetricasSLA(): Promise<MetricasSLADto> {
    const tickets = await this.ticketsRepository.find({
      where: { estado: 'abierto' },
    });

    const ahora = new Date();
    const ok = tickets.filter(
      (t) =>
        t.fecha_vencimiento_sla > ahora &&
        (t.fecha_vencimiento_sla.getTime() - ahora.getTime()) /
          (1000 * 60 * 60) >
          8,
    ).length;
    const warning = tickets.filter(
      (t) =>
        t.fecha_vencimiento_sla > ahora &&
        (t.fecha_vencimiento_sla.getTime() - ahora.getTime()) /
          (1000 * 60 * 60) <=
          8 &&
        (t.fecha_vencimiento_sla.getTime() - ahora.getTime()) /
          (1000 * 60 * 60) >
          0,
    ).length;
    const critical = tickets.filter(
      (t) => t.fecha_vencimiento_sla < ahora,
    ).length;

    const total = tickets.length;
    const cumplimiento = total > 0 ? ((total - critical) / total) * 100 : 100;

    return {
      total_tickets_con_sla: total,
      ok,
      warning,
      critical,
      porcentaje_cumplimiento: Math.round(cumplimiento * 100) / 100,
    };
  }

  async obtenerMetricasKB(): Promise<MetricasKbDto> {
    const articulos = await this.articulosRepository.find();
    const utilizaciones = await this.ticketArticulosRepository.find();
    const enviados_cliente = utilizaciones.filter(
      (t) => t.fue_enviado_al_cliente,
    ).length;

    const total_tickets = await this.ticketsRepository.count();
    const promedio_utilizacion =
      total_tickets > 0 ? (utilizaciones.length / total_tickets) * 100 : 0;

    return {
      total_articulos: articulos.length,
      articulos_utilizados: new Set(utilizaciones.map((u) => u.articulo_id))
        .size,
      articulos_enviados_cliente: enviados_cliente,
      promedio_utilizacion: Math.round(promedio_utilizacion * 100) / 100,
    };
  }

  async obtenerMetricasInteracciones(dias: number = 30): Promise<{
    total: number;
    por_tipo_autor: { cliente: number; agente: number; sistema: number };
    notas_internas: number;
    promedio_por_ticket: number;
  }> {
    const hace_dias = new Date(
      new Date().getTime() - dias * 24 * 60 * 60 * 1000,
    );

    const interacciones = await this.interaccionesRepository.find({
      where: { creado_en: Between(hace_dias, new Date()) },
    });

    const por_tipo_autor = {
      cliente: interacciones.filter((i) => i.autor_tipo === 'cliente').length,
      agente: interacciones.filter((i) => i.autor_tipo === 'agente').length,
      sistema: interacciones.filter((i) => i.autor_tipo === 'sistema').length,
    };

    const notas_internas = interacciones.filter(
      (i) => i.es_nota_interna,
    ).length;

    return {
      total: interacciones.length,
      por_tipo_autor,
      notas_internas,
      promedio_por_ticket:
        (await this.ticketsRepository.count()) > 0
          ? interacciones.length / (await this.ticketsRepository.count())
          : 0,
    };
  }

  async obtenerMetricasPorFuente(): Promise<{
    pedidos: number;
    suscripciones: number;
    pagos: number;
    salud: number;
    interno: number;
    total: number;
  }> {
    const tickets = await this.ticketsRepository.find();

    const pedidos = tickets.filter((t) => t.pedido_id_ref).length;
    const suscripciones = tickets.filter((t) => t.suscripcion_id_ref).length;
    const pagos = tickets.filter((t) => t.pago_id_ref).length;
    const salud = tickets.filter((t) => t.salud_ref).length;
    const interno = tickets.filter(
      (t) =>
        !t.pedido_id_ref &&
        !t.suscripcion_id_ref &&
        !t.pago_id_ref &&
        !t.salud_ref,
    ).length;

    return {
      pedidos,
      suscripciones,
      pagos,
      salud,
      interno,
      total: tickets.length,
    };
  }

  async obtenerTendencia(dias: number = 7): Promise<
    {
      fecha: string;
      abiertos: number;
      cerrados: number;
      resueltos: number;
    }[]
  > {
    const ahora = new Date();
    const resultado: {
      fecha: string;
      abiertos: number;
      cerrados: number;
      resueltos: number;
    }[] = [];

    for (let i = dias - 1; i >= 0; i--) {
      const inicioDia = new Date(ahora);
      inicioDia.setDate(ahora.getDate() - i);
      inicioDia.setHours(0, 0, 0, 0);

      const finDia = new Date(inicioDia);
      finDia.setHours(23, 59, 59, 999);

      const ticketsCreados = await this.ticketsRepository.find({
        where: { creado_en: Between(inicioDia, finDia) },
      });

      const ticketsCerrados = await this.ticketsRepository
        .createQueryBuilder('ticket')
        .where('ticket.estado = :estado', { estado: 'cerrado' })
        .andWhere('ticket.actualizado_en BETWEEN :inicio AND :fin', {
          inicio: inicioDia,
          fin: finDia,
        })
        .getMany();

      const ticketsResueltos = await this.ticketsRepository
        .createQueryBuilder('ticket')
        .where('ticket.estado = :estado', { estado: 'resuelto' })
        .andWhere('ticket.actualizado_en BETWEEN :inicio AND :fin', {
          inicio: inicioDia,
          fin: finDia,
        })
        .getMany();

      const diaLabel = inicioDia.toLocaleDateString('es-ES', {
        weekday: 'short',
      });

      resultado.push({
        fecha: diaLabel,
        abiertos: ticketsCreados.length,
        cerrados: ticketsCerrados.length,
        resueltos: ticketsResueltos.length,
      });
    }

    return resultado;
  }

  async obtenerMetricasInteraccionesPorTipo(): Promise<{
    total: number;
    por_tipo: { cliente: number; agente: number; sistema: number };
    notas_internas: number;
  }> {
    const interacciones = await this.interaccionesRepository.find();

    return {
      total: interacciones.length,
      por_tipo: {
        cliente: interacciones.filter((i) => i.autor_tipo === 'cliente').length,
        agente: interacciones.filter((i) => i.autor_tipo === 'agente').length,
        sistema: interacciones.filter((i) => i.autor_tipo === 'sistema').length,
      },
      notas_internas: interacciones.filter((i) => i.es_nota_interna).length,
    };
  }
}
