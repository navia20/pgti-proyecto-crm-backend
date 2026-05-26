import {
  TipoEventoInterno,
  EstadoEventoInterno,
} from '../entities/evento-interno.entity';

export class EventoInternoDto {
  id: string;
  tipo: TipoEventoInterno;
  estado: EstadoEventoInterno;
  datos_previos: Record<string, any>;
  datos_nuevos: Record<string, any>;
  usuario_id?: string;
  razon_cambio?: string;
  reintentos: number;
  ultimo_error?: string;
  creado_en: Date;
  procesado_en?: Date;
}

export class CreateEventoInternoDto {
  tipo: TipoEventoInterno;
  datos_previos: Record<string, any>;
  datos_nuevos: Record<string, any>;
  usuario_id?: string;
  razon_cambio?: string;
}
