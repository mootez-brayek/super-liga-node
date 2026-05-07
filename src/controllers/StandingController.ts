import { Router } from 'express';
import { StandingService } from '../services/StandingService';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';

export function createStandingRouter(standingService: StandingService) {
  const router = Router();

  router.get(
    '/',
    requireAuth,
    asyncHandler(async (_req, res) => {
      res.status(200).json(await standingService.getStandings());
    })
  );

  return router;
}
