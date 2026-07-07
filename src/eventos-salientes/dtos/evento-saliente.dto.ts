import {
  TipoEventoSaliente,
  EstadoEventoSaliente,
} from '../entities/evento-saliente.entity';

export class EventoSalienteDto {
  id!: string;
  tipo!: TipoEventoSaliente;
  estado!: EstadoEventoSaliente;
  payload!: Record<string, any>;
  destino_url?: string;
  intentos_envio!: number;
  ultimo_error?: string;
  creado_en!: Date;
  enviado_en?: Date;
  proximo_reintento?: Date;
}

export class CreateEventoSalienteDto {
  tipo!: TipoEventoSaliente;
  payload!: Record<string, any>;
  destino_url?: string;
}

export class EnviarEventoSalienteDto {
  id!: string;
  tipo!: string;
  payload!: Record<string, any>;
  destinatario!: string;
}
