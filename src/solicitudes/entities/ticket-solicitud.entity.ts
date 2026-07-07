import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export type SolicitudEstado = 'pendiente' | 'aprobada' | 'rechazada';

@Entity('ticket_solicitudes')
export class TicketSolicitudEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  email: string;

  @Column({ type: 'varchar', nullable: true })
  telefono: string;

  @Column()
  asunto: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente',
  })
  estado: SolicitudEstado;

  @Column({ type: 'text', nullable: true })
  motivo_rechazo: string;

  @CreateDateColumn()
  creado_en: Date;
}
