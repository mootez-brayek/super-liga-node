export interface RoundRobinFixture {
  roundNumber: number;
  homeTeamId: number;
  awayTeamId: number;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function createDefaultSeasonName(reference = new Date()): string {
  const year = reference.getFullYear();
  return `Season ${year}-${year + 1}`;
}

export function parseTimeToMinutes(value: string): number {
  const [hoursRaw = '0', minutesRaw = '0'] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return (hours * 60) + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${pad2(hours)}:${pad2(minutes)}:00`;
}

export function addDaysToDate(dateValue: string, days: number): string {
  const parts = dateValue.split('-').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return dateValue;
  }

  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + days);

  return [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate())
  ].join('-');
}

export function buildRoundRobinSchedule(teamIds: number[], doubleRound = false): RoundRobinFixture[] {
  const teams = [...teamIds];
  if (teams.length < 2) {
    return [];
  }

  if (teams.length % 2 !== 0) {
    teams.push(-1);
  }

  const rounds = teams.length - 1;
  const half = teams.length / 2;
  const rotating = [...teams];
  const fixtures: RoundRobinFixture[] = [];

  for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
    const roundNumber = roundIndex + 1;

    for (let i = 0; i < half; i += 1) {
      const home = rotating[i];
      const away = rotating[rotating.length - 1 - i];

      if (home === -1 || away === -1) {
        continue;
      }

      const swap = roundIndex % 2 === 1;
      fixtures.push({
        roundNumber,
        homeTeamId: swap ? away : home,
        awayTeamId: swap ? home : away
      });
    }

    const fixed = rotating[0];
    const last = rotating.pop();
    if (last == null) {
      break;
    }
    rotating.splice(1, 0, last);
    rotating[0] = fixed;
  }

  if (!doubleRound) {
    return fixtures;
  }

  const reverseStart = rounds + 1;
  const reverseFixtures = fixtures.map((fixture, index) => ({
    roundNumber: reverseStart + Math.floor(index / half),
    homeTeamId: fixture.awayTeamId,
    awayTeamId: fixture.homeTeamId
  }));

  return [...fixtures, ...reverseFixtures];
}
