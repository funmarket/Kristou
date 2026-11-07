import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createTelegramRuntime,
  type CssVariableTarget,
  type TelegramEvent,
  type TelegramWebAppBridge,
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

  emit(event: TelegramEvent): void {
    for (const handler of this.handlers.get(event) ?? []) handler();
  }

  listenerCount(event: TelegramEvent): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}

function createTarget(): CssVariableTarget & { style: FakeStyle } {
  return { style: new FakeStyle() };
}

test("mount uses Telegram lifecycle and maps content safe areas into the shared KRISTOU shell variables", () => {
  const bridge = new FakeBridge();
  const target = createTarget();
  const runtime = createTelegramRuntime(bridge, target);

  runtime.mount();

  assert.equal(bridge.readyCalls, 1);
  assert.equal(bridge.expandCalls, 1);
  assert.equal(target.style.values.get("--k-safe-top"), "24px");
  assert.equal(target.style.values.get("--k-safe-right"), "8px");
  assert.equal(target.style.values.get("--k-safe-bottom"), "30px");
  assert.equal(target.style.values.get("--k-safe-left"), "8px");
  assert.equal(target.style.values.get("--k-telegram-viewport-height"), "620px");
  assert.equal(target.style.values.get("--k-telegram-viewport-stable-height"), "600px");
});

test("runtime reacts to Telegram viewport and safe-area events and detaches cleanly", () => {
  const bridge = new FakeBridge();
  const target = createTarget();
  const runtime = createTelegramRuntime(bridge, target);

  runtime.mount();
  bridge.contentSafeAreaInset = { top: 30, right: 10, bottom: 36, left: 10 };
  bridge.viewportHeight = 650;
  bridge.viewportStableHeight = 640;
  bridge.emit("contentSafeAreaChanged");
  bridge.emit("viewportChanged");

  assert.equal(target.style.values.get("--k-safe-top"), "30px");
  assert.equal(target.style.values.get("--k-telegram-viewport-height"), "650px");
  assert.equal(target.style.values.get("--k-telegram-viewport-stable-height"), "640px");

  runtime.dispose();

  assert.equal(bridge.listenerCount("viewportChanged"), 0);
  assert.equal(bridge.listenerCount("safeAreaChanged"), 0);
  assert.equal(bridge.listenerCount("contentSafeAreaChanged"), 0);
  assert.equal(target.style.values.has("--k-telegram-viewport-height"), false);
});

test("runtime snapshot contains Telegram presentation/runtime facts only, not school business state", () => {
  const bridge = new FakeBridge();
  const runtime = createTelegramRuntime(bridge, createTarget());

  assert.deepEqual(Object.keys(runtime.snapshot()).sort(), [
    "platform",
    "version",
    "viewportHeight",
    "viewportStableHeight",
  ]);
});
