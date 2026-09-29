import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { JSDOM } from "jsdom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { KristouShell } from "../../packages/frontend/src/shell/KristouShell.tsx";

function installDom() {
  const dom = new JSDOM("<!doctype html><html><body><div id=\"root\"></div></body></html>", {
    url: "http://localhost/",
  });

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    navigator: dom.window.navigator,
  });

  return dom;
}

afterEach(() => {
  cleanup();
});

test("phone-first shell exposes separate notification and account controls", () => {
  const dom = installDom();
  render(<KristouShell><main>Content</main></KristouShell>);

  assert.ok(screen.getByRole("button", { name: /notifications/i }));
  assert.ok(screen.getByRole("button", { name: /account/i }));

  dom.window.close();
});

test("theme choice starts Light and changes only after an explicit user action", () => {
  const dom = installDom();
  Object.defineProperty(dom.window, "matchMedia", {
    value: () => ({ matches: true }),
    configurable: true,
  });

  render(<KristouShell><main>Content</main></KristouShell>);
  assert.equal(document.documentElement.dataset.theme, "light");

  fireEvent.click(screen.getByRole("button", { name: /account/i }));
  fireEvent.click(screen.getByRole("button", { name: /pitch black/i }));

  assert.equal(document.documentElement.dataset.theme, "dark");
  dom.window.close();
});

test("Arabic switches the shared shell to RTL without changing component tree", () => {
  const dom = installDom();
  render(<KristouShell><main>Content</main></KristouShell>);

  fireEvent.click(screen.getByRole("button", { name: /account/i }));
  fireEvent.click(screen.getByRole("button", { name: /العربية/i }));

  assert.equal(document.documentElement.lang, "ar");
  assert.equal(document.documentElement.dir, "rtl");
  assert.ok(screen.getByRole("button", { name: /الإشعارات/i }));

  dom.window.close();
});

test("account sheet uses governed scroll utility and remains reachable on phones", () => {
  const dom = installDom();
  render(<KristouShell><main>Content</main></KristouShell>);

  fireEvent.click(screen.getByRole("button", { name: /account/i }));
  const sheet = screen.getByRole("dialog", { name: /account/i });

  assert.match(sheet.className, /k-scroll/);
  assert.match(sheet.className, /k-account-sheet/);

  dom.window.close();
});
