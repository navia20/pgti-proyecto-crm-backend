import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TicketEntity } from '../../tickets/entities/ticket.entity';

export type AuthorType = 'cliente' | 'agente' | 'sistema';

@Entity('interacciones')
export class InteraccionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  ticket_id: string;

  @Column({
    type: 'enum',
    enum: ['cliente', 'agente', 'sistema'],
  })
  autor_tipo: AuthorType;

  @Column('varchar')
  autor_id: string;

  @Column('text')
  contenido: string;

  @Column({ type: 'boolean', default: false })
  es_nota_interna: boolean;

  @CreateDateColumn()
  creado_en: Date;

  @ManyToOne(() => TicketEntity, (ticket) => ticket.interacciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticket_id' })
  ticket: TicketEntity;
}
