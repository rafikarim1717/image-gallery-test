import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
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
  url!: string; // MinIO object key for uploads, or a remote URL for seed images

  @Column({ default: 0 })
  clickCount!: number;

  // Plain column (not @CreateDateColumn) so seeded rows can set their own
  // historical createdAt from seed-images.json instead of it being
  // overwritten with "now" on insert.
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  // Nullable: seed images (B6) have no owner. That also makes them
  // naturally read-only, since a real user's id never matches null.
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  user?: User;

  @Column({ nullable: true })
  userId!: string | null;

  // Original numeric id from seed-images.json. Only used to make seeding
  // idempotent across restarts; uploaded images leave this null.
  @Column({ nullable: true, unique: true })
  seedId?: number;
}
