import { Router } from 'express';
import { TeamService } from '../services/TeamService';
import { UserService } from '../services/UserService';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Role } from '../entities/enums';
import { AppError } from '../utils/app-error';
import { buildPublicUploadPath, createImageUpload } from '../utils/uploads';

function normalizeOptionalText(value: unknown): string | null {
  if (Array.isArray(value)) {
    return normalizeOptionalText(value[0]);
  }

  if (value == null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

export function createAdminRouter(userService: UserService, teamService: TeamService) {
  const router = Router();
  const uploadTeamLogo = createImageUpload('teams', 'logoFile');

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

  router.put(
    '/my-team',
    requireAuth,
    requireRole(Role.ADMIN),
    uploadTeamLogo,
    asyncHandler(async (req, res) => {
      const name = String(req.body.name ?? '').trim();

      if (!name) {
        throw new AppError(400, 'Team name is required');
      }

      const logo = req.file
        ? buildPublicUploadPath('teams', req.file.filename)
        : req.body.logo !== undefined
          ? normalizeOptionalText(req.body.logo)
          : undefined;

      res.status(200).json(
        await teamService.updateMyTeam(
          {
            name,
            logo
          },
          req.currentUser!
        )
      );
    })
  );

  router.delete(
    '/my-team',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      await teamService.archiveMyTeam(req.currentUser!);
      res.status(200).end();
    })
  );

  router.patch(
    '/my-team/restore',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      res.status(200).json(await teamService.restoreMyTeam(req.currentUser!));
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
