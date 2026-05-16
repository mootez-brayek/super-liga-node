import { Router } from 'express';
import { MatchService } from '../services/MatchService';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Role } from '../entities/enums';
import { parseIdParam } from '../utils/params';

export function createMatchRouter(matchService: MatchService) {
  const router = Router();

  router.post(
    '/',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      res.status(200).json(await matchService.createMatch(req.body));
    })
  );

  router.put(
    '/:matchId/finish',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const matchId = parseIdParam(req.params.matchId, 'matchId');
      res.status(200).json(await matchService.finishMatch(matchId, req.body));
    })
  );

  router.get(
    '/:matchId/events',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const matchId = parseIdParam(req.params.matchId, 'matchId');
      res.status(200).json(await matchService.getMatchEvents(matchId));
    })
  );

  router.post(
    '/:matchId/events',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const matchId = parseIdParam(req.params.matchId, 'matchId');
      res.status(200).json(await matchService.addMatchEvent(matchId, req.body));
    })
  );

  router.delete(
    '/:matchId/events/:eventId',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const matchId = parseIdParam(req.params.matchId, 'matchId');
      const eventId = parseIdParam(req.params.eventId, 'eventId');
      await matchService.deleteMatchEvent(matchId, eventId);
      res.status(200).end();
    })
  );

  router.get(
    '/upcoming',
    requireAuth,
    asyncHandler(async (_req, res) => {
      res.status(200).json(await matchService.getUpcomingMatches());
    })
  );

  router.get(
    '/finished',
    requireAuth,
    asyncHandler(async (_req, res) => {
      res.status(200).json(await matchService.getFinishedMatches());
    })
  );

  router.get(
    '/my-finished',
    requireAuth,
    asyncHandler(async (req, res) => {
      res.status(200).json(await matchService.getFinishedMatchesForMyTeam(req.currentUser!));
    })
  );

  router.get(
    '/my-upcoming',
    requireAuth,
    asyncHandler(async (req, res) => {
      res.status(200).json(await matchService.getUpcomingMatchesForMyTeam(req.currentUser!));
    })
  );

  router.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
      res.status(200).json(await matchService.getAllMatches());
    })
  );

  router.get(
    '/:matchId/result',
    requireAuth,
    asyncHandler(async (req, res) => {
      const matchId = parseIdParam(req.params.matchId, 'matchId');
      res.status(200).json(await matchService.getMatchResult(matchId));
    })
  );

  return router;
}
