export interface CreateMatchRequest {
  homeTeamId: number;
  awayTeamId: number;
  matchDate: string;
  matchTime: string;
  seasonId?: number | null;
  roundNumber?: number | null;
}
