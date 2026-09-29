import React from "react";
import { KristouShell } from "@kristou/frontend";
import "@kristou/frontend/shell/KristouShell.css";

export function App() {
  return (
    <KristouShell>
      <section
        style={{
          minHeight: "55dvh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <p style={{ margin: 0, color: "var(--k-text-muted)" }}>KRISTOU SCHOOL</p>
          <h1 style={{ margin: "8px 0 0", fontSize: "clamp(28px, 9vw, 48px)" }}>
            Foundation shell
          </h1>
          <p style={{ maxWidth: 520, margin: "12px auto 0", color: "var(--k-text-muted)" }}>
            Protected school spaces will be added as their server-authorized domains are implemented.
          </p>
        </div>
      </section>
    </KristouShell>
  );
}
