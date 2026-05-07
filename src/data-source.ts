import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Team } from './entities/Team';
import { Player } from './entities/Player';
import { Match } from './entities/Match';
import { Standing } from './entities/Standing';

const port = Number(process.env.DB_PORT || 3306);

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'super_liga',
  entities: [User, Team, Player, Match, Standing],
  synchronize: process.env.DB_SYNCHRONIZE !== 'false',
  logging: process.env.DB_LOGGING === 'true'
});
