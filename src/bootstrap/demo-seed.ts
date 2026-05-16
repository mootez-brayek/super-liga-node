import 'dotenv/config';
import 'reflect-metadata';

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../data-source';
import { MatchEventResponse } from '../dto/MatchEventResponse';
import { MatchResponse } from '../dto/MatchResponse';
import { PlayerResponse } from '../dto/PlayerResponse';
import { TeamResponse } from '../dto/TeamResponse';
import { MatchEventType, MatchStatus, Position, Role, StrongFoot } from '../entities/enums';
import { Match } from '../entities/Match';
import { MatchEvent } from '../entities/MatchEvent';
import { Player } from '../entities/Player';
import { Standing } from '../entities/Standing';
import { Team } from '../entities/Team';
import { User } from '../entities/User';
import { MatchService } from '../services/MatchService';
import { PlayerService } from '../services/PlayerService';
import { TeamService } from '../services/TeamService';
import { uploadsRoot } from '../utils/uploads';
import { CurrentUser } from '../types/express';

type TeamSeed = {
  name: string;
  slug: string;
  colors: [string, string];
  admin: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  roster: string[];
};

type TeamCard = TeamSeed & {
  adminUser: User;
  response: TeamResponse;
  players: PlayerResponse[];
};

type FinishedFixture = {
  matchDate: string;
  matchTime: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  homeScorerIndices: number[];
  awayScorerIndices: number[];
  homeRed: number;
  awayRed: number;
  homeOut: number;
  awayOut: number;
  mvpTeam: string;
  mvpIndex: number;
};

type UpcomingFixture = {
  matchDate: string;
  matchTime: string;
  home: string;
  away: string;
};

const DEMO_PASSWORD = 'Demo123!';
const DEMO_ASSET_ROOT = path.join(uploadsRoot, 'demo-seed');
const TEAM_LOGO_DIR = path.join(DEMO_ASSET_ROOT, 'teams');
const PLAYER_PICTURE_DIR = path.join(DEMO_ASSET_ROOT, 'players');
const RESET_REQUESTED = process.argv.includes('--reset');

const PLAYER_NUMBERS = [1, 2, 3, 6, 8, 9, 11];
const PLAYER_POSITIONS: Position[] = [
  Position.GOALKEEPER,
  Position.DEFENDER,
  Position.DEFENDER,
  Position.MIDFIELDER,
  Position.MIDFIELDER,
  Position.FORWARD,
  Position.FORWARD
];
const PLAYER_FEET: StrongFoot[] = [
  StrongFoot.RIGHT,
  StrongFoot.LEFT,
  StrongFoot.BOTH,
  StrongFoot.RIGHT,
  StrongFoot.LEFT,
  StrongFoot.RIGHT,
  StrongFoot.BOTH
];

const DEMO_TEAMS: TeamSeed[] = [
  {
    name: 'Atlas FC',
    slug: 'atlas',
    colors: ['#0B4F8A', '#2AA8FF'],
    admin: { firstName: 'Nabil', lastName: 'Brahimi', phoneNumber: '+21620000001' },
    roster: [
      'Amine Jaziri',
      'Yassine Gharbi',
      'Aymen Trabelsi',
      'Nader Mejri',
      'Sami Khelifi',
      'Wassim Bouazizi',
      'Moez Daou'
    ]
  },
  {
    name: 'Carthage United',
    slug: 'carthage',
    colors: ['#6B0F1A', '#FF6B6B'],
    admin: { firstName: 'Mounir', lastName: 'Chebbi', phoneNumber: '+21620000002' },
    roster: [
      'Hamza Ben Ali',
      'Bilel Ben Salah',
      'Anis Gharbi',
      'Fares Khelifi',
      'Oussama Bouazizi',
      'Rami Kacem',
      'Walid Mejri'
    ]
  },
  {
    name: 'Phoenix Sport',
    slug: 'phoenix',
    colors: ['#AD4B00', '#FFB347'],
    admin: { firstName: 'Karim', lastName: 'Ghedira', phoneNumber: '+21620000003' },
    roster: [
      'Ilyes Cherif',
      'Saif Khlif',
      'Marwen Sassi',
      'Houssem Ben Romdhane',
      'Aymen Haddad',
      'Yassine Mansouri',
      'Moez Aouadi'
    ]
  },
  {
    name: 'Sahara Stars',
    slug: 'sahara',
    colors: ['#0F5132', '#7EE8A2'],
    admin: { firstName: 'Firas', lastName: 'Attia', phoneNumber: '+21620000004' },
    roster: [
      'Saber Jaziri',
      'Malek Trabelsi',
      'Sami Ben Salem',
      'Nabil Khelifi',
      'Yassine Gharbi',
      'Rayan Bouzid',
      'Anis Daou'
    ]
  },
  {
    name: 'Marsa City',
    slug: 'marsa',
    colors: ['#1F2D86', '#8DA2FF'],
    admin: { firstName: 'Anis', lastName: 'Kharraz', phoneNumber: '+21620000005' },
    roster: [
      'Aymen Saidi',
      'Oussama Ben Salah',
      'Firas Mejri',
      'Amine Kacem',
      'Rami Ben Ali',
      'Walid Messaoud',
      'Marouane Gharbi'
    ]
  },
  {
    name: 'Tunis Knights',
    slug: 'tunis',
    colors: ['#1B1B23', '#C2A15D'],
    admin: { firstName: 'Hichem', lastName: 'Ghezal', phoneNumber: '+21620000006' },
    roster: [
      'Issam Bousnina',
      'Moez Khelil',
      'Nader Ben Youssef',
      'Fares Chennoufi',
      'Sami Hammami',
      'Hichem Ben Amor',
      'Yassine Ghedira'
    ]
  }
];

const FINISHED_FIXTURES: FinishedFixture[] = [
  {
    matchDate: '2026-05-15',
    matchTime: '20:00',
    home: 'Sahara Stars',
    away: 'Tunis Knights',
    homeScore: 2,
    awayScore: 3,
    homeScorerIndices: [5, 4],
    awayScorerIndices: [5, 3, 4],
    homeRed: 1,
    awayRed: 0,
    homeOut: 1,
    awayOut: 0,
    mvpTeam: 'Tunis Knights',
    mvpIndex: 3
  },
  {
    matchDate: '2026-05-13',
    matchTime: '19:15',
    home: 'Carthage United',
    away: 'Marsa City',
    homeScore: 4,
    awayScore: 1,
    homeScorerIndices: [5, 4, 3, 2],
    awayScorerIndices: [3],
    homeRed: 0,
    awayRed: 0,
    homeOut: 0,
    awayOut: 1,
    mvpTeam: 'Carthage United',
    mvpIndex: 5
  },
  {
    matchDate: '2026-05-12',
    matchTime: '18:30',
    home: 'Atlas FC',
    away: 'Phoenix Sport',
    homeScore: 2,
    awayScore: 0,
    homeScorerIndices: [5, 4],
    awayScorerIndices: [],
    homeRed: 0,
    awayRed: 0,
    homeOut: 0,
    awayOut: 0,
    mvpTeam: 'Atlas FC',
    mvpIndex: 4
  },
  {
    matchDate: '2026-05-10',
    matchTime: '20:15',
    home: 'Marsa City',
    away: 'Tunis Knights',
    homeScore: 0,
    awayScore: 2,
    homeScorerIndices: [],
    awayScorerIndices: [5, 4],
    homeRed: 1,
    awayRed: 0,
    homeOut: 0,
    awayOut: 1,
    mvpTeam: 'Tunis Knights',
    mvpIndex: 5
  },
  {
    matchDate: '2026-05-09',
    matchTime: '17:45',
    home: 'Phoenix Sport',
    away: 'Sahara Stars',
    homeScore: 1,
    awayScore: 1,
    homeScorerIndices: [3],
    awayScorerIndices: [4],
    homeRed: 0,
    awayRed: 0,
    homeOut: 0,
    awayOut: 0,
    mvpTeam: 'Phoenix Sport',
    mvpIndex: 3
  },
  {
    matchDate: '2026-05-08',
    matchTime: '19:00',
    home: 'Atlas FC',
    away: 'Carthage United',
    homeScore: 3,
    awayScore: 2,
    homeScorerIndices: [5, 4, 3],
    awayScorerIndices: [5, 4],
    homeRed: 0,
    awayRed: 1,
    homeOut: 0,
    awayOut: 1,
    mvpTeam: 'Atlas FC',
    mvpIndex: 5
  }
];

const UPCOMING_FIXTURES: UpcomingFixture[] = [
  { matchDate: '2026-05-18', matchTime: '19:00', home: 'Carthage United', away: 'Sahara Stars' },
  { matchDate: '2026-05-19', matchTime: '18:00', home: 'Tunis Knights', away: 'Atlas FC' },
  { matchDate: '2026-05-20', matchTime: '17:30', home: 'Phoenix Sport', away: 'Marsa City' },
  { matchDate: '2026-05-21', matchTime: '20:00', home: 'Sahara Stars', away: 'Phoenix Sport' }
];

function ensureDirectory(directory: string) {
  fs.mkdirSync(directory, { recursive: true });
}

function resetAssets() {
  fs.rmSync(DEMO_ASSET_ROOT, { recursive: true, force: true });
  ensureDirectory(TEAM_LOGO_DIR);
  ensureDirectory(PLAYER_PICTURE_DIR);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

function buildTeamLogoPath(slug: string) {
  return `/uploads/demo-seed/teams/${slug}.svg`;
}

function buildPlayerPicturePath(slug: string, index: number) {
  return `/uploads/demo-seed/players/${slug}-${String(index + 1).padStart(2, '0')}.svg`;
}

function makeBirthDate(teamIndex: number, playerIndex: number) {
  const year = 1990 + ((teamIndex * 3 + playerIndex) % 13);
  const month = String(((teamIndex + playerIndex) % 12) + 1).padStart(2, '0');
  const day = String(10 + ((teamIndex * 2 + playerIndex) % 18)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createTeamLogoSvg(team: TeamSeed) {
  const initials = escapeXml(getInitials(team.name));
  const [primary, secondary] = team.colors;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="${escapeXml(team.name)} logo">
  <defs>
    <linearGradient id="bg-${team.slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" />
      <stop offset="100%" stop-color="${secondary}" />
    </linearGradient>
    <linearGradient id="shine-${team.slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.05" />
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="56" fill="url(#bg-${team.slug})" />
  <circle cx="120" cy="120" r="98" fill="#FFFFFF" fill-opacity="0.12" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="5" />
  <circle cx="120" cy="120" r="76" fill="#000000" fill-opacity="0.12" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="3" />
  <path d="M40 156C66 108 93 78 120 78s54 30 80 78" fill="none" stroke="url(#shine-${team.slug})" stroke-linecap="round" stroke-width="14" opacity="0.8" />
  <circle cx="120" cy="120" r="46" fill="#FFFFFF" fill-opacity="0.94" />
  <text x="120" y="133" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="900" fill="${primary}" letter-spacing="2">${initials}</text>
</svg>`;
}

function createPlayerPortraitSvg(team: TeamSeed, playerName: string, number: number) {
  const initials = escapeXml(getInitials(playerName));
  const [primary, secondary] = team.colors;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="${escapeXml(playerName)} portrait">
  <defs>
    <linearGradient id="player-${team.slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" />
      <stop offset="100%" stop-color="${secondary}" />
    </linearGradient>
  </defs>
  <rect width="320" height="320" rx="48" fill="url(#player-${team.slug})" />
  <circle cx="160" cy="98" r="48" fill="#FFFFFF" fill-opacity="0.22" />
  <path d="M84 264c10-46 44-72 76-72s66 26 76 72" fill="#FFFFFF" fill-opacity="0.18" />
  <circle cx="160" cy="110" r="42" fill="#FFFFFF" fill-opacity="0.95" />
  <rect x="102" y="134" width="116" height="88" rx="34" fill="#FFFFFF" fill-opacity="0.16" />
  <rect x="136" y="158" width="48" height="64" rx="16" fill="#FFFFFF" fill-opacity="0.92" />
  <text x="160" y="114" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900" fill="${primary}" letter-spacing="1">${initials}</text>
  <text x="160" y="199" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900" fill="${primary}">#${number}</text>
</svg>`;
}

function writeSvg(filePath: string, content: string) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

async function resetDatabase() {
  await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0');

  const repositories = [
    AppDataSource.getRepository(MatchEvent),
    AppDataSource.getRepository(Match),
    AppDataSource.getRepository(Player),
    AppDataSource.getRepository(Standing),
    AppDataSource.getRepository(Team),
    AppDataSource.getRepository(User)
  ];

  try {
    for (const repository of repositories) {
      const tableName = repository.metadata.tableName;
      await AppDataSource.query(`DELETE FROM \`${tableName}\``);
      await AppDataSource.query(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1`);
    }
  } finally {
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function upsertDemoUser(seed: {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: Role;
}) {
  const userRepo = AppDataSource.getRepository(User);
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);

  const existing = await userRepo.findOne({ where: { email: seed.email } });
  const next = existing ?? userRepo.create();

  next.email = seed.email;
  next.username = seed.username;
  next.firstName = seed.firstName;
  next.lastName = seed.lastName;
  next.phoneNumber = seed.phoneNumber;
  next.password = password;
  next.role = seed.role;
  next.isActive = true;

  return userRepo.save(next);
}

function toCurrentUser(user: User): CurrentUser {
  return {
    userId: user.userId,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username
  };
}

async function seedTeams(teamService: TeamService, teamAdminUsers: User[]) {
  const teamCards: TeamCard[] = [];

  for (const [index, team] of DEMO_TEAMS.entries()) {
    const adminUser = teamAdminUsers[index];
    const teamLogoPath = buildTeamLogoPath(team.slug);

    writeSvg(path.join(TEAM_LOGO_DIR, `${team.slug}.svg`), createTeamLogoSvg(team));

    const response = await teamService.createTeam(
      {
        name: team.name,
        logo: teamLogoPath
      },
      toCurrentUser(adminUser)
    );

    teamCards.push({
      ...team,
      adminUser,
      response,
      players: []
    });
  }

  return teamCards;
}

async function seedPlayers(playerService: PlayerService, teams: TeamCard[]) {
  for (const [teamIndex, teamCard] of teams.entries()) {
    const currentUser = toCurrentUser(teamCard.adminUser);

    for (const [playerIndex, playerName] of teamCard.roster.entries()) {
      const picturePath = buildPlayerPicturePath(teamCard.slug, playerIndex);
      writeSvg(
        path.join(PLAYER_PICTURE_DIR, `${teamCard.slug}-${String(playerIndex + 1).padStart(2, '0')}.svg`),
        createPlayerPortraitSvg(teamCard, playerName, PLAYER_NUMBERS[playerIndex])
      );

      const [firstName, ...rest] = playerName.split(/\s+/);
      const lastName = rest.join(' ');

      const player = await playerService.addPlayer(
        {
          firstName,
          lastName,
          number: PLAYER_NUMBERS[playerIndex],
          picture: picturePath,
          strongFoot: PLAYER_FEET[playerIndex],
          birthDate: makeBirthDate(teamIndex, playerIndex),
          position: PLAYER_POSITIONS[playerIndex],
          teamId: teamCard.response.teamId
        },
        currentUser
      );

      teamCard.players.push(player);
    }
  }
}

async function seedFinishedMatches(matchService: MatchService, teams: TeamCard[]) {
  const matchCards: MatchResponse[] = [];

  for (const fixture of FINISHED_FIXTURES) {
    const homeTeam = teams.find((team) => team.name === fixture.home);
    const awayTeam = teams.find((team) => team.name === fixture.away);
    const mvpTeam = teams.find((team) => team.name === fixture.mvpTeam);

    if (!homeTeam || !awayTeam || !mvpTeam) {
      throw new Error(`Invalid finished fixture: ${fixture.home} vs ${fixture.away}`);
    }

    const created = await matchService.createMatch({
      homeTeamId: homeTeam.response.teamId,
      awayTeamId: awayTeam.response.teamId,
      matchDate: fixture.matchDate,
      matchTime: fixture.matchTime
    });

    const finished = await matchService.finishMatch(created.matchId, {
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      homeRed: fixture.homeRed,
      awayRed: fixture.awayRed,
      homeOut: fixture.homeOut,
      awayOut: fixture.awayOut,
      mvpId: mvpTeam.players[fixture.mvpIndex]?.playerId ?? null,
      homeScorerIds: fixture.homeScorerIndices.map((index) => homeTeam.players[index]?.playerId).filter((value): value is number => Boolean(value)),
      awayScorerIds: fixture.awayScorerIndices.map((index) => awayTeam.players[index]?.playerId).filter((value): value is number => Boolean(value))
    });

    matchCards.push(finished);
  }

  return matchCards;
}

async function seedUpcomingMatches(matchService: MatchService, teams: TeamCard[]) {
  const matchCards: MatchResponse[] = [];

  for (const fixture of UPCOMING_FIXTURES) {
    const homeTeam = teams.find((team) => team.name === fixture.home);
    const awayTeam = teams.find((team) => team.name === fixture.away);

    if (!homeTeam || !awayTeam) {
      throw new Error(`Invalid upcoming fixture: ${fixture.home} vs ${fixture.away}`);
    }

    const created = await matchService.createMatch({
      homeTeamId: homeTeam.response.teamId,
      awayTeamId: awayTeam.response.teamId,
      matchDate: fixture.matchDate,
      matchTime: fixture.matchTime
    });

    matchCards.push(created);
  }

  return matchCards;
}

async function seedMatchEvents(matchService: MatchService, teams: TeamCard[]) {
  const atlas = teams.find((team) => team.name === 'Atlas FC');
  const carthage = teams.find((team) => team.name === 'Carthage United');
  const marsa = teams.find((team) => team.name === 'Marsa City');
  const finishedMatch = await AppDataSource.getRepository(Match).findOne({
    where: {
      homeTeam: { teamId: atlas?.response.teamId ?? 0 },
      awayTeam: { teamId: carthage?.response.teamId ?? 0 },
      status: MatchStatus.FINISHED
    },
    relations: ['homeTeam', 'awayTeam']
  });

  if (!finishedMatch || !atlas || !carthage || !marsa) {
    return [];
  }

  const events: MatchEventResponse[] = [];

  events.push(
    await matchService.addMatchEvent(finishedMatch.matchId, {
      type: MatchEventType.YELLOW_CARD,
      minute: 14,
      teamId: atlas.response.teamId,
      playerId: atlas.players[2].playerId,
      note: 'Rough tackle'
    })
  );

  events.push(
    await matchService.addMatchEvent(finishedMatch.matchId, {
      type: MatchEventType.RED_CARD,
      minute: 71,
      teamId: carthage.response.teamId,
      playerId: carthage.players[4].playerId,
      note: 'Last man challenge'
    })
  );

  const marsaMatch = await AppDataSource.getRepository(Match).findOne({
    where: {
      homeTeam: { teamId: marsa.response.teamId },
      awayTeam: { teamId: teams.find((team) => team.name === 'Tunis Knights')?.response.teamId ?? 0 },
      status: MatchStatus.FINISHED
    },
    relations: ['homeTeam', 'awayTeam']
  });

  if (marsaMatch) {
    events.push(
      await matchService.addMatchEvent(marsaMatch.matchId, {
        type: MatchEventType.TWO_MINUTE,
        minute: 62,
        teamId: marsa.response.teamId,
        playerId: marsa.players[1].playerId,
        note: 'Temporary exclusion'
      })
    );
  }

  return events;
}

async function main() {
  if (!RESET_REQUESTED) {
    throw new Error('Use `npm run seed:demo -- --reset` to rebuild the demo database.');
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  resetAssets();
  await resetDatabase();

  const userRepo = AppDataSource.getRepository(User);
  const teamService = new TeamService();
  const playerService = new PlayerService();
  const matchService = new MatchService();

  const superAdmin = await upsertDemoUser({
    email: 'super.admin@demo.local',
    username: 'superadmin',
    firstName: 'Demo',
    lastName: 'Super',
    phoneNumber: '+21620999999',
    role: Role.SuperAdmin
  });

  const teamAdmins = await Promise.all(
    DEMO_TEAMS.map((team) =>
      upsertDemoUser({
        email: `${team.slug}.admin@demo.local`,
        username: `${team.slug}_admin`,
        firstName: team.admin.firstName,
        lastName: team.admin.lastName,
        phoneNumber: team.admin.phoneNumber,
        role: Role.ADMIN
      })
    )
  );

  const teams = await seedTeams(teamService, teamAdmins);
  await seedPlayers(playerService, teams);
  const finishedMatches = await seedFinishedMatches(matchService, teams);
  const upcomingMatches = await seedUpcomingMatches(matchService, teams);
  const extraEvents = await seedMatchEvents(matchService, teams);

  const counts = {
    users: await userRepo.count(),
    teams: await AppDataSource.getRepository(Team).count(),
    players: await AppDataSource.getRepository(Player).count(),
    standings: await AppDataSource.getRepository(Standing).count(),
    matches: await AppDataSource.getRepository(Match).count(),
    events: await AppDataSource.getRepository(MatchEvent).count()
  };

  console.log('Demo database seeded');
  console.log(`Super admin: ${superAdmin.email} / ${DEMO_PASSWORD}`);
  console.log('Team admins:');
  for (const [index, team] of DEMO_TEAMS.entries()) {
    console.log(`- ${team.name}: ${teamAdmins[index].email} / ${DEMO_PASSWORD}`);
  }
  console.table(counts);
  console.log(`Finished matches created: ${finishedMatches.length}`);
  console.log(`Upcoming matches created: ${upcomingMatches.length}`);
  console.log(`Extra events created: ${extraEvents.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
