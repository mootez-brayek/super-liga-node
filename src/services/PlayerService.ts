import { AppDataSource } from '../data-source';
import { CreatePlayerRequest } from '../dto/CreatePlayerRequest';
import { PlayerResponse } from '../dto/PlayerResponse';
import { UpdatePlayerRequest } from '../dto/UpdatePlayerRequest';
import { Position, Role } from '../entities/enums';
import { Player } from '../entities/Player';
import { Team } from '../entities/Team';
import { User } from '../entities/User';
import { CurrentUser } from '../types/express';
import { calculateAge, normalizeDate } from '../utils/date';
import { isBlank } from '../utils/string';
import { deleteUploadedMedia } from '../utils/uploads';

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

    if (team.isArchived) {
      throw new Error('Team is archived');
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

  async updatePlayer(playerId: number, request: UpdatePlayerRequest, currentUser: CurrentUser): Promise<PlayerResponse> {
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

    if (admin.team.isArchived) {
      throw new Error('Team is archived');
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

    const previousPicture = player.picture;

    if (request.picture !== undefined) {
      player.picture = request.picture?.trim() ? request.picture.trim() : null;
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

    if (request.teamId != null && request.teamId !== player.team.teamId) {
      throw new Error('You can only update your team players');
    }

    const saved = await playerRepo.save(player);

    if (saved.picture !== previousPicture) {
      deleteUploadedMedia(previousPicture);
    }

    return this.mapToResponse(saved);
  }

  async togglePlayerStatus(playerId: number, currentUser: CurrentUser): Promise<void> {
    const playerRepo = this.playerRepo();
    const player = await playerRepo.findOne({ where: { playerId }, relations: ['team', 'team.admin'] });

    if (!player) {
      throw new Error('Player not found');
    }

    if (currentUser.role !== Role.ADMIN || !player.team.admin || player.team.admin.userId !== currentUser.userId) {
      throw new Error('You can only update your team players');
    }

    player.active = !player.active;
    await playerRepo.save(player);
  }

  async archivePlayer(playerId: number, currentUser: CurrentUser): Promise<void> {
    const playerRepo = this.playerRepo();
    const player = await playerRepo.findOne({ where: { playerId }, relations: ['team', 'team.admin'] });

    if (!player) {
      throw new Error('Player not found');
    }

    if (currentUser.role !== Role.ADMIN || !player.team.admin || player.team.admin.userId !== currentUser.userId) {
      throw new Error('You can only update your team players');
    }

    if (!player.active) {
      return;
    }

    player.active = false;
    await playerRepo.save(player);
  }

  async restorePlayer(playerId: number, currentUser: CurrentUser): Promise<void> {
    const playerRepo = this.playerRepo();
    const player = await playerRepo.findOne({ where: { playerId }, relations: ['team', 'team.admin'] });

    if (!player) {
      throw new Error('Player not found');
    }

    if (currentUser.role !== Role.ADMIN || !player.team.admin || player.team.admin.userId !== currentUser.userId) {
      throw new Error('You can only update your team players');
    }

    if (player.active) {
      return;
    }

    player.active = true;
    await playerRepo.save(player);
  }

  async getPlayerByTeam(teamId: number, includeInactive = false): Promise<PlayerResponse[]> {
    const players = await this.playerRepo().find({
      where: includeInactive ? { team: { teamId } } : { team: { teamId }, active: true },
      relations: ['team']
    });

    return players.map((player) => this.mapToResponse(player));
  }

  private mapToResponse(player: Player): PlayerResponse {
    return {
      playerId: player.playerId,
      fullName: `${player.firstName} ${player.lastName}`,
      number: player.number,
      picture: player.picture ?? null,
      active: player.active,
      strongFoot: player.strongFoot,
      birthDate: player.birthDate ?? null,
      age: calculateAge(player.birthDate),
      position: player.position,
      teamName: player.team.name
    };
  }
}
