import { MatchStatus } from '../entities/enums';

export interface MatchResultResponse {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  winner: string;
  status: MatchStatus | null;
  seasonName: string | null;
  roundNumber: number;
}
