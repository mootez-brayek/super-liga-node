import { MatchStatus } from '../entities/enums';

export interface MyTeamMatchResponse {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string | null;
  matchTime: string | null;
  status: MatchStatus | null;
  result: string | null;
}
