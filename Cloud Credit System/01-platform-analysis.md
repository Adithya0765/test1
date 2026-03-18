# Cloud Credit System: Platform Analysis

## 1. Current platform components found in codebase

- Main backend API and data layer: [server.js](server.js)
- API entrypoint wrapper for serverless: [api/index.js](api/index.js)
- Main user registration and contact UI flow: [main.js](main.js)
- Public registration portal: [registration.html](registration.html)
- Admin panel app shell and management UI: [admin-page/app.js](admin-page/app.js)
- QStudio public landing and access request flow: [_qstudio_publish/app.js](_qstudio_publish/app.js)

## 2. User roles and permission model (as-is and target)

- Guest (unauthenticated)
- Registered user (public registration completed)
- Workspace member (future role for project/workspace usage)
- Workspace admin (future role for budget/quota controls)
- Organization owner (future role for billing/subscription ownership)
- Platform admin (already exists in admin APIs with OTP login)

## 3. Existing resource-consuming operations in current platform

- Registration submissions via POST /api/register in [server.js](server.js)
- Contact submissions via POST /api/contact in [server.js](server.js)
- Career submissions via POST /api/careers/apply in [server.js](server.js)
- Public dynamic form submissions via POST /api/forms/:slug/submit in [server.js](server.js)
- Admin bulk email send via POST /api/admin/email/send in [server.js](server.js)
- Admin CRUD operations for forms, responses, and records in [server.js](server.js)

## 4. Existing data storage usage

- Postgres in production (preferred) and SQLite fallback locally in [server.js](server.js)
- Current tables: registrations, contact_messages, career_applications, forms, form_responses

## 5. Compute/API/project workload gaps vs target SaaS platform

The current implementation is mostly a portal + admin data management backend. To support cloud-credit economics similar to major cloud providers, the following target platform entities should be introduced:

- Projects/workspaces
- API keys scoped by workspace
- Compute jobs and simulation tasks
- Metered storage artifacts
- GPU/CPU job scheduling
- Team-level shared budgets and quotas

## 6. Credit consumption points to introduce

Credits should be consumed at the moment of resource reservation, then finalized at completion.

- API request metering (per call and per token/unit)
- Compute job reservation and execution (CPU/GPU minute model)
- Simulation execution (job complexity and duration weighted)
- Storage consumed by artifacts and datasets (GB-hour or GB-month)
- Premium feature calls (advanced analytics, priority queue, export, high-availability)
- Notification/email overage for bulk operations

## 7. Recommended migration path from current codebase

- Keep current business APIs unchanged initially
- Add a usage metering middleware around future protected endpoints
- Add credit ledger and balance tables in Postgres
- Add billing and subscription objects
- Add asynchronous job execution service and usage event pipeline
- Add admin credit controls and user dashboard endpoints
