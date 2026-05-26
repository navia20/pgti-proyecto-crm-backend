import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export type TipoEventoInterno = 'cliente_actualizado' | 'cliente_fusionado' | 'ticket_creado' | 'ticket_actualizado' | 'interaccion_creada';
export type EstadoEventoInterno = 'pendiente' | 'procesado' | 'error' | 'descartado';

@Entity('eventos_internos')
export class EventoInternoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['cliente_actualizado', 'cliente_fusionado', 'ticket_creado', 'ticket_actualizado', 'interaccion_creada'],
  })
  tipo: TipoEventoInterno;

  @Column({
    type: 'enum',
    enum: ['pendiente', 'procesado', 'error', 'descartado'],
    default: 'pendiente',
  })
  estado: EstadoEventoInterno;

  @Column('json')
  datos_previos: Record<string, any>;

  @Column('json')
  datos_nuevos: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  usuario_id: string;

  @Column({ nullable: true })
  razon_cambio: string;

  @Column({ type: 'integer', default: 0 })
  reintentos: number;

  @Column({ type: 'varchar', nullable: true })
  ultimo_error: string;

  @CreateDateColumn()
  creado_en: Date;

  @Column({ type: 'timestamp', nullable: true })
  procesado_en: Date;
}
