export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type TelegramEvent = "viewportChanged" | "safeAreaChanged" | "contentSafeAreaChanged";

export interface TelegramWebAppBridge {
  readonly platform?: string;
  readonly version?: string;
  readonly viewportHeight?: number;
  readonly viewportStableHeight?: number;
  readonly safeAreaInset?: SafeAreaInsets;
  readonly contentSafeAreaInset?: SafeAreaInsets;
  ready(): void;
  expand(): void;
  onEvent(event: TelegramEvent, handler: () => void): void;
  offEvent(event: TelegramEvent, handler: () => void): void;
}

export interface CssVariableStyle {
  setProperty(name: string, value: string): void;
  removeProperty(name: string): void;
}

export interface CssVariableTarget {
  style: CssVariableStyle;
}

export interface TelegramRuntimeSnapshot {
  platform: string | undefined;
  version: string | undefined;
  viewportHeight: number | undefined;
  viewportStableHeight: number | undefined;
}

export interface TelegramRuntime {
  mount(): void;
  dispose(): void;
  snapshot(): TelegramRuntimeSnapshot;
}

const SAFE_AREA_VARIABLES = [
  "--k-safe-top",
  "--k-safe-right",
  "--k-safe-bottom",
  "--k-safe-left",
] as const;

const VIEWPORT_VARIABLES = [
  "--k-telegram-viewport-height",
  "--k-telegram-viewport-stable-height",
] as const;

function px(value: number | undefined): string | undefined {
  return typeof value === "number" && Number.isFinite(value) ? `${value}px` : undefined;
}

function setOrRemove(target: CssVariableTarget, name: string, value: string | undefined): void {
  if (value === undefined) {
    target.style.removeProperty(name);
    return;
  }

  target.style.setProperty(name, value);
}

export function createTelegramRuntime(
  bridge: TelegramWebAppBridge,
  target: CssVariableTarget,
): TelegramRuntime {
  let mounted = false;

  const syncSafeArea = () => {
    const inset = bridge.contentSafeAreaInset ?? bridge.safeAreaInset;

    setOrRemove(target, "--k-safe-top", px(inset?.top));
    setOrRemove(target, "--k-safe-right", px(inset?.right));
    setOrRemove(target, "--k-safe-bottom", px(inset?.bottom));
    setOrRemove(target, "--k-safe-left", px(inset?.left));
  };

  const syncViewport = () => {
    setOrRemove(target, "--k-telegram-viewport-height", px(bridge.viewportHeight));
    setOrRemove(target, "--k-telegram-viewport-stable-height", px(bridge.viewportStableHeight));
  };

  const mount = () => {
    if (mounted) return;
    mounted = true;

    bridge.onEvent("viewportChanged", syncViewport);
    bridge.onEvent("safeAreaChanged", syncSafeArea);
    bridge.onEvent("contentSafeAreaChanged", syncSafeArea);

    syncSafeArea();
    syncViewport();

    bridge.ready();
    bridge.expand();
  };

  const dispose = () => {
    if (!mounted) return;
    mounted = false;

    bridge.offEvent("viewportChanged", syncViewport);
    bridge.offEvent("safeAreaChanged", syncSafeArea);
    bridge.offEvent("contentSafeAreaChanged", syncSafeArea);

    for (const variable of SAFE_AREA_VARIABLES) {
      target.style.removeProperty(variable);
    }
    for (const variable of VIEWPORT_VARIABLES) {
      target.style.removeProperty(variable);
    }
  };

  const snapshot = (): TelegramRuntimeSnapshot => ({
    platform: bridge.platform,
    version: bridge.version,
    viewportHeight: bridge.viewportHeight,
    viewportStableHeight: bridge.viewportStableHeight,
  });

  return {
    mount,
    dispose,
    snapshot,
  };
}
