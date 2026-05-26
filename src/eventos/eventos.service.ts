import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EventoInternoEntity,
  EstadoEventoInterno,
} from './entities/evento-interno.entity';
import {
  EventoInternoDto,
  CreateEventoInternoDto,
} from './dtos/evento-interno.dto';

@Injectable()
export class EventosService {
  private readonly logger = new Logger(EventosService.name);

  constructor(
    @InjectRepository(EventoInternoEntity)
    private readonly eventosRepository: Repository<EventoInternoEntity>,
  ) {}

  async registrar(
    createEventoDto: CreateEventoInternoDto,
  ): Promise<EventoInternoDto> {
    const evento = this.eventosRepository.create({
      tipo: createEventoDto.tipo,
      datos_previos: createEventoDto.datos_previos || {},
      datos_nuevos: createEventoDto.datos_nuevos || {},
      usuario_id: createEventoDto.usuario_id,
      razon_cambio: createEventoDto.razon_cambio,
      estado: 'pendiente' as EstadoEventoInterno,
    });

    const saved = await this.eventosRepository.save(evento);
    this.logger.log(`Evento registrado: ${saved.id} (${saved.tipo})`);
    return this.mapToDto(saved);
  }

  async findAll(estado?: string): Promise<EventoInternoDto[]> {
    const query = this.eventosRepository.createQueryBuilder('evento');

    if (estado) {
      query.where('evento.estado = :estado', { estado });
    }

    const eventos = await query
      .orderBy('evento.creado_en', 'DESC')
      .take(1000)
      .getMany();
    return eventos.map((e) => this.mapToDto(e));
  }

  async findPending(): Promise<EventoInternoDto[]> {
    return this.findAll('pendiente');
  }

  async marcarProcesado(eventoId: string): Promise<EventoInternoDto> {
    const evento = await this.eventosRepository.findOne({
      where: { id: eventoId },
    });

    if (!evento) {
      throw new Error(`Evento ${eventoId} no encontrado`);
    }

    evento.estado = 'procesado';
    evento.procesado_en = new Date();
    const saved = await this.eventosRepository.save(evento);

    this.logger.log(`Evento marcado como procesado: ${eventoId}`);
    return this.mapToDto(saved);
  }

  async marcarError(
    eventoId: string,
    errorMsg: string,
  ): Promise<EventoInternoDto> {
    const evento = await this.eventosRepository.findOne({
      where: { id: eventoId },
    });

    if (!evento) {
      throw new Error(`Evento ${eventoId} no encontrado`);
    }

    evento.reintentos += 1;
    evento.ultimo_error = errorMsg;
    evento.estado = evento.reintentos >= 3 ? 'error' : 'pendiente';
    const saved = await this.eventosRepository.save(evento);

    this.logger.warn(
      `Evento error (reintento ${evento.reintentos}): ${eventoId} - ${errorMsg}`,
    );
    return this.mapToDto(saved);
  }

  private mapToDto(evento: EventoInternoEntity): EventoInternoDto {
    return {
      id: evento.id,
      tipo: evento.tipo,
      estado: evento.estado,
      datos_previos: evento.datos_previos,
      datos_nuevos: evento.datos_nuevos,
      usuario_id: evento.usuario_id,
      razon_cambio: evento.razon_cambio,
      reintentos: evento.reintentos,
      ultimo_error: evento.ultimo_error,
      creado_en: evento.creado_en,
      procesado_en: evento.procesado_en,
    };
  }
}
