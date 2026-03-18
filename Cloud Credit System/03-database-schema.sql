-- Cloud Credit System schema (PostgreSQL)
-- Designed for high scale and auditability.

CREATE TABLE IF NOT EXISTS organizations (
    id BIGSERIAL PRIMARY KEY,
    external_id TEXT UNIQUE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT REFERENCES organizations(id),
    email CITEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    owner_user_id BIGINT REFERENCES users(id),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_plans (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    monthly_price_cents BIGINT NOT NULL DEFAULT 0,
    included_credits BIGINT NOT NULL DEFAULT 0,
    overage_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    billing_plan_id BIGINT NOT NULL REFERENCES billing_plans(id),
    provider TEXT NOT NULL,
    provider_subscription_id TEXT NOT NULL,
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_subscription_id)
);

CREATE TABLE IF NOT EXISTS credit_balances (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    user_id BIGINT REFERENCES users(id),
    scope TEXT NOT NULL DEFAULT 'organization',
    bucket_type TEXT NOT NULL,
    total_credits NUMERIC(20,6) NOT NULL DEFAULT 0,
    reserved_credits NUMERIC(20,6) NOT NULL DEFAULT 0,
    available_credits NUMERIC(20,6) NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    priority SMALLINT NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (total_credits >= 0),
    CHECK (reserved_credits >= 0),
    CHECK (available_credits >= 0)
);

CREATE INDEX IF NOT EXISTS idx_credit_balances_org ON credit_balances(organization_id);
CREATE INDEX IF NOT EXISTS idx_credit_balances_user ON credit_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_balances_expiry ON credit_balances(expires_at);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    user_id BIGINT REFERENCES users(id),
    project_id BIGINT REFERENCES projects(id),
    subscription_id BIGINT REFERENCES subscriptions(id),
    balance_id BIGINT REFERENCES credit_balances(id),
    transaction_type TEXT NOT NULL,
    amount NUMERIC(20,6) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CREDIT',
    status TEXT NOT NULL DEFAULT 'posted',
    reason_code TEXT,
    source_service TEXT,
    resource_type TEXT,
    resource_id TEXT,
    usage_event_id TEXT,
    idempotency_key TEXT,
    reference_transaction_id BIGINT REFERENCES credit_transactions(id),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    posted_at TIMESTAMPTZ,
    CHECK (amount <> 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_credit_txn_idempotency ON credit_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_credit_txn_org_time ON credit_transactions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_txn_usage_event ON credit_transactions(usage_event_id);
CREATE INDEX IF NOT EXISTS idx_credit_txn_project_time ON credit_transactions(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS credit_holds (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    user_id BIGINT REFERENCES users(id),
    project_id BIGINT REFERENCES projects(id),
    hold_key TEXT NOT NULL UNIQUE,
    requested_amount NUMERIC(20,6) NOT NULL,
    consumed_amount NUMERIC(20,6) NOT NULL DEFAULT 0,
    released_amount NUMERIC(20,6) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    expires_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_holds_org_status ON credit_holds(organization_id, status);

CREATE TABLE IF NOT EXISTS usage_logs (
    id BIGSERIAL PRIMARY KEY,
    usage_event_id TEXT NOT NULL UNIQUE,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    user_id BIGINT REFERENCES users(id),
    project_id BIGINT REFERENCES projects(id),
    api_key_id TEXT,
    service TEXT NOT NULL,
    operation TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    unit_type TEXT NOT NULL,
    quantity NUMERIC(20,6) NOT NULL,
    unit_price NUMERIC(20,6) NOT NULL,
    multiplier NUMERIC(20,6) NOT NULL DEFAULT 1,
    estimated_credits NUMERIC(20,6),
    actual_credits NUMERIC(20,6),
    status TEXT NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_org_time ON usage_logs(organization_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_project_time ON usage_logs(project_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_service_operation ON usage_logs(service, operation, measured_at DESC);

CREATE TABLE IF NOT EXISTS job_executions (
    id BIGSERIAL PRIMARY KEY,
    job_id TEXT NOT NULL UNIQUE,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    user_id BIGINT REFERENCES users(id),
    project_id BIGINT REFERENCES projects(id),
    job_type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'standard',
    cpu_seconds NUMERIC(20,6) NOT NULL DEFAULT 0,
    gpu_seconds NUMERIC(20,6) NOT NULL DEFAULT 0,
    memory_gb_seconds NUMERIC(20,6) NOT NULL DEFAULT 0,
    storage_gb_hours NUMERIC(20,6) NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    failure_reason TEXT,
    hold_key TEXT REFERENCES credit_holds(hold_key),
    estimated_credits NUMERIC(20,6),
    actual_credits NUMERIC(20,6),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_job_exec_org_status ON job_executions(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_exec_project_time ON job_executions(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS pricing_rules (
    id BIGSERIAL PRIMARY KEY,
    service TEXT NOT NULL,
    operation TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    unit_type TEXT NOT NULL,
    base_credits NUMERIC(20,6) NOT NULL DEFAULT 0,
    unit_rate NUMERIC(20,6) NOT NULL,
    region_multiplier NUMERIC(20,6) NOT NULL DEFAULT 1,
    priority_multiplier NUMERIC(20,6) NOT NULL DEFAULT 1,
    min_credits NUMERIC(20,6) NOT NULL DEFAULT 0,
    max_credits NUMERIC(20,6),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_lookup ON pricing_rules(service, operation, resource_type, active, effective_from DESC);

CREATE TABLE IF NOT EXISTS quota_policies (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL REFERENCES organizations(id),
    project_id BIGINT REFERENCES projects(id),
    policy_scope TEXT NOT NULL,
    max_credits_per_day NUMERIC(20,6),
    max_credits_per_month NUMERIC(20,6),
    max_api_rps INTEGER,
    max_concurrent_jobs INTEGER,
    hard_limit BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quota_policies_org ON quota_policies(organization_id, active);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(id),
    actor_role TEXT,
    organization_id BIGINT REFERENCES organizations(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_time ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_time ON audit_logs(actor_user_id, created_at DESC);

-- Suggested partitioning at large scale:
-- 1) RANGE partition usage_logs by month on measured_at
-- 2) RANGE partition credit_transactions by month on created_at
-- 3) Keep hot partitions in primary storage, archive old partitions
