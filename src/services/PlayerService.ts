import { AppDataSource } from '../data-source';
import { CreatePlayerRequest } from '../dto/CreatePlayerRequest';
import { PlayerResponse } from '../dto/PlayerResponse';
import { Position, Role } from '../entities/enums';
import { Player } from '../entities/Player';
import { Team } from '../entities/Team';
import { User } from '../entities/User';
import { CurrentUser } from '../types/express';
import { calculateAge, normalizeDate } from '../utils/date';
import { isBlank } from '../utils/string';

export class PlayerService {
  private playerRepo() {
    return AppDataSource.getRepository(Player);
  }

  private userRepo() {
    return AppDataSource.getRepository(User);
  }

  private teamRepo() {
    return AppDataSource.getRepository(Team);
  }

  async addPlayer(request: CreatePlayerRequest, currentUser: CurrentUser): Promise<PlayerResponse> {
    if (currentUser.role !== Role.ADMIN) {
      throw new Error('Only ADMIN can add players');
    }

    const userRepo = this.userRepo();
    const teamRepo = this.teamRepo();
    const playerRepo = this.playerRepo();

    const fullAdmin = await userRepo.findOne({
      where: { userId: currentUser.userId },
      relations: ['team']
    });

    if (!fullAdmin) {
      throw new Error('Admin not found');
    }

    if (!fullAdmin.team) {
      throw new Error('Team not found');
    }

    const team = await teamRepo.findOne({
      where: { teamId: fullAdmin.team.teamId },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('Team not found');
    }

    if (!team.admin || team.admin.userId !== currentUser.userId) {
      throw new Error('Only Admin of that team can add players to it');
    }

    const exists = await playerRepo.exists({
      where: {
        team: { teamId: team.teamId },
        number: request.number
      }
    });
    if (exists) {
      throw new Error('Player number already exists in this team');
    }

    const player = playerRepo.create({
      firstName: request.firstName,
      lastName: request.lastName,
      number: request.number,
      picture: request.picture ?? null,
      strongFoot: request.strongFoot,
      birthDate: normalizeDate(request.birthDate),
      position: request.position as Position,
      active: true,
      team,
      createdBy: fullAdmin
    });

    const saved = await playerRepo.save(player);
    return this.mapToResponse(saved);
  }

  async updatePlayer(playerId: number, request: CreatePlayerRequest, currentUser: CurrentUser): Promise<PlayerResponse> {
    if (currentUser.role !== Role.ADMIN) {
      throw new Error('Only ADMIN can update players');
    }

    const userRepo = this.userRepo();
    const playerRepo = this.playerRepo();

    const admin = await userRepo.findOne({
      where: { userId: currentUser.userId },
      relations: ['team']
    });

    if (!admin) {
      throw new Error('User not found');
    }

    const player = await playerRepo.findOne({
      where: { playerId },
      relations: ['team']
    });

    if (!player) {
      throw new Error('Player not found');
    }

    if (!admin.team || player.team.teamId !== admin.team.teamId) {
      throw new Error('You can only update your team players');
    }

    if (!isBlank(request.firstName)) {
      player.firstName = request.firstName!.trim();
    }

    if (!isBlank(request.lastName)) {
      player.lastName = request.lastName!.trim();
    }

    if (request.number != null) {
      if (request.number !== player.number) {
        const exists = await playerRepo.exists({
          where: {
            team: { teamId: player.team.teamId },
            number: request.number
          }
        });

        if (exists) {
          throw new Error('Number already exists in team');
        }
      }

      player.number = request.number;
    }

    if (!isBlank(request.picture)) {
      player.picture = request.picture!.trim();
    }

    if (request.strongFoot != null) {
      player.strongFoot = request.strongFoot;
    }

    if (!isBlank(request.birthDate)) {
      player.birthDate = normalizeDate(request.birthDate);
    }

    if (request.position != null) {
      player.position = request.position;
    }

    const saved = await playerRepo.save(player);
    return this.mapToResponse(saved);
  }

  async togglePlayerStatus(playerId: number): Promise<void> {
    const playerRepo = this.playerRepo();
    const player = await playerRepo.findOne({ where: { playerId }, relations: ['team'] });

    if (!player) {
      throw new Error('Player not found');
    }

    player.active = !player.active;
    await playerRepo.save(player);
  }

  async getPlayerByTeam(teamId: number): Promise<PlayerResponse[]> {
    const players = await this.playerRepo().find({
      where: { team: { teamId } },
      relations: ['team']
    });

    return players.map((player) => this.mapToResponse(player));
  }

  private mapToResponse(player: Player): PlayerResponse {
    return {
      playerId: player.playerId,
      fullName: `${player.firstName} ${player.lastName}`,
      number: player.number,
      strongFoot: player.strongFoot,
      birthDate: player.birthDate ?? null,
      age: calculateAge(player.birthDate),
      position: player.position,
      teamName: player.team.name
    };
  }
}
