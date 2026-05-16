import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Role } from '../entities/enums';
import { UserService } from '../services/UserService';
import { SeasonService } from '../services/SeasonService';
import { GenerateSeasonScheduleRequest } from '../dto/GenerateSeasonScheduleRequest';
import { parseIdParam } from '../utils/params';

export function createSuperAdminRouter(userService: UserService, seasonService: SeasonService) {
  const router = Router();

  router.post(
    '/create-admin',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      res.status(200).json(await userService.createAdmin(req.body));
    })
  );

  router.get(
    '/admins',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (_req, res) => {
      res.status(200).json(await userService.getAllAdmins());
    })
  );

  router.put(
    '/admins/:id',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const id = parseIdParam(req.params.id, 'id');
      res.status(200).json(await userService.updateAdminById(id, req.body));
    })
  );

  router.post(
    '/:id/toggle-status',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const id = parseIdParam(req.params.id, 'id');
      await userService.toggleAdminStatus(id);
      res.status(200).end();
    })
  );

  router.delete(
    '/admins/:id',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const id = parseIdParam(req.params.id, 'id');
      await userService.archiveAdmin(id);
      res.status(200).end();
    })
  );

  router.patch(
    '/admins/:id/restore',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const id = parseIdParam(req.params.id, 'id');
      await userService.restoreAdmin(id);
      res.status(200).end();
    })
  );

  router.get(
    '/seasons',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (_req, res) => {
      res.status(200).json(await seasonService.getSeasons());
    })
  );

  router.post(
    '/seasons/generate',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const payload = req.body as GenerateSeasonScheduleRequest;
      res.status(200).json(await seasonService.generateSeasonSchedule(payload));
    })
  );

  router.patch(
    '/seasons/:seasonId/activate',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const seasonId = parseIdParam(req.params.seasonId, 'seasonId');
      res.status(200).json(await seasonService.activateSeason(seasonId));
    })
  );

  return router;
}
