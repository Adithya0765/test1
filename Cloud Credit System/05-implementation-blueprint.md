# Cloud Credit System Implementation Blueprint

## A. Integration points in current backend

Use these files as initial insertion points:

- API middleware and routing host: [server.js](server.js)
- Existing admin auth and admin routes: [server.js](server.js)
- Existing admin UI controls: [admin-page/app.js](admin-page/app.js)

## B. Minimal first rollout (Phase 1)

1. Add new Postgres tables from [Cloud Credit System/03-database-schema.sql](Cloud%20Credit%20System/03-database-schema.sql)
2. Add Credit Service module:
- reserveCredits
- settleCredits
- refundCredits
- getBalance
3. Add API endpoints from [Cloud Credit System/04-api-endpoints.md](Cloud%20Credit%20System/04-api-endpoints.md)
4. Add metering events for:
- /api/forms/:slug/submit
- /api/admin/email/send
- future compute endpoints
5. Add admin pages for grant/revoke/adjust and monitoring

## C. Phase 2 (workspace and compute support)

1. Introduce organizations, projects, and workspace membership APIs
2. Create job submission endpoint and async queue processing
3. Enforce pre-run reservation and post-run settlement for each job
4. Add storage metering worker for periodic usage billing

## D. Phase 3 (enterprise hardening)

1. Add anomaly detector and abuse signals
2. Add approval workflow for high-value manual credit actions
3. Add partitioning for usage_logs and credit_transactions
4. Add BI exports for finance and customer success

## E. Example transaction flow

1. User starts simulation in workspace
2. Platform requests estimate
3. Credit Service reserves 120 credits
4. Job executes for 84 credits actual
5. Credit Service settles 84 and refunds 36
6. User dashboard shows final cost and updated balance
7. Admin monitoring receives usage event and anomaly score update

## F. Guardrails

- Never update balances directly without ledger entry
- Never process duplicate debit when idempotency key repeats
- Never allow negative available balance unless overage flag is enabled by plan
- Always write audit logs for admin balance actions
