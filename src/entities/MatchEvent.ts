import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { MatchEventType } from './enums';
import { Match } from './Match';
import { Player } from './Player';
import { Team } from './Team';

@Entity()
export class MatchEvent {
  @PrimaryGeneratedColumn()
  eventId!: number;

  @ManyToOne(() => Match, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match!: Match;

  @Column({ type: 'enum', enum: MatchEventType })
  type!: MatchEventType;

  @Column({ type: 'int' })
  minute!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note!: string | null;

  @ManyToOne(() => Team, { nullable: true })
  @JoinColumn({ name: 'team_id' })
  team!: Team | null;

  @ManyToOne(() => Player, { nullable: true })
  @JoinColumn({ name: 'player_id' })
  player!: Player | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
