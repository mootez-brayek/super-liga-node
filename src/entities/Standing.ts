import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Team } from './Team';

@Entity()
@Index(['team'], { unique: true })
export class Standing {
  @PrimaryGeneratedColumn()
  standingId!: number;

  @ManyToOne(() => Team, (team) => team.standings, { nullable: false, eager: true })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @Column({ default: 0 })
  played!: number;

  @Column({ default: 0 })
  wins!: number;

  @Column({ default: 0 })
  draws!: number;

  @Column({ default: 0 })
  losses!: number;

  @Column({ default: 0 })
  goalsScored!: number;

  @Column({ default: 0 })
  goalsConceded!: number;

  @Column({ default: 0 })
  goalDifference!: number;

  @Column({ default: 0 })
  fairPlay!: number;

  @Column({ default: 0 })
  points!: number;

  @Column({ default: 0 })
  position!: number;
}
