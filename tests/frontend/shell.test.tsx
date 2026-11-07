import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { JSDOM } from "jsdom";
import { KristouShell } from "../../packages/frontend/src/shell/KristouShell.tsx";

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: "http://localhost/",
  });

  Object.defineProperty(globalThis, "window", {
    value: dom.window,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: dom.window.document,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "HTMLElement", {
    value: dom.window.HTMLElement,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "Node", {
    value: dom.window.Node,
    configurable: true,
    writable: true,
  });

  return dom;
}

async function renderShell() {
  const testing = await import("@testing-library/react");
  return {
    testing,
    view: testing.render(
      <KristouShell>
        <main>Content</main>
      </KristouShell>,
    ),
  };
}

test("phone-first shell exposes separate notification and account controls", async () => {
  const dom = installDom();
  const { view } = await renderShell();

  try {
    assert.ok(view.getByRole("button", { name: /notifications/i }));
    assert.ok(view.getByRole("button", { name: /account/i }));
  } finally {
    view.unmount();
    dom.window.close();
  }
});

test("theme choice starts Light and changes only after an explicit user action", async () => {
  const dom = installDom();
  Object.defineProperty(dom.window, "matchMedia", {
    value: () => ({ matches: true }),
    configurable: true,
  });
  const { testing, view } = await renderShell();

  try {
    assert.equal(document.documentElement.dataset.theme, "light");

    testing.fireEvent.click(view.getByRole("button", { name: /account/i }));
    testing.fireEvent.click(view.getByRole("button", { name: /pitch black/i }));

    assert.equal(document.documentElement.dataset.theme, "dark");
  } finally {
    view.unmount();
    dom.window.close();
  }
});

test("Arabic switches the shared shell to RTL without changing component tree", async () => {
  const dom = installDom();
  const { testing, view } = await renderShell();

  try {
    testing.fireEvent.click(view.getByRole("button", { name: /account/i }));
    testing.fireEvent.click(view.getByRole("button", { name: /العربية/i }));

    assert.equal(document.documentElement.lang, "ar");
    assert.equal(document.documentElement.dir, "rtl");
    assert.ok(view.getByRole("button", { name: /الإشعارات/i }));
  } finally {
    view.unmount();
    dom.window.close();
  }
});

test("account sheet uses governed scroll utility and remains reachable on phones", async () => {
  const dom = installDom();
  const { testing, view } = await renderShell();

  try {
    testing.fireEvent.click(view.getByRole("button", { name: /account/i }));
    const sheet = view.getByRole("dialog", { name: /account/i });

    assert.match(sheet.className, /k-scroll/);
    assert.match(sheet.className, /k-account-sheet/);
  } finally {
    view.unmount();
    dom.window.close();
  }
});
