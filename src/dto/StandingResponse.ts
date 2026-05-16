export interface StandingResponse {
  position: number;
  teamName: string;
  seasonName: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  goalDifference: number;
  points: number;
}
