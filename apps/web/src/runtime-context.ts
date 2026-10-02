import {
  createTelegramRuntime,
  type CssVariableTarget,
  type TelegramWebAppBridge,
} from "./telegram/runtime.js";

export interface RuntimeContextHost {
  readonly document: {
    readonly documentElement: CssVariableTarget;
  };
  readonly Telegram?: {
    readonly WebApp?: TelegramWebAppBridge;
  };
}

export interface WebRuntimeContext {
  dispose(): void;
}

export function mountWebRuntimeContext(host: RuntimeContextHost): WebRuntimeContext {
  const bridge = host.Telegram?.WebApp;
  if (!bridge) {
    return {
      dispose() {},
    };
  }

  const runtime = createTelegramRuntime(bridge, host.document.documentElement);
  runtime.mount();

  return {
    dispose: () => runtime.dispose(),
  };
}
