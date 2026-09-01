<!--
Sync Impact Report
- Version: initial -> 1.0.0
- Added principles:
  1. Preserve Working Behavior and Contracts
  2. Enforce Authorization on the Server
  3. Respect Established Architecture
  4. Use Real Integrations and Complete UI States
  5. Prefer Focused, Demo-Ready Delivery
  6. Validate Every Implementation Phase
- Added sections: Platform Boundaries; Delivery and Quality Gates; Governance
- Templates requiring follow-up: none present in the repository
-->

# Rentify Platform Constitution

## Core Principles

### I. Preserve Working Behavior and Contracts

All changes MUST preserve existing working guest, host, and administrator behavior unless an approved specification explicitly requires a behavioral change. Existing HTTP routes, methods, request and response shapes, status codes, authentication semantics, and persisted-data expectations MUST remain compatible. Any intentional contract change MUST be documented before implementation, coordinated across every affected application, and covered by validation. When requirements are ambiguous, compatibility with current behavior takes precedence.

Rationale: Rentify is a brownfield platform with multiple consumers of shared backend behavior; uncoordinated changes can break functioning user journeys.

### II. Enforce Authorization on the Server

Every administrative capability and protected resource MUST be authenticated and authorized by the NestJS server. The backend MUST verify the caller's role and permissions for each protected operation before accessing or mutating data. UI visibility, route guards, hidden controls, and client-side state MAY improve user experience but MUST NOT be treated as security boundaries. Authorization failures MUST use consistent HTTP responses and MUST NOT disclose protected data.

Rationale: A client can be bypassed or manipulated; only server-side enforcement protects administrative operations and platform data.

### III. Respect Established Architecture

Frontend work in `admin-ui` and `client` MUST follow the existing feature-based structure, colocating feature-specific components, hooks, API access, schemas, state, and types according to local conventions. Shared code MUST be promoted only when there is a demonstrated cross-feature use case.

Backend work in `server` MUST follow Clean Architecture: domain and application rules remain independent of NestJS controllers, Prisma, PostgreSQL, and other infrastructure. Controllers MUST translate transport concerns, use cases/services MUST coordinate business behavior, and repositories/adapters MUST isolate persistence and external systems. Dependencies MUST point toward business rules; framework or database details MUST NOT leak into domain logic.

Rationale: Consistency with established boundaries keeps brownfield changes understandable and limits coupling.

### IV. Use Real Integrations and Complete UI States

Product flows MUST use actual Rentify APIs and persisted data. Production code MUST NOT introduce hard-coded records, mock datasets, simulated success responses, or client-only mutations as substitutes for missing backend behavior. If an API capability is absent, it MUST be implemented through the server and database layers or explicitly declared out of scope.

Every data-driven screen and materially independent data region MUST provide intentional loading, empty, error, and success states. Errors MUST offer a useful message and, where appropriate, a retry or recovery action. Successful mutations MUST leave displayed state consistent with the server through invalidation, refetching, or a verified cache update.

Rationale: Real integrations expose actual system behavior, while complete states make demos and day-to-day usage reliable under normal network and data conditions.

### V. Prefer Focused, Demo-Ready Delivery

Implementations MUST make the smallest coherent change that satisfies the approved requirement. Unrelated refactors, broad rewrites, speculative abstractions, and opportunistic style changes MUST be excluded. New dependencies MUST be added only when existing platform capabilities cannot reasonably solve the problem, and the justification and operational impact MUST be recorded.

A working end-to-end demo and successful builds take priority over optional polish. Each increment SHOULD produce a demonstrable vertical slice using real data, with critical user paths completed before secondary enhancements.

Rationale: Focused changes reduce regression risk and keep the platform in a deliverable state.

### VI. Validate Every Implementation Phase

Validation MUST occur after every implementation phase, not only at final handoff. A phase is a coherent change to a layer, application, or end-to-end slice. At minimum, the affected package MUST pass its applicable lint, tests, type checks, and build before the next phase begins. Validation MUST include targeted checks of changed behavior and API compatibility; administrative changes MUST include authorization success and denial cases; UI changes MUST exercise loading, empty, error, and success states.

Failures MUST be resolved or explicitly documented with cause, impact, and reproduction steps before work proceeds. Final delivery MUST report commands run and any checks that could not be completed.

Rationale: Frequent validation localizes defects and protects the monorepo's working baseline.

## Platform Boundaries

- `admin-ui` is the administrator-facing Next.js application. It uses React, TypeScript, Tailwind CSS, Zustand, TanStack React Query, and Axios, and MUST consume server APIs rather than substitute local data.
- `client` is the existing guest and host Next.js application. Its working journeys and server contracts are compatibility constraints for all shared backend changes.
- `server` is the NestJS application. Business rules MUST follow Clean Architecture, Prisma MUST remain an infrastructure concern, and PostgreSQL is the system of record.
- Cross-package changes MUST be traced from database and server behavior through each affected API consumer. Shared contracts MUST remain synchronized without creating framework coupling between packages.
- Secrets, credentials, and environment-specific values MUST remain outside committed source. Database schema changes MUST use reviewed Prisma migrations and include a compatibility or rollout plan when existing data is affected.

## Delivery and Quality Gates

Before implementation, work MUST identify the affected user journey, packages, existing contracts, authorization rules, and expected UI states. The plan MUST divide work into phases that can be validated independently.

The default validation gates are:

1. For `server`: run relevant targeted tests, `npm test` when applicable, `npm run lint`, and `npm run build`. Run `npm run test:e2e` for changed HTTP flows when the required environment is available.
2. For `admin-ui`: run `npm run lint` and `npm run build`, plus targeted interaction checks for all four UI states and real API behavior.
3. For `client`: run `npm run lint` and `npm run build` whenever shared contracts or client code are affected, plus targeted checks of impacted guest or host journeys.
4. For cross-package work: validate the server contract first, then each affected consumer, and finally demonstrate the integrated path against actual services and data.

Generated formatting changes MUST remain scoped to touched files wherever practical. A phase is complete only when its applicable gates pass or an explicit exception is recorded. The final review MUST reject client-only authorization, mock production data, missing UI states, unapproved contract breaks, unrelated rewrites, and unjustified dependencies.

## Governance

This constitution is the highest-priority engineering guidance for Rentify specifications, plans, tasks, implementation, and review. When another project document conflicts with it, this constitution governs unless it is formally amended.

Amendments require: (1) a written proposal describing the change and rationale; (2) an impact review covering all three packages, contracts, security, migrations, and delivery workflow as applicable; (3) explicit approval by the project maintainers; and (4) updates to dependent templates or guidance in the same change.

Constitution versions follow semantic versioning:

- MAJOR: removes or materially redefines a governing principle or backward-compatibility expectation.
- MINOR: adds a principle or materially expands mandatory guidance.
- PATCH: clarifies wording without changing required behavior.

Every feature specification and implementation plan MUST include a constitution check before work begins and again before completion. Reviewers MUST verify compliance using repository evidence and recorded validation results. Exceptions MUST be narrow, time-bounded, justified in writing, and approved by maintainers; security and server-side authorization requirements are not waivable for production behavior.

**Version**: 1.0.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-08-20
