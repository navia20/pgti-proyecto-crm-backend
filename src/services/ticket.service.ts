import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, PrioridadTicket, EstadoTicket } from './ticket.entity';
import { Interaccion, TipoAutor } from '../entities/interaccion.entity';
import { Cliente } from '../entities/cliente.entity';

export interface CreateTicketDto {
  cliente_id?: number;
  titulo: string;
  canal: string;
  prioridad: string;
  descripcion: string;
  categoria?: string;
}

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Interaccion)
    private interaccionRepository: Repository<Interaccion>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
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
      const clienteAnonimo = new Cliente();
      clienteAnonimo.nombre_completo = `Cliente Anónimo ${Date.now()}`;
      clienteAnonimo.email = `anonimo-${Date.now()}@anonymous.crm`;

      const clienteGuardado = await this.clienteRepository.save(clienteAnonimo);
      clienteId = clienteGuardado.id;
    }

    // 1. Crear el ticket
    const ticket = new Ticket();
    ticket.cliente_id = clienteId;
    ticket.asunto = dto.titulo;
    ticket.canal = dto.canal as any;
    ticket.prioridad = dto.prioridad as PrioridadTicket;
    ticket.estado = EstadoTicket.Abierto;
    ticket.agente_id = 1; // Por ahora, asignación manual
    ticket.fecha_vencimiento_sla = this.calcularFechaVencimientoSLA(dto.prioridad);

    const ticketGuardado = await this.ticketRepository.save(ticket);

    // 2. Crear la primera interacción (descripción)
    const interaccion = new Interaccion();
    interaccion.ticket_id = ticketGuardado.id;
    interaccion.autor_tipo = TipoAutor.Cliente;
    interaccion.autor_id = clienteId;
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

  async obtenerTicket(id: number): Promise<Ticket | null> {
    return this.ticketRepository.findOne({
      where: { id },
      relations: ['cliente', 'interacciones'],
    });
  }

  async listarTickets(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      relations: ['cliente', 'interacciones'],
    });
  }
}
