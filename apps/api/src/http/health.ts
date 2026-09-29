import { Router } from "express";

export interface ReadinessProbe {
  isReady(): boolean;
}

export function createHealthRouter(readiness: ReadinessProbe): Router {
  const router = Router();

  router.get("/live", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  router.get("/ready", (_request, response) => {
    if (!readiness.isReady()) {
      response.status(503).json({ status: "not_ready" });
      return;
    }

    response.status(200).json({ status: "ready" });
  });

  return router;
}
