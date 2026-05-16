import { MatchStatus } from '../entities/enums';

export interface MatchResponse {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus | null;
  matchDate: string | null;
  matchTime: string | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  seasonId: number | null;
  seasonName: string | null;
  roundNumber: number;
}
