import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventoSalienteEntity } from './entities/evento-saliente.entity';
import { EventoSalienteDto, CreateEventoSalienteDto } from './dtos/evento-saliente.dto';

@Injectable()
export class EventosSalientesService {
  private readonly logger = new Logger(EventosSalientesService.name);

  constructor(
    @InjectRepository(EventoSalienteEntity)
    private readonly eventosSalientesRepository: Repository<EventoSalienteEntity>,
  ) {}

  async registrar(createEventoDto: CreateEventoSalienteDto): Promise<EventoSalienteDto> {
    const evento = this.eventosSalientesRepository.create({
      tipo: createEventoDto.tipo as any,
      payload: createEventoDto.payload || {},
      destino_url: createEventoDto.destino_url,
      estado: 'pendiente_envio',
    });

    const saved = await this.eventosSalientesRepository.save(evento);
    this.logger.log(`Evento saliente registrado: ${saved.id} (${saved.tipo})`);
    return this.mapToDto(saved);
  }

  async findAll(estado?: string): Promise<EventoSalienteDto[]> {
    const query = this.eventosSalientesRepository.createQueryBuilder('evento');

    if (estado) {
      query.where('evento.estado = :estado', { estado });
    }

    const eventos = await query.orderBy('evento.creado_en', 'DESC').take(1000).getMany();
    return eventos.map((e) => this.mapToDto(e));
  }

  async findPending(): Promise<EventoSalienteDto[]> {
    return this.findAll('pendiente_envio');
  }

  async marcarEnviado(eventoId: string): Promise<EventoSalienteDto> {
    const evento = await this.eventosSalientesRepository.findOne({ where: { id: eventoId } });

    if (!evento) {
      throw new Error(`Evento ${eventoId} no encontrado`);
    }

    evento.estado = 'enviado';
    evento.enviado_en = new Date();
    const saved = await this.eventosSalientesRepository.save(evento);

    this.logger.log(`Evento saliente marcado como enviado: ${eventoId}`);
    return this.mapToDto(saved);
  }

  async marcarFallo(eventoId: string, errorMsg: string, segundosReintentar: number = 3600): Promise<EventoSalienteDto> {
    const evento = await this.eventosSalientesRepository.findOne({ where: { id: eventoId } });

    if (!evento) {
      throw new Error(`Evento ${eventoId} no encontrado`);
    }

    evento.intentos_envio += 1;
    evento.ultimo_error = errorMsg;

    if (evento.intentos_envio >= 5) {
      evento.estado = 'fallo';
    } else {
      evento.proximo_reintento = new Date(Date.now() + segundosReintentar * 1000);
    }

    const saved = await this.eventosSalientesRepository.save(evento);

    this.logger.warn(
      `Evento saliente error (intento ${evento.intentos_envio}): ${eventoId} - ${errorMsg}`,
    );
    return this.mapToDto(saved);
  }

  async marcarCancelado(eventoId: string): Promise<EventoSalienteDto> {
    const evento = await this.eventosSalientesRepository.findOne({ where: { id: eventoId } });

    if (!evento) {
      throw new Error(`Evento ${eventoId} no encontrado`);
    }

    evento.estado = 'cancelado';
    const saved = await this.eventosSalientesRepository.save(evento);

    this.logger.log(`Evento saliente cancelado: ${eventoId}`);
    return this.mapToDto(saved);
  }

  async obtenerEventosPendientes(): Promise<EventoSalienteDto[]> {
    const ahora = new Date();
    const eventos = await this.eventosSalientesRepository
      .createQueryBuilder('evento')
      .where('evento.estado = :estado', { estado: 'pendiente_envio' })
      .orWhere('evento.proximo_reintento <= :ahora', { ahora })
      .orderBy('evento.creado_en', 'ASC')
      .getMany();

    return eventos.map((e) => this.mapToDto(e));
  }

  private mapToDto(evento: EventoSalienteEntity): EventoSalienteDto {
    return {
      id: evento.id,
      tipo: evento.tipo,
      estado: evento.estado,
      payload: evento.payload,
      destino_url: evento.destino_url,
      intentos_envio: evento.intentos_envio,
      ultimo_error: evento.ultimo_error,
      creado_en: evento.creado_en,
      enviado_en: evento.enviado_en,
      proximo_reintento: evento.proximo_reintento,
    };
  }
}
