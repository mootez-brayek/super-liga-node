import { Router } from 'express';
import { DashboardService } from '../services/DashboardService';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Role } from '../entities/enums';

export function createDashboardRouter(dashboardService: DashboardService) {
  const router = Router();

  router.get(
    '/stats',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (_req, res) => {
      res.status(200).json(await dashboardService.getStats());
    })
  );

  return router;
}
