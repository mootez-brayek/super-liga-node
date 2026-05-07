import { AppDataSource } from '../data-source';
import { CreateTeamRequest } from '../dto/CreateTeamRequest';
import { StandingResponse } from '../dto/StandingResponse';
import { TeamResponse } from '../dto/TeamResponse';
import { Role } from '../entities/enums';
import { Standing } from '../entities/Standing';
import { Team } from '../entities/Team';
import { User } from '../entities/User';
import { CurrentUser } from '../types/express';

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

  async createTeam(request: CreateTeamRequest, currentUser: CurrentUser): Promise<TeamResponse> {
    const teamRepo = this.teamRepo();
    const userRepo = this.userRepo();

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
        admin: transactionAdmin
      });

      const savedTeam = await manager.getRepository(Team).save(team);

      await manager.getRepository(Standing).save(
        manager.getRepository(Standing).create({
          team: savedTeam
        })
      );

      return this.mapToResponse(savedTeam);
    });
  }

  async getTeams(): Promise<TeamResponse[]> {
    const teams = await this.teamRepo().find();

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

  async getMyStats(currentUser: CurrentUser): Promise<StandingResponse> {
    const team = await this.teamRepo().findOne({
      where: { admin: { userId: currentUser.userId } },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    const standing = await this.standingRepo().findOne({
      where: { team: { teamId: team.teamId } },
      relations: ['team']
    });

    if (!standing) {
      throw new Error('Standing not found');
    }

    return {
      position: standing.position,
      teamName: team.name,
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
      adminName: null
    };
  }
}
