# KRISTOU SCHOOL

KRISTOU SCHOOL is the clean application platform for École Primaire Privée Kristou School. It is a mobile-first, multilingual school platform for public visitors, parents, students, teachers, delegated managers/associates, and the School Owner / App Admin.

This repository is intentionally clean. The HoomaUltimate repository is a read-only process/architecture reference only; no HOOMA product code, schema, routes, runtime, auth, branding, or business rules belong here.

## Repository topology

Current Phase 0 foundation:

```text
apps/
  api/        # canonical backend transport/composition runtime
  web/        # canonical React product entry/router/shell for Browser + Telegram WebView
  telegram/   # compatibility/deployment facade only; must not own a product source tree
  worker/     # asynchronous execution only

packages/
  config/
  contracts/
  database/
  domain/
  frontend/   # shared KRISTOU feature UI/state/API integration
  testing/
  ui/         # domain-neutral presentation/tokens/assets

docs/
AGENTS.md
structure.md
requirements.md
progress.md
.env.example
```

Future packages are added only when an approved implementation slice requires them. The exact topology may be refined only through the architecture authorities in this repository.

KRISTOU has one product frontend. Browser and Telegram WebView are delivery/authentication contexts of that same frontend. `apps/web` owns the canonical React application entry, route authority, and product shell. Telegram-specific code is limited to host/runtime integration and must not create a second router, shell, feature tree, API client/state model, or durable product authority.

## Mandatory reading before implementation

Before the first implementation edit, every agent or developer must read:

1. `AGENTS.md`
2. `docs/LIVING_BUILD_PLAN.md`
3. the relevant sections of `requirements.md`
4. the relevant sections of `structure.md`
5. relevant decisions in `docs/DECISIONS.md`
6. relevant data/authority rules in `docs/CANONICAL_MODEL.md`

Then inspect the actual repository, current branch/HEAD, overlapping work, and relevant runtime/data evidence before editing.

## Domain ownership rule

Every durable product concept has exactly one authoritative owner. Do not create cross-domain monolithic services, repositories, scripts, contracts, frontend stores/clients, or catch-all modules to make implementation faster.

Cross-domain workflows must use explicit application orchestration or ports. The owning domain retains its business and persistence authority.

Unrelated product flows must not be forced to query, lock, validate, cache, load, or rerender together.

## Living documentation

Documentation is part of the product contract.

Authoritative subjects are separated:

- `requirements.md` — product behavior and acceptance contract;
- `structure.md` — architecture, topology, dependency direction, domain ownership;
- `docs/CANONICAL_MODEL.md` — canonical entities, writes, durable truth, projections;
- `docs/DECISIONS.md` — architectural decisions and ADR index;
- `AGENTS.md` + `docs/LIVING_BUILD_PLAN.md` — how work is performed;
- `progress.md` — current implementation evidence only.

Do not create another file that competes with one of these authorities.

## Core product direction

The approved product baseline includes:

- one canonical product frontend shared by Browser and Telegram WebView;
- one canonical user shared by Web and Telegram authentication transports;
- server-side RBAC + resource-scoped authorization;
- public/general, parent, student, teacher, manager/associate, and App Admin access boundaries;
- class communities;
- Parent Notes;
- short Messages;
- student class-wide Class Questions with no private student DMs initially;
- safety-critical Pickup;
- Teachers and Administration/School Board surfaces;
- La Toque Gourmande Food Menu;
- notifications and configurable sounds;
- Arabic, French, and English from foundation;
- Light as default appearance and Pitch Black as optional dark mode.

See `requirements.md` for accepted behavior rather than treating this README as the full product contract.

## First run

The Phase 0 workspace bootstrap uses Node.js 22 and npm 10.9.2.

```bash
npm ci
npm run architecture:check
npm run format:check
npm run lint
npm run deploy:preflight
```

The Phase 0 API, Web, Telegram-facade, Worker, and shared-package workspaces now exist in source. Their presence is not runtime proof. Build, test, database, browser, deployment, and live behavior must each be verified at the evidence tier required by the claim.
