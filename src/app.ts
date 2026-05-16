import cors from 'cors';
import express from 'express';
import { authMiddleware } from './middleware/auth.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { createAdminRouter } from './controllers/AdminController';
import { createAuthRouter } from './controllers/AuthController';
import { createDashboardRouter } from './controllers/DashboardController';
import { createMatchRouter } from './controllers/MatchController';
import { createPlayerRouter } from './controllers/PlayerController';
import { createPublicRouter } from './controllers/PublicController';
import { createStandingRouter } from './controllers/StandingController';
import { createSuperAdminRouter } from './controllers/SuperAdminController';
import { createTeamRouter } from './controllers/TeamController';
import { DashboardService } from './services/DashboardService';
import { MatchService } from './services/MatchService';
import { PlayerService } from './services/PlayerService';
import { StandingService } from './services/StandingService';
import { SeasonService } from './services/SeasonService';
import { TeamService } from './services/TeamService';
import { UserService } from './services/UserService';
import { registerSwagger } from './swagger';
import { uploadsRoot } from './utils/uploads';

function buildAllowedOrigins() {
  const rawOrigins = (process.env.CORS_ORIGIN || 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins = new Set<string>();

  for (const origin of rawOrigins) {
    allowedOrigins.add(origin);

    try {
      const parsed = new URL(origin);
      const portSuffix = parsed.port ? `:${parsed.port}` : '';

      if (parsed.hostname.startsWith('www.')) {
        allowedOrigins.add(`${parsed.protocol}//${parsed.hostname.slice(4)}${portSuffix}`);
      } else {
        allowedOrigins.add(`${parsed.protocol}//www.${parsed.hostname}${portSuffix}`);
      }
    } catch {
      // Ignore invalid URLs and keep the exact configured value only.
    }
  }

  return Array.from(allowedOrigins);
}

function isLocalOrigin(origin: string) {
  try {
    const parsed = new URL(origin);
    return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();

  const allowedOrigins = buildAllowedOrigins();
  const corsOptions = {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    optionsSuccessStatus: 204
  };

  const userService = new UserService();
  const teamService = new TeamService();
  const playerService = new PlayerService();
  const matchService = new MatchService();
  const standingService = new StandingService();
  const seasonService = new SeasonService();
  const dashboardService = new DashboardService();

  app.get('/', (_req, res) => {
    res.status(200).json({
      message: 'Super Liga Node backend is running',
      data: { status: 'ok' }
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      message: 'ok',
      data: { status: 'ok' }
    });
  });

  app.use('/uploads', express.static(uploadsRoot));
  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(authMiddleware);
  registerSwagger(app);

  app.use('/auth', createAuthRouter(userService));
  app.use('/api/public', createPublicRouter(standingService, matchService, teamService, playerService, seasonService));
  app.use('/api/team', createTeamRouter(teamService));
  app.use('/api/admin/player', createPlayerRouter(playerService));
  app.use('/api/super-admin/matches', createMatchRouter(matchService));
  app.use('/api/standing', createStandingRouter(standingService));
  app.use('/api/super-admin/dashboard', createDashboardRouter(dashboardService));
  app.use('/api/admin', createAdminRouter(userService, teamService));
  app.use('/api/super-admin', createSuperAdminRouter(userService, seasonService));

  app.use(errorMiddleware);

  return app;
}
