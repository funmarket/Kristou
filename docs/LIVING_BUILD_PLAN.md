# KRISTOU SCHOOL — LIVING BUILD PLAN

Status: **ACTIVE BUILD DISCIPLINE**

Purpose: keep KRISTOU SCHOOL development moving without drift, duplicate architecture, false completion claims, or agents interfering with one another.

This document is not a feature backlog and not a product-requirements file. It defines the permanent working method for building the project coherently.

Read `AGENTS.md` first. Then use this file during every implementation task.

---

## 1. Permanent authorities

Project truth is separated deliberately:

- `requirements.md` — product behavior and acceptance rules;
- `structure.md` — repository/application architecture and domain ownership;
- `docs/CANONICAL_MODEL.md` — canonical data/write/projection authority;
- `docs/DECISIONS.md` — architectural decisions;
- `progress.md` — current implementation evidence only.

The product owner's newest explicit instruction overrides older project documents when they conflict.

This file controls execution quality, not product scope.

---

## 2. Build loop for every task

### A. Understand

Before editing:

- restate the exact requested outcome internally;
- read the relevant product/architecture authorities;
- confirm repository, branch, and current HEAD;
- identify whether the task is frontend, backend, data, infrastructure, or cross-layer;
- identify overlapping active work/PRs/branches when relevant;
- separate verified facts from assumptions.

### B. Inspect

Trace from authoritative source to every affected consumer.

For a vertical slice, inspect as applicable:

```text
UI/state
-> shared frontend/contracts
-> API route/transport
-> authentication/authorization
-> application/domain policy
-> repository port
-> infrastructure repository
-> schema/migration
-> PostgreSQL/Redis/object storage
-> worker/outbox/realtime
-> deployment/runtime
```

For UI defects, also inspect:

- parent containers;
- shared components;
- design tokens/CSS;
- responsive behavior;
- RTL;
- Light/Pitch Black theme behavior;
- Telegram viewport/safe-area behavior.

Do not edit until the owning source is identified.

### C. Check existing ownership

Search before creating:

- models/tables/enums;
- services/repositories;
- endpoints;
- contracts;
- hooks/providers/stores;
- components;
- media paths;
- workers/jobs;
- scripts;
- migrations/tests;
- environment configuration;
- documents.

If an existing implementation owns the concept, extend/fix it there. Do not create a parallel source.

### D. Define the smallest complete change

A task should solve one requested issue from source through all required consumers.

Do not add:

- unrelated cleanup;
- speculative future schema;
- another agent's work;
- broad refactors merely because code is nearby.

If a cross-domain workflow is needed, compose explicit narrow ports/readers/orchestrators and keep persistence/business authority with owning domains.

### E. Implement with tests

Use test-driven development where practical:

1. identify or add the smallest regression/acceptance test;
2. observe the relevant failure where a new test is appropriate;
3. implement the minimal correct source change;
4. run focused verification;
5. run broader regression checks required by the touched boundary.

Do not weaken tests to make a change pass.

### F. Update living documentation

Before reporting completion, reconcile every affected authority:

- product behavior -> `requirements.md`;
- architecture/domain ownership -> `structure.md`;
- canonical data/write authority -> `docs/CANONICAL_MODEL.md`;
- architecture decision -> `docs/DECISIONS.md` / dedicated ADR;
- execution discipline -> `AGENTS.md` / this file;
- implementation evidence -> `progress.md`.

Do not create a new overlapping file merely because updating the authority is inconvenient.

### G. Verify

Use evidence appropriate to the changed layer.

### H. Report

Report:

- root cause;
- source trace;
- exact changed files;
- docs updated;
- branch/head SHA;
- checks actually run;
- gaps/risks;
- evidence-based score;
- next issue status.

Do not automatically start a new issue unless authorized.

---

## 3. Non-drift rules

Always prohibited unless the product owner explicitly changes the rule:

- guessing missing product behavior;
- silently changing architecture to make implementation easier;
- copying another product's architecture/business rules blindly;
- duplicate models/tables/services/routes/auth state/API clients;
- cross-domain monolithic services/repositories/contracts/stores/controllers;
- catch-all `shared`, `common`, `utils`, `platform`, or `management` modules that hide business ownership;
- circular domain dependencies;
- frontend-only authorization;
- hardcoded production credentials/service secrets;
- direct database edits used instead of governed source/migrations;
- partial features presented as complete;
- fake production data or fake verification;
- arbitrary CSS/z-index/offset patches instead of tracing layout ownership;
- destructive branch operations to resolve concurrency;
- changing unrelated files because they appear old or imperfect.

A user opening one product area should not trigger unrelated domain queries, locks, validation, caches, or rerenders merely because several domains were coupled together.

---

## 3A. One-product topology and deployment gate

Before any task that touches frontend entrypoints, routing, authentication transport, Telegram runtime, API transport wiring, build commands, or deployment entry behavior, verify all of the following from current source/runtime evidence:

1. `apps/web` remains the canonical KRISTOU product frontend owner;
2. Browser and Telegram WebView are intended to enter the same canonical React/TypeScript product;
3. no independent `apps/telegram` product workspace/source owner remains after R4; any future compatibility package must be facade-only;
4. no second Telegram router/provider/shell, duplicate feature UI, duplicate product state, duplicate domain API client, or duplicate asset authority is introduced;
5. Telegram-specific behavior is limited to host/runtime mechanics and authentication transport adaptation;
6. both delivery contexts converge on the same API/application/domain authority and canonical User;
7. replacing platform ownership follows move -> prove -> remove, never copy -> hide -> keep both;
8. the build/deployment path being changed is the one that actually serves the current application;
9. Railway is the current verified candidate hosting authority unless fresh deployment evidence proves otherwise;
10. Cloudflare is future AI/edge scope unless the product owner explicitly changes that decision.

If any item is unknown or contradicted, stop before mutation.

A task may not use "same backend" as proof of one-product architecture while maintaining separate frontend ownership. A failing check from a non-authoritative hosting path must not be treated as proof that the live application build is broken.

---

## 4. Parallel work rules

Multiple agents may work in parallel; interference is not allowed.

Every agent must:

- snapshot HEAD before editing;
- inspect active overlapping work when available;
- keep scope narrow;
- re-check HEAD before consequential writes/commits;
- inspect incoming changes;
- preserve unrelated work;
- stop when overlapping ownership is unclear.

Never:

- force-push over another agent;
- hard-reset a shared branch;
- repeatedly overwrite another writer;
- silently absorb another agent's task.

A non-fast-forward/conflict is a safety signal, not permission to force.

---

## 5. Persistence rules

- PostgreSQL contains durable business truth.
- Redis is transient only for explicitly designed counters/locks/cache/live coordination.
- Object storage owns binary media bytes.
- Schema, migrations, repositories, services, contracts, and tests must agree.
- Cross-domain atomic workflows may share an application transaction boundary without transferring domain ownership.
- Add constraints/indexes from real invariants/query needs.
- Do not add speculative future-domain tables.
- Never treat a Redis value as the only durable record of a safety-critical pickup action.
- Never expose secrets/private child content in logs or audit metadata.

---

## 6. Identity and authorization discipline

- exactly one canonical User;
- Web and Telegram are separate authentication transports resolving to that User;
- no heuristic account merging;
- account-link codes are explicit, expiring, and one-time;
- authorization is server-side;
- role alone is insufficient where child/class/resource scope is required;
- Manager/Associate authority is capability-specific;
- Parent access requires canonical family/child scope;
- Student access requires active class membership;
- Teacher class authority requires canonical class assignment/capability;
- App Admin is global school authority.

Changing identity/auth/authorization requires inspecting every affected transport/consumer.

---

## 7. Pickup-specific execution discipline

Pickup is safety-critical.

Any Pickup change must trace and verify:

```text
identity
-> parent/guardian or pickup-person authority
-> child/class membership
-> dismissal window (Africa/Tunis server time)
-> current state
-> durable mutation
-> outbox/realtime
-> teacher board
-> manager control board
-> notification/sound
-> release authorization
-> audit
```

Mandatory invariant:

> A parent may announce arrival. Only authorized school staff may release a child.

A Pickup task cannot be called complete from source inspection alone when behavior depends on concurrency, Redis, PostgreSQL, or realtime delivery.

---

## 8. Security-by-default workflow

For sensitive changes, assess applicable:

- access control;
- authentication/session handling;
- input/schema validation;
- injection risks;
- upload/media validation;
- CSRF/origin/CORS behavior;
- secret handling;
- dependency vulnerabilities;
- logging/PII leakage;
- object ownership;
- rate limiting/abuse;
- SSRF where external fetches exist;
- software/data integrity;
- auditability.

When security tooling exists, use the repository's governed SAST/SCA/secret/IaC/SBOM commands rather than ad-hoc claims.

Never invent a security finding without concrete source/tool evidence.

---

## 9. Testing expectations

### Unit tests

Use for deterministic validation/policy.

### PostgreSQL integration tests

Use real disposable PostgreSQL when behavior depends on:

- constraints;
- transactions;
- concurrency;
- idempotency;
- role/capability persistence;
- pickup state;
- enrollment transitions;
- outbox claiming.

### Redis integration tests

Use real disposable Redis when behavior depends on:

- Parent Note quota/reset;
- pickup short locks/live coordination;
- rate limiting;
- transient expiration.

### HTTP/API tests

Prove:

- public/private boundaries;
- authentication;
- authorization;
- resource scope;
- stable errors.

### Frontend tests

Prove important route/action states, including where applicable:

- loading/empty/error/success;
- mobile layouts;
- Arabic RTL;
- Light/Pitch Black themes;
- Telegram-specific runtime behavior.

### Worker tests

Prove:

- safe claiming;
- retry/backoff;
- idempotency;
- no duplicate side effects.

Mocks do not prove real PostgreSQL/Redis concurrency semantics.

---

## 10. Verification tiers

Use the strongest tier relevant to the claim.

### Tier A — Static/source

- exact source inspection;
- format;
- lint;
- typecheck;
- architecture rules.

### Tier B — Focused behavior

- unit/regression tests;
- API/component tests.

### Tier C — Real integration

- PostgreSQL/Redis/storage integration;
- concurrency/idempotency;
- migrations.

### Tier D — Runtime

- app startup;
- Web/Telegram behavior;
- worker processing;
- health/log evidence.

### Tier E — Deployed/live

Only when explicitly in scope:

- exact deployed commit/artifact;
- migration state;
- health/smoke behavior;
- required live read-back.

Do not use a lower evidence tier to claim a higher one.

---

## 11. Evidence-based implementation score

Completion reports use a score out of 10 for the exact assigned scope.

| Area                                          | Weight | Evidence expected                                                    |
| --------------------------------------------- | -----: | -------------------------------------------------------------------- |
| Canonical ownership / architecture            |    2.0 | Correct owner, dependency direction, no duplicate authority          |
| Behavioral correctness                        |    2.0 | Focused tests for accepted behavior/edge cases                       |
| Authorization / privacy / security            |    1.5 | Server-side scope and security checks proven                         |
| Persistence / concurrency / async correctness |    1.5 | Relevant real integration/idempotency evidence                       |
| Web/Telegram/UI behavior                      |    1.0 | Connected user flow and responsive/i18n/theme proof where applicable |
| Documentation consistency                     |    1.0 | Governing docs reconciled                                            |
| Runtime/deployment evidence                   |    1.0 | Required only when runtime/deployment is part of the scope           |

Scoring rules:

- score only what was actually verified;
- do not award runtime/deployment points when those layers were not in scope;
- state unverified areas explicitly;
- a high score is not a substitute for a missing acceptance condition.

---

## 12. Definition of complete for an assigned task

A task is complete only for its exact scope when applicable layers are implemented and proven.

Depending on the task, completion may require:

1. accepted product behavior is clear;
2. canonical owner is clear;
3. schema/migration is correct;
4. contracts agree;
5. server-side authorization exists;
6. application/domain behavior exists;
7. repository/infrastructure integration exists;
8. API route exists;
9. frontend state/action is actually wired;
10. error/loading/empty/success states exist;
11. Redis/Worker/media side effects are complete;
12. permanent tests cover critical behavior;
13. static/build checks pass;
14. governing docs match;
15. runtime/deployment evidence is proven when part of the claim.

A task is not complete merely because a model, button, endpoint, page, mock, or plan exists.

---

## 13. HoomaUltimate reference rule

HoomaUltimate may be inspected read-only for:

- clean working discipline;
- domain-ownership patterns;
- living-document organization;
- dependency-boundary examples;
- verification/reporting rigor.

Forbidden:

- copying HOOMA product domains/business rules;
- wiring HOOMA runtime/schema/auth/routes;
- importing HOOMA naming/branding;
- treating HOOMA's current source as KRISTOU implementation truth.

KRISTOU's own approved requirements and current source always remain authoritative.

---

## 14. Foundation status and recovery evidence

The documentation-bootstrap state is historical and must not be treated as current.

### Recovery snapshot — 2026-10-02 before integration reconciliation

At this verified snapshot:

- deployed/source lineage: `deploy-candidate@76ab188b39327955d4b23a823ff1d5b5ddaf47dc`;
- source-identical implementation head: `foundation/build-graph-closure@2e38c4f2b736fbdd04095f4cfa8577f99657eb2b`;
- pre-reconciliation integration head: `phase-0-foundation@0ac85b23c6e0f88bae8293496c890ca681c4915f`;
- Foundation CI run `36922103675` succeeded on exact source head `2e38c4f2b736fbdd04095f4cfa8577f99657eb2b`;
- Railway `web-candidate` and `api-candidate` deployments from the deployed lineage were successful;
- the repository had implemented API/Web/Telegram/Worker workspaces, shared packages, foundation Prisma schema/migration, build graph, tests, and CI.

This snapshot is historical evidence. After reconciliation, do not use the SHAs above as current branch truth; re-read the exact integration HEAD and current Railway deployment evidence.

### Durable current-state rule

Before consequential work:

- verify the exact current `phase-0-foundation` HEAD;
- verify that accepted foundation/build/runtime work is present on that integration head;
- use Railway as the current Web/API deployment authority unless the owner explicitly changes the hosting decision;
- treat deployment branches as deployment evidence, not as a substitute for integration-branch authority.

Known frontend recovery debt remains:

- R5 must close the explicit canonical build-graph packet without reintroducing a Telegram product workspace;
- R6-R8 must still wire and prove Browser/Telegram runtime-context and authentication parity;
- architecture checks now reject any reintroduced `apps/telegram/src` product source owner.

Use `progress.md` for exact implementation/deployment evidence and re-verify mutable branch/runtime facts before each consequential task.
