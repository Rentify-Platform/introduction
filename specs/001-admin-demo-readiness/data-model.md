# Data Model: Rentify Admin Demo Readiness

## Migration Assessment

Không dự kiến Prisma migration. Các entity và field cần thiết đã tồn tại; implementation phải ưu tiên invariant/use-case/UI thay vì sửa schema.

## Entities and Rules

### Account

- Identity: UUID `id`
- Relevant fields: `email`, profile names, `role`, `status`
- Roles: `guest`, `host`, `admin`
- Statuses: `active`, `suspended`, `banned`
- Admin transition rule:
  - Target `guest`/`host`: admin có thể chuyển sang status hợp lệ sau confirmation.
  - Target `admin`: không transition nào hợp lệ; backend trả 403 trước repository update.
  - Không có `superadmin`.

### Property

- Identity: UUID `id`; owner: `hostId`
- Relevant fields: title, city/address, `requiresLocalLicense`, status, timestamps
- Statuses exposed to admin mutation: `active`, `paused`, `archived`
- Planned transition rule:
  - `active`: host KYC phải `verified` và property license phải `verified` trong mọi trường hợp; `requiresLocalLicense` không miễn prerequisite này và admin không có override.
  - `paused`, `archived`: áp dụng theo domain/business constraints hiện hành.
- Admin confirmation không thay đổi state; chỉ confirmed API success mới thay đổi persisted state.

### Property License

- Related by `propertyId`
- Relevant fields: license number/type, issuer, jurisdiction, document URL, issue/expiry dates, status
- Statuses observed: `pending`, `verified`, `rejected`, `expired`
- Feature is read-only; no license status mutation in scope.
- Absence is an empty state, not an exceptional record.

### KYC Document

- Identity: UUID `id`; related by `accountId`
- Relevant fields: document type, country, document URLs, dates, status, rejection reason, reviewer, reviewed timestamp
- Review transitions:
  - `pending` → `verified` on approve
  - `pending` → `rejected` on reject with trimmed non-empty reason
  - Non-pending → no second review; return conflict/business error
- Reviewer is authenticated admin id supplied by server context, never trusted from request body.

### Ledger Balance

- Identified for demo by owner type `platform`, subtype `revenue`, currency `VND`
- Read-only in this feature
- Response must preserve integer minor units (`balanceCents`) and currency; UI formats for display without changing stored value.
- Missing account/data produces an explicit empty/unavailable state, not fabricated zero unless backend contract explicitly represents a real zero balance.

### Admin Session (UI projection)

- Token stored using existing mechanism
- Current user retrieved from API and contains role
- States: initializing, unauthenticated, unauthorized, authenticated-admin, expired/error
- Protected content renders only in authenticated-admin state.

## Relationships

```text
Account (host) 1 ── * Property 1 ── 0..1 PropertyLicense
Account         1 ── * KycDocument
Account (admin) 1 ── * reviewed KycDocument
Platform owner  1 ── * LedgerAccount ── balance projection
```

## Query and Mutation Consistency

- List queries remain paginated and server-filtered.
- Filter change resets page to 1.
- Mutation success invalidates relevant list/root key.
- Conflict/stale result triggers refetch; no optimistic moderation state.

