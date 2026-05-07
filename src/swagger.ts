import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const arrayOf = (name: string) => ({ type: 'array', items: ref(name) });
const jsonResponse = (schema: unknown, description = 'OK') => ({
  description,
  content: {
    'application/json': {
      schema
    }
  }
});

const errorResponses = {
  400: jsonResponse(ref('ErrorResponse'), 'Bad Request'),
  401: jsonResponse(ref('ErrorResponse'), 'Unauthorized'),
  403: jsonResponse(ref('ErrorResponse'), 'Forbidden'),
  500: jsonResponse(ref('ErrorResponse'), 'Internal Server Error')
};

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Super Liga Node API',
    version: '1.0.0',
    description: 'Node rewrite of the Spring Boot Super Liga backend.'
  },
  servers: [
    {
      url: 'http://localhost:3000'
    }
  ],
  tags: [
    { name: 'Auth' },
    { name: 'Public' },
    { name: 'Teams' },
    { name: 'Players' },
    { name: 'Matches' },
    { name: 'Standing' },
    { name: 'Dashboard' },
    { name: 'Admin' },
    { name: 'SuperAdmin' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['message', 'data'],
        properties: {
          message: { type: 'string' },
          data: { nullable: true }
        }
      },
      Role: {
        type: 'string',
        enum: ['SuperAdmin', 'ADMIN']
      },
      MatchStatus: {
        type: 'string',
        enum: ['UPCOMING', 'LIVE', 'FINISHED', 'CANCELLED']
      },
      Position: {
        type: 'string',
        enum: ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD']
      },
      StrongFoot: {
        type: 'string',
        enum: ['LEFT', 'RIGHT', 'BOTH']
      },
      AuthRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            minLength: 5,
            maxLength: 50,
            example: 'admin@example.com'
          },
          password: {
            type: 'string',
            minLength: 6,
            maxLength: 100,
            example: 'secret123'
          }
        }
      },
      LoginResponse: {
        type: 'object',
        required: ['email', 'accessToken', 'id', 'role', 'firstName', 'lastName', 'phoneNumber', 'username'],
        properties: {
          email: { type: 'string' },
          accessToken: { type: 'string' },
          id: { type: 'integer', format: 'int64' },
          role: ref('Role'),
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phoneNumber: { type: 'string', nullable: true },
          username: { type: 'string', nullable: true }
        }
      },
      LoginApiResponse: {
        type: 'object',
        required: ['message', 'data'],
        properties: {
          message: { type: 'string', example: 'Login successful' },
          data: ref('LoginResponse')
        }
      },
      CreateAdminRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          password: { type: 'string', example: 'admin1234' },
          firstName: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          phoneNumber: { type: 'string', nullable: true, example: '+21620000000' }
        }
      },
      CreateAdminResponse: {
        type: 'object',
        required: ['userId', 'email', 'firstName', 'lastName', 'phoneNumber', 'role', 'active'],
        properties: {
          userId: { type: 'integer', format: 'int64' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phoneNumber: { type: 'string', nullable: true },
          role: ref('Role'),
          active: { type: 'boolean' }
        }
      },
      UpdateAdminRequest: {
        type: 'object',
        properties: {
          firstName: { type: 'string', nullable: true },
          lastName: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true, format: 'email' },
          phoneNumber: { type: 'string', nullable: true }
        }
      },
      CreateTeamRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Super Eagles' },
          logo: { type: 'string', nullable: true, example: 'https://example.com/logo.png' }
        }
      },
      TeamResponse: {
        type: 'object',
        required: ['teamId', 'name', 'logo', 'adminName'],
        properties: {
          teamId: { type: 'integer', format: 'int64' },
          name: { type: 'string' },
          logo: { type: 'string', nullable: true },
          adminName: { type: 'string', nullable: true }
        }
      },
      CreatePlayerRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'number', 'strongFoot', 'position', 'teamId'],
        properties: {
          firstName: { type: 'string', example: 'Ali' },
          lastName: { type: 'string', example: 'Ben' },
          number: { type: 'integer', example: 9 },
          picture: { type: 'string', nullable: true },
          strongFoot: ref('StrongFoot'),
          birthDate: { type: 'string', nullable: true, example: '2002-06-15' },
          position: ref('Position'),
          teamId: { type: 'integer', nullable: true, example: 1 }
        }
      },
      PlayerResponse: {
        type: 'object',
        required: ['playerId', 'fullName', 'number', 'strongFoot', 'birthDate', 'age', 'position', 'teamName'],
        properties: {
          playerId: { type: 'integer', format: 'int64' },
          fullName: { type: 'string' },
          number: { type: 'integer' },
          strongFoot: ref('StrongFoot'),
          birthDate: { type: 'string', nullable: true, example: '2002-06-15' },
          age: { type: 'integer', nullable: true },
          position: ref('Position'),
          teamName: { type: 'string' }
        }
      },
      CreateMatchRequest: {
        type: 'object',
        required: ['homeTeamId', 'awayTeamId', 'matchDate', 'matchTime'],
        properties: {
          homeTeamId: { type: 'integer', example: 1 },
          awayTeamId: { type: 'integer', example: 2 },
          matchDate: { type: 'string', format: 'date', example: '2026-05-10' },
          matchTime: { type: 'string', example: '18:30:00' }
        }
      },
      FinishMatchRequest: {
        type: 'object',
        required: ['homeScore', 'awayScore'],
        properties: {
          homeScore: { type: 'integer', example: 2 },
          awayScore: { type: 'integer', example: 1 },
          homeRed: { type: 'integer', nullable: true, example: 0 },
          awayRed: { type: 'integer', nullable: true, example: 1 },
          homeOut: { type: 'integer', nullable: true, example: 0 },
          awayOut: { type: 'integer', nullable: true, example: 0 },
          mvpId: { type: 'integer', nullable: true, example: 15 }
        }
      },
      MatchResponse: {
        type: 'object',
        required: ['matchId', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'status', 'matchDate', 'matchTime', 'homeTeamId', 'awayTeamId'],
        properties: {
          matchId: { type: 'integer', format: 'int64' },
          homeTeam: { type: 'string' },
          awayTeam: { type: 'string' },
          homeScore: { type: 'integer', nullable: true },
          awayScore: { type: 'integer', nullable: true },
          status: ref('MatchStatus'),
          matchDate: { type: 'string', nullable: true, format: 'date' },
          matchTime: { type: 'string', nullable: true, example: '18:30:00' },
          homeTeamId: { type: 'integer', nullable: true },
          awayTeamId: { type: 'integer', nullable: true }
        }
      },
      MatchResultResponse: {
        type: 'object',
        required: ['matchId', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'winner', 'status'],
        properties: {
          matchId: { type: 'integer', format: 'int64' },
          homeTeam: { type: 'string' },
          awayTeam: { type: 'string' },
          homeScore: { type: 'integer', nullable: true },
          awayScore: { type: 'integer', nullable: true },
          winner: { type: 'string' },
          status: ref('MatchStatus')
        }
      },
      MyTeamMatchResponse: {
        type: 'object',
        required: ['matchId', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore', 'matchDate', 'matchTime', 'status', 'result'],
        properties: {
          matchId: { type: 'integer', format: 'int64' },
          homeTeam: { type: 'string' },
          awayTeam: { type: 'string' },
          homeScore: { type: 'integer', nullable: true },
          awayScore: { type: 'integer', nullable: true },
          matchDate: { type: 'string', nullable: true, format: 'date' },
          matchTime: { type: 'string', nullable: true, example: '18:30:00' },
          status: ref('MatchStatus'),
          result: { type: 'string', nullable: true, example: 'WIN' }
        }
      },
      StandingResponse: {
        type: 'object',
        required: ['position', 'teamName', 'played', 'wins', 'draws', 'losses', 'goalsScored', 'goalsConceded', 'goalDifference', 'points'],
        properties: {
          position: { type: 'integer' },
          teamName: { type: 'string' },
          played: { type: 'integer' },
          wins: { type: 'integer' },
          draws: { type: 'integer' },
          losses: { type: 'integer' },
          goalsScored: { type: 'integer' },
          goalsConceded: { type: 'integer' },
          goalDifference: { type: 'integer' },
          points: { type: 'integer' }
        }
      },
      DashboardStatsDto: {
        type: 'object',
        required: ['totalAdmins', 'totalMatches', 'totalPlayers'],
        properties: {
          totalAdmins: { type: 'integer', format: 'int64' },
          totalMatches: { type: 'integer', format: 'int64' },
          totalPlayers: { type: 'integer', format: 'int64' }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('AuthRequest')
            }
          }
        },
        responses: {
          200: jsonResponse(ref('LoginApiResponse')),
          400: jsonResponse(ref('ErrorResponse'), 'Bad Request'),
          401: jsonResponse(ref('ErrorResponse'), 'Unauthorized')
        }
      }
    },
    '/api/public/standing': {
      get: {
        tags: ['Public'],
        summary: 'Get public standings',
        security: [],
        responses: {
          200: jsonResponse(arrayOf('StandingResponse'))
        }
      }
    },
    '/api/public/match/upcoming': {
      get: {
        tags: ['Public'],
        summary: 'Get upcoming matches',
        security: [],
        responses: {
          200: jsonResponse(arrayOf('MatchResponse'))
        }
      }
    },
    '/api/public/match/finished': {
      get: {
        tags: ['Public'],
        summary: 'Get finished matches',
        security: [],
        responses: {
          200: jsonResponse(arrayOf('MatchResponse'))
        }
      }
    },
    '/api/public/teams': {
      get: {
        tags: ['Public'],
        summary: 'Get public teams',
        security: [],
        responses: {
          200: jsonResponse(arrayOf('TeamResponse'))
        }
      }
    },
    '/api/public/players/{teamId}': {
      get: {
        tags: ['Public'],
        summary: 'Get players by team id',
        security: [],
        parameters: [
          {
            name: 'teamId',
            in: 'path',
            required: true,
            schema: { type: 'integer', format: 'int64' }
          }
        ],
        responses: {
          200: jsonResponse(arrayOf('PlayerResponse'))
        }
      }
    },
    '/api/team/create-team': {
      post: {
        tags: ['Teams'],
        summary: 'Create a team for the authenticated admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('CreateTeamRequest')
            }
          }
        },
        responses: {
          200: jsonResponse(ref('TeamResponse')),
          ...errorResponses
        }
      }
    },
    '/api/team': {
      get: {
        tags: ['Teams'],
        summary: 'Get teams',
        responses: {
          200: jsonResponse(arrayOf('TeamResponse'))
        }
      }
    },
    '/api/admin/player': {
      post: {
        tags: ['Players'],
        summary: 'Create a player for the authenticated admin team',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('CreatePlayerRequest')
            }
          }
        },
        responses: {
          200: jsonResponse(ref('PlayerResponse')),
          ...errorResponses
        }
      }
    },
    '/api/admin/player/{playerId}': {
      put: {
        tags: ['Players'],
        summary: 'Update a player',
        parameters: [
          {
            name: 'playerId',
            in: 'path',
            required: true,
            schema: { type: 'integer', format: 'int64' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('CreatePlayerRequest')
            }
          }
        },
        responses: {
          200: jsonResponse(ref('PlayerResponse')),
          ...errorResponses
        }
      }
    },
    '/api/admin/player/{playerId}/toggle-status': {
      patch: {
        tags: ['Players'],
        summary: 'Toggle a player active status',
        parameters: [
          {
            name: 'playerId',
            in: 'path',
            required: true,
            schema: { type: 'integer', format: 'int64' }
          }
        ],
        responses: {
          200: { description: 'OK' },
          ...errorResponses
        }
      }
    },
    '/api/admin/player/team/{teamId}': {
      get: {
        tags: ['Players'],
        summary: 'Get players for a team',
        parameters: [
          {
            name: 'teamId',
            in: 'path',
            required: true,
            schema: { type: 'integer', format: 'int64' }
          }
        ],
        responses: {
          200: jsonResponse(arrayOf('PlayerResponse'))
        }
      }
    },
    '/api/super-admin/matches': {
      post: {
        tags: ['Matches'],
        summary: 'Create a match',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('CreateMatchRequest')
            }
          }
        },
        responses: {
          200: jsonResponse(ref('MatchResponse')),
          ...errorResponses
        }
      },
      get: {
        tags: ['Matches'],
        summary: 'Get all matches',
        responses: {
          200: jsonResponse(arrayOf('MatchResponse'))
        }
      }
    },
    '/api/super-admin/matches/{matchId}/finish': {
      put: {
        tags: ['Matches'],
        summary: 'Finish a match',
        parameters: [
          {
            name: 'matchId',
            in: 'path',
            required: true,
            schema: { type: 'integer', format: 'int64' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('FinishMatchRequest')
            }
          }
        },
        responses: {
          200: jsonResponse(ref('MatchResponse')),
          ...errorResponses
        }
      }
    },
    '/api/super-admin/matches/upcoming': {
      get: {
        tags: ['Matches'],
        summary: 'Get upcoming matches',
        responses: {
          200: jsonResponse(arrayOf('MatchResponse'))
        }
      }
    },
    '/api/super-admin/matches/finished': {
      get: {
        tags: ['Matches'],
        summary: 'Get finished matches',
        responses: {
          200: jsonResponse(arrayOf('MatchResponse'))
        }
      }
    },
    '/api/super-admin/matches/my-finished': {
      get: {
        tags: ['Matches'],
        summary: 'Get finished matches for the authenticated admin team',
        responses: {
          200: jsonResponse(arrayOf('MyTeamMatchResponse'))
        }
      }
    },
    '/api/super-admin/matches/my-upcoming': {
      get: {
        tags: ['Matches'],
        summary: 'Get upcoming matches for the authenticated admin team',
        responses: {
          200: jsonResponse(arrayOf('MatchResponse'))
        }
      }
    },
    '/api/super-admin/matches/{matchId}/result': {
      get: {
        tags: ['Matches'],
        summary: 'Get match result summary',
        parameters: [
          {
            name: 'matchId',
            in: 'path',
            required: true,
            schema: { type: 'integer', format: 'int64' }
          }
        ],
        responses: {
          200: jsonResponse(ref('MatchResultResponse')),
          ...errorResponses
        }
      }
    },
    '/api/standing': {
      get: {
        tags: ['Standing'],
        summary: 'Get standings',
        responses: {
          200: jsonResponse(arrayOf('StandingResponse'))
        }
      }
    },
    '/api/super-admin/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard stats',
        responses: {
          200: jsonResponse(ref('DashboardStatsDto')),
          ...errorResponses
        }
      }
    },
    '/api/admin/me': {
      put: {
        tags: ['Admin'],
        summary: 'Update my admin profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('UpdateAdminRequest')
            }
          }
        },
        responses: {
          200: jsonResponse(ref('CreateAdminResponse')),
          ...errorResponses
        }
      },
      get: {
        tags: ['Admin'],
        summary: 'Get my admin profile',
        responses: {
          200: jsonResponse(ref('CreateAdminResponse')),
          ...errorResponses
        }
      }
    },
    '/api/admin/my-team': {
      get: {
        tags: ['Admin'],
        summary: 'Get my team',
        responses: {
          200: jsonResponse(ref('TeamResponse')),
          ...errorResponses
        }
      }
    },
    '/api/admin/my-stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get my team stats',
        responses: {
          200: jsonResponse(ref('StandingResponse')),
          ...errorResponses
        }
      }
    },
    '/api/super-admin/create-admin': {
      post: {
        tags: ['SuperAdmin'],
        summary: 'Create an admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('CreateAdminRequest')
            }
          }
        },
        responses: {
          200: jsonResponse(ref('CreateAdminResponse')),
          ...errorResponses
        }
      }
    },
    '/api/super-admin/admins': {
      get: {
        tags: ['SuperAdmin'],
        summary: 'List all admins',
        responses: {
          200: jsonResponse(arrayOf('CreateAdminResponse')),
          ...errorResponses
        }
      }
    },
    '/api/super-admin/{id}/toggle-status': {
      post: {
        tags: ['SuperAdmin'],
        summary: 'Toggle an admin active status',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', format: 'int64' }
          }
        ],
        responses: {
          200: { description: 'OK' },
          ...errorResponses
        }
      }
    }
  }
};

export function registerSwagger(app: Express) {
  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.json(swaggerSpec);
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true
      }
    })
  );
}
