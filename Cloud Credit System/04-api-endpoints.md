# Cloud Credit System API Design

## 1. Balance and pricing

### GET /api/v1/credits/balance

- Returns total available, reserved, and expiring credits by bucket.

### GET /api/v1/credits/estimate

- Query parameters: service, operation, projectId, units, priority, region
- Returns estimatedCredits and pricing breakdown.

### GET /api/v1/credits/usage

- Query parameters: from, to, groupBy (project|service|operation|day)
- Returns usage and cost aggregates.

## 2. Transaction APIs

### POST /api/v1/credits/reserve

- Purpose: reserve credits before job execution
- Body: holdKey, projectId, service, operation, estimatedUnits, idempotencyKey
- Response: holdId, reservedAmount, expiresAt

### POST /api/v1/credits/settle

- Purpose: finalize actual cost and refund unused hold
- Body: holdKey, actualUnits, usageEventId, idempotencyKey
- Response: chargedAmount, refundedAmount, finalStatus

### POST /api/v1/credits/refund

- Purpose: manual or automated refund
- Body: referenceTransactionId, amount, reasonCode, idempotencyKey
- Response: refundTransactionId, newBalance

### GET /api/v1/credits/transactions

- Filters: organizationId, userId, projectId, type, status, from, to, cursor

## 3. Admin APIs

### POST /api/v1/admin/credits/grant

- Grants promotional or manual credits
- Body: organizationId, userId(optional), amount, bucketType, expiresAt, reason

### POST /api/v1/admin/credits/revoke

- Revokes available credits from target buckets

### POST /api/v1/admin/credits/adjust

- Manual signed adjustment with approval metadata

### GET /api/v1/admin/credits/monitoring

- Returns heavy usage accounts, anomalies, failed settlements, and quota breaches

### GET /api/v1/admin/reports/credits

- Exports daily/monthly financial and usage reports

## 4. Subscription and plan APIs

### GET /api/v1/billing/plans

- Returns available plans, included credits, overage policies

### POST /api/v1/billing/subscriptions

- Creates or updates subscription for organization

### POST /api/v1/billing/topups

- Purchases additional credit packs

### POST /api/v1/billing/webhooks/provider

- Receives Stripe/payment events and updates subscription state

## 5. Quota and throttling APIs

### GET /api/v1/quotas

- Returns active quota policy for org/project

### PUT /api/v1/quotas

- Upserts quota limits and hard/soft behavior

### GET /api/v1/usage/realtime

- Returns near real-time consumption and queue usage

## 6. Recommended response envelope

{
  "success": true,
  "requestId": "req_123",
  "data": { },
  "error": null
}

## 7. Security and reliability requirements

- Require idempotency key for all mutating credit endpoints
- Validate auth scope for org, project, and admin actions
- Record all admin mutations in audit_logs
- Return deterministic error codes:
- CREDIT_INSUFFICIENT
- CREDIT_HOLD_EXPIRED
- CREDIT_IDEMPOTENCY_CONFLICT
- QUOTA_EXCEEDED
- PLAN_LIMIT_REACHED
