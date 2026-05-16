import { MatchEventType } from '../entities/enums';

export interface CreateMatchEventRequest {
  type: MatchEventType;
  minute: number;
  note?: string | null;
  teamId?: number | null;
  playerId?: number | null;
}
