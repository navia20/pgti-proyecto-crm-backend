import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TicketEntity } from './ticket.entity';

export type CanalNotificacion = 'email' | 'whatsapp' | 'sms' | 'otro';

@Entity('ticket_enlaces')
export class TicketEnlaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  ticket_id!: string;

  @Column({ type: 'varchar', unique: true })
  token!: string;

  @Column({
    type: 'enum',
    enum: ['email', 'whatsapp', 'sms', 'otro'],
    default: 'otro',
  })
  canal_notificacion!: CanalNotificacion;

  @Column({ type: 'timestamp' })
  expira_en!: Date;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn()
  creado_en!: Date;

  @ManyToOne(() => TicketEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket!: TicketEntity;
}
