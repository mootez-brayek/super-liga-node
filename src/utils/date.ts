export function normalizeDate(value: unknown): string | null {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

export function normalizeTime(value: unknown): string | null {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    if (/^\d{2}:\d{2}$/.test(value)) {
      return `${value}:00`;
    }
    return value.slice(0, 8);
  }

  return String(value).slice(0, 8);
}

export function calculateAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) {
    return null;
  }

  const parts = birthDate.split('-').map((part) => Number(part));

  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  const [year, month, day] = parts;
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age -= 1;
  }

  return age;
}
