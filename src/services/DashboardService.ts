import { AppDataSource } from '../data-source';
import { DashboardStatsDto } from '../dto/DashboardStatsDto';
import { Role } from '../entities/enums';
import { Match } from '../entities/Match';
import { Player } from '../entities/Player';
import { User } from '../entities/User';

export class DashboardService {
  async getStats(): Promise<DashboardStatsDto> {
    const userRepo = AppDataSource.getRepository(User);
    const matchRepo = AppDataSource.getRepository(Match);
    const playerRepo = AppDataSource.getRepository(Player);

    const [totalAdmins, totalMatches, totalPlayers] = await Promise.all([
      userRepo.count({ where: { role: Role.ADMIN } }),
      matchRepo.count(),
      playerRepo.count()
    ]);

    return {
      totalAdmins,
      totalMatches,
      totalPlayers
    };
  }
}
