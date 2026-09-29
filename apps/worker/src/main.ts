import { loadWorkerConfig, type WorkerConfig } from "@kristou/config";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createWorkerHealth, type WorkerHealth } from "./health.js";

export interface StartWorkerOptions {
  installSignalHandlers?: boolean;
  keepAlive?: boolean;
}

export interface WorkerRuntime {
  config: WorkerConfig;
  health: WorkerHealth;
  stop(): Promise<void>;
}

export function startWorker(
  env: Record<string, string | undefined>,
  options: StartWorkerOptions = {},
): WorkerRuntime {
  const config = loadWorkerConfig(env);
  const health = createWorkerHealth();
  const installSignalHandlers = options.installSignalHandlers ?? true;
  const keepAlive = options.keepAlive ?? true;
  const keepAliveHandle = keepAlive ? setInterval(() => undefined, 60_000) : undefined;
  let stopped = false;

  const stop = async () => {
    if (stopped) return;
    stopped = true;
    health.markNotReady();
    if (keepAliveHandle) clearInterval(keepAliveHandle);
    process.off("SIGTERM", onSignal);
    process.off("SIGINT", onSignal);
  };

  const onSignal = () => {
    void stop();
  };

  if (installSignalHandlers) {
    process.once("SIGTERM", onSignal);
    process.once("SIGINT", onSignal);
  }

  health.markReady();

  return {
    config,
    health,
    stop,
  };
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(resolve(entry)).href;
}

if (isDirectExecution()) {
  startWorker(process.env);
}
