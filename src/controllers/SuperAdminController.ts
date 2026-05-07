import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Role } from '../entities/enums';
import { UserService } from '../services/UserService';
import { parseIdParam } from '../utils/params';

export function createSuperAdminRouter(userService: UserService) {
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

  return router;
}
