import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Football Prediction API',
      version: '1.0.0',
      description:
        'Backend API for AI-powered football match predictions mobile application. Provides authentication and match prediction data.',
      contact: {
        name: 'API Support',
        email: env.EMAIL_FROM,
      },
    },
    servers: [
      {
        url: env.NODE_ENV === 'production'
          ? 'https://decentralabs.tech'
          : `http://localhost:${env.PORT}`,
        description: env.NODE_ENV === 'production' ? 'Production Server' : 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your access token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'ValidationError',
            },
            message: {
              type: 'string',
              example: 'Invalid input data',
            },
            statusCode: {
              type: 'integer',
              example: 400,
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            name: {
              type: 'string',
              nullable: true,
            },
            surname: {
              type: 'string',
              nullable: true,
            },
            emailVerified: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Team: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Arsenal',
            },
            apiId: {
              type: 'string',
              nullable: true,
            },
            logoUrl: {
              type: 'string',
              nullable: true,
              example: 'https://media.api-sports.io/football/teams/42.png',
            },
            country: {
              type: 'string',
              nullable: true,
              example: 'England',
            },
            league: {
              type: 'string',
              nullable: true,
              example: 'Premier League',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Match: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            apiId: {
              type: 'string',
              nullable: true,
            },
            homeTeam: {
              $ref: '#/components/schemas/Team',
            },
            awayTeam: {
              $ref: '#/components/schemas/Team',
            },
            kickoffTime: {
              type: 'string',
              format: 'date-time',
            },
            status: {
              type: 'string',
              enum: ['upcoming', 'live', 'finished', 'postponed', 'cancelled'],
              example: 'upcoming',
            },
            homeScore: {
              type: 'integer',
              nullable: true,
            },
            awayScore: {
              type: 'integer',
              nullable: true,
            },
            venue: {
              type: 'string',
              nullable: true,
              example: 'Emirates Stadium',
            },
            referee: {
              type: 'string',
              nullable: true,
              example: 'Michael Oliver',
            },
            league: {
              type: 'string',
              nullable: true,
              example: 'Premier League',
            },
            season: {
              type: 'string',
              nullable: true,
              example: '2023',
            },
            round: {
              type: 'string',
              nullable: true,
              example: 'Regular Season - 15',
            },
          },
        },
        Standing: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            team: {
              $ref: '#/components/schemas/Team',
            },
            season: {
              type: 'string',
              example: '2023',
            },
            league: {
              type: 'string',
              example: 'Premier League',
            },
            rank: {
              type: 'integer',
              example: 1,
            },
            points: {
              type: 'integer',
              example: 91,
            },
            goalsDiff: {
              type: 'integer',
              example: 62,
            },
            played: {
              type: 'integer',
              example: 38,
            },
            wins: {
              type: 'integer',
              example: 28,
            },
            draws: {
              type: 'integer',
              example: 7,
            },
            losses: {
              type: 'integer',
              example: 3,
            },
            goalsFor: {
              type: 'integer',
              example: 96,
            },
            goalsAgainst: {
              type: 'integer',
              example: 34,
            },
            form: {
              type: 'string',
              nullable: true,
              example: 'WWWWW',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Promotion - Champions League (Group Stage)',
            },
          },
        },
        PlayerStats: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            apiId: {
              type: 'string',
            },
            team: {
              $ref: '#/components/schemas/Team',
            },
            season: {
              type: 'string',
              example: '2023',
            },
            name: {
              type: 'string',
              example: 'E. Haaland',
            },
            firstname: {
              type: 'string',
              nullable: true,
              example: 'Erling',
            },
            lastname: {
              type: 'string',
              nullable: true,
              example: 'Braut Haaland',
            },
            age: {
              type: 'integer',
              nullable: true,
              example: 24,
            },
            nationality: {
              type: 'string',
              nullable: true,
              example: 'Norway',
            },
            photo: {
              type: 'string',
              nullable: true,
              example: 'https://media.api-sports.io/football/players/1100.png',
            },
            position: {
              type: 'string',
              nullable: true,
              example: 'Attacker',
            },
            appearences: {
              type: 'integer',
              example: 32,
            },
            goals: {
              type: 'integer',
              example: 27,
            },
            assists: {
              type: 'integer',
              example: 5,
            },
            shots: {
              type: 'integer',
              example: 98,
            },
            shotsOn: {
              type: 'integer',
              example: 59,
            },
            rating: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 7.36,
            },
          },
        },
        Prediction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            matchId: {
              type: 'string',
              format: 'uuid',
            },
            homeWinProbability: {
              type: 'number',
              format: 'float',
              example: 0.45,
            },
            drawProbability: {
              type: 'number',
              format: 'float',
              example: 0.25,
            },
            awayWinProbability: {
              type: 'number',
              format: 'float',
              example: 0.30,
            },
            predictedHomeScore: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 2.1,
            },
            predictedAwayScore: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 1.3,
            },
            confidence: {
              type: 'string',
              enum: ['High', 'Medium', 'Low'],
              example: 'High',
            },
            reasoning: {
              type: 'string',
              example: 'Based on recent form and head-to-head record...',
            },
            aiModel: {
              type: 'string',
              nullable: true,
              example: 'claude-3.5-sonnet',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'User',
        description: 'User profile endpoints',
      },
      {
        name: 'Matches',
        description: 'Match prediction endpoints',
      },
      {
        name: 'Standings',
        description: 'League standings and table endpoints',
      },
      {
        name: 'Players',
        description: 'Player statistics endpoints',
      },
      {
        name: 'Teams',
        description: 'Team information endpoints',
      },
      {
        name: 'Insights',
        description: 'Analytics and insights endpoints',
      },
      {
        name: 'Health',
        description: 'Health check endpoint',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to route files
};

export const swaggerSpec = swaggerJsdoc(options);
