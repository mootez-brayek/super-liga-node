import { NextFunction, Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppError } from '../utils/app-error';

function buildResponse(res: Response, status: number, message: string, data: unknown = null) {
  return res.status(status).json({ message, data });
}

function mapTypeOrmError(error: unknown) {
  if (!(error instanceof QueryFailedError)) {
    return null;
  }

  const driverError = (error as unknown as { driverError?: { code?: string; message?: string } }).driverError;
  const message = driverError?.message ?? error.message;

  if (message.includes('phone_number')) {
    return { status: 400, message: 'Phone number already used' };
  }

  if (message.includes('email')) {
    return { status: 400, message: 'Email already used' };
  }

  return { status: 400, message: 'Duplicate entry detected' };
}

export function errorMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof SyntaxError && 'body' in error) {
    return buildResponse(res, 400, error.message || 'Malformed JSON request');
  }

  if (error instanceof AppError) {
    return buildResponse(res, error.statusCode, error.message);
  }

  const typeOrmError = mapTypeOrmError(error);
  if (typeOrmError) {
    return buildResponse(res, typeOrmError.status, typeOrmError.message);
  }

  if (error instanceof Error) {
    return buildResponse(res, 500, error.message || 'An unexpected error occurred.');
  }

  return buildResponse(res, 500, 'An unexpected error occurred.');
}
