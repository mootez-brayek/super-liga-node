import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User';
import { Team } from './entities/Team';
import { Player } from './entities/Player';
import { Match } from './entities/Match';
import { Standing } from './entities/Standing';
import { Season } from './entities/Season';
import { MatchEvent } from './entities/MatchEvent';

function resolveEnvAlias(
  primary: string | undefined,
  secondary: string | undefined,
  fallback: string,
  primaryName: string,
  secondaryName: string
) {
  if (primary && secondary && primary !== secondary) {
    throw new Error(`Conflicting values for ${primaryName} and ${secondaryName}. Use only one of them, or make them identical.`);
  }

  return primary ?? secondary ?? fallback;
}

const dbHost = process.env.DB_HOST ?? 'localhost';
const dbPort = Number(process.env.DB_PORT ?? 3306);
const dbUsername = resolveEnvAlias(process.env.DB_USERNAME, process.env.DB_USER, 'root', 'DB_USERNAME', 'DB_USER');
const dbPassword = process.env.DB_PASSWORD ?? 'root';
const dbName = resolveEnvAlias(process.env.DB_DATABASE, process.env.DB_NAME, 'super_liga', 'DB_DATABASE', 'DB_NAME');

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: dbHost,
  port: dbPort,
  username: dbUsername,
  password: dbPassword,
  database: dbName,
  entities: [User, Team, Player, Season, Match, Standing, MatchEvent],
  synchronize: process.env.DB_SYNCHRONIZE !== 'false',
  logging: process.env.DB_LOGGING === 'true'
});
