import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export type TipoEventoSaliente =
  | 'ticket_creado'
  | 'ticket_actualizado'
  | 'cliente_actualizado'
  | 'interaccion_nueva'
  | 'ticket_resuelto';
export type EstadoEventoSaliente =
  | 'pendiente_envio'
  | 'enviado'
  | 'fallo'
  | 'cancelado';

@Entity('eventos_salientes')
export class EventoSalienteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: [
      'ticket_creado',
      'ticket_actualizado',
      'cliente_actualizado',
      'interaccion_nueva',
      'ticket_resuelto',
    ],
  })
  tipo: TipoEventoSaliente;

  @Column({
    type: 'enum',
    enum: ['pendiente_envio', 'enviado', 'fallo', 'cancelado'],
    default: 'pendiente_envio',
  })
  estado: EstadoEventoSaliente;

  @Column('json')
  payload: Record<string, any>;

  @Column({ nullable: true })
  destino_url: string;

  @Column({ type: 'integer', default: 0 })
  intentos_envio: number;

  @Column({ type: 'varchar', nullable: true })
  ultimo_error: string;

  @CreateDateColumn()
  creado_en: Date;

  @Column({ type: 'timestamp', nullable: true })
  enviado_en: Date;

  @Column({ type: 'timestamp', nullable: true })
  proximo_reintento: Date;
}
