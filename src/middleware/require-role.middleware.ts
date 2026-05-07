import { NextFunction, Request, Response } from 'express';
import { Role } from '../entities/enums';
import { AppError } from '../utils/app-error';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      next(new AppError(401, 'Unauthorized: Full authentication is required to access this resource'));
      return;
    }

    if (!roles.includes(req.currentUser.role)) {
      next(new AppError(403, 'You do not have permission to perform this action.'));
      return;
    }

    next();
  };
}
