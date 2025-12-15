import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('0.0.0.0'),

  // App Configuration
  APP_URL: z.string().url().default('http://localhost:3000'),
  APP_SCHEME: z.string().default('predictionai'), // Deep link scheme for mobile app
  APP_NAME: z.string().default('AI Football Predictions'),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),

  CORS_ORIGINS: z.string().transform((str) => str.split(',')),

  EMAIL_FROM: z.string().email(),
  EMAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional(),

  // RapidAPI Football Data (API-Football v3)
  RAPIDAPI_KEY: z.string().optional(),
  FOOTBALL_DATA_SOURCE: z.enum(['dummy', 'api']).default('dummy'),

  // OpenAI for AI Analysis
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  ENABLE_AI_ANALYSIS: z.string().default('true').transform((v) => v === 'true'),
  PREDICTION_CACHE_TTL: z.string().default('1800').transform(Number), // 30 minutes

  AUTH_RATE_LIMIT: z.string().default('50').transform(Number),
  GENERAL_RATE_LIMIT: z.string().default('300').transform(Number),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
