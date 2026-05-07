import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';
import { Player } from './Player';
import { Standing } from './Standing';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  teamId!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  logo!: string | null;

  @OneToOne(() => User, (user) => user.team, { nullable: true })
  @JoinColumn({ name: 'admin_id' })
  admin!: User | null;

  @OneToMany(() => Player, (player) => player.team)
  players!: Player[];

  @OneToMany(() => Standing, (standing) => standing.team)
  standings!: Standing[];
}
