import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Match } from './Match';
import { Standing } from './Standing';

@Entity({ name: 'seasons' })
export class Season {
  @PrimaryGeneratedColumn()
  seasonId!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ default: false })
  isActive!: boolean;

  @OneToMany(() => Match, (match) => match.season)
  matches!: Match[];

  @OneToMany(() => Standing, (standing) => standing.season)
  standings!: Standing[];
}
