import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MatchStatus } from './enums';
import { Team } from './Team';
import { Player } from './Player';

@Entity({ name: 'matches' })
export class Match {
  @PrimaryGeneratedColumn()
  matchId!: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  matchDate!: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  matchTime!: string | null;

  @Column({ type: 'int', nullable: true })
  homeScore!: number | null;

  @Column({ type: 'int', nullable: true })
  awayScore!: number | null;

  @Column({ default: 0 })
  homeRed!: number;

  @Column({ default: 0 })
  awayRed!: number;

  @Column({ default: 0 })
  homeOut!: number;

  @Column({ default: 0 })
  awayOut!: number;

  @Column({ type: 'enum', enum: MatchStatus, nullable: true })
  status!: MatchStatus | null;

  @ManyToOne(() => Team, { nullable: false })
  @JoinColumn({ name: 'home_team_id' })
  homeTeam!: Team;

  @ManyToOne(() => Team, { nullable: false })
  @JoinColumn({ name: 'away_team_id' })
  awayTeam!: Team;

  @ManyToOne(() => Player, { nullable: true })
  @JoinColumn({ name: 'mvp_id' })
  mvp!: Player | null;
}
