import { AppDataSource } from '../data-source';
import { DashboardStatsDto } from '../dto/DashboardStatsDto';
import { Role } from '../entities/enums';
import { Match } from '../entities/Match';
import { Player } from '../entities/Player';
import { User } from '../entities/User';
import { SeasonService } from './SeasonService';

export class DashboardService {
  private seasonService() {
    return new SeasonService();
  }

  async getStats(): Promise<DashboardStatsDto> {
    const userRepo = AppDataSource.getRepository(User);
    const matchRepo = AppDataSource.getRepository(Match);
    const playerRepo = AppDataSource.getRepository(Player);
    const season = await this.seasonService().ensureActiveSeason();

    const [totalAdmins, totalMatches, totalPlayers] = await Promise.all([
      userRepo.count({ where: { role: Role.ADMIN } }),
      matchRepo.count({ where: { season: { seasonId: season.seasonId } } }),
      playerRepo.count()
    ]);

    return {
      totalAdmins,
      totalMatches,
      totalPlayers
    };
  }
}
