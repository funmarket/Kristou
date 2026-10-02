# KRISTOU SCHOOL — PROGRESS

Status: **CURRENT IMPLEMENTATION EVIDENCE ONLY**

This file records verified implementation state. It must not become a second requirements, architecture, or decision document.

## Verified recovery snapshot — 2026-10-02 before PR #11 merge

This section is a dated pre-merge snapshot. It remains historical evidence after reconciliation and must not be treated as a substitute for re-reading the current integration branch and Railway deployment state.

At this snapshot:

- deployed Railway source: `deploy-candidate@76ab188b39327955d4b23a823ff1d5b5ddaf47dc`;
- source-identical implementation head: `foundation/build-graph-closure@2e38c4f2b736fbdd04095f4cfa8577f99657eb2b`;
- pre-reconciliation integration head: `phase-0-foundation@0ac85b23c6e0f88bae8293496c890ca681c4915f`;
- the final two `deploy-candidate` commits contained no file diff relative to `foundation/build-graph-closure@2e38c4f...`;
- no open pull requests existed when the recovery branch was originally created.

Verified source/CI evidence on that deployed lineage included:

- root npm workspace/toolchain, dependency-aware workspace graph, architecture/preflight scripts, and `npm run build:web`;
- API liveness/readiness foundation;
- Worker lifecycle/readiness foundation;
- phone-first shared UI/frontend foundation;
- Web shell with Light default, Pitch Black dark mode, AR/FR/EN direction support, and governed mobile scroll behavior;
- current Telegram runtime mechanics under `apps/telegram/src` with focused tests;
- foundation PostgreSQL/Prisma schema/migration limited to User, WebCredential, WebSession, TelegramIdentity, AccountLinkChallenge, AuditLog, and OutboxEvent;
- Foundation CI workflow at `.github/workflows/foundation-ci.yml`;
- Foundation CI run `36922103675` — **SUCCESS** on exact source head `2e38c4f2b736fbdd04095f4cfa8577f99657eb2b`;
- the dependency-safe Web build contract: config -> ui -> frontend -> web.

Verified Railway candidate deployment evidence at that snapshot:

- project: KRISTOU, environment: production;
- `web-candidate` latest deployment `c20235a8-a4b6-42f5-94f9-639576f3b318` — **SUCCESS**;
- `web-candidate` public domain: `web-candidate-production-f61b.up.railway.app`;
- Web source branch: `deploy-candidate`;
- Web build command: `npm run build:web`;
- live HTTP evidence showed `/`, generated JS/CSS, and the governed logo served successfully;
- `api-candidate` latest deployment `03067730-69a4-47bf-8a22-5726e7331a57` — **SUCCESS**;
- API Railway healthcheck `/health/live` succeeded;
- PostgreSQL and Redis Railway services were running successfully.

Known unresolved recovery debt / unverified areas:

- `apps/telegram/src` still owns Telegram runtime mechanics; target architecture moves those host mechanics under the canonical Web frontend and removes the superseded source owner only after parity proof;
- the current architecture guard does not yet forbid reintroduction of a second Telegram product source tree;
- PostgreSQL integration proof is still incomplete: the exact successful Foundation CI workflow generated/validated Prisma but did not run `npm run test:integration` against disposable PostgreSQL, so Task 6B must not be called runtime-GREEN;
- authentication/session flows, Telegram `initData` validation/account linking, authorization, registration, product domains, notification delivery, object-storage runtime, and AI remain unimplemented or unverified as product capabilities.

Do not convert source presence, a successful build, or a successful deployment into proof of unrelated behavior.

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

### Task 5 — Telegram runtime facade

- Integration baseline: `phase-0-foundation@4f6e919b2fb2ca32b66d17a498c0dec69d241050`
- Task branch: `foundation/task-5-telegram-runtime`
- RED proof: focused Telegram runtime test failed before implementation with `ERR_MODULE_NOT_FOUND` for `apps/telegram/src/runtime.ts`.
- Implemented only the Telegram presentation/runtime facade:
  - `ready()` + `expand()` lifecycle calls;
  - `viewportChanged`, `safeAreaChanged`, and `contentSafeAreaChanged` listeners;
  - content-safe-area values projected into the shared KRISTOU `--k-safe-*` CSS variables;
  - Telegram viewport heights projected into Telegram-specific CSS variables;
  - listener cleanup + CSS-variable cleanup on dispose;
  - snapshot limited to Telegram runtime/presentation facts;
  - `@kristou/telegram` reuses `@kristou/frontend` and `@kristou/ui`.
- Explicitly not implemented:
  - Telegram bot token;
  - initData validation;
  - authentication;
  - account linking;
  - Telegram-specific business records/state;
  - any product-domain logic.
- Focused verification:
  - `node --experimental-strip-types --test tests/telegram/runtime.test.ts` against the exact runtime behavior — **3/3 PASS**;
  - branch compare against `phase-0-foundation`: only Telegram runtime files, lockfile, test, and this progress entry are in scope;
  - package dependencies are narrow: `@kristou/frontend` + `@kristou/ui`;
  - no `TELEGRAM_BOT_TOKEN` dependency or credential is required by the runtime facade.
- Telegram API behavior was checked against the official Mini Apps documentation for `ready()`, `expand()`, viewport changes, safe-area changes, and content-safe-area changes.
- Dependency-backed workspace `tsc`/build remains unverified in this container because npm-registry access is unavailable; Task 8 CI remains the authoritative dependency-backed gate.
- Status: **MERGED** into `phase-0-foundation` at merge commit `58df42bc51b58eaa38124a5a3c1319ac827b26fe`.

### Task 6A — Identity contract + RED persistence invariants

- Integration baseline: `phase-0-foundation@58df42bc51b58eaa38124a5a3c1319ac827b26fe`
- Task branch: `foundation/task-6-foundation-persistence`
- Product-owner decision locked:
  - Web login uses one unique normalized login username + password;
  - email is optional;
  - email is not a Web login identifier;
  - optional email is not password-recovery authority without a separately verified-email flow;
  - Telegram and Web credentials attach to the same canonical `User.id`.
- `requirements.md`, `docs/CANONICAL_MODEL.md`, and `docs/DECISIONS.md` were reconciled; ADR-012 records the login-policy decision.
- Added RED database integration contract at `tests/database/foundation.integration.test.ts` covering:
  - unique Web login username;
  - one canonical User with both WebCredential and TelegramIdentity;
  - Telegram identity uniqueness across Users;
  - account-link challenge verifier/expiry/consumption fields;
  - concurrency-safe single consumption using a conditional database update.
- RED proof observed before database implementation: the focused test fails with `ERR_MODULE_NOT_FOUND` for the intentionally absent `packages/database/src/index.ts`.
- No Prisma schema, migration, database package, auth service/routes, Telegram initData validation, or linking service implementation has been added by Task 6A.
- Full real Web↔Telegram signed-initData end-to-end behavior remains a later Identity/Auth service integration proof after the database foundation exists.

### Task 6B — Foundation database candidate re-integrated from current phase head

- Live integration baseline rechecked: `phase-0-foundation@74a73f9377de858648dacce8b56b429d066f7432`.
- PR #6 is merged into `phase-0-foundation`; PR #7 is also marked merged, but its merge target was the Task 6A branch, so the database files were not present on the live integration branch.
- Clean follow-up branch: `foundation/task-6b-database-foundation-v2`, created directly from the current live integration head.
- Re-applied only the previously reviewed Task 6B database files:
  - `package-lock.json`
  - `packages/database/package.json`
  - `packages/database/tsconfig.json`
  - `packages/database/src/index.ts`
  - `packages/database/prisma/schema.prisma`
  - `packages/database/prisma/migrations/20260930000000_foundation/migration.sql`
  - `packages/database/prisma/migrations/migration_lock.toml`
- Source postcheck confirms the branch is one commit ahead, zero behind `phase-0-foundation`, and contains no product-domain tables.
- Verified source constraints:
  - unique normalized Web login username field;
  - unique Telegram user ID field;
  - WebCredential and TelegramIdentity each reference canonical `User.id`;
  - WebSession stores `tokenHash`, not a raw session token field;
  - AccountLinkChallenge stores a unique verifier hash plus expiry, consumed-at, failed-attempt and creation state;
  - OutboxEvent includes status, attempts, available-at, claimed-at, delivered-at and last-error fields.
- Runtime proof remains pending because the available execution container has no local Prisma/PostgreSQL tooling and DNS cannot resolve GitHub/npm hosts. Do not claim Prisma validation, migration execution, or integration-test GREEN until a supported runtime runs those commands.
- No auth routes/services, Telegram initData validation, account-link claim implementation, deployment, or Task 7 work were started.

### Task 6B.1 — Foundation integration-test contract candidate

- Integration baseline: `phase-0-foundation@124c3be70817f711f87380a73fddadcac1a35ee8`.
- Task branch: `foundation/task-6b1-integration-test-contract`.
- Fresh start state: no open PRs; `main` and `phase-0-foundation` were not mutated.
- Confirmed `scripts/run-tests.mjs` ignored optional supplied test paths.
- Added focused regression coverage for runner filtering:
  - RED: requesting one integration-test path still executed both fixture integration tests;
  - GREEN after minimal runner fix: requested path runs only that test, while no-path execution still runs all integration tests;
  - focused runner regression suite: **2/2 PASS** in the ChatGPT container.
- Expanded `tests/database/foundation.integration.test.ts` so the eventual PostgreSQL proof exercises all seven Task 6B foundation models:
  - User;
  - WebCredential;
  - WebSession;
  - TelegramIdentity;
  - AccountLinkChallenge;
  - AuditLog;
  - OutboxEvent.
- The strengthened contract covers canonical Web/Telegram ownership, unique login username, optional email, Telegram identity uniqueness, token-hash-only session persistence, expiry/revocation representation, hashed account-link verifier state, failed attempts, concurrency-safe single consumption, safe audit references/metadata, and outbox pending/claim/retry/failure/delivery fields.
- AuditLog source/runtime assertions only prove that the model has no secret-specific top-level persistence fields and that safe metadata round-trips. Application-level sanitization of arbitrary JSON metadata remains a later responsibility and is not claimed by this database contract.
- No Prisma schema or migration change was required by the source contract.
- TypeScript syntax stripping/check for the expanded foundation integration test: **PASS**.
- PostgreSQL runtime proof remains blocked in this environment; do not call Task 6B runtime-GREEN until Prisma generation/validation, migration application, and the focused database integration suite pass against disposable PostgreSQL.
- Status correction: **MERGED** into `phase-0-foundation` through PR #9 at merge commit `0ac85b23c6e0f88bae8293496c890ca681c4915f`. This proves source/test-contract integration only; the PostgreSQL runtime integration gate remains unproven.

### Recovery baseline — build graph, Railway candidate, and one-product topology

- Recovery inspection established that `deploy-candidate@76ab188b39327955d4b23a823ff1d5b5ddaf47dc` is the source used by the successful Railway Web/API candidate deployments.
- `foundation/build-graph-closure@2e38c4f2b736fbdd04095f4cfa8577f99657eb2b` has the same source tree as that deployed commit and has exact-head Foundation CI run `36922103675` — **SUCCESS**.
- At the time of this recovery snapshot, `phase-0-foundation@0ac85b23c6e0f88bae8293496c890ca681c4915f` was stale relative to the verified deployed/source lineage; this is historical pre-reconciliation evidence, not current branch truth.
- The deployed source still contains `apps/telegram/src/runtime.ts`. This is current implementation evidence, not target architecture. ADR-013 and the revised Phase 0 plan require one canonical product frontend and a later move -> prove -> remove migration of Telegram host mechanics into the canonical Web runtime boundary.
- No Railway infrastructure mutation was performed by this documentation recovery task.


### Recovery R4 — Telegram workspace/source ownership cleanup

- Starting integration HEAD: `phase-0-foundation@e9f2604fb0b07b826381985c35bbed974a99e277`.
- R3 / PR #13 was already merged at that exact starting SHA.
- Fresh repository inspection found the remaining `apps/telegram` workspace contained only `package.json`, `tsconfig.json`, and `src/index.ts`; the source file only re-exported `KristouShell` and `DEFAULT_THEME` and owned no unique runtime/product behavior.
- Full repository reference inspection found no current package/source consumer of `@kristou/telegram`; the root build/typecheck included it only because the workspace manifest existed.
- Fresh Railway inspection of the KRISTOU project found current services build with `npm run build:web` or `npm run build` and start `@kristou/api`; no service referenced `@kristou/telegram`, `apps/telegram`, or a Telegram workspace root.
- R4 decision: **WORKSPACE REMOVED**. The obsolete `apps/telegram` workspace/source/build ownership is removed; canonical Telegram host runtime remains at `apps/web/src/telegram/runtime.ts`.
- Architecture regression coverage now requires every `apps/telegram/src/**` product source owner to fail; the temporary R2/R3 `src/index.ts` exception is removed.
- Repository-wide build-graph redesign remains a separate R5 packet; Browser/Telegram runtime-context integration remains R6.
