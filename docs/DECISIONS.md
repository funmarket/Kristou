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

## ADR-003 — Planned runtime split is API, Web, Telegram, Worker

**Decision:** KRISTOU plans four application runtimes: API, Web, Telegram Mini App facade, and Worker.

**Reason:** Separate browser/Telegram runtime concerns from business/API authority and asynchronous processing.

**Current-state note:** This is architecture direction only. These runtimes are not yet implemented.

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
