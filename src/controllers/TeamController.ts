import { Router } from 'express';
import { TeamService } from '../services/TeamService';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Role } from '../entities/enums';

export function createTeamRouter(teamService: TeamService) {
  const router = Router();

  router.post(
    '/create-team',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      res.status(200).json(await teamService.createTeam(req.body, req.currentUser!));
    })
  );

  router.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
      res.status(200).json(await teamService.getTeams());
    })
  );

  return router;
}
