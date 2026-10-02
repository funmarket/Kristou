import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { mountWebRuntimeContext } from "./runtime-context.js";

const root = document.getElementById("root");
if (!root) {
  throw new Error("KRISTOU Web root element is missing");
}

const runtimeContext = mountWebRuntimeContext(window);
window.addEventListener("pagehide", runtimeContext.dispose, { once: true });

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
