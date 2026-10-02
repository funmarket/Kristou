# KRISTOU SCHOOL — ARCHITECTURAL DECISIONS

Status: **ACTIVE ADR INDEX**

This file records explicit architectural decisions only. Product behavior belongs in `requirements.md`; implementation evidence belongs in `progress.md`.

Dedicated ADR files may be added under `docs/adr/` when a decision needs deeper trade-off/history detail. Do not duplicate the same decision in multiple authorities.

---

## ADR-001 — KRISTOU is a clean standalone repository

**Decision:** `funmarket/Kristou` is the KRISTOU SCHOOL implementation repository. HoomaUltimate is read-only process/architecture reference material only.

**Reason:** KRISTOU must own its own product model, schema, migrations, auth, runtime, deployment, and evidence without inheriting another product's semantics.

---

## ADR-002 — One canonical User, independent Web and Telegram authentication transports

**Decision:** Web credentials/sessions and Telegram identities resolve to one canonical KRISTOU User. Account linking is explicit; heuristic identity merging is forbidden.

**Reason:** Prevent duplicate school profiles and identity collision/account-takeover risk.

---

## ADR-012 — Web login uses username + password; email is optional

**Decision:** KRISTOU Web authentication uses one unique normalized login username plus password. Email is optional, is not a Web login identifier, and is not password-recovery authority unless a separately implemented verified-email flow establishes ownership. A Telegram-originated canonical User may later attach one WebCredential to the same `User.id`; doing so must not create a second User.

**Reason:** Keep Web login simple and deterministic while preserving one canonical identity across Web and Telegram. Optional contact data must not silently become authentication or recovery authority.

---

## ADR-013 — One canonical product frontend; Telegram is a delivery/runtime context

**Status:** Accepted.

**Context:** KRISTOU requires Browser and Telegram access without allowing two product implementations, two route trees, two state/API layers, or two business authorities.

**Decision:** KRISTOU has one canonical React/TypeScript product frontend. `apps/web` owns the canonical application entry, route authority, shell, and runtime composition for both normal Browser and Telegram WebView delivery contexts. Shared product feature UI/state/API integration belongs in `packages/frontend`; domain-neutral presentation belongs in `packages/ui`. `apps/telegram`, if retained for hosting or compatibility, is facade-only and must not own a `src/` product tree, router, provider, shell, feature pages, product state, domain API clients, assets, or business behavior. Telegram-specific code is limited to host/runtime mechanics such as validated `initData` transport, lifecycle, viewport/safe-area, BackButton, haptics/native integrations, and compatible entry/deep-link behavior.

Both delivery contexts call the same canonical API/application/domain authorities and resolve to the same canonical `User`. Authentication transports may differ; product ownership does not.

**Reason:** Preserve one product authority, prevent divergent Web/Telegram behavior, simplify testing and deployment, and keep platform differences at the transport/runtime edge rather than in product features.

**Consequences:** Existing Telegram host mechanics must be migrated into the canonical Web runtime adapter boundary and the superseded Telegram source owner removed only after replacement behavior is proven. Architecture checks must reject reintroduction of a second Telegram product source tree.

**Supersedes / Superseded by:** Supersedes ADR-003.

---

## ADR-003 — Planned runtime split is API, Web, Telegram, Worker

**Status:** Superseded by ADR-013.

**Historical decision:** KRISTOU originally planned four application runtimes: API, Web, Telegram Mini App facade, and Worker.

**Why superseded:** The wording allowed Telegram to become an independently compiled source-owning application workspace, which conflicts with the locked one-product architecture. Runtime/host concerns may differ, but Browser and Telegram WebView must not own separate product frontends.

**Superseded by:** ADR-013.

---

## ADR-004 — PostgreSQL durable, Redis transient, object storage for bytes

**Decision:** Durable business truth lives in PostgreSQL. Redis/Valkey is disposable transient infrastructure only for explicitly designed counters, locks, caches, and live coordination. Binary media lives in governed object storage.

**Reason:** Clear authority, recovery, retention, and outage semantics.

---

## ADR-005 — Server-side RBAC + resource-scoped authorization

**Decision:** Protected behavior requires server-side role/capability checks plus the relevant child/class/resource scope. Frontend visibility never grants permission.

**Reason:** KRISTOU handles minors, family information, private class content, and pickup; role labels alone are insufficient authority.

---

## ADR-006 — Pickup arrival and child release are separate authorities

**Decision:** A parent/authorized pickup actor may announce arrival, but only authorized school staff may transition a child to `RELEASED`.

**Reason:** Pickup is safety-critical. Arrival notification is not proof of physical handoff.

---

## ADR-007 — Transactional outbox for important asynchronous side effects

**Decision:** Where a durable business mutation requires asynchronous notification/realtime work, the durable mutation and OutboxEvent should commit atomically; Worker handles retry-safe fanout.

**Reason:** Prevent lost notifications/realtime projections without moving business authority into clients or the Worker.

---

## ADR-008 — Class Questions are class-wide; no private student DMs initially

**Decision:** Students may ask/reply inside their own class-wide Class Questions space. Initial scope has no private student-to-student messaging.

**Reason:** Preserve the homework/class-help use case while reducing safeguarding and privacy risk.

---

## ADR-009 — Shared media infrastructure, domain-owned semantic attachment

**Decision:** Generic media descriptor/byte lifecycle is shared; each product domain retains authority over whether media may be attached, who can view it, and what it means.

**Reason:** Avoid fragmented upload systems without turning Media into a cross-domain business owner.

---

## ADR-010 — Light-default, trilingual UI foundation

**Decision:** Light is the initial/default theme; optional dark mode uses a pitch-black foundation with light/white text. Arabic, French, and English are foundational, with Arabic RTL supported by the same component system.

**Reason:** Theme/i18n/RTL are structural presentation concerns and should not be retrofitted after feature implementation.

---


## ADR-011 — Security-sensitive environment selection is explicit

**Decision:** Server configuration uses `APP_ENV` and public Web configuration uses `VITE_APP_ENV` with the allowed values `local | staging | production`. KRISTOU does not infer security-sensitive runtime behavior from `NODE_ENV` alone.

**Reason:** Build tools and hosting platforms may set `NODE_ENV` for optimization independently of KRISTOU's deployment environment. An explicit application environment keeps fail-closed configuration behavior deliberate and testable.

---

# ADR template

Use this structure for a new decision:

```markdown
## ADR-NNN — Short decision title

**Status:** Proposed | Accepted | Superseded

**Context:** What architectural problem requires a decision?

**Decision:** The exact chosen rule.

**Reason:** Why this choice is appropriate.

**Consequences:** Important costs, constraints, or follow-up requirements.

**Supersedes / Superseded by:** ADR reference when applicable.
```

Only create an ADR when there is a real architectural decision. Do not create placeholder ADRs for speculative future features.
