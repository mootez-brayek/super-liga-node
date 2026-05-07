import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization');

  if (!header || !header.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7).trim();
  const currentUser = verifyAccessToken(token);

  if (currentUser) {
    req.currentUser = currentUser;
  }

  next();
}
