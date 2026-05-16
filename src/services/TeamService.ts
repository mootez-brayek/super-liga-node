import { AppDataSource } from '../data-source';
import { CreateTeamRequest } from '../dto/CreateTeamRequest';
import { StandingResponse } from '../dto/StandingResponse';
import { TeamResponse } from '../dto/TeamResponse';
import { UpdateTeamRequest } from '../dto/UpdateTeamRequest';
import { Role } from '../entities/enums';
import { Standing } from '../entities/Standing';
import { Team } from '../entities/Team';
import { User } from '../entities/User';
import { CurrentUser } from '../types/express';
import { SeasonService } from './SeasonService';
import { deleteUploadedMedia } from '../utils/uploads';
import { isBlank } from '../utils/string';

export class TeamService {
  private teamRepo() {
    return AppDataSource.getRepository(Team);
  }

  private standingRepo() {
    return AppDataSource.getRepository(Standing);
  }

  private userRepo() {
    return AppDataSource.getRepository(User);
  }

  private seasonService() {
    return new SeasonService();
  }

  async createTeam(request: CreateTeamRequest, currentUser: CurrentUser): Promise<TeamResponse> {
    const teamRepo = this.teamRepo();
    const userRepo = this.userRepo();
    const season = await this.seasonService().ensureActiveSeason();

    const exists = await teamRepo.exists({ where: { name: request.name } });
    if (exists) {
      throw new Error('Team name already exists');
    }

    if (currentUser.role !== Role.ADMIN) {
      throw new Error('Only ADMIN can create a team');
    }

    const admin = await userRepo.findOne({ where: { userId: currentUser.userId } });
    if (!admin) {
      throw new Error('User not found');
    }

    const adminWithTeam = await userRepo.findOne({
      where: { userId: currentUser.userId },
      relations: ['team']
    });

    if (!adminWithTeam) {
      throw new Error('User not found');
    }

    if (adminWithTeam.team) {
      throw new Error('Admin already has a team');
    }

    return AppDataSource.transaction(async (manager) => {
      const transactionAdmin = await manager.getRepository(User).findOne({
        where: { userId: currentUser.userId }
      });

      if (!transactionAdmin) {
        throw new Error('User not found');
      }

      const team = manager.getRepository(Team).create({
        name: request.name,
        logo: request.logo ?? null,
        isArchived: false,
        admin: transactionAdmin
      });

      const savedTeam = await manager.getRepository(Team).save(team);

      await manager.getRepository(Standing).save(
        manager.getRepository(Standing).create({
          season,
          team: savedTeam
        })
      );

      return this.mapToResponse(savedTeam);
    });
  }

  async getTeams(options: { includeArchived?: boolean } = {}): Promise<TeamResponse[]> {
    const teams = await this.teamRepo().find(
      options.includeArchived
        ? { relations: ['admin'] }
        : { relations: ['admin'], where: { isArchived: false } }
    );

    return teams.map((team) => this.mapToResponse(team));
  }

  async getMyTeam(currentUser: CurrentUser): Promise<TeamResponse> {
    const team = await this.teamRepo().findOne({
      where: { admin: { userId: currentUser.userId } },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    return this.mapToResponse(team);
  }

  async updateMyTeam(request: UpdateTeamRequest, currentUser: CurrentUser): Promise<TeamResponse> {
    const team = await this.teamRepo().findOne({
      where: { admin: { userId: currentUser.userId } },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    return this.updateTeamEntity(team, request);
  }

  async updateTeam(teamId: number, request: UpdateTeamRequest): Promise<TeamResponse> {
    const team = await this.teamRepo().findOne({
      where: { teamId },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    return this.updateTeamEntity(team, request);
  }

  async archiveMyTeam(currentUser: CurrentUser): Promise<void> {
    const team = await this.teamRepo().findOne({
      where: { admin: { userId: currentUser.userId } },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    await this.archiveTeam(team.teamId);
  }

  async restoreMyTeam(currentUser: CurrentUser): Promise<TeamResponse> {
    const team = await this.teamRepo().findOne({
      where: { admin: { userId: currentUser.userId } },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    team.isArchived = false;
    const saved = await this.teamRepo().save(team);
    return this.mapToResponse(saved);
  }

  async archiveTeam(teamId: number): Promise<void> {
    const teamRepo = this.teamRepo();
    const team = await teamRepo.findOne({
      where: { teamId },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    team.isArchived = true;
    await teamRepo.save(team);
  }

  async restoreTeam(teamId: number): Promise<TeamResponse> {
    const teamRepo = this.teamRepo();
    const team = await teamRepo.findOne({
      where: { teamId },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    team.isArchived = false;
    const saved = await teamRepo.save(team);
    return this.mapToResponse(saved);
  }

  async getMyStats(currentUser: CurrentUser): Promise<StandingResponse> {
    const team = await this.teamRepo().findOne({
      where: { admin: { userId: currentUser.userId } },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const season = await this.seasonService().ensureActiveSeason();
    let standing = await this.standingRepo().findOne({
      where: {
        season: { seasonId: season.seasonId },
        team: { teamId: team.teamId }
      },
      relations: ['team', 'season']
    });

    if (!standing) {
      standing = await this.standingRepo().save(
        this.standingRepo().create({
          season,
          team
        })
      );
    }

    return {
      position: standing.position,
      teamName: team.name,
      seasonName: standing.season?.name ?? season.name,
      played: standing.played,
      wins: standing.wins,
      draws: standing.draws,
      losses: standing.losses,
      goalsScored: standing.goalsScored,
      goalsConceded: standing.goalsConceded,
      goalDifference: standing.goalDifference,
      points: standing.points
    };
  }

  private mapToResponse(team: Team): TeamResponse {
    return {
      teamId: team.teamId,
      name: team.name,
      logo: team.logo ?? null,
      adminName: team.admin ? `${team.admin.firstName} ${team.admin.lastName}`.trim() : null,
      isArchived: team.isArchived
    };
  }

  private async updateTeamEntity(team: Team, request: UpdateTeamRequest): Promise<TeamResponse> {
    const teamRepo = this.teamRepo();
    const previousLogo = team.logo;

    if (!isBlank(request.name)) {
      const nextName = request.name!.trim();
      if (nextName !== team.name) {
        const exists = await teamRepo.exists({ where: { name: nextName } });
        if (exists) {
          throw new Error('Team name already exists');
        }
      }

      team.name = nextName;
    }

    if (request.logo !== undefined) {
      team.logo = request.logo?.trim() ? request.logo.trim() : null;
    }

    const saved = await teamRepo.save(team);

    if (saved.logo !== previousLogo) {
      deleteUploadedMedia(previousLogo);
    }

    return this.mapToResponse(saved);
  }
}
