import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mountWebRuntimeContext,
  type RuntimeContextHost,
} from "../../apps/web/src/runtime-context.ts";
import type {
  CssVariableTarget,
  TelegramEvent,
  TelegramWebAppBridge,
} from "../../apps/web/src/telegram/runtime.ts";

class FakeStyle {
  readonly values = new Map<string, string>();

  setProperty(name: string, value: string): void {
    this.values.set(name, value);
  }

  removeProperty(name: string): void {
    this.values.delete(name);
  }
}

class FakeBridge implements TelegramWebAppBridge {
  readyCalls = 0;
  expandCalls = 0;
  viewportHeight = 620;
  viewportStableHeight = 600;
  platform = "android";
  version = "10.1";
  safeAreaInset = { top: 12, right: 4, bottom: 18, left: 4 };
  contentSafeAreaInset = { top: 24, right: 8, bottom: 30, left: 8 };

  private handlers = new Map<TelegramEvent, Set<() => void>>();

  ready(): void {
    this.readyCalls += 1;
  }

  expand(): void {
    this.expandCalls += 1;
  }

  onEvent(event: TelegramEvent, handler: () => void): void {
    const set = this.handlers.get(event) ?? new Set<() => void>();
    set.add(handler);
    this.handlers.set(event, set);
  }

  offEvent(event: TelegramEvent, handler: () => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  listenerCount(event: TelegramEvent): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}

function createTarget(): CssVariableTarget & { style: FakeStyle } {
  return { style: new FakeStyle() };
}

test("normal Browser context leaves Telegram runtime inactive", () => {
  const target = createTarget();
  const host: RuntimeContextHost = {
    document: { documentElement: target },
  };

  const context = mountWebRuntimeContext(host);

  assert.equal(target.style.values.size, 0);
  context.dispose();
  assert.equal(target.style.values.size, 0);
});

test("Telegram WebView context mounts and disposes the existing Web-owned runtime", () => {
  const bridge = new FakeBridge();
  const target = createTarget();
  const host: RuntimeContextHost = {
    document: { documentElement: target },
    Telegram: { WebApp: bridge },
  };

  const context = mountWebRuntimeContext(host);

  assert.equal(bridge.readyCalls, 1);
  assert.equal(bridge.expandCalls, 1);
  assert.equal(bridge.listenerCount("viewportChanged"), 1);
  assert.equal(bridge.listenerCount("safeAreaChanged"), 1);
  assert.equal(bridge.listenerCount("contentSafeAreaChanged"), 1);
  assert.equal(target.style.values.get("--k-safe-top"), "24px");
  assert.equal(target.style.values.get("--k-telegram-viewport-height"), "620px");

  context.dispose();

  assert.equal(bridge.listenerCount("viewportChanged"), 0);
  assert.equal(bridge.listenerCount("safeAreaChanged"), 0);
  assert.equal(bridge.listenerCount("contentSafeAreaChanged"), 0);
  assert.equal(target.style.values.size, 0);
});
