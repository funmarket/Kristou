import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { ApiConfig } from "@kristou/config";
import type { IdentityRepository } from "../modules/identity/application/auth-service.js";
import { createAuthRouter } from "../http/auth.js";
import { createHealthRouter, type ReadinessProbe } from "../http/health.js";

type OptionalAuthConfig = Partial<
  Pick<
    ApiConfig,
    | "appEnv"
    | "sessionCookieName"
    | "sessionTokenPepper"
    | "sessionTtlSeconds"
    | "telegramBotToken"
    | "telegramInitDataMaxAgeSeconds"
  >
>;

export interface CreateApiAppOptions {
  config: Pick<ApiConfig, "webOrigin"> & OptionalAuthConfig;
  readiness: ReadinessProbe;
  identityRepository?: IdentityRepository;
}

function requireAuthConfig(config: CreateApiAppOptions["config"]) {
  const {
    appEnv,
    sessionCookieName,
    sessionTokenPepper,
    sessionTtlSeconds,
    telegramBotToken,
    telegramInitDataMaxAgeSeconds,
  } = config;
  if (
    appEnv === undefined ||
    sessionCookieName === undefined ||
    sessionTokenPepper === undefined ||
    sessionTtlSeconds === undefined ||
    telegramBotToken === undefined ||
    telegramInitDataMaxAgeSeconds === undefined
  ) {
    throw new Error("KRISTOU auth configuration is incomplete");
  }
  return {
    appEnv,
    sessionCookieName,
    sessionTokenPepper,
    sessionTtlSeconds,
    telegramBotToken,
    telegramInitDataMaxAgeSeconds,
  };
}

export function createApiApp({
  config,
  readiness,
  identityRepository,
}: CreateApiAppOptions): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: config.webOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use("/health", createHealthRouter(readiness));
  if (identityRepository) {
    app.use("/auth", createAuthRouter(identityRepository, requireAuthConfig(config)));
  }

  return app;
}
