import { AppError } from './app-error';

export function parseIdParam(raw: string | string[], name = 'id'): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isInteger(value)) {
    throw new AppError(400, `Invalid ${name} parameter`);
  }
  return value;
}
