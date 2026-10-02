# KRISTOU SCHOOL — AGENT RULES

Status: **MANDATORY REPOSITORY INSTRUCTIONS**

These rules apply to every AI agent, developer, automation, and coding session working in `funmarket/Kristou`.

KRISTOU SCHOOL is the product. Do not import HOOMA product names, routes, domains, business rules, schema, auth, runtime, or branding. HoomaUltimate is a read-only process/architecture reference only.

Before changing anything, read this file and `docs/LIVING_BUILD_PLAN.md`. For product and architecture truth, read the relevant parts of `requirements.md`, `structure.md`, `docs/CANONICAL_MODEL.md`, and `docs/DECISIONS.md`.

---

## 1. Source-of-truth order

When sources disagree, use this order:

1. the product owner's latest explicit instruction;
2. locked product behavior in `requirements.md`;
3. architecture in `structure.md`;
4. current architectural decisions in `docs/DECISIONS.md`;
5. current data/authority contracts in `docs/CANONICAL_MODEL.md`;
6. the actual repository/database/runtime as evidence of **current state**, never as permission to override a newer target rule.

`AGENTS.md` and `docs/LIVING_BUILD_PLAN.md` govern **how work is performed**. They do not invent product requirements.

If a contradiction cannot be resolved from these sources, **stop and report it**. Do not guess.

---

## 2. Mandatory pre-build gate

Before the first edit of every task:

1. confirm repository and branch;
2. record current branch HEAD SHA;
3. read the relevant governing sources;
4. inspect current source before proposing a source change;
5. trace the requested behavior through every applicable layer;
6. search for existing owners before creating a model, route, service, repository, contract, component, store, migration, script, or document;
7. identify the authoritative source that should change;
8. check whether HEAD moved while tracing;
9. define the smallest complete task boundary;
10. identify which authoritative docs are affected.

No edit is allowed merely because a symptom is visible in the UI.

---

## 3. Trace from source, not symptoms

For backend/data behavior, inspect the applicable chain:

```text
UI/client
-> contract
-> transport/route
-> authentication/authorization
-> application/domain policy
-> repository port
-> infrastructure repository
-> schema/migration
-> PostgreSQL / Redis / object storage
-> runtime/deployment configuration
```

For UI behavior, inspect:

```text
data/state
-> trigger/lifecycle
-> feature component
-> parent/layout
-> shared component/provider
-> CSS/tokens/responsive rules
-> Web/Telegram runtime differences
```

For authentication, inspect Web and Telegram transports separately while preserving one canonical KRISTOU User.

---

## 4. Root-cause rules

Mandatory:

- fix the authoritative source, not a downstream symptom;
- no patching around broken architecture;
- no duplicate state, duplicate API clients, duplicate role systems, duplicate tables, shadow models, or parallel sources of truth;
- no arbitrary z-index/offset hacks used to hide structural UI defects;
- no production mock data;
- no guessed IDs, users, roles, dates, credentials, URLs, class membership, child links, or pickup state;
- no hardcoded secrets or Telegram bot credentials;
- no frontend-only authorization for protected behavior;
- no direct production-database patch as a substitute for correct source/migration work;
- no fake or partial implementation presented as complete;
- CI verifies source; CI must not silently repair or commit source.

When a shared owner is the source, fix it there instead of overriding every consumer.

---

## 5. Domain, scalability, and dependency discipline

Every durable product concept has exactly one authoritative owner.

Mandatory:

- one owner per concept;
- preserve one-way dependency direction;
- no circular domain imports;
- cross-domain workflows use explicit application ports/orchestrators;
- the owning domain retains business and persistence authority;
- keep HTTP/transport out of domain policy;
- keep ORM/database specifics behind infrastructure/repository boundaries;
- keep authorization server-side and resource-scoped;
- PostgreSQL is durable business truth;
- Redis is transient infrastructure only where explicitly designed;
- object storage owns media bytes;
- Browser and Telegram WebView are delivery/authentication contexts of the same canonical product state.

### One product frontend — hard lock

KRISTOU has one canonical React/TypeScript product frontend.

Target ownership:

- `apps/web` owns the canonical React application entry, route authority, product shell, and runtime composition for normal Browser + Telegram WebView;
- product feature UI/state/API integration belongs in `packages/frontend` under the owning feature/domain boundary;
- `packages/ui` remains domain-neutral presentation/tokens/assets;
- Telegram-specific code is limited to host/runtime mechanics such as validated `initData` transport, lifecycle, viewport/safe-area, BackButton, haptics/native host integration, and compatible entry/deep-link behavior;
- no second Telegram router, provider, shell, feature tree, product state store, domain API client, asset authority, or business behavior is allowed.

Current state after R4: Telegram host/runtime mechanics are owned under `apps/web/src/telegram/runtime.ts`, and no independent `apps/telegram` product workspace/source owner remains. If a future compatibility package is explicitly required, it must be facade-only and must not regain router, shell, feature, state, API, asset, runtime, or business ownership.

### No monolithic authorities

Do **not** create or expand a file, service, repository, contract, API client, store, controller, script, or module that owns unrelated domains.

Forbidden direction includes:

- one service mixing Identity + Classes + Pickup + Registration + Messaging;
- one repository persisting unrelated domain tables;
- one contract file becoming the implementation authority for multiple domains;
- one frontend store loading unrelated product areas together;
- one generic `shared`, `common`, `utils`, `platform`, or `management` module used to hide unclear business ownership.

Genuinely generic primitives may be shared, but shared code must never become a second business owner.

---

## 6. Branching, parallel-agent, and concurrency boundary

KRISTOU uses an integration-branch workflow, but branch names are not authority by themselves. Fresh source/runtime inspection decides which commit is the valid starting state.

Integration branch discipline:

- `main` is not the day-to-day implementation branch.
- `phase-0-foundation` is the long-lived Phase 0 integration branch after accepted recovery/reconciliation work lands.
- Before branching a new implementation slice, verify the exact current `phase-0-foundation` HEAD and confirm it contains the most recently accepted foundation/build/runtime work.
- Railway deployment branches/services are deployment evidence, not a substitute for integration-branch authority.
- If a verified deployed/source lineage is ahead of `phase-0-foundation`, reconcile it through a reviewed PR before new feature work branches from the integration line.
- After reconciliation, branch new work only from the newly verified integration HEAD.
- Slice branches use focused names such as `foundation/<task>`, `feat/<domain-slice>`, or `fix/<issue>`.
- `main` moves only through an explicit owner-approved release/foundation promotion.

Unless the product owner explicitly instructs otherwise, never interfere with another agent's active work.

Do not:

- revert or rewrite another agent's files;
- move a shared branch backward;
- force-push;
- overwrite a non-fast-forward update;
- modify unrelated files while "already in the area";
- adopt another agent's task without authorization;
- branch a new implementation slice from stale `main` or from an integration head known to be stale relative to accepted/deployed source lineage awaiting reconciliation.

If HEAD changes after the initial snapshot:

1. stop the write;
2. inspect the new HEAD and incoming diff;
3. determine whether it overlaps the current task;
4. stop and report if ownership overlaps or is unclear;
5. if clearly unrelated, rebuild on the freshly verified authoritative integration/source HEAD without altering incoming work.

---

## 7. Change discipline and living documentation

Every implementation should be the smallest complete source-level change that solves the assigned issue.

Before adding a new owner, prove an equivalent authoritative implementation does not already exist.

Documentation is part of implementation. Every completed task must audit and update affected authorities:

- product behavior -> `requirements.md`;
- architecture/domain ownership -> `structure.md`;
- canonical data/authority -> `docs/CANONICAL_MODEL.md`;
- architectural decisions -> `docs/DECISIONS.md` and ADRs when useful;
- execution discipline -> `AGENTS.md` / `docs/LIVING_BUILD_PLAN.md`;
- current implementation evidence -> `progress.md`.

Do not create overlapping architecture or status documents.

Open PR work is in-flight, not current foundation truth.

### Deployment authority

Current verified hosting for the KRISTOU candidate is Railway. Railway owns the current Web/API deployment evidence.

Do not diagnose or rewrite the current Web build merely to satisfy a check from a non-authoritative hosting path. First trace the Railway deployment that actually serves the user-visible application.

---

## 8. Product-sensitive invariants

Future implementation must preserve the locked requirements in `requirements.md`. In particular:

- one canonical User across Web and Telegram;
- no heuristic account merging;
- server-side RBAC + resource-scoped authorization;
- parents see only linked children and permitted classes;
- students see only their enrolled class;
- no private student-to-student messaging in initial scope;
- a parent may announce pickup arrival, but only authorized school staff may release a child;
- pickup time policy is server-authoritative in `Africa/Tunis`;
- private student/family data is never exposed through public projections;
- Light is the default appearance; optional Dark is pitch black with light text;
- Arabic/French/English support is foundational, not a retrofit.

These summaries do not replace `requirements.md`.

---

## 9. Verification is part of implementation

Run the strongest relevant verification available for the changed slice.

Depending on scope:

- format/lint/typecheck/build;
- focused unit/regression tests;
- real PostgreSQL integration tests;
- real Redis integration tests;
- migration validation/status/deploy against disposable or intended infrastructure;
- authorization matrices;
- Web/Telegram behavior;
- worker/outbox idempotency;
- responsive/RTL/theme UI verification;
- runtime/deployment health when deployment is explicitly in scope;
- documentation/source consistency.

Never say "fixed", "working", "deployed", "complete", or "DONE" beyond what the evidence proves.

If a check cannot be run, state exactly what remains unverified.

---

## 10. Mandatory completion report

Every finished task report must include:

- **Issue / root cause**
- **Source trace**
- **Changed files**
- **Documentation updated**
- **Branch / exact HEAD SHA**
- **Proof** — checks actually run and exact results
- **Not verified / remaining risk**
- **Implementation score: X/10** — evidence-based using `docs/LIVING_BUILD_PLAN.md`
- **Next issue** — explicitly state whether it was started

No vague "everything looks good" reports.

---

## 11. Stop conditions

Stop and report instead of improvising when:

- requirements conflict;
- the authoritative source cannot be identified;
- another agent is changing overlapping work;
- a destructive migration/data operation is required but not authorized;
- required infrastructure/credentials are unavailable;
- runtime evidence contradicts the intended architecture;
- the only apparent solution is a workaround instead of a source fix;
- implementation would require inventing missing product behavior;
- a proposed solution creates a duplicate source of truth or cross-domain monolith.

Stopping with evidence is correct engineering. Guessing is not.
