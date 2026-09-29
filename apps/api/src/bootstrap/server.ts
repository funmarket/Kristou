import type { Server } from "node:http";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { loadApiConfig } from "@kristou/config";
import { createApiApp } from "./app.js";
import type { ReadinessProbe } from "../http/health.js";

export interface StartApiServerOptions {
  host?: string;
  port?: number;
  readiness?: ReadinessProbe;
}

const defaultReadiness: ReadinessProbe = {
  isReady: () => false,
};

function parsePort(value: string | undefined): number {
  if (value === undefined || value === "") return 3000;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("PORT must be an integer between 0 and 65535");
  }
  return port;
}

export function startApiServer(
  env: Record<string, string | undefined>,
  options: StartApiServerOptions = {},
): Server {
  const config = loadApiConfig(env);
  const app = createApiApp({
    config,
    readiness: options.readiness ?? defaultReadiness,
  });

  const host = options.host ?? "0.0.0.0";
  const port = options.port ?? parsePort(env.PORT);
  return app.listen(port, host);
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(resolve(entry)).href;
}

if (isDirectExecution()) {
  const server = startApiServer(process.env);

  const shutdown = () => {
    server.close((error) => {
      if (error) {
        console.error(error);
        process.exitCode = 1;
      }
    });
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}
