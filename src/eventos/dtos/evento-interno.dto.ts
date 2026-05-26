export class EventoInternoDto {
  id: string;
  tipo: string;
  estado: string;
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
  tipo: string;
  datos_previos: Record<string, any>;
  datos_nuevos: Record<string, any>;
  usuario_id?: string;
  razon_cambio?: string;
}
