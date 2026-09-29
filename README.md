# KRISTOU SCHOOL

KRISTOU SCHOOL is the clean application platform for École Primaire Privée Kristou School. It is a mobile-first, multilingual school platform for public visitors, parents, students, teachers, delegated managers/associates, and the School Owner / App Admin.

This repository is intentionally clean. The HoomaUltimate repository is a read-only process/architecture reference only; no HOOMA product code, schema, routes, runtime, auth, branding, or business rules belong here.

## Repository topology

Planned foundation:

```text
apps/
  api/
  web/
  telegram/
  worker/
packages/
  auth/
  config/
  contracts/
  database/
  domain/
  frontend/
  media-processing/
  storage/
  testing/
  ui/
docs/
AGENTS.md
structure.md
requirements.md
progress.md
.env.example
```

The exact code topology may be refined only through the architecture authorities in this repository.

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

- one canonical user shared by Web and Telegram;
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

The API/Web/Telegram/Worker workspaces are added in later Phase 0 tasks. Until those workspaces exist, full build/typecheck/runtime commands are intentionally not claimed as verified.
