import { AppDataSource } from '../data-source';
import { CreateMatchEventRequest } from '../dto/CreateMatchEventRequest';
import { CreateMatchRequest } from '../dto/CreateMatchRequest';
import { FinishMatchRequest } from '../dto/FinishMatchRequest';
import { MatchEventResponse } from '../dto/MatchEventResponse';
import { MatchResultResponse } from '../dto/MatchResultResponse';
import { MatchResponse } from '../dto/MatchResponse';
import { MyTeamMatchResponse } from '../dto/MyTeamMatchResponse';
import { MatchEventType, MatchStatus, Role } from '../entities/enums';
import { Match } from '../entities/Match';
import { MatchEvent } from '../entities/MatchEvent';
import { Player } from '../entities/Player';
import { Season } from '../entities/Season';
import { Standing } from '../entities/Standing';
import { Team } from '../entities/Team';
import { CurrentUser } from '../types/express';
import { normalizeDate, normalizeTime } from '../utils/date';
import { isBlank } from '../utils/string';
import { SeasonService } from './SeasonService';

export class MatchService {
  private matchRepo() {
    return AppDataSource.getRepository(Match);
  }

  private teamRepo() {
    return AppDataSource.getRepository(Team);
  }

  private playerRepo() {
    return AppDataSource.getRepository(Player);
  }

  private standingRepo() {
    return AppDataSource.getRepository(Standing);
  }

  private eventRepo() {
    return AppDataSource.getRepository(MatchEvent);
  }

  private seasonService() {
    return new SeasonService();
  }

  async createMatch(request: CreateMatchRequest): Promise<MatchResponse> {
    const teamRepo = this.teamRepo();
    const matchRepo = this.matchRepo();
    const seasonRepo = AppDataSource.getRepository(Season);
    const activeSeason = await this.seasonService().ensureActiveSeason();

    const homeTeam = await teamRepo.findOne({ where: { teamId: request.homeTeamId } });
    if (!homeTeam) {
      throw new Error('Home team not found');
    }

    const awayTeam = await teamRepo.findOne({ where: { teamId: request.awayTeamId } });
    if (!awayTeam) {
      throw new Error('Away team not found');
    }

    if (homeTeam.isArchived) {
      throw new Error('Home team is archived');
    }

    if (awayTeam.isArchived) {
      throw new Error('Away team is archived');
    }

    if (homeTeam.teamId === awayTeam.teamId) {
      throw new Error('A team cannot play against itself');
    }

    const roundNumber = request.roundNumber == null ? 1 : Number(request.roundNumber);
    if (!Number.isInteger(roundNumber) || roundNumber < 1) {
      throw new Error('Round number must be a positive integer');
    }

    const season = request.seasonId != null
      ? await seasonRepo.findOne({ where: { seasonId: request.seasonId } })
      : activeSeason;

    if (!season) {
      throw new Error('Season not found');
    }

    const match = matchRepo.create({
      season,
      homeTeam,
      awayTeam,
      matchDate: normalizeDate(request.matchDate),
      matchTime: normalizeTime(request.matchTime),
      roundNumber,
      status: MatchStatus.UPCOMING
    });

    const saved = await matchRepo.save(match);

    return {
      matchId: saved.matchId,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeScore: saved.homeScore,
      awayScore: saved.awayScore,
      status: saved.status,
      matchDate: saved.matchDate,
      matchTime: saved.matchTime,
      homeTeamId: homeTeam.teamId,
      awayTeamId: awayTeam.teamId,
      seasonId: season.seasonId,
      seasonName: season.name,
      roundNumber: saved.roundNumber
    };
  }

  async finishMatch(matchId: number, request: FinishMatchRequest): Promise<MatchResponse> {
    return AppDataSource.transaction(async (manager) => {
      const matchRepo = manager.getRepository(Match);
      const playerRepo = manager.getRepository(Player);
      const standingRepo = manager.getRepository(Standing);
      const eventRepo = manager.getRepository(MatchEvent);

      const match = await matchRepo.findOne({
        where: { matchId },
        relations: ['homeTeam', 'awayTeam', 'mvp', 'season']
      });

      if (!match) {
        throw new Error('Match not found');
      }

      if (match.status === MatchStatus.FINISHED) {
        throw new Error('Match already finished');
      }

      match.homeScore = request.homeScore;
      match.awayScore = request.awayScore;
      match.awayOut = request.awayOut ?? 0;
      match.homeOut = request.homeOut ?? 0;
      match.awayRed = request.awayRed ?? 0;
      match.homeRed = request.homeRed ?? 0;
      match.status = MatchStatus.FINISHED;

      if (!match.season) {
        const season = await this.seasonService().ensureActiveSeason();
        match.season = season;
      }

      if (request.mvpId != null) {
        const mvp = await playerRepo.findOne({ where: { playerId: request.mvpId } });
        if (!mvp) {
          throw new Error('Player not found');
        }
        match.mvp = mvp;
      }

      const saved = await matchRepo.save(match);
      await this.createGoalEvents(match, request, eventRepo, playerRepo);
      await this.updateStandings(match, standingRepo);

      return this.mapToResponse(saved);
    });
  }

  async getUpcomingMatches(): Promise<MatchResponse[]> {
    const season = await this.seasonService().ensureActiveSeason();
    const matches = await this.matchRepo().find({
      where: [
        {
          season: { seasonId: season.seasonId },
          status: MatchStatus.UPCOMING,
          homeTeam: { isArchived: false },
          awayTeam: { isArchived: false }
        }
      ],
      relations: ['homeTeam', 'awayTeam', 'season']
    });

    return this.sortMatches(matches).map((match) => this.mapToResponse(match));
  }

  async getFinishedMatches(): Promise<MatchResponse[]> {
    const season = await this.seasonService().ensureActiveSeason();
    const matches = await this.matchRepo().find({
      where: { status: MatchStatus.FINISHED, season: { seasonId: season.seasonId } },
      relations: ['homeTeam', 'awayTeam', 'season']
    });

    return this.sortMatches(matches).map((match) => this.mapToResponse(match));
  }

  async getAllMatches(): Promise<MatchResponse[]> {
    const matches = await this.matchRepo().find({
      relations: ['homeTeam', 'awayTeam', 'season']
    });

    return this.sortMatches(matches).map((match) => this.mapToResponse(match));
  }

  async getMatchResult(matchId: number): Promise<MatchResultResponse> {
    const match = await this.matchRepo().findOne({
      where: { matchId },
      relations: ['homeTeam', 'awayTeam', 'season']
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.homeScore == null || match.awayScore == null) {
      throw new Error('Match result is not available yet');
    }

    let winner = 'DRAW';
    if (match.homeScore > match.awayScore) {
      winner = match.homeTeam.name;
    } else if (match.awayScore > match.homeScore) {
      winner = match.awayTeam.name;
    }

    return {
      matchId: match.matchId,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      winner,
      status: match.status,
      seasonName: match.season?.name ?? null,
      roundNumber: match.roundNumber
    };
  }

  async getMatchEvents(matchId: number): Promise<MatchEventResponse[]> {
    const match = await this.matchRepo().findOne({
      where: { matchId },
      relations: ['homeTeam', 'awayTeam']
    });

    if (!match) {
      throw new Error('Match not found');
    }

    const events = await this.eventRepo().find({
      where: { match: { matchId } },
      relations: ['team', 'player', 'match'],
      order: {
        minute: 'ASC',
        eventId: 'ASC'
      }
    });

    return events.map((event) => this.mapEventToResponse(event));
  }

  async addMatchEvent(matchId: number, request: CreateMatchEventRequest): Promise<MatchEventResponse> {
    return AppDataSource.transaction(async (manager) => {
      const matchRepo = manager.getRepository(Match);
      const eventRepo = manager.getRepository(MatchEvent);
      const teamRepo = manager.getRepository(Team);
      const playerRepo = manager.getRepository(Player);

      const match = await matchRepo.findOne({
        where: { matchId },
        relations: ['homeTeam', 'awayTeam']
      });

      if (!match) {
        throw new Error('Match not found');
      }

      const minute = Number(request.minute);
      if (!Number.isInteger(minute) || minute < 0) {
        throw new Error('Minute must be a non-negative integer');
      }

      if (!Object.values(MatchEventType).includes(request.type)) {
        throw new Error('Invalid match event type');
      }

      const team = request.teamId != null
        ? await teamRepo.findOne({ where: { teamId: request.teamId } })
        : null;

      if (request.teamId != null && !team) {
        throw new Error('Team not found');
      }

      if (team && team.isArchived) {
        throw new Error('Team is archived');
      }

      const player = request.playerId != null
        ? await playerRepo.findOne({ where: { playerId: request.playerId }, relations: ['team'] })
        : null;

      if (request.playerId != null && !player) {
        throw new Error('Player not found');
      }

      if (player && player.team.teamId !== match.homeTeam.teamId && player.team.teamId !== match.awayTeam.teamId) {
        throw new Error('Player must belong to one of the match teams');
      }

      if (team && team.teamId !== match.homeTeam.teamId && team.teamId !== match.awayTeam.teamId) {
        throw new Error('Team must belong to one of the match teams');
      }

      const event = eventRepo.create({
        match,
        type: request.type,
        minute,
        note: isBlank(request.note) ? null : request.note!.trim(),
        team,
        player
      });

      const saved = await eventRepo.save(event);
      const fullEvent = await eventRepo.findOne({
        where: { eventId: saved.eventId },
        relations: ['match', 'team', 'player']
      });

      if (!fullEvent) {
        throw new Error('Match event not found');
      }

      return this.mapEventToResponse(fullEvent);
    });
  }

  async deleteMatchEvent(matchId: number, eventId: number): Promise<void> {
    const eventRepo = this.eventRepo();
    const event = await eventRepo.findOne({
      where: { eventId, match: { matchId } },
      relations: ['match']
    });

    if (!event) {
      throw new Error('Match event not found');
    }

    await eventRepo.remove(event);
  }

  async getFinishedMatchesForMyTeam(currentUser: CurrentUser): Promise<MyTeamMatchResponse[]> {
    const team = await this.findMyTeam(currentUser);
    const season = await this.seasonService().ensureActiveSeason();
    const matches = await this.matchRepo().find({
      where: [
        { homeTeam: { teamId: team.teamId }, status: MatchStatus.FINISHED, season: { seasonId: season.seasonId } },
        { awayTeam: { teamId: team.teamId }, status: MatchStatus.FINISHED, season: { seasonId: season.seasonId } }
      ],
      relations: ['homeTeam', 'awayTeam', 'season']
    });

    return this.sortMatches(matches).map((match) => this.mapToTeamResponse(match, team.teamId));
  }

  async getUpcomingMatchesForMyTeam(currentUser: CurrentUser): Promise<MatchResponse[]> {
    const team = await this.findMyTeam(currentUser);
    const season = await this.seasonService().ensureActiveSeason();
    const matches = await this.matchRepo().find({
      where: [
        {
          homeTeam: { teamId: team.teamId },
          awayTeam: { isArchived: false },
          status: MatchStatus.UPCOMING,
          season: { seasonId: season.seasonId }
        },
        {
          awayTeam: { teamId: team.teamId },
          homeTeam: { isArchived: false },
          status: MatchStatus.UPCOMING,
          season: { seasonId: season.seasonId }
        }
      ],
      relations: ['homeTeam', 'awayTeam', 'season']
    });

    return this.sortMatches(matches).map((match) => this.mapToResponse(match));
  }

  private async findMyTeam(currentUser: CurrentUser): Promise<Team> {
    const team = await this.teamRepo().findOne({
      where: { admin: { userId: currentUser.userId } },
      relations: ['admin']
    });

    if (!team) {
      throw new Error('No value present');
    }

    return team;
  }

  private async updateStandings(match: Match, standingRepo = this.standingRepo()) {
    const OUT_PENALTY = 1;
    const RED_PENALTY = 2;
    const FAIR_PLAY_START = 5;
    const season = match.season ?? await this.seasonService().ensureActiveSeason();

    const homeStanding = await standingRepo.findOne({
      where: {
        season: { seasonId: season.seasonId },
        team: { teamId: match.homeTeam.teamId }
      },
      relations: ['team', 'season']
    });

    const awayStanding = await standingRepo.findOne({
      where: {
        season: { seasonId: season.seasonId },
        team: { teamId: match.awayTeam.teamId }
      },
      relations: ['team', 'season']
    });

    const resolvedHomeStanding = homeStanding ?? standingRepo.create({
      season,
      team: match.homeTeam
    });

    const resolvedAwayStanding = awayStanding ?? standingRepo.create({
      season,
      team: match.awayTeam
    });

    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    resolvedHomeStanding.played += 1;
    resolvedAwayStanding.played += 1;

    resolvedHomeStanding.goalsScored += homeScore;
    resolvedHomeStanding.goalsConceded += awayScore;
    resolvedAwayStanding.goalsScored += awayScore;
    resolvedAwayStanding.goalsConceded += homeScore;

    let homeFairPlay = FAIR_PLAY_START;
    let awayFairPlay = FAIR_PLAY_START;

    homeFairPlay -= (match.homeOut ?? 0) * OUT_PENALTY;
    homeFairPlay -= (match.homeRed ?? 0) * RED_PENALTY;

    awayFairPlay -= (match.awayOut ?? 0) * OUT_PENALTY;
    awayFairPlay -= (match.awayRed ?? 0) * RED_PENALTY;

    homeFairPlay = Math.max(homeFairPlay, 0);
    awayFairPlay = Math.max(awayFairPlay, 0);

    resolvedHomeStanding.fairPlay += homeFairPlay;
    resolvedAwayStanding.fairPlay += awayFairPlay;

    let homeBasePoints = 0;
    let awayBasePoints = 0;

    if (homeScore > awayScore) {
      resolvedHomeStanding.wins += 1;
      resolvedAwayStanding.losses += 1;
      homeBasePoints = 5;
      awayBasePoints = 1;
    } else if (homeScore < awayScore) {
      resolvedAwayStanding.wins += 1;
      resolvedHomeStanding.losses += 1;
      awayBasePoints = 5;
      homeBasePoints = 1;
    } else {
      resolvedHomeStanding.draws += 1;
      resolvedAwayStanding.draws += 1;
      homeBasePoints = 3;
      awayBasePoints = 3;
    }

    resolvedHomeStanding.points += homeBasePoints + homeFairPlay;
    resolvedAwayStanding.points += awayBasePoints + awayFairPlay;

    resolvedHomeStanding.goalDifference = resolvedHomeStanding.goalsScored - resolvedHomeStanding.goalsConceded;
    resolvedAwayStanding.goalDifference = resolvedAwayStanding.goalsScored - resolvedAwayStanding.goalsConceded;

    await standingRepo.save([resolvedHomeStanding, resolvedAwayStanding]);
    await this.updatePositions(season.seasonId, standingRepo);
  }

  private async updatePositions(seasonId: number, standingRepo = this.standingRepo()) {
    const standings = await standingRepo.find({
      relations: ['team', 'season'],
      where: { season: { seasonId } },
      order: {
        points: 'DESC',
        goalDifference: 'DESC',
        goalsScored: 'DESC'
      }
    });

    let pos = 1;
    for (const standing of standings) {
      standing.position = pos++;
    }

    await standingRepo.save(standings);
  }

  private mapToResponse(match: Match): MatchResponse {
    return {
      matchId: match.matchId,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status,
      matchDate: match.matchDate,
      matchTime: match.matchTime,
      homeTeamId: match.homeTeam.teamId,
      awayTeamId: match.awayTeam.teamId,
      seasonId: match.season?.seasonId ?? null,
      seasonName: match.season?.name ?? null,
      roundNumber: match.roundNumber
    };
  }

  private mapToTeamResponse(match: Match, myTeamId: number): MyTeamMatchResponse {
    const isHome = match.homeTeam.teamId === myTeamId;
    const myScore = isHome ? match.homeScore ?? 0 : match.awayScore ?? 0;
    const opponentScore = isHome ? match.awayScore ?? 0 : match.homeScore ?? 0;

    let result: string | null = null;
    if (match.status === MatchStatus.FINISHED) {
      if (myScore > opponentScore) {
        result = 'WIN';
      } else if (myScore < opponentScore) {
        result = 'LOSS';
      } else {
        result = 'DRAW';
      }
    }

    return {
      matchId: match.matchId,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      matchDate: match.matchDate,
      matchTime: match.matchTime,
      status: match.status,
      result,
      seasonName: match.season?.name ?? null,
      roundNumber: match.roundNumber
    };
  }

  private mapEventToResponse(event: MatchEvent): MatchEventResponse {
    return {
      eventId: event.eventId,
      matchId: event.match.matchId,
      type: event.type,
      minute: event.minute,
      note: event.note ?? null,
      teamId: event.team?.teamId ?? null,
      teamName: event.team?.name ?? null,
      playerId: event.player?.playerId ?? null,
      playerName: event.player ? `${event.player.firstName} ${event.player.lastName}`.trim() : null
    };
  }

  private async createGoalEvents(
    match: Match,
    request: FinishMatchRequest,
    eventRepo = this.eventRepo(),
    playerRepo = this.playerRepo()
  ): Promise<void> {
    const homeScorerIds = (request.homeScorerIds ?? []).map((value) => Number(value)).filter((value) => Number.isInteger(value));
    const awayScorerIds = (request.awayScorerIds ?? []).map((value) => Number(value)).filter((value) => Number.isInteger(value));

    if (homeScorerIds.length !== (request.homeScore ?? 0)) {
      throw new Error('Home scorers must match the home score');
    }

    if (awayScorerIds.length !== (request.awayScore ?? 0)) {
      throw new Error('Away scorers must match the away score');
    }

    if (homeScorerIds.length === 0 && awayScorerIds.length === 0) {
      return;
    }

    const events: MatchEvent[] = [];

    for (const playerId of homeScorerIds) {
      const player = await playerRepo.findOne({
        where: { playerId },
        relations: ['team']
      });

      if (!player) {
        throw new Error('Player not found');
      }

      if (player.team.teamId !== match.homeTeam.teamId) {
        throw new Error('Home scorer must belong to the home team');
      }

      events.push(eventRepo.create({
        match,
        type: MatchEventType.GOAL,
        minute: 0,
        note: null,
        team: player.team,
        player
      }));
    }

    for (const playerId of awayScorerIds) {
      const player = await playerRepo.findOne({
        where: { playerId },
        relations: ['team']
      });

      if (!player) {
        throw new Error('Player not found');
      }

      if (player.team.teamId !== match.awayTeam.teamId) {
        throw new Error('Away scorer must belong to the away team');
      }

      events.push(eventRepo.create({
        match,
        type: MatchEventType.GOAL,
        minute: 0,
        note: null,
        team: player.team,
        player
      }));
    }

    if (events.length > 0) {
      await eventRepo.save(events);
    }
  }

  private sortMatches(matches: Match[]): Match[] {
    return [...matches].sort((left, right) => {
      const leftActive = left.season?.isActive ? 1 : 0;
      const rightActive = right.season?.isActive ? 1 : 0;

      if (leftActive !== rightActive) {
        return rightActive - leftActive;
      }

      const leftSeason = left.season?.name ?? '';
      const rightSeason = right.season?.name ?? '';

      if (leftSeason !== rightSeason) {
        return leftSeason.localeCompare(rightSeason);
      }

      if (left.roundNumber !== right.roundNumber) {
        return left.roundNumber - right.roundNumber;
      }

      const leftDate = left.matchDate ?? '';
      const rightDate = right.matchDate ?? '';
      if (leftDate !== rightDate) {
        return leftDate.localeCompare(rightDate);
      }

      const leftTime = left.matchTime ?? '';
      const rightTime = right.matchTime ?? '';
      if (leftTime !== rightTime) {
        return leftTime.localeCompare(rightTime);
      }

      return left.matchId - right.matchId;
    });
  }
}
