import { AppDataSource } from '../data-source';
import { GenerateSeasonScheduleRequest } from '../dto/GenerateSeasonScheduleRequest';
import { SeasonResponse } from '../dto/SeasonResponse';
import { MatchStatus } from '../entities/enums';
import { Match } from '../entities/Match';
import { Season } from '../entities/Season';
import { Standing } from '../entities/Standing';
import { Team } from '../entities/Team';
import {
  addDaysToDate,
  buildRoundRobinSchedule,
  createDefaultSeasonName,
  formatMinutesToTime,
  parseTimeToMinutes
} from '../utils/schedule';
import { normalizeDate, normalizeTime } from '../utils/date';

export class SeasonService {
  private seasonRepo() {
    return AppDataSource.getRepository(Season);
  }

  private teamRepo() {
    return AppDataSource.getRepository(Team);
  }

  private standingRepo() {
    return AppDataSource.getRepository(Standing);
  }

  private matchRepo() {
    return AppDataSource.getRepository(Match);
  }

  async ensureActiveSeason(): Promise<Season> {
    let season = await this.seasonRepo().findOne({ where: { isActive: true } });

    if (!season) {
      season = await this.seasonRepo().save(
        this.seasonRepo().create({
          name: createDefaultSeasonName(),
          isActive: true
        })
      );
    }

    await this.backfillLegacyRows(season);
    await this.ensureStandingsForSeason(season);

    return season;
  }

  async getCurrentSeason(): Promise<SeasonResponse> {
    const season = await this.ensureActiveSeason();
    return this.mapSeasonResponse(
      season,
      await this.matchRepo().count({ where: { season: { seasonId: season.seasonId } } }),
      await this.countDistinctRounds(season.seasonId)
    );
  }

  async getSeasons(): Promise<SeasonResponse[]> {
    const seasons = await this.seasonRepo().find({
      order: {
        isActive: 'DESC',
        name: 'ASC',
        seasonId: 'DESC'
      }
    });

    const responses: SeasonResponse[] = [];
    for (const season of seasons) {
      responses.push(
        this.mapSeasonResponse(
          season,
          await this.matchRepo().count({ where: { season: { seasonId: season.seasonId } } }),
          await this.countDistinctRounds(season.seasonId)
        )
      );
    }

    return responses;
  }

  async activateSeason(seasonId: number): Promise<SeasonResponse> {
    const season = await this.seasonRepo().findOne({ where: { seasonId } });
    if (!season) {
      throw new Error('Season not found');
    }

    await this.seasonRepo().update({ isActive: true }, { isActive: false });
    season.isActive = true;
    const saved = await this.seasonRepo().save(season);

    await this.backfillLegacyRows(saved);
    await this.ensureStandingsForSeason(saved);

    return this.mapSeasonResponse(
      saved,
      await this.matchRepo().count({ where: { season: { seasonId: saved.seasonId } } }),
      await this.countDistinctRounds(saved.seasonId)
    );
  }

  async generateSeasonSchedule(request: GenerateSeasonScheduleRequest): Promise<{
    season: SeasonResponse;
    matchesCreated: number;
    roundsCreated: number;
  }> {
    const name = String(request.name ?? '').trim();
    if (!name) {
      throw new Error('Season name is required');
    }

    const existing = await this.seasonRepo().findOne({ where: { name } });
    if (existing) {
      throw new Error('Season name already exists');
    }

    const startDate = normalizeDate(request.startDate);
    if (!startDate) {
      throw new Error('Start date is required');
    }

    const startTime = normalizeTime(request.startTime);
    if (!startTime) {
      throw new Error('Start time is required');
    }

    const teams = await this.teamRepo().find({
      where: { isArchived: false },
      order: { name: 'ASC' }
    });

    if (teams.length < 2) {
      throw new Error('At least two active teams are required');
    }

    await this.seasonRepo().update({ isActive: true }, { isActive: false });

    const season = await this.seasonRepo().save(
      this.seasonRepo().create({
        name,
        isActive: true
      })
    );

    await this.ensureStandingsForSeason(season, teams);

    const fixtures = buildRoundRobinSchedule(
      teams.map((team) => team.teamId),
      Boolean(request.doubleRound)
    );

    const roundGapDays = Number.isFinite(Number(request.roundGapDays)) && Number(request.roundGapDays) > 0
      ? Math.floor(Number(request.roundGapDays))
      : 7;
    const matchGapMinutes = Number.isFinite(Number(request.matchGapMinutes)) && Number(request.matchGapMinutes) > 0
      ? Math.floor(Number(request.matchGapMinutes))
      : 90;
    const baseMinutes = parseTimeToMinutes(startTime);
    const roundCounts = new Map<number, number>();
    const roundNumberToDate = new Map<number, string>();

    const matchRepo = this.matchRepo();
    const matches = fixtures.map((fixture) => {
      const roundIndex = fixture.roundNumber - 1;
      const roundDate = roundNumberToDate.get(fixture.roundNumber)
        ?? addDaysToDate(startDate, roundIndex * roundGapDays);
      roundNumberToDate.set(fixture.roundNumber, roundDate);

      const nextMatchIndex = roundCounts.get(fixture.roundNumber) ?? 0;
      roundCounts.set(fixture.roundNumber, nextMatchIndex + 1);

      const homeTeam = teams.find((team) => team.teamId === fixture.homeTeamId);
      const awayTeam = teams.find((team) => team.teamId === fixture.awayTeamId);

      if (!homeTeam || !awayTeam) {
        throw new Error('Unable to resolve round robin teams');
      }

      const matchTime = formatMinutesToTime(baseMinutes + nextMatchIndex * matchGapMinutes);

      return matchRepo.create({
        season,
        homeTeam,
        awayTeam,
        roundNumber: fixture.roundNumber,
        matchDate: roundDate,
        matchTime,
        status: MatchStatus.UPCOMING
      });
    });

    await matchRepo.save(matches);

    return {
      season: this.mapSeasonResponse(season, matches.length, fixtures.length ? Math.max(...fixtures.map((fixture) => fixture.roundNumber)) : 0),
      matchesCreated: matches.length,
      roundsCreated: fixtures.length ? Math.max(...fixtures.map((fixture) => fixture.roundNumber)) : 0
    };
  }

  private async backfillLegacyRows(activeSeason: Season): Promise<void> {
    await AppDataSource.query('UPDATE matches SET season_id = ? WHERE season_id IS NULL', [activeSeason.seasonId]);
    await AppDataSource.query('UPDATE standing SET season_id = ? WHERE season_id IS NULL', [activeSeason.seasonId]);
  }

  private async ensureStandingsForSeason(season: Season, providedTeams?: Team[]): Promise<void> {
    const teams = providedTeams ?? await this.teamRepo().find({
      where: { isArchived: false },
      order: { name: 'ASC' }
    });

    const standings = await this.standingRepo().find({
      where: { season: { seasonId: season.seasonId } },
      relations: ['team']
    });
    const existingTeamIds = new Set(standings.map((standing) => standing.team.teamId));

    const newStandings = teams
      .filter((team) => !existingTeamIds.has(team.teamId))
      .map((team) => this.standingRepo().create({
        season,
        team
      }));

    if (newStandings.length > 0) {
      await this.standingRepo().save(newStandings);
    }
  }

  private async countDistinctRounds(seasonId: number): Promise<number> {
    const rows = await this.matchRepo().createQueryBuilder('match')
      .select('DISTINCT match.roundNumber', 'roundNumber')
      .where('match.season_id = :seasonId', { seasonId })
      .getRawMany<{ roundNumber: string }>();

    return rows.length;
  }

  private mapSeasonResponse(season: Season, matchCount: number, roundCount: number): SeasonResponse {
    return {
      seasonId: season.seasonId,
      name: season.name,
      isActive: season.isActive,
      matchCount,
      roundCount
    };
  }
}
