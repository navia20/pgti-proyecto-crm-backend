import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TicketEntity,
  TicketChannel,
  TicketPriority,
} from '../tickets/entities/ticket.entity';
import { InteraccionEntity } from '../interacciones/entities/interaccion.entity';
import { ClienteEntity } from '../clientes/entities/cliente.entity';

export interface CreateTicketDto {
  cliente_id?: number;
  titulo: string;
  canal: TicketChannel;
  prioridad: TicketPriority;
  descripcion: string;
  categoria?: string;
}

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(TicketEntity)
    private ticketRepository: Repository<TicketEntity>,
    @InjectRepository(InteraccionEntity)
    private interaccionRepository: Repository<InteraccionEntity>,
    @InjectRepository(ClienteEntity)
    private clienteRepository: Repository<ClienteEntity>,
  ) {}

  // Calcular fecha de vencimiento SLA según prioridad
  private calcularFechaVencimientoSLA(prioridad: string): Date {
    const ahora = new Date();
    let horas = 72; // Default para Baja

    switch (prioridad.toLowerCase()) {
      case 'crítica':
        horas = 8;
        break;
      case 'alta':
        horas = 24;
        break;
      case 'media':
        horas = 48;
        break;
    }

    const fecha = new Date(ahora);
    fecha.setHours(fecha.getHours() + horas);
    return fecha;
  }

  async crearTicket(dto: CreateTicketDto): Promise<any> {
    // 0. Obtener o crear cliente
    let clienteId = dto.cliente_id;

    if (!clienteId) {
      // Crear cliente anónimo
      const clienteAnonimo = new ClienteEntity();
      clienteAnonimo.nombre_completo = `Cliente Anónimo ${Date.now()}`;
      clienteAnonimo.email = `anonimo-${Date.now()}@anonymous.crm`;

      const clienteGuardado = await this.clienteRepository.save(clienteAnonimo);
      clienteId = clienteGuardado.id;
    }

    // 1. Crear el ticket
    const ticket = new TicketEntity();
    ticket.cliente_id = clienteId;
    ticket.asunto = dto.titulo;
    ticket.canal = dto.canal;
    ticket.prioridad = dto.prioridad;
    ticket.estado = 'abierto';
    // ticket.agente_id = null; // Sin asignación manual por ahora
    ticket.fecha_vencimiento_sla = this.calcularFechaVencimientoSLA(
      dto.prioridad,
    );

    const ticketGuardado = await this.ticketRepository.save(ticket);

    // 2. Crear la primera interacción (descripción)
    const interaccion = new InteraccionEntity();
    interaccion.ticket_id = ticketGuardado.id;
    interaccion.autor_tipo = 'cliente';
    interaccion.autor_id = '00000000-0000-0000-0000-000000000000'; // Placeholder UUID para cliente anónimo
    interaccion.contenido = dto.descripcion;
    interaccion.es_nota_interna = false;

    await this.interaccionRepository.save(interaccion);

    // 3. Obtener datos del cliente
    const clienteData = await this.clienteRepository.findOne({
      where: { id: clienteId },
    });

    return {
      success: true,
      ticket: ticketGuardado,
      cliente: clienteData,
      interaccion: interaccion,
      mensaje: `Ticket #${ticketGuardado.id} creado exitosamente`,
    };
  }

  async obtenerTicket(id: string): Promise<TicketEntity | null> {
    return this.ticketRepository.findOne({
      where: { id },
      relations: ['cliente', 'interacciones'],
    });
  }

  async listarTickets(): Promise<TicketEntity[]> {
    return this.ticketRepository.find({
      relations: ['cliente', 'interacciones'],
    });
  }
}
