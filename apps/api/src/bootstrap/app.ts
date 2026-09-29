import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { ApiConfig } from "@kristou/config";
import { createHealthRouter, type ReadinessProbe } from "../http/health.js";

export interface CreateApiAppOptions {
  config: Pick<ApiConfig, "webOrigin">;
  readiness: ReadinessProbe;
}

export function createApiApp({ config, readiness }: CreateApiAppOptions): Express {
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

  return app;
}
