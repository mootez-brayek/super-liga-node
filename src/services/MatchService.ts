import { AppDataSource } from '../data-source';
import { CreateMatchRequest } from '../dto/CreateMatchRequest';
import { FinishMatchRequest } from '../dto/FinishMatchRequest';
import { MatchResultResponse } from '../dto/MatchResultResponse';
import { MatchResponse } from '../dto/MatchResponse';
import { MyTeamMatchResponse } from '../dto/MyTeamMatchResponse';
import { MatchStatus, Role } from '../entities/enums';
import { Match } from '../entities/Match';
import { Player } from '../entities/Player';
import { Standing } from '../entities/Standing';
import { Team } from '../entities/Team';
import { CurrentUser } from '../types/express';
import { normalizeDate, normalizeTime } from '../utils/date';

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

  async createMatch(request: CreateMatchRequest): Promise<MatchResponse> {
    const teamRepo = this.teamRepo();
    const matchRepo = this.matchRepo();

    const homeTeam = await teamRepo.findOne({ where: { teamId: request.homeTeamId } });
    if (!homeTeam) {
      throw new Error('Home team not found');
    }

    const awayTeam = await teamRepo.findOne({ where: { teamId: request.awayTeamId } });
    if (!awayTeam) {
      throw new Error('Away team not found');
    }

    if (homeTeam.teamId === awayTeam.teamId) {
      throw new Error('A team cannot play against itself');
    }

    const match = matchRepo.create({
      homeTeam,
      awayTeam,
      matchDate: normalizeDate(request.matchDate),
      matchTime: normalizeTime(request.matchTime),
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
      homeTeamId: null,
      awayTeamId: null
    };
  }

  async finishMatch(matchId: number, request: FinishMatchRequest): Promise<MatchResponse> {
    return AppDataSource.transaction(async (manager) => {
      const matchRepo = manager.getRepository(Match);
      const playerRepo = manager.getRepository(Player);
      const standingRepo = manager.getRepository(Standing);

      const match = await matchRepo.findOne({
        where: { matchId },
        relations: ['homeTeam', 'awayTeam', 'mvp']
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

      if (request.mvpId != null) {
        const mvp = await playerRepo.findOne({ where: { playerId: request.mvpId } });
        if (!mvp) {
          throw new Error('Player not found');
        }
        match.mvp = mvp;
      }

      const saved = await matchRepo.save(match);
      await this.updateStandings(match, standingRepo);

      return this.mapToResponse(saved);
    });
  }

  async getUpcomingMatches(): Promise<MatchResponse[]> {
    const matches = await this.matchRepo().find({
      where: { status: MatchStatus.UPCOMING },
      relations: ['homeTeam', 'awayTeam']
    });

    return matches.map((match) => this.mapToResponse(match));
  }

  async getFinishedMatches(): Promise<MatchResponse[]> {
    const matches = await this.matchRepo().find({
      where: { status: MatchStatus.FINISHED },
      relations: ['homeTeam', 'awayTeam']
    });

    return matches.map((match) => this.mapToResponse(match));
  }

  async getAllMatches(): Promise<MatchResponse[]> {
    const matches = await this.matchRepo().find({
      relations: ['homeTeam', 'awayTeam']
    });

    return matches.map((match) => this.mapToResponse(match));
  }

  async getMatchResult(matchId: number): Promise<MatchResultResponse> {
    const match = await this.matchRepo().findOne({
      where: { matchId },
      relations: ['homeTeam', 'awayTeam']
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
      status: match.status
    };
  }

  async getFinishedMatchesForMyTeam(currentUser: CurrentUser): Promise<MyTeamMatchResponse[]> {
    const team = await this.findMyTeam(currentUser);
    const matches = await this.matchRepo().find({
      where: [
        { homeTeam: { teamId: team.teamId }, status: MatchStatus.FINISHED },
        { awayTeam: { teamId: team.teamId }, status: MatchStatus.FINISHED }
      ],
      relations: ['homeTeam', 'awayTeam'],
      order: { matchDate: 'ASC' }
    });

    return matches.map((match) => this.mapToTeamResponse(match, team.teamId));
  }

  async getUpcomingMatchesForMyTeam(currentUser: CurrentUser): Promise<MatchResponse[]> {
    const team = await this.findMyTeam(currentUser);
    const matches = await this.matchRepo().find({
      where: [
        { homeTeam: { teamId: team.teamId }, status: MatchStatus.UPCOMING },
        { awayTeam: { teamId: team.teamId }, status: MatchStatus.UPCOMING }
      ],
      relations: ['homeTeam', 'awayTeam'],
      order: { matchDate: 'ASC' }
    });

    return matches.map((match) => this.mapToResponse(match));
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

    const homeStanding = await standingRepo.findOne({
      where: { team: { teamId: match.homeTeam.teamId } },
      relations: ['team']
    });

    if (!homeStanding) {
      throw new Error('Home standing not found');
    }

    const awayStanding = await standingRepo.findOne({
      where: { team: { teamId: match.awayTeam.teamId } },
      relations: ['team']
    });

    if (!awayStanding) {
      throw new Error('Away standing not found');
    }

    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    homeStanding.played += 1;
    awayStanding.played += 1;

    homeStanding.goalsScored += homeScore;
    homeStanding.goalsConceded += awayScore;
    awayStanding.goalsScored += awayScore;
    awayStanding.goalsConceded += homeScore;

    let homeFairPlay = FAIR_PLAY_START;
    let awayFairPlay = FAIR_PLAY_START;

    homeFairPlay -= (match.homeOut ?? 0) * OUT_PENALTY;
    homeFairPlay -= (match.homeRed ?? 0) * RED_PENALTY;

    awayFairPlay -= (match.awayOut ?? 0) * OUT_PENALTY;
    awayFairPlay -= (match.awayRed ?? 0) * RED_PENALTY;

    homeFairPlay = Math.max(homeFairPlay, 0);
    awayFairPlay = Math.max(awayFairPlay, 0);

    homeStanding.fairPlay += homeFairPlay;
    awayStanding.fairPlay += awayFairPlay;

    let homeBasePoints = 0;
    let awayBasePoints = 0;

    if (homeScore > awayScore) {
      homeStanding.wins += 1;
      awayStanding.losses += 1;
      homeBasePoints = 5;
      awayBasePoints = 1;
    } else if (homeScore < awayScore) {
      awayStanding.wins += 1;
      homeStanding.losses += 1;
      awayBasePoints = 5;
      homeBasePoints = 1;
    } else {
      homeStanding.draws += 1;
      awayStanding.draws += 1;
      homeBasePoints = 3;
      awayBasePoints = 3;
    }

    homeStanding.points += homeBasePoints + homeFairPlay;
    awayStanding.points += awayBasePoints + awayFairPlay;

    homeStanding.goalDifference = homeStanding.goalsScored - homeStanding.goalsConceded;
    awayStanding.goalDifference = awayStanding.goalsScored - awayStanding.goalsConceded;

    await standingRepo.save([homeStanding, awayStanding]);
    await this.updatePositions(standingRepo);
  }

  private async updatePositions(standingRepo = this.standingRepo()) {
    const standings = await standingRepo.find({
      relations: ['team'],
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
      awayTeamId: match.awayTeam.teamId
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
      result
    };
  }
}
