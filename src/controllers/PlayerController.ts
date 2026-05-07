import { Router } from 'express';
import { PlayerService } from '../services/PlayerService';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Role } from '../entities/enums';
import { parseIdParam } from '../utils/params';

export function createPlayerRouter(playerService: PlayerService) {
  const router = Router();

  router.post(
    '/',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      res.status(200).json(await playerService.addPlayer(req.body, req.currentUser!));
    })
  );

  router.put(
    '/:playerId',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const playerId = parseIdParam(req.params.playerId, 'playerId');
      res.status(200).json(await playerService.updatePlayer(playerId, req.body, req.currentUser!));
    })
  );

  router.patch(
    '/:playerId/toggle-status',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const playerId = parseIdParam(req.params.playerId, 'playerId');
      await playerService.togglePlayerStatus(playerId);
      res.status(200).end();
    })
  );

  router.get(
    '/team/:teamId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const teamId = parseIdParam(req.params.teamId, 'teamId');
      res.status(200).json(await playerService.getPlayerByTeam(teamId));
    })
  );

  return router;
}
