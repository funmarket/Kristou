# KRISTOU SCHOOL — STRUCTURE

Status: **PRIMARY ARCHITECTURE CONTRACT**  
Repository: `funmarket/Kristou`  
Product: **KRISTOU SCHOOL**

This file defines the architecture KRISTOU SCHOOL must preserve as it grows. It is not a feature-status ledger, implementation queue, or permission to create speculative structures.

The HoomaUltimate repository is a **read-only process/architecture reference only**. It may inform discipline and structural patterns, but it is never runtime, schema, authentication, route, product, or branding authority for KRISTOU.

---

## 0. Purpose

This document owns:

- repository topology;
- runtime boundaries;
- package ownership;
- backend layering;
- dependency direction;
- canonical domain ownership;
- rules preventing cross-domain monoliths.

Product behavior belongs in `requirements.md`.  
Canonical data/authority belongs in `docs/CANONICAL_MODEL.md`.  
Architectural decisions belong in `docs/DECISIONS.md`.  
Current implementation evidence belongs in `progress.md`.

---

## 1. Governing sources and living-document rule

Implementation follows:

1. latest explicit product-owner instruction;
2. `requirements.md` for accepted product behavior;
3. this `structure.md` for architecture;
4. `docs/DECISIONS.md` for architectural decisions;
5. `docs/CANONICAL_MODEL.md` for canonical data/authority;
6. actual source/database/runtime as evidence of current state.

`AGENTS.md` and `docs/LIVING_BUILD_PLAN.md` govern how work is performed.

Before creating a model, route, service, repository, package, store, component, script, migration, or contract, search for the existing owner of that concept.

Documentation is part of implementation. If architecture or ownership changes, this file must change in the same task.

---

## 2. Repository topology

Planned clean monorepo foundation:

```text
Kristou/
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
    adr/
    CANONICAL_MODEL.md
    DECISIONS.md
    LIVING_BUILD_PLAN.md

  scripts/
  tests/
  .github/

  AGENTS.md
  structure.md
  requirements.md
  progress.md
  .env.example
  README.md
```

This topology is a target architecture. The repository is currently documentation-only. Do not claim apps/packages exist until they are created and verified.

Do not add a top-level app/package merely to avoid an existing ownership boundary.

---

## 3. Runtime ownership

### `apps/api`

Owns:

- HTTP transport;
- request parsing/validation;
- authentication integration;
- server-side authorization entry points;
- application orchestration;
- concrete repository/infrastructure adapters;
- transaction/locking boundaries;
- API composition.

Business policy must not live directly in HTTP handlers.

### `apps/web`

Owns:

- canonical browser application entry;
- browser routing;
- Web authentication screens;
- responsive application shell;
- Web runtime behavior.

It consumes shared feature UI and contracts where appropriate but does not own backend business rules.

### `apps/telegram`

Owns the Telegram Mini App runtime facade:

- Telegram `initData` handoff;
- viewport/safe-area behavior;
- Telegram lifecycle;
- native Telegram navigation/haptics where used;
- Telegram-specific shell integration.

It must not create a second KRISTOU product state or Telegram-only business database.

### `apps/worker`

Owns asynchronous execution only:

- transactional outbox consumption;
- retry/backoff;
- idempotent notification delivery;
- media background work;
- cleanup;
- scheduled processing where explicitly designed.

Worker must not become a second business-policy authority.

---

## 4. Shared package ownership

### `packages/auth`

Authentication primitives only:

- password/session primitives;
- Telegram validation primitives;
- auth transport helpers.

No product authorization policy.

### `packages/config`

Environment/config validation and startup/preflight configuration.

No product business rules.

### `packages/contracts`

Wire schemas/types split by owning domain.

Rules:

- domain-specific contract files;
- re-export indexes may aggregate exports only;
- no giant cross-domain contract implementation file;
- ORM models must not leak directly through API contracts.

### `packages/database`

Owns:

- database client configuration;
- schema;
- migrations;
- low-level database helpers.

It does not own product business policy.

### `packages/domain`

Genuinely cross-domain value primitives only.

It is not a dumping ground for feature policy.

### `packages/frontend`

Shared Web/Telegram product feature UI and typed API integration.

Feature ownership remains aligned with backend domains.

### `packages/media-processing`

Mechanical media primitives only:

- format/decode validation;
- metadata stripping;
- orientation normalization;
- approved variants/transforms;
- deterministic media-key/descriptor planning.

No product authorization or domain lifecycle.

### `packages/storage`

Object-storage abstraction/adapters.

No feature authorization or business ownership.

### `packages/testing`

Reusable typed fixtures/builders and disposable infrastructure helpers.

### `packages/ui`

Platform-neutral components, design tokens, themes, accessibility primitives, icons/assets.

No feature business state.

---

## 5. Backend domain shape

Substantial API domains should use:

```text
apps/api/src/modules/<domain>/
  domain/
  application/
  infrastructure/
  http/
```

Small domains may omit empty folders but must not collapse transport, authorization, business policy, persistence, and infrastructure into an uncontrolled catch-all.

Expected direction:

```text
http -> application -> domain
infrastructure -> application/domain ports
bootstrap/container -> concrete implementations
```

Forbidden direction:

```text
domain -> ORM/database client
application -> HTTP framework
HTTP handler -> direct database business logic
frontend -> database package
worker -> HTTP controller
one domain -> another domain's concrete repository
lower-level canonical domain -> higher-level feature domain
```

Cross-domain collaboration uses explicit application ports/readers/orchestrators.

---

## 6. Canonical domain ownership table

This table identifies the intended authoritative owner for known product concepts. Exact code paths do not exist yet and must not be invented before implementation.

| Canonical concept | Authoritative owner | Notes |
| --- | --- | --- |
| User, WebCredential, WebSession, TelegramIdentity, account-link challenges | **Identity & Authentication** | One canonical User across Web and Telegram; no heuristic merge. |
| Roles, capabilities, scoped authorization policy | **Access Control** | Server-side RBAC + resource/attribute scope. |
| User-facing parent/student/teacher/manager profile data | **People** | Authentication identity remains owned by Identity. |
| Parent-child guardian relationship | **Family** | Canonical link used by Parent Notes, class access, pickup authorization checks. |
| AcademicYear, Level, Class | **Academics** | Class identity/lifecycle authority. |
| Teacher-to-class assignment | **Academics** | Class-scoped teacher authority source. |
| EnrollmentApplication, review lifecycle, Enrollment | **Enrollment** | Acceptance does not itself grant class access until enrollment/assignment exists. |
| Student-to-class active assignment/membership | **Academics** | Must reference valid enrollment; no duplicate class roster authority elsewhere. |
| Class Announcements | **Class Community** | Private class content scoped by canonical Class membership. |
| Homework & Classwork | **Class Community** | Teacher-controlled class learning content. |
| Class Calendar items | **Class Community** | School-wide calendar items remain separate if later modeled. |
| Class Documents | **Class Community** | Private class content; media bytes use shared storage infrastructure. |
| Class Gallery | **Class Community** | Private class content. |
| Student Class Questions and replies | **Class Community** | Class-wide only; no private student DMs initially. |
| Parent Notes and replies | **Parent Notes** | Own quota/time-window/privacy semantics. |
| Short operational Message threads/messages | **Messaging** | 200-character rule; must not bypass Parent Notes policy. |
| Dismissal configuration, pickup state/events, release confirmation | **Pickup** | Safety-critical server authority. |
| AuthorizedPickupPerson | **Pickup** | Separate concept from Parent role; school-controlled authorization. |
| SchoolBroadcast | **Broadcasts** | One canonical broadcast; audience projections are not duplicate truth. |
| User inbox notifications/read state/delivery projections | **Notifications** | Notification is projection/delivery state, not source business truth. |
| Notification sound/theme/language preference | **Preferences** | Presentation preference only. |
| Weekly La Toque Gourmande menu and meal content | **Food Menu** | Admin or explicitly authorized Manager may manage. |
| Public teacher cards/bios/order/visibility | **School Directory** | Public projection/configuration; internal Teacher profile remains People-owned. |
| Public Administration/School Board cards | **School Directory** | App Admin controls public presentation. |
| Public homepage/pages/activities/clubs/public gallery | **Public Content** | Public CMS-style content only. |
| MediaAsset descriptor/lifecycle | **Media** | Product domains own semantic attachment/visibility policy; Media owns generic descriptor lifecycle. |
| AuditLog | **Audit** | Sensitive operation history; never contains secrets/private message bodies unnecessarily. |
| OutboxEvent | **Async Foundation** | Durable async handoff infrastructure, not a business domain. |
| AI Assistant orchestration | **TBD — AI** | Phase 8; do not create durable AI authority before the slice begins. |
| Grades/report cards | **TBD / out of initial scope** | Do not model until approved. |
| Attendance | **TBD / out of initial scope** | Pickup is not general attendance. |
| School transport/bus | **TBD / out of initial scope** | Separate future design required. |
| Payments | **TBD / out of initial scope** | Do not create speculative payment models. |

When a future implementation proves a concept belongs elsewhere, update this table and `docs/CANONICAL_MODEL.md` through an explicit architectural decision before code establishes a second authority.

---

## 7. Key cross-domain collaboration rules

### Identity -> product domains

Product domains consume canonical `User.id` and authorized identity context through interfaces. They do not query WebSession or TelegramIdentity persistence directly.

### Family / Academics -> private class access

Class/private child access requires canonical relationships:

```text
Identity
+ Access Control
+ Family link where parent-scoped
+ active Academics class membership
```

No feature invents its own child/class relationship table.

### Pickup

Pickup may read:

- authenticated actor identity;
- ParentChildLink from Family;
- class/student assignment from Academics;
- teacher assignment/capability from Academics + Access Control.

Pickup owns its own state transitions and persistence.

Family/Academics do not own pickup state.

### Notifications

Owning domains emit durable events/outbox work. Notifications create recipient/delivery projections.

A notification delivery failure must never roll back the original business event.

### Media

Product domains decide whether media is allowed, private/public, and attached to their own entity. Shared Media/Storage handles generic descriptor/bytes lifecycle.

---

## 8. Web and Telegram boundary

Web and Telegram have separate authentication transports but converge on the same backend identity and product state.

```text
Web session ---------\
                     -> canonical User -> same API/domain state
Telegram initData ---/
```

No Telegram-specific copies of:

- children;
- classes;
- Parent Notes;
- pickup;
- messages;
- notifications;
- food menus;
- registration.

---

## 9. Persistence boundaries

### PostgreSQL

Durable business truth.

Examples when implemented:

- canonical identities;
- class/enrollment relationships;
- Parent Notes;
- pickup events;
- Messages metadata/body where approved by Messaging design;
- food menus;
- notifications;
- audits;
- outbox events.

### Redis

Transient only.

Approved directions include:

- rate limiting;
- Parent Note quota counters;
- short pickup locks;
- live coordination/cache where safe;
- ephemeral realtime support.

Redis loss must not redefine durable business history.

### Object storage

Binary bytes:

- images;
- private documents;
- menu images/photos;
- class media;
- other approved media.

PostgreSQL stores canonical descriptors/ownership references.

---

## 10. Frontend architecture rules

- shared Web/Telegram feature UI belongs in `packages/frontend` when genuinely reusable;
- runtime shells remain in `apps/web` and `apps/telegram`;
- design tokens/platform-neutral components belong in `packages/ui`;
- one feature must not require loading unrelated domains;
- server state and authorization must not be replaced by frontend guesses;
- Arabic RTL, French LTR, and English LTR are foundational;
- Light is default; optional dark mode is pitch black with light text.

---

## 11. No cross-domain monoliths

Never create:

- `SchoolService` that owns every school feature;
- `ManagementRepository` for unrelated tables;
- a global `api.ts` that becomes implementation owner for all domains;
- a single giant frontend store for the whole application;
- a `common` or `utils` folder containing business rules from several domains;
- one migration/repair script that mutates unrelated domains.

If a workflow crosses domains, compose narrow interfaces and preserve ownership.

---

## 12. Architecture completion rule

A new domain/slice is architecturally acceptable only when:

1. the canonical owner is clear;
2. its dependencies point in allowed directions;
3. cross-domain reads/writes use explicit interfaces;
4. persistence ownership is unambiguous;
5. server-side authorization is defined;
6. Web/Telegram consumers do not create parallel truth;
7. governing docs are reconciled;
8. verification proves the implemented slice.

Do not turn this file into a progress ledger. Current implementation evidence belongs in `progress.md`.
