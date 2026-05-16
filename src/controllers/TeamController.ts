import { Router } from 'express';
import { TeamService } from '../services/TeamService';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Role } from '../entities/enums';
import { AppError } from '../utils/app-error';
import { buildPublicUploadPath, createImageUpload } from '../utils/uploads';
import { parseBooleanParam, parseIdParam } from '../utils/params';

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

export function createTeamRouter(teamService: TeamService) {
  const router = Router();
  const uploadTeamLogo = createImageUpload('teams', 'logoFile');

  router.post(
    '/create-team',
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
        await teamService.createTeam(
          {
            name,
            logo
          },
          req.currentUser!
        )
      );
    })
  );

  router.put(
    '/me',
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
    '/me',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      await teamService.archiveMyTeam(req.currentUser!);
      res.status(200).end();
    })
  );

  router.patch(
    '/me/restore',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      res.status(200).json(await teamService.restoreMyTeam(req.currentUser!));
    })
  );

  router.put(
    '/:teamId',
    requireAuth,
    requireRole(Role.SuperAdmin),
    uploadTeamLogo,
    asyncHandler(async (req, res) => {
      const teamId = parseIdParam(req.params.teamId, 'teamId');
      const name = String(req.body.name ?? '').trim();

      if (!name) {
        throw new AppError(400, 'Team name is required');
      }

      const logo = req.file ? buildPublicUploadPath('teams', req.file.filename) : normalizeOptionalText(req.body.logo);

      res.status(200).json(
        await teamService.updateTeam(teamId, {
          name,
          logo
        })
      );
    })
  );

  router.delete(
    '/:teamId',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const teamId = parseIdParam(req.params.teamId, 'teamId');
      await teamService.archiveTeam(teamId);
      res.status(200).end();
    })
  );

  router.patch(
    '/:teamId/restore',
    requireAuth,
    requireRole(Role.SuperAdmin),
    asyncHandler(async (req, res) => {
      const teamId = parseIdParam(req.params.teamId, 'teamId');
      res.status(200).json(await teamService.restoreTeam(teamId));
    })
  );

  router.get(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
      res.status(200).json(await teamService.getTeams({
        includeArchived: parseBooleanParam(req.query.includeArchived)
      }));
    })
  );

  return router;
}
