import { z } from "zod";

const appEnvironmentSchema = z.enum(["local", "staging", "production"]);
const urlSchema = z.string().url();
const positiveIntegerSchema = z.coerce.number().int().positive();

const serverBaseSchema = z.object({
  APP_ENV: appEnvironmentSchema,
  DATABASE_URL: urlSchema,
  REDIS_URL: urlSchema,
});

const apiEnvironmentSchema = serverBaseSchema.extend({
  WEB_ORIGIN: urlSchema,
  SESSION_COOKIE_NAME: z.string().min(1),
  SESSION_TOKEN_PEPPER: z.string().min(32),
  SESSION_TTL_SECONDS: positiveIntegerSchema,
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: positiveIntegerSchema,
});

const workerEnvironmentSchema = serverBaseSchema;

const webPublicEnvironmentSchema = z.object({
  VITE_APP_ENV: appEnvironmentSchema,
  VITE_API_BASE_URL: urlSchema,
});

export type AppEnvironment = z.infer<typeof appEnvironmentSchema>;

export interface ApiConfig {
  appEnv: AppEnvironment;
  databaseUrl: string;
  redisUrl: string;
  webOrigin: string;
  sessionCookieName: string;
  sessionTokenPepper: string;
  sessionTtlSeconds: number;
  telegramBotToken: string;
  telegramInitDataMaxAgeSeconds: number;
}

export interface WorkerConfig {
  appEnv: AppEnvironment;
  databaseUrl: string;
  redisUrl: string;
}

export interface WebPublicConfig {
  appEnv: AppEnvironment;
  apiBaseUrl: string;
}

type EnvironmentInput = Record<string, string | undefined>;

export function loadApiConfig(env: EnvironmentInput): ApiConfig {
  const parsed = apiEnvironmentSchema.parse(env);
  return {
    appEnv: parsed.APP_ENV,
    databaseUrl: parsed.DATABASE_URL,
    redisUrl: parsed.REDIS_URL,
    webOrigin: parsed.WEB_ORIGIN,
    sessionCookieName: parsed.SESSION_COOKIE_NAME,
    sessionTokenPepper: parsed.SESSION_TOKEN_PEPPER,
    sessionTtlSeconds: parsed.SESSION_TTL_SECONDS,
    telegramBotToken: parsed.TELEGRAM_BOT_TOKEN,
    telegramInitDataMaxAgeSeconds: parsed.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS,
  };
}

export function loadWorkerConfig(env: EnvironmentInput): WorkerConfig {
  const parsed = workerEnvironmentSchema.parse(env);
  return {
    appEnv: parsed.APP_ENV,
    databaseUrl: parsed.DATABASE_URL,
    redisUrl: parsed.REDIS_URL,
  };
}

export function loadWebPublicConfig(env: EnvironmentInput): WebPublicConfig {
  const parsed = webPublicEnvironmentSchema.parse(env);
  return {
    appEnv: parsed.VITE_APP_ENV,
    apiBaseUrl: parsed.VITE_API_BASE_URL,
  };
}
