import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Role } from './enums';
import { Team } from './Team';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  userId!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true, nullable: true })
  phoneNumber!: string | null;

  @Column({ default: false })
  isActive!: boolean;

  @Column({ unique: true, nullable: true })
  username!: string | null;

  @Column()
  password!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @OneToOne(() => Team, (team) => team.admin)
  team?: Team | null;
}
