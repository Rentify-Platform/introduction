# Quickstart: Validate Rentify Admin Demo

## Prerequisites

- PostgreSQL and required Rentify infrastructure configured through existing environment files.
- Dependencies already installed in `server` and `admin-ui`.
- Real demo records prepared through existing seed/database workflow:
  - one active admin used for login;
  - another admin to test protected status mutation;
  - at least one guest and one host;
  - properties with and without submitted/verified license;
  - at least two pending KYC documents;
  - platform/revenue/VND ledger account or a known empty-state fixture.

Do not add hard-coded demo arrays to Admin UI.

## Phase Validation

From `server` after each backend phase:

```powershell
npm test -- --runInBand
npm run lint
npm run build
```

When an HTTP test environment is available:

```powershell
npm run test:e2e
```

From `admin-ui` after each frontend phase:

```powershell
npm run lint
npm run build
```

## Authorization Matrix

Exercise accounts list/status, properties list/license/status, KYC pending/review and platform balance:

| Credential | Expected |
|---|---|
| No token | 401, no protected data |
| Invalid/expired token | 401, Admin UI clears session and requests login |
| Guest token | 403, no protected data |
| Host token | 403, no protected data |
| Admin token | Contract-specific success |

Additional invariant checks:

- Admin updates guest/host status: allowed for valid transition.
- Admin updates own admin status: 403; persisted status unchanged.
- Admin updates another admin status: 403; persisted status unchanged.

## Main Demo Script

1. Open Admin UI and log in with active admin credentials.
2. Verify Overview loads platform balance from API and contains no fake KPIs/recent bookings.
3. Open Users, search/filter, attempt a guest/host status change, cancel once, then confirm; verify toast and refreshed persisted status.
4. Verify an admin row has no usable status action.
5. Open Properties, search/filter, inspect a license and its empty/error alternatives, cancel then confirm a valid status change.
6. Open KYC, inspect a document, cancel then confirm approval.
7. Reject another KYC document: verify blank reason is blocked, provide reason, confirm, and verify queue refresh.
8. Reload each screen and confirm all successful mutations persist.
9. Repeat protected API calls with guest/host tokens to verify backend denial.

## Five-State UI Matrix

For Overview balance, Users list, Properties list/license, and KYC queue/review verify:

- Loading: visible progress/skeleton; no false empty or zero.
- Empty: explicit no-data/no-result message and filter recovery where applicable.
- Error: distinct from empty, useful message, retry when safe.
- Unauthorized: protected data hidden; 401 login recovery and 403 access denied.
- Success: real API data rendered; actions reflect current server state.

## Release Gate

The feature is demo-ready only when:

- server and admin-ui builds pass;
- applicable lint/tests pass or every exception is recorded with impact;
- main demo script completes without serious runtime error;
- authorization matrix passes;
- no mock/hard-coded Admin business records remain;
- targeted guest/host regression checks pass.

