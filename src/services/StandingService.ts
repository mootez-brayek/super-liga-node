import { AppDataSource } from '../data-source';
import { StandingResponse } from '../dto/StandingResponse';
import { Standing } from '../entities/Standing';
import { SeasonService } from './SeasonService';

export class StandingService {
  private standingRepo() {
    return AppDataSource.getRepository(Standing);
  }

  private seasonService() {
    return new SeasonService();
  }

  async getStandings(): Promise<StandingResponse[]> {
    const season = await this.seasonService().ensureActiveSeason();
    const standings = await this.standingRepo().find({
      relations: ['team', 'season'],
      where: {
        season: { seasonId: season.seasonId },
        team: { isArchived: false }
      },
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
      seasonName: standing.season?.name ?? season.name,
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
