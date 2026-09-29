# KRISTOU SCHOOL — PROGRESS

Status: **CURRENT IMPLEMENTATION EVIDENCE ONLY**

This file records verified implementation state. It must not become a second requirements, architecture, or decision document.

## Current verified state

Documentation foundation bootstrap is complete and Phase 0 implementation has started on the long-lived `phase-0-foundation` integration branch. Focused slices branch from that integration branch; `main` remains outside day-to-day implementation.

Verified repository governance/architecture documents now exist:

- `README.md`
- `AGENTS.md`
- `structure.md`
- `requirements.md`
- `docs/DECISIONS.md`
- `docs/CANONICAL_MODEL.md`
- `docs/LIVING_BUILD_PLAN.md`
- `.env.example`

At this point there is **no verified application implementation yet** for:

- monorepo/workspace manifests;
- `apps/api`;
- `apps/web`;
- `apps/telegram`;
- `apps/worker`;
- shared packages;
- database schema/migrations;
- Redis runtime;
- object storage runtime;
- authentication;
- authorization;
- registration;
- class community;
- Parent Notes;
- Messages;
- Pickup;
- Food Menu;
- notifications;
- AI;
- deployment.

Do not mark planned architecture as implemented until source/runtime evidence exists.

## Evidence discipline

For future entries, record only facts verified against the current source/runtime, such as:

- exact branch/head;
- PR/commit;
- files changed;
- tests/builds;
- migration checks;
- deployed/runtime proof where applicable;
- remaining unverified items.

Product behavior belongs in `requirements.md`.  
Architecture belongs in `structure.md`.  
Canonical data authority belongs in `docs/CANONICAL_MODEL.md`.  
Architectural decisions belong in `docs/DECISIONS.md`.


## Phase 0 implementation

### Task 1 — Workspace/toolchain

- Integration branch baseline: `phase-0-foundation@cb58b56005193588a3039b08da858e73014785b2`
- Task branch: `foundation/task-1-workspace`
- Task branch pre-build HEAD: `12c85963b777e83cf32019a703ba085b23b386e7`
- HoomaUltimate was re-inspected read-only to confirm the long-lived integration branch + focused slice PR workflow.
- Root npm workspace/toolchain, architecture guard, test runner, deploy preflight, formatter/linter configuration, and lockfile are introduced by this task.
- Local proof run in the ChatGPT container:
  - `node --check scripts/architecture-check.mjs` — PASS
  - `node --check scripts/deploy-preflight.mjs` — PASS
  - clean architecture check — PASS
  - deliberate forbidden `packages/domain -> @kristou/database` import — correctly FAILS
  - clean deploy preflight — PASS
  - deliberate committed-root `.env` condition — correctly FAILS
- Additional root-script verification in the ChatGPT container:
  - `npm run typecheck` — PASS with no workspaces yet
  - `npm test` — PASS, correctly reports no unit tests yet
  - `npm run build` — PASS with no app/package workspaces yet
- Package installation is **not yet verified** because outbound npm registry access is unavailable in the ChatGPT container. Do not claim `npm ci`, ESLint, Prettier, or dependency-backed workspace builds as green until CI or another connected runtime proves them.


### Task 2 — Shared package skeletons + config authority

- Integration baseline: `phase-0-foundation@a9358e0f45538627dcca60d5c00664103c97137c`
- Task branch: `foundation/task-2-config`
- RED proof: `tests/config/env.test.ts` failed before implementation with `ERR_MODULE_NOT_FOUND` for the missing config package.
- Implemented focused `@kristou/config`, `@kristou/contracts`, `@kristou/domain`, and `@kristou/testing` package boundaries.
- Configuration uses explicit `APP_ENV` / `VITE_APP_ENV`; security behavior is not inferred from `NODE_ENV`.
- `loadApiConfig(env)`, `loadWorkerConfig(env)`, and `loadWebPublicConfig(env)` are implemented with Zod schemas.
- Public Web config only returns `appEnv` and `apiBaseUrl`; private database/session/Telegram/storage values are not projected.
- `.env.example` was reconciled with the implemented configuration contract.
- Source-level verification in the ChatGPT container:
  - TypeScript syntax stripping/check for `packages/config/src/env.ts` — PASS
  - TypeScript syntax stripping/check for `packages/config/src/index.ts` — PASS
  - architecture dependency guard over the new package boundaries — PASS
  - package-lock workspace link for `@kristou/config` — PASS
  - lockfile Zod version matches manifest (`4.4.3`) — PASS
- Dependency-backed config tests / full package typecheck are **not yet runtime-proven** because outbound npm-registry access is unavailable in the ChatGPT container. This remains an explicit verification gap until CI is available.
