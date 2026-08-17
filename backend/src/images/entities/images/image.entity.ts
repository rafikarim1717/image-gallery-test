import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../../users/entities/user.entity';

@Entity()
export class Image {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column()
  category!: string; // nature, architecture, people, technology

  @Column()
  url!: string; // MinIO object URL or S3 key

  @Column({ default: 0 })
  clickCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: string; // FK to User
}
