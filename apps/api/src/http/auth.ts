import { Router, type Request, type Response } from "express";
import type { ApiConfig } from "@kristou/config";
import {
  AuthError,
  IdentityAuthService,
  type IdentityRepository,
} from "../modules/identity/application/auth-service.js";

type AuthApiConfig = Pick<
  ApiConfig,
  | "appEnv"
  | "sessionCookieName"
  | "sessionTokenPepper"
  | "sessionTtlSeconds"
  | "telegramBotToken"
  | "telegramInitDataMaxAgeSeconds"
>;

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  for (const item of header.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) {
      return decodeURIComponent(item.slice(separator + 1).trim());
    }
  }
  return undefined;
}

function authStatus(error: AuthError): number {
  return error.code === "AUTH_CONFLICT" ? 409 : 401;
}

function sendAuthError(response: Response, error: unknown): void {
  if (error instanceof AuthError) {
    response.status(authStatus(error)).json({ error: error.code });
    return;
  }
  response.status(401).json({ error: "AUTH_INVALID" });
}

export function createAuthRouter(
  repository: IdentityRepository,
  config: AuthApiConfig,
): Router {
  const router = Router();
  const service = new IdentityAuthService(repository, {
    sessionTokenPepper: config.sessionTokenPepper,
    sessionTtlSeconds: config.sessionTtlSeconds,
    telegramBotToken: config.telegramBotToken,
    telegramInitDataMaxAgeSeconds: config.telegramInitDataMaxAgeSeconds,
  });
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: config.appEnv !== "local",
    path: "/",
  };

  router.post("/login", async (request, response) => {
    try {
      const body = request.body as unknown;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        throw new AuthError("AUTH_INVALID");
      }
      const record = body as Record<string, unknown>;
      if (
        typeof record.loginUsername !== "string" ||
        typeof record.password !== "string"
      ) {
        throw new AuthError("AUTH_INVALID");
      }

      const result = await service.loginWeb(record.loginUsername, record.password);
      response.cookie(config.sessionCookieName, result.sessionToken, {
        ...cookieOptions,
        maxAge: config.sessionTtlSeconds * 1000,
      });
      response.status(200).json({ principal: result.principal });
    } catch (error) {
      sendAuthError(response, error);
    }
  });

  router.post("/logout", async (request, response) => {
    try {
      const token = readCookie(request, config.sessionCookieName);
      if (token) await service.logoutWeb(token);
      response.cookie(config.sessionCookieName, "", {
        ...cookieOptions,
        maxAge: 0,
      });
      response.status(204).end();
    } catch (error) {
      sendAuthError(response, error);
    }
  });

  router.get("/me", async (request, response) => {
    try {
      const principal = await service.resolvePrincipal({
        sessionToken: readCookie(request, config.sessionCookieName),
        telegramInitData: request.get("x-telegram-init-data"),
      });
      response.status(200).json({ principal });
    } catch (error) {
      sendAuthError(response, error);
    }
  });

  return router;
}
