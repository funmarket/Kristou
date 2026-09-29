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


### Task 3 — API + Worker runtime foundations

- Integration baseline: `phase-0-foundation@0c5349db5a6040843be27ab11d75259c611e65aa`
- Task branch: `foundation/task-3-runtimes`
- RED proof: API/Worker startup tests failed before implementation with `ERR_MODULE_NOT_FOUND` for the missing runtime source.
- Implemented:
  - Express 5 API composition root;
  - `GET /health/live` -> 200 `{ status: "ok" }`;
  - `GET /health/ready` -> 503 until the readiness probe reports initialized dependencies;
  - Helmet + strict configured CORS baseline;
  - fail-closed config loading before API listen;
  - Worker readiness primitive;
  - Worker startup/stop lifecycle and signal handling;
  - no business polling/domain logic.
- Source-level verification in the ChatGPT container:
  - TypeScript syntax stripping/check for all new API/Worker source files — PASS
  - architecture dependency guard over API/Worker -> config dependency direction — PASS
  - lockfile workspace registration for `@kristou/api` and `@kristou/worker` — PASS
- Dependency-backed HTTP tests, package typecheck, and build are **not yet runtime-proven** because outbound npm-registry access is unavailable in the ChatGPT container. These remain explicit CI verification gaps until Task 8.


### Task 4 — Phone-first UI/design-system + Web shell

- Integration baseline: `phase-0-foundation@d8a1f40d94e46fdd0429226abac00274130531ce`
- Task branch: `foundation/task-4-web-ui`
- Added `@kristou/ui`, `@kristou/frontend`, and `@kristou/web` workspace boundaries.
- Added semantic Light/Pitch Black tokens:
  - Light default: `#FFFFFF`
  - Pitch Black background: `#000000`
  - Pitch Black primary text: `#FFFFFF`
- Added phone-first governed scrolling:
  - native touch scrolling preserved;
  - scrollbar chrome hidden on coarse/touch pointers;
  - transparent track + low-contrast hover thumb on pointer/desktop surfaces.
- Added shared English/French/Arabic shell translations with Arabic RTL and FR/EN LTR.
- Added phone-first KRISTOU shell with separate bell/account controls, bottom-sheet account/notification panels on phones, desktop expansion, and safe-area handling.
- No fake authenticated product state, class data, child data, notifications, or capability grants were introduced.
- Official owner-supplied `ggd.png` is committed unchanged at `packages/ui/src/assets/kristou-logo.png`.
  - source SHA-256: `316d53ab3da5863af2a883cc8553ea418e517acd104a4c1020b5166e73349efc`
  - source Git blob SHA: `a39a8686e8fb821eda164e54a33ef694a9443d8c`
  - repository blob SHA: `a39a8686e8fb821eda164e54a33ef694a9443d8c`
- Web dev/build uses `scripts/sync-web-brand-assets.mjs` to copy the canonical UI-owned logo into Vite public output without committing a second authoritative logo.
- Fresh source-contract audit on the final task head: **27/27 checks passed**, covering branch isolation, theme defaults, exact black/white dark tokens, RTL/LTR mapping, transparent scrollbars, safe areas, separate bell/account controls, phone bottom-sheet behavior, workspace direction, Web asset sync, and logo blob identity.
- Focused PR review caught a real path bug in the first asset-sync implementation: npm workspace scripts may execute with `apps/web` as the working directory, so resolving the repo from `process.cwd()` was unsafe. The sync script now derives the repository root from `import.meta.url`.
- The corrected asset-sync script was executed from a nested `apps/web` working directory in the container and produced a byte-identical public copy:
  - canonical SHA-256: `316d53ab3da5863af2a883cc8553ea418e517acd104a4c1020b5166e73349efc`
  - generated-copy SHA-256: `316d53ab3da5863af2a883cc8553ea418e517acd104a4c1020b5166e73349efc`
  - `cmp` result: exact match
- Runtime gaps not yet closed:
  - dependency-backed React/jsdom tests, TypeScript workspace typecheck, and Vite build cannot run in the current ChatGPT container because outbound npm registry resolution is unavailable;
  - rendered browser QA at 320/360/393/430/desktop could not be completed because the available headless Chromium process hangs on the container DBus/headless environment.
- Do not treat those runtime/render checks as verified until Task 8 CI or another supported browser runtime proves them.
