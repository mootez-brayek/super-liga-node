import { Router } from 'express';
import { TeamService } from '../services/TeamService';
import { UserService } from '../services/UserService';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Role } from '../entities/enums';

export function createAdminRouter(userService: UserService, teamService: TeamService) {
  const router = Router();

  router.put(
    '/me',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      res.status(200).json(await userService.updateAdmin(req.body, req.currentUser!));
    })
  );

  router.get(
    '/me',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      res.status(200).json(await userService.getMyProfile(req.currentUser!));
    })
  );

  router.get(
    '/my-team',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      res.status(200).json(await teamService.getMyTeam(req.currentUser!));
    })
  );

  router.get(
    '/my-stats',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      res.status(200).json(await teamService.getMyStats(req.currentUser!));
    })
  );

  return router;
}
