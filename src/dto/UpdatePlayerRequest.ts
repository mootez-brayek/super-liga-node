import { Position, StrongFoot } from '../entities/enums';

export interface UpdatePlayerRequest {
  firstName?: string | null;
  lastName?: string | null;
  number?: number | null;
  picture?: string | null;
  strongFoot?: StrongFoot | null;
  birthDate?: string | null;
  position?: Position | null;
  teamId?: number | null;
}
