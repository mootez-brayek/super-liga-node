import { MatchEventType } from '../entities/enums';

export interface MatchEventResponse {
  eventId: number;
  matchId: number;
  type: MatchEventType;
  minute: number;
  note: string | null;
  teamId: number | null;
  teamName: string | null;
  playerId: number | null;
  playerName: string | null;
}
