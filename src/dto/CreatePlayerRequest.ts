import { Position, StrongFoot } from '../entities/enums';

export interface CreatePlayerRequest {
  firstName: string;
  lastName: string;
  number: number;
  picture: string | null;
  strongFoot: StrongFoot | null;
  birthDate: string | null;
  position: Position | null;
  teamId: number | null;
}
