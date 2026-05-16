import { Position, StrongFoot } from '../entities/enums';

export interface PlayerResponse {
  playerId: number;
  fullName: string;
  number: number;
  picture: string | null;
  active: boolean;
  strongFoot: StrongFoot;
  birthDate: string | null;
  age: number | null;
  position: Position;
  teamName: string;
}
