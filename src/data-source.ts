import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Team } from './entities/Team';
import { Player } from './entities/Player';
import { Match } from './entities/Match';
import { Standing } from './entities/Standing';

const dbHost = process.env.DB_HOST ?? 'localhost';
const dbPort = Number(process.env.DB_PORT ?? 3306);
const dbUsername = process.env.DB_USERNAME ?? process.env.DB_USER ?? 'root';
const dbPassword = process.env.DB_PASSWORD ?? 'root';
const dbName = process.env.DB_DATABASE ?? process.env.DB_NAME ?? 'super_liga';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbName,
  entities: [User, Team, Player, Match, Standing],
  synchronize: process.env.DB_SYNCHRONIZE !== 'false',
  logging: process.env.DB_LOGGING === 'true'
});