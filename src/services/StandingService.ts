import { AppDataSource } from '../data-source';
import { StandingResponse } from '../dto/StandingResponse';
import { Standing } from '../entities/Standing';

export class StandingService {
  private standingRepo() {
    return AppDataSource.getRepository(Standing);
  }

  async getStandings(): Promise<StandingResponse[]> {
    const standings = await this.standingRepo().find({
      relations: ['team'],
      order: {
        points: 'DESC',
        goalDifference: 'DESC',
        goalsScored: 'DESC'
      }
    });

    let position = 1;

    return standings.map((standing) => ({
      position: position++,
      teamName: standing.team.name,
      played: standing.played,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      goalsScored: standing.goalsScored,
      goalsConceded: standing.goalsConceded,
      goalDifference: standing.goalDifference,
      points: standing.points
    }));
  }
}
