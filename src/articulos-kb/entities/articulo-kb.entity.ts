import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TicketArticuloEntity } from '../../ticket-articulos/entities/ticket-articulo.entity';

@Entity('articulos_kb')
export class ArticuloKbEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column('text')
  contenido: string;

  @Column()
  categoria: string;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;

  @OneToMany(() => TicketArticuloEntity, (ta) => ta.articulo, {
    cascade: true,
  })
  tickets: TicketArticuloEntity[];
}
