import { AppError } from './app-error';

function toNumber(raw: unknown): number {
  return Number(Array.isArray(raw) ? raw[0] : raw);
}

export function parseRequiredNumber(raw: unknown, name = 'value'): number {
  const value = toNumber(raw);

  if (!Number.isFinite(value)) {
    throw new AppError(400, `Invalid ${name} parameter`);
  }

  return value;
}

export function parseOptionalNumber(raw: unknown): number | null {
  if (raw == null || raw === '') {
    return null;
  }

  const value = toNumber(raw);
  return Number.isFinite(value) ? value : null;
}

export function parseIdParam(raw: string | string[], name = 'id'): number {
  const value = parseRequiredNumber(raw, name);

  if (!Number.isInteger(value)) {
    throw new AppError(400, `Invalid ${name} parameter`);
  }

  return value;
}

export function parseBooleanParam(raw: unknown, fallback = false): boolean {
  if (raw == null) {
    return fallback;
  }

  const value = Array.isArray(raw) ? raw[0] : raw;

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === '') {
    return fallback;
  }

  return ['true', '1', 'yes', 'on'].includes(normalized);
}
