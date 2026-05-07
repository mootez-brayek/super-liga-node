import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Position, StrongFoot } from './enums';
import { Team } from './Team';
import { User } from './User';

@Entity()
@Index(['team', 'number'], { unique: true })
export class Player {
  @PrimaryGeneratedColumn()
  playerId!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  number!: number;

  @Column({ nullable: true })
  picture!: string | null;

  @Column({ type: 'enum', enum: StrongFoot })
  strongFoot!: StrongFoot;

  @Column({ type: 'varchar', length: 10, nullable: true })
  birthDate!: string | null;

  @Column({ default: 0 })
  yellowCards!: number;

  @Column({ default: 0 })
  redCards!: number;

  @Column({ default: 0 })
  goals!: number;

  @Column({ default: 0 })
  assists!: number;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;

  @Column({ type: 'enum', enum: Position })
  position!: Position;

  @ManyToOne(() => Team, (team) => team.players, { nullable: false })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;

  fullName!: string;

  @AfterLoad()
  setFullName() {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
}
