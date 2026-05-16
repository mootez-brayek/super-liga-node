export interface GenerateSeasonScheduleRequest {
  name: string;
  startDate: string;
  startTime: string;
  roundGapDays?: number;
  matchGapMinutes?: number;
  doubleRound?: boolean;
}
