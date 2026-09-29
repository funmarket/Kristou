# KRISTOU SCHOOL Phase 0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the clean, testable KRISTOU SCHOOL monorepo foundation that all later domains can build on without duplicating authority, while delivering the approved phone-first Web shell, trilingual/RTL/theme primitives, canonical identity/auth foundations, database/outbox/audit primitives, API/Worker runtimes, and CI/security gates.

**Architecture:** KRISTOU uses npm workspaces with separate `apps/api`, `apps/web`, `apps/telegram`, and `apps/worker` runtimes plus focused shared packages. PostgreSQL owns durable truth; Redis is transient only; object storage is abstracted but not required for the first local boot. Web and Telegram resolve to one canonical User. Product domains remain separate and are not implemented in this plan.

**Tech Stack:** Node.js 22 LTS-compatible runtime, npm workspaces, TypeScript 5.9.x, React 19.x, Vite 7.x, Express 5.x, Zod 4.x, Prisma 6.19.x, Argon2id, React Router, Testing Library, Node test runner/Vitest-compatible focused tests as selected in Task 1, ESLint, Prettier.

**Spec:** `requirements.md`, `structure.md`, `docs/CANONICAL_MODEL.md`, `docs/DECISIONS.md`, and the owner-approved visual/template package from the current KRISTOU design checkpoint. The attached `ggd.png` logo is the official source asset and must be copied unchanged into the repository when Task 4 executes.

## Global Constraints

- KRISTOU is **phone-device-first**. Desktop expands the phone experience; it does not define it.
- Light mode is the default. Dark mode uses a pitch-black `#000000` foundation with light/white text.
- Arabic, French, and English are foundational. Arabic uses RTL in the same component tree.
- Touch surfaces must not show thick browser-default scrollbars. Mobile scrollbars are effectively transparent/hidden; pointer/desktop scrollbars are thin and unobtrusive.
- The supplied `ggd.png` logo is used unchanged. No regeneration, redraw, recolor, restyling, or alternate logo.
- One canonical User across Web and Telegram; no heuristic account merging.
- Authorization is server-side. UI visibility never grants authority.
- PostgreSQL is durable truth. Redis is transient. Object storage owns bytes when introduced.
- No cross-domain monoliths, catch-all business services, giant stores, or duplicate authorities.
- No Pickup, Parent Notes, Enrollment, Class Community, Messaging, Food Menu, Broadcast, or School Directory business implementation in this Phase 0 plan.
- No production secrets in source, docs, screenshots, browser bundles, or test fixtures.
- Every successful implementation task updates `progress.md` and any affected governing docs.
- Do not create Railway, Cloudflare, or a Telegram bot before the explicit infrastructure gates in Tasks 9 and 10.

## Review Focus

1. **Workspace dependency direction:** a lower-level package must not import app code or feature-domain implementations.
2. **Environment failure semantics:** API/Worker must fail clearly on invalid required production configuration without hardcoded fallbacks.
3. **Theme/i18n regression:** first paint must remain Light, Arabic must switch `dir="rtl"`, and pitch-black mode must never inherit the old dark-blue palette.
4. **Identity split risk:** Web and Telegram auth primitives must both resolve to canonical `User.id` and must not introduce separate user tables.
5. **Client secret leakage:** the Telegram bot token, session pepper, database credentials, and object-storage secrets must never appear in Web/Vite client output.

---

## Planned repository tree after Phase 0

```text
Kristou/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── bootstrap/
│   │       └── http/
│   ├── web/
│   │   └── src/
│   ├── telegram/
│   │   └── src/
│   └── worker/
│       └── src/
├── packages/
│   ├── auth/
│   ├── config/
│   ├── contracts/
│   ├── database/
│   ├── domain/
│   ├── frontend/
│   ├── media-processing/
│   ├── storage/
│   ├── testing/
│   └── ui/
├── scripts/
│   ├── architecture-check.mjs
│   ├── deploy-preflight.mjs
│   └── run-tests.mjs
├── tests/
│   ├── architecture/
│   ├── config/
│   ├── auth/
│   └── frontend/
├── .github/workflows/ci.yml
├── package.json
├── package-lock.json
├── tsconfig.base.json
├── eslint.config.js
├── .prettierrc.json
├── .gitignore
└── existing governance/docs
```

---

### Task 1: Bootstrap the workspace and verification toolchain

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.base.json`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.gitignore`
- Create: `scripts/run-tests.mjs`
- Create: `scripts/architecture-check.mjs`
- Create: `scripts/deploy-preflight.mjs`
- Modify: `README.md`
- Modify: `progress.md`

**Interfaces:**
- Produces root commands used by every later task: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run architecture:check`, `npm run deploy:preflight`, `npm run check`.
- Establishes npm workspace globs `apps/*` and `packages/*`.

- [ ] **Step 1: Snapshot branch/HEAD and verify the repo still contains no implementation code.**

Run the GitHub/source inspection required by `AGENTS.md`. Record starting SHA in `progress.md`.

Expected: only governance/docs plus `.env.example`; no package manager/runtime code.

- [ ] **Step 2: Create the root npm workspace manifest and lockfile.**

Use:

```json
{
  "name": "kristou-school",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "packageManager": "npm@10.9.2",
  "engines": { "node": ">=22 <25" },
  "workspaces": ["apps/*", "packages/*"]
}
```

Add scripts for dev, build, typecheck, lint, format/check, architecture check, deploy preflight, DB generate/validate/migrate/status, unit tests, integration tests, and full `check`.

- [ ] **Step 3: Add TypeScript, ESLint, Prettier, tsx, Testing Library, and test-runner dev dependencies.**

Pin exact versions in the committed lockfile. Do not use floating unpinned workspace dependencies for internal packages.

- [ ] **Step 4: Implement `scripts/architecture-check.mjs` with foundation-only dependency rules.**

It must fail when:
- an app is imported by a package;
- `packages/domain` imports API/HTTP/database infrastructure;
- frontend packages import `packages/database`;
- a package imports another package not declared in its manifest;
- obvious catch-all business owner folders such as `apps/api/src/modules/management` are introduced without an explicit architecture decision.

- [ ] **Step 5: Implement `scripts/deploy-preflight.mjs`.**

At this stage it checks only repository/deploy prerequisites that can be known locally:
- package lock exists;
- required root scripts exist;
- production-required environment variables are enumerated by config package once Task 2 exists;
- no development fallback secret is permitted in production.

- [ ] **Step 6: Run the workspace bootstrap verification.**

Run:
```bash
npm ci
npm run format:check
npm run lint
npm run architecture:check
```

Expected: PASS. `npm run typecheck/build/test` may remain partial until workspaces exist; do not fake them.

- [ ] **Step 7: Update `README.md` first-run commands and `progress.md` with exact proof.**

- [ ] **Step 8: Commit.**

Suggested commit:
```text
chore: bootstrap KRISTOU workspace toolchain
```

---

### Task 2: Create focused shared package skeletons and config authority

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.json`
- Create: `packages/config/src/index.ts`
- Create: `packages/config/src/env.ts`
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/src/index.ts`
- Create: `packages/testing/package.json`
- Create: `packages/testing/tsconfig.json`
- Create: `packages/testing/src/index.ts`
- Test: `tests/config/env.test.ts`
- Modify: `.env.example`
- Modify: `progress.md`

**Interfaces:**
- Produces `loadApiConfig(env)`, `loadWorkerConfig(env)`, and `loadWebPublicConfig(env)`.
- Produces shared primitive exports only; no feature-domain contracts yet.

- [ ] **Step 1: Write config tests first.**

Tests must prove:
- development can use explicit local values;
- production rejects missing `DATABASE_URL`, `REDIS_URL`, session secret/pepper, and allowed origin configuration once those runtimes require them;
- public Web config cannot expose `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`, session pepper, or object-storage secrets;
- invalid URLs fail validation.

- [ ] **Step 2: Run tests and confirm failure because config package does not exist.**

- [ ] **Step 3: Implement Zod-based config loaders.**

Keep API/Worker private configuration separate from explicitly public Web configuration.

Do not infer production behavior from `NODE_ENV` alone where an explicit variable is safer; document any such decision.

- [ ] **Step 4: Create empty/focused `contracts`, `domain`, and `testing` package entry points.**

Do not add future business models.

- [ ] **Step 5: Reconcile `.env.example` with the actual config schema.**

Every required variable appears once with a placeholder; no real credential.

- [ ] **Step 6: Run focused and package checks.**

```bash
npm test -- tests/config/env.test.ts
npm run typecheck
npm run architecture:check
```

Expected: PASS.

- [ ] **Step 7: Update docs/progress and commit.**

Suggested commit:
```text
feat: add KRISTOU configuration authority
```

---

### Task 3: Bootstrap the API and Worker runtimes with health contracts

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/bootstrap/server.ts`
- Create: `apps/api/src/bootstrap/app.ts`
- Create: `apps/api/src/http/health.ts`
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/main.ts`
- Create: `apps/worker/src/health.ts`
- Test: `tests/api/health.test.ts`
- Test: `tests/worker/startup.test.ts`
- Modify: `progress.md`

**Interfaces:**
- API produces `GET /health/live` and `GET /health/ready`.
- Worker produces process/runtime health primitives that later deployment health checks can call or expose through the chosen worker health adapter.
- Both consume `@kristou/config`.

- [ ] **Step 1: Write failing API health/startup tests.**

Assertions:
- liveness returns 200 when process is up;
- readiness fails when mandatory runtime dependencies are not initialized;
- invalid production configuration stops startup before serving requests.

- [ ] **Step 2: Implement the minimal Express 5 API composition root.**

Use Helmet and strict CORS wiring placeholders driven by config. Do not add product routes.

- [ ] **Step 3: Implement Worker startup and graceful shutdown skeleton.**

No business polling loop yet; only lifecycle/config initialization.

- [ ] **Step 4: Run focused tests.**

```bash
npm test -- tests/api/health.test.ts tests/worker/startup.test.ts
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 5: Update `progress.md` and commit.**

Suggested commit:
```text
feat: add KRISTOU API and worker foundations
```

---

### Task 4: Implement the phone-first UI/design-system foundation and Web shell

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.tsx`
- Create: `packages/ui/src/theme/tokens.css`
- Create: `packages/ui/src/theme/global.css`
- Create: `packages/ui/src/assets/kristou-logo.png` (exact copy of owner-provided `ggd.png`)
- Create: `packages/frontend/package.json`
- Create: `packages/frontend/tsconfig.json`
- Create: `packages/frontend/src/index.ts`
- Create: `packages/frontend/src/i18n/index.ts`
- Create: `packages/frontend/src/shell/KristouShell.tsx`
- Create: `packages/frontend/src/shell/KristouShell.css`
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Test: `tests/frontend/shell.test.tsx`
- Test: `tests/frontend/theme-i18n.test.tsx`
- Modify: `progress.md`

**Interfaces:**
- Produces `KristouShell`, theme tokens, locale/direction primitives, and official logo asset.
- Web app consumes shared shell rather than duplicating it.

- [ ] **Step 1: Copy the supplied `ggd.png` byte-for-byte into `packages/ui/src/assets/kristou-logo.png`.**

Verification: SHA/hash or binary comparison proves the committed asset matches the uploaded source.

No image-generation/editing step is allowed.

- [ ] **Step 2: Write failing shell/theme/i18n tests.**

Must assert:
- default document/theme is Light even when OS preference is dark;
- toggling dark produces `data-theme="dark"` and `#000000` foundation;
- Arabic switches document direction to RTL;
- French/English are LTR;
- mobile account/menu surfaces remain reachable;
- scrollable shell/menu classes use the governed scrollbar utility rather than default thick scrollbars.

- [ ] **Step 3: Implement semantic theme tokens.**

Required baseline:
```text
Light:
  background: light/white
Dark:
  background: #000000
  primary text: #FFFFFF
```

KRISTOU teal/gold are accents only.

- [ ] **Step 4: Implement governed scroll behavior.**

Mobile/touch:
- preserve native overflow scrolling;
- hide/transparent scrollbar chrome;
- never disable scrolling merely to hide scrollbars.

Desktop/pointer:
- thin, low-contrast scrollbar;
- transparent track;
- subtle thumb only when useful.

Horizontal card strips must not display old-style scrollbar tracks.

- [ ] **Step 5: Implement the shared trilingual i18n primitive.**

Start with shell/navigation/settings strings only. Do not duplicate components per locale.

- [ ] **Step 6: Implement the approved phone-first shell.**

Header:
```text
[official KRISTOU logo + KRISTOU SCHOOL] [bell] [avatar]
```

Account menu/sheet must be phone-first and capable of later capability-aware entries. In Phase 0 it may render safe placeholder sections only; it must not fake authenticated product data.

- [ ] **Step 7: Build the Web app and run tests.**

```bash
npm test -- tests/frontend/shell.test.tsx tests/frontend/theme-i18n.test.tsx
npm -w @kristou/web run build
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Perform manual responsive QA at representative phone widths.**

At minimum:
- 320 px;
- 360 px;
- 390/393 px;
- 430 px;
- desktop expansion.

Check Light, Pitch Black, Arabic RTL, English/French LTR, sheets, header, and scrolling.

- [ ] **Step 9: Update progress/docs and commit.**

Suggested commit:
```text
feat: add KRISTOU phone-first UI foundation
```

---

### Task 5: Create the Telegram runtime facade without a bot credential

**Files:**
- Create: `apps/telegram/package.json`
- Create: `apps/telegram/tsconfig.json`
- Create: `apps/telegram/src/index.ts`
- Create: `apps/telegram/src/runtime.ts`
- Test: `tests/telegram/runtime.test.ts`
- Modify: `progress.md`

**Interfaces:**
- Produces a Telegram-specific runtime adapter for viewport/safe-area/lifecycle behavior.
- Reuses `@kristou/frontend` and `@kristou/ui`.
- Does **not** yet require `TELEGRAM_BOT_TOKEN`.

- [ ] **Step 1: Write tests proving Telegram runtime does not create separate business state.**

Test only shell/runtime behavior and safe-area integration.

- [ ] **Step 2: Implement the Telegram facade.**

No Telegram auth validation yet; no bot token; no account-linking endpoint.

- [ ] **Step 3: Verify Web and Telegram consume the same shared shell/i18n/theme packages.**

- [ ] **Step 4: Run build/typecheck/tests and commit.**

Suggested commit:
```text
feat: add KRISTOU Telegram runtime facade
```

---

### Task 6: Create PostgreSQL/Prisma foundation and canonical identity/audit/outbox schema

**Files:**
- Create: `packages/database/package.json`
- Create: `packages/database/tsconfig.json`
- Create: `packages/database/src/index.ts`
- Create: `packages/database/prisma/schema.prisma`
- Create: `packages/database/prisma/migrations/<timestamp>_foundation/migration.sql`
- Test: `tests/database/foundation.integration.test.ts`
- Modify: `docs/CANONICAL_MODEL.md`
- Modify: `docs/DECISIONS.md` if a new persistence decision is made
- Modify: `progress.md`

**Interfaces:**
- Produces canonical persistence for only foundation entities:
  - `User`
  - `WebCredential`
  - `WebSession`
  - `TelegramIdentity`
  - `AccountLinkChallenge`
  - `AuditLog`
  - `OutboxEvent`
- No Enrollment/Class/Pickup/Parent Notes/etc. tables in this task.

- [ ] **Step 1: Write real disposable-PostgreSQL integration tests for foundation invariants.**

At minimum:
- one Telegram identity belongs to at most one User;
- one Web credential login identifier maps unambiguously according to chosen auth identifier policy;
- raw session token is not stored;
- link challenge supports expiry/single consumption fields;
- OutboxEvent has retry/claim lifecycle fields needed for later Worker implementation;
- AuditLog rejects/avoids secret-bearing contract paths by application design.

- [ ] **Step 2: Decide and document the exact Web login identifier policy before schema implementation.**

If the owner has not separately chosen username/email/phone semantics, stop at this step and ask. Do not guess.

- [ ] **Step 3: Implement only the approved foundation schema and migration.**

- [ ] **Step 4: Run Prisma generation/validation/migration against disposable PostgreSQL.**

```bash
npm run db:generate
npm run db:validate
npm run test:integration -- tests/database/foundation.integration.test.ts
```

Expected: PASS.

- [ ] **Step 5: Reconcile canonical-model docs, update progress, and commit.**

Suggested commit:
```text
feat: add KRISTOU foundation persistence
```

---

### Task 7: Add authentication primitives and session security

**Files:**
- Create: `packages/auth/package.json`
- Create: `packages/auth/tsconfig.json`
- Create: `packages/auth/src/index.ts`
- Create: `packages/auth/src/password.ts`
- Create: `packages/auth/src/session-token.ts`
- Create: `packages/auth/src/telegram-init-data.ts`
- Test: `tests/auth/password.test.ts`
- Test: `tests/auth/session-token.test.ts`
- Test: `tests/auth/telegram-init-data.test.ts`
- Modify: `progress.md`

**Interfaces:**
- Produces:
  - `hashPassword(password): Promise<string>`
  - `verifyPassword(hash, password): Promise<boolean>`
  - opaque session-token generation + hashing helpers
  - `validateTelegramInitData(raw, botToken, options)` primitive
- No account-link HTTP flow yet.

- [ ] **Step 1: Write failing tests for Argon2id password hashing and opaque session token storage.**

- [ ] **Step 2: Implement password and session primitives.**

Never return/persist raw session token except to the caller at issuance time.

- [ ] **Step 3: Implement Telegram initData validator behind a token parameter.**

Tests use synthetic/test secrets only. No real Telegram token is needed.

- [ ] **Step 4: Test replay-age/timestamp/signature failures according to the chosen Telegram validation library behavior.**

- [ ] **Step 5: Run auth tests/typecheck/security checks and commit.**

Suggested commit:
```text
feat: add KRISTOU auth primitives
```

---

### Task 8: Establish CI, security baseline, and full local foundation proof

**Files:**
- Create: `.github/workflows/ci.yml`
- Create or modify: security/architecture test fixtures as needed
- Modify: `README.md`
- Modify: `progress.md`
- Modify: `docs/LIVING_BUILD_PLAN.md` only if actual execution commands differ from the documented discipline

**Interfaces:**
- CI is read-only verification.
- Produces the required local/CI gate before infrastructure creation.

- [ ] **Step 1: Configure CI to run on pushes/PRs without modifying repository files.**

Required:
```text
npm ci
npm run db:generate
npm run db:validate
npm run architecture:check
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run deploy:preflight
```

Integration tests that require disposable PostgreSQL/Redis may use CI services in a separate job.

- [ ] **Step 2: Add a dependency/security check appropriate to the chosen npm stack.**

At minimum:
`npm audit --omit=dev --omit=optional --audit-level=high`.

If a secret scanner is introduced, pin/version its invocation and make CI read-only.

- [ ] **Step 3: Add a build-output secret-leak assertion.**

Fail if Web/Telegram bundle text contains names/values of private variables such as:
- `TELEGRAM_BOT_TOKEN`
- `DATABASE_URL`
- session pepper
- object-storage secret key.

- [ ] **Step 4: Run the complete local gate.**

```bash
npm run check
npm run test:integration
```

Expected: all green.

- [ ] **Step 5: Record exact SHA and proof in `progress.md`.**

This successful gate unlocks **Task 9: staging infrastructure creation**.

- [ ] **Step 6: Commit.**

Suggested commit:
```text
ci: enforce KRISTOU foundation gates
```

---

### Task 9: STAGING INFRASTRUCTURE GATE — create Railway and Cloudflare projects

**This is the point at which the product owner should create/authorize Railway and Cloudflare resources. Do not create them earlier.**

**Precondition:** Task 8 is green locally and in CI at an exact commit SHA.

**Railway target:**
- one KRISTOU staging project/environment;
- API service from `apps/api`;
- Worker service from `apps/worker`;
- PostgreSQL;
- Redis/Valkey;
- staging-only environment variables;
- health checks wired to the implemented health contracts.

**Cloudflare target:**
- KRISTOU Web frontend/edge project targeting the exact Web build;
- staging/preview environment first;
- public API base URL points only to Railway staging API;
- optional Workers/R2/AI resources are **not** created unless the current implementation slice actually needs them.

**Files (only after resources exist):**
- Modify/create deployment configuration actually required by the chosen providers
- Modify: `.env.example` only if real variable names changed
- Modify: `README.md`
- Modify: `progress.md`

- [ ] **Step 1: Stop and ask the owner to create/authorize the Railway staging project and Cloudflare frontend project.**

At this exact point I will tell you: **“Create Railway and Cloudflare now.”**

- [ ] **Step 2: Wire staging environment variables without real values entering Git.**

- [ ] **Step 3: Deploy exact SHA to staging.**

- [ ] **Step 4: Prove API liveness/readiness and Worker readiness from the deployed services.**

- [ ] **Step 5: Prove Cloudflare preview serves the exact Web build and points to the staging API.**

- [ ] **Step 6: Record exact URLs, deployed SHA, environment status, and remaining gaps in `progress.md`.**

Production resources/aliases remain out of scope.

---

### Task 10: TELEGRAM DEVELOPMENT BOT GATE — create temporary bot token safely

**This is the first point at which a temporary Telegram bot token is needed.**

**Preconditions:**
- Task 9 staging API/Web are reachable through stable staging URLs;
- private env handling is proven;
- `packages/auth` Telegram initData validator exists and is tested;
- Telegram runtime facade builds;
- account-link implementation plan has been written and approved.

- [ ] **Step 1: Ask the owner to create a separate temporary KRISTOU development bot with BotFather.**

Do not use the future production bot.

- [ ] **Step 2: Store the token only in Railway/staging private secrets as `TELEGRAM_BOT_TOKEN`.**

Never paste the token into:
- GitHub files;
- Web/Telegram frontend environment variables;
- screenshots;
- docs;
- test fixtures;
- chat-visible source snippets.

- [ ] **Step 3: Configure the development Mini App URL to the approved staging/preview URL.**

- [ ] **Step 4: Begin the separate Identity/Telegram-linking implementation plan.**

The token is not a signal to implement all Telegram features at once.

- [ ] **Step 5: Before production, revoke/regenerate the development credential and provision a production-only secret.**

---

## Phase 0 completion gate

Phase 0 Foundation is complete only when:

- npm workspace + lockfile are committed;
- API, Web, Telegram facade, and Worker build;
- config fails closed correctly in production mode;
- PostgreSQL foundation schema/migration is proven on disposable Postgres;
- canonical identity primitives exist without duplicate Web/Telegram Users;
- Argon2id/session/Telegram-initData auth primitives pass focused tests;
- phone-first shell uses the exact supplied logo;
- Light default, pitch-black dark, AR/FR/EN, RTL, and transparent scrollbar behavior are verified;
- architecture checks pass;
- CI is green and read-only;
- staging Railway + Cloudflare proof exists at an exact SHA;
- governing docs and `progress.md` match the implementation.

## Self-review

- **Spec coverage:** This plan implements only the approved Phase 0 foundation and deliberately defers product domains.
- **Boundary coverage:** Identity, config, UI, database, runtime, auth primitives, CI, and deployment gates are separate reviewable tasks.
- **No speculative business schema:** Class, Pickup, Enrollment, Parent Notes, Messaging, Food Menu, Directory, Broadcasts, and AI tables are not created here.
- **Review Focus covered:** architecture imports (Task 1), env failures/client leakage (Tasks 2/8), theme/i18n/scrollbars (Task 4), canonical identity (Tasks 6/7), secret leakage (Tasks 8–10).
- **Owner decision gate:** Task 6 explicitly stops before schema creation if Web login identifier policy remains unresolved.
- **Infrastructure timing:** Railway/Cloudflare are not required until Task 9; temporary Telegram token is not required until Task 10.
