import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { InteraccionEntity } from '../../interacciones/entities/interaccion.entity';
import { TicketArticuloEntity } from '../../ticket-articulos/entities/ticket-articulo.entity';

export type TicketPriority = 'baja' | 'media' | 'alta' | 'critica';
export type TicketStatus = 'abierto' | 'progreso' | 'resuelto' | 'cerrado';
export type TicketChannel = 'chat' | 'email' | 'telefono' | 'app';

@Entity('tickets')
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  asunto!: string;

  @Column({
    type: 'enum',
    enum: ['abierto', 'progreso', 'resuelto', 'cerrado'],
    default: 'abierto',
  })
  estado!: TicketStatus;

  @Column({
    type: 'enum',
    enum: ['baja', 'media', 'alta', 'critica'],
    default: 'media',
  })
  prioridad!: TicketPriority;

  @Column({
    type: 'enum',
    enum: ['chat', 'email', 'telefono', 'app'],
  })
  canal!: TicketChannel;

  @Column('integer', { nullable: true })
  cliente_id?: number;

  @Column({ type: 'varchar', nullable: true })
  agente_id?: string;

  @Column({ type: 'timestamp' })
  fecha_vencimiento_sla!: Date;

  @Column({ type: 'varchar', nullable: true })
  pedido_id_ref?: string;

  @Column({ type: 'varchar', nullable: true })
  suscripcion_id_ref?: string;

  @CreateDateColumn()
  creado_en!: Date;

  @UpdateDateColumn()
  actualizado_en!: Date;

  @Column({ type: 'varchar', nullable: true })
  pago_id_ref?: string;

  @Column({ type: 'varchar', nullable: true })
  salud_ref?: string;

  @Column({ type: 'varchar', nullable: true })
  sistema_id?: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ type: 'text', nullable: true })
  resolucion?: string;

  @Column({ type: 'boolean', default: false })
  sla_warned!: boolean;

  // Relaciones
  @OneToMany(() => InteraccionEntity, (interaccion) => interaccion.ticket, {
    cascade: true,
  })
  interacciones?: InteraccionEntity[];

  @OneToMany(() => TicketArticuloEntity, (ta) => ta.ticket, {
    cascade: true,
  })
  articulos?: TicketArticuloEntity[];
}
