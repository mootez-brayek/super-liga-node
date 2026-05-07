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
import { TeamService } from './services/TeamService';
import { UserService } from './services/UserService';
import { registerSwagger } from './swagger';

export function createApp() {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';

  const userService = new UserService();
  const teamService = new TeamService();
  const playerService = new PlayerService();
  const matchService = new MatchService();
  const standingService = new StandingService();
  const dashboardService = new DashboardService();

  app.use(
    cors({
      origin: corsOrigin,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(authMiddleware);
  registerSwagger(app);

  app.use('/auth', createAuthRouter(userService));
  app.use('/api/public', createPublicRouter(standingService, matchService, teamService, playerService));
  app.use('/api/team', createTeamRouter(teamService));
  app.use('/api/admin/player', createPlayerRouter(playerService));
  app.use('/api/super-admin/matches', createMatchRouter(matchService));
  app.use('/api/standing', createStandingRouter(standingService));
  app.use('/api/super-admin/dashboard', createDashboardRouter(dashboardService));
  app.use('/api/admin', createAdminRouter(userService, teamService));
  app.use('/api/super-admin', createSuperAdminRouter(userService));

  app.use(errorMiddleware);

  return app;
}
