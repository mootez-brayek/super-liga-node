import { Router } from 'express';
import { PlayerService } from '../services/PlayerService';
import { asyncHandler } from '../middleware/async-handler';
import { requireAuth } from '../middleware/require-auth.middleware';
import { requireRole } from '../middleware/require-role.middleware';
import { Position, Role, StrongFoot } from '../entities/enums';
import { AppError } from '../utils/app-error';
import { buildPublicUploadPath, createImageUpload } from '../utils/uploads';
import { CreatePlayerRequest } from '../dto/CreatePlayerRequest';
import { parseBooleanParam, parseIdParam, parseOptionalNumber, parseRequiredNumber } from '../utils/params';

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

export function createPlayerRouter(playerService: PlayerService) {
  const router = Router();
  const uploadPlayerPicture = createImageUpload('players', 'pictureFile');

  router.post(
    '/',
    requireAuth,
    requireRole(Role.ADMIN),
    uploadPlayerPicture,
    asyncHandler(async (req, res) => {
      const firstName = String(req.body.firstName ?? '').trim();
      const lastName = String(req.body.lastName ?? '').trim();
      const strongFoot = normalizeOptionalText(req.body.strongFoot);
      const position = normalizeOptionalText(req.body.position);

      if (!firstName || !lastName) {
        throw new AppError(400, 'First name and last name are required');
      }

      if (!strongFoot || !Object.values(StrongFoot).includes(strongFoot as StrongFoot)) {
        throw new AppError(400, 'Strong foot is required');
      }

      if (!position || !Object.values(Position).includes(position as Position)) {
        throw new AppError(400, 'Position is required');
      }

      const number = parseRequiredNumber(req.body.number, 'number');
      if (!Number.isInteger(number)) {
        throw new AppError(400, 'Player number must be an integer');
      }

      const picture = req.file ? buildPublicUploadPath('players', req.file.filename) : normalizeOptionalText(req.body.picture);

      const request = {
        firstName,
        lastName,
        number,
        picture,
        strongFoot: strongFoot as StrongFoot,
        birthDate: normalizeOptionalText(req.body.birthDate),
        position: position as Position,
        teamId: parseOptionalNumber(req.body.teamId)
      } as CreatePlayerRequest;

      res.status(200).json(await playerService.addPlayer(request, req.currentUser!));
    })
  );

  router.put(
    '/:playerId',
    requireAuth,
    requireRole(Role.ADMIN),
    uploadPlayerPicture,
    asyncHandler(async (req, res) => {
      const playerId = parseIdParam(req.params.playerId, 'playerId');
      const strongFoot = normalizeOptionalText(req.body.strongFoot);
      const position = normalizeOptionalText(req.body.position);
      const number = parseOptionalNumber(req.body.number);

      if (strongFoot != null && !Object.values(StrongFoot).includes(strongFoot as StrongFoot)) {
        throw new AppError(400, 'Invalid strong foot');
      }

      if (position != null && !Object.values(Position).includes(position as Position)) {
        throw new AppError(400, 'Invalid position');
      }

      if (number != null && !Number.isInteger(number)) {
        throw new AppError(400, 'Player number must be an integer');
      }

      const request = {
        firstName: normalizeOptionalText(req.body.firstName),
        lastName: normalizeOptionalText(req.body.lastName),
        number,
        picture: req.file
          ? buildPublicUploadPath('players', req.file.filename)
          : req.body.picture !== undefined
            ? normalizeOptionalText(req.body.picture)
            : undefined,
        strongFoot: strongFoot as StrongFoot | null,
        birthDate: normalizeOptionalText(req.body.birthDate),
        position: position as Position | null,
        teamId: parseOptionalNumber(req.body.teamId)
      } as CreatePlayerRequest;

      res.status(200).json(await playerService.updatePlayer(playerId, request, req.currentUser!));
    })
  );

  router.delete(
    '/:playerId',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const playerId = parseIdParam(req.params.playerId, 'playerId');
      await playerService.archivePlayer(playerId, req.currentUser!);
      res.status(200).end();
    })
  );

  router.patch(
    '/:playerId/restore',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const playerId = parseIdParam(req.params.playerId, 'playerId');
      await playerService.restorePlayer(playerId, req.currentUser!);
      res.status(200).end();
    })
  );

  router.patch(
    '/:playerId/toggle-status',
    requireAuth,
    requireRole(Role.ADMIN),
    asyncHandler(async (req, res) => {
      const playerId = parseIdParam(req.params.playerId, 'playerId');
      await playerService.togglePlayerStatus(playerId, req.currentUser!);
      res.status(200).end();
    })
  );

  router.get(
    '/team/:teamId',
    requireAuth,
    asyncHandler(async (req, res) => {
      const teamId = parseIdParam(req.params.teamId, 'teamId');
      res.status(200).json(await playerService.getPlayerByTeam(teamId, parseBooleanParam(req.query.includeInactive)));
    })
  );

  return router;
}
