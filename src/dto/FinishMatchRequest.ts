export interface FinishMatchRequest {
  homeScore: number;
  awayScore: number;
  homeRed: number | null;
  awayRed: number | null;
  homeOut: number | null;
  awayOut: number | null;
  mvpId: number | null;
  homeScorerIds?: number[] | null;
  awayScorerIds?: number[] | null;
}
