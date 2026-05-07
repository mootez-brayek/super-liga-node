import { Router } from 'express';
import { MatchService } from '../services/MatchService';
import { PlayerService } from '../services/PlayerService';
import { StandingService } from '../services/StandingService';
import { TeamService } from '../services/TeamService';
import { asyncHandler } from '../middleware/async-handler';
import { parseIdParam } from '../utils/params';

export function createPublicRouter(
  standingService: StandingService,
  matchService: MatchService,
  teamService: TeamService,
  playerService: PlayerService
) {
  const router = Router();

  router.get(
    '/standing',
    asyncHandler(async (_req, res) => {
      res.status(200).json(await standingService.getStandings());
    })
  );

  router.get(
    '/match/upcoming',
    asyncHandler(async (_req, res) => {
      res.status(200).json(await matchService.getUpcomingMatches());
    })
  );

  router.get(
    '/match/finished',
    asyncHandler(async (_req, res) => {
      res.status(200).json(await matchService.getFinishedMatches());
    })
  );

  router.get(
    '/teams',
    asyncHandler(async (_req, res) => {
      res.status(200).json(await teamService.getTeams());
    })
  );

  router.get(
    '/players/:teamId',
    asyncHandler(async (req, res) => {
      const teamId = parseIdParam(req.params.teamId, 'teamId');
      res.status(200).json(await playerService.getPlayerByTeam(teamId));
    })
  );

  return router;
}
