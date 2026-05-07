import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentUser) {
    next(new AppError(401, 'Unauthorized: Full authentication is required to access this resource'));
    return;
  }

  next();
}
