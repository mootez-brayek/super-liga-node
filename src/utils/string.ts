export function isBlank(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim().length === 0);
}
