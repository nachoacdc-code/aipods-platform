-- AIpods Autonomous Layer + Pod System schema
-- Tables for agent runs, escalations, CEO reports, model router, pods, tasks, usage

-- ─── Pods ────────────────────────────────────────────────────────────────────
create table if not exists pods (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  pod_type      text not null,                       -- e.g. lead_research, marketing, sales, ops, creative
  status        text not null default 'active'
    check (status in ('active', 'paused', 'archived')),
  config_json   jsonb default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists pod_modules (
  id            uuid primary key default gen_random_uuid(),
  pod_id        uuid not null references pods(id) on delete cascade,
  module_type   text not null,
  enabled       boolean not null default true,
  added_at      timestamptz not null default now()
);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  pod_id          uuid not null references pods(id) on delete cascade,
  task_type       text not null,
  status          text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  units_consumed  numeric(10,2) not null default 0,
  input_json      jsonb default '{}',
  output_json     jsonb default '{}',
  lessons_json    jsonb default '[]',
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_tasks_pod on tasks(pod_id);
create index if not exists idx_tasks_status on tasks(status);

-- ─── Usage Periods ──────────────────────────────────────────────────────────
create table if not exists usage_periods (
  id            uuid primary key default gen_random_uuid(),
  period_start  timestamptz not null,
  period_end    timestamptz not null,
  units_used    numeric(10,2) not null default 0,
  units_limit   numeric(10,2) not null default 999999,  -- MVP: effectively unlimited
  created_at    timestamptz not null default now()
);

-- ─── Team Intelligence ──────────────────────────────────────────────────────
create table if not exists team_intelligence (
  id                uuid primary key default gen_random_uuid(),
  score             int not null default 0,
  documents_count   int not null default 0,
  tasks_completed   int not null default 0,
  lessons_learned   int not null default 0,
  calculated_at     timestamptz not null default now()
);

-- ─── Agent Runs ─────────────────────────────────────────────────────────────
create table if not exists agent_runs (
  id            uuid primary key default gen_random_uuid(),
  agent_type    text not null,                       -- ceo, pod_factory, sales, marketing, finance, customer_success, qa
  status        text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  input_json    jsonb default '{}',
  output_json   jsonb default '{}',
  model_used    text,
  tokens_used   int not null default 0,
  cost_usd      numeric(10,6) not null default 0,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index if not exists idx_agent_runs_type on agent_runs(agent_type);
create index if not exists idx_agent_runs_started on agent_runs(started_at desc);

-- ─── Escalations ────────────────────────────────────────────────────────────
create table if not exists escalations (
  id                uuid primary key default gen_random_uuid(),
  agent_type        text not null,
  severity          text not null default 'info'
    check (severity in ('info', 'action_required', 'urgent')),
  title             text not null,
  description       text,
  status            text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  founder_response  text,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);

create index if not exists idx_escalations_status on escalations(status);

-- ─── CEO Reports ────────────────────────────────────────────────────────────
create table if not exists ceo_reports (
  id                    uuid primary key default gen_random_uuid(),
  report_date           date not null,
  report_json           jsonb not null default '{}',
  key_metrics_json      jsonb default '{}',
  recommendations_json  jsonb default '[]',
  founder_notes         text,
  created_at            timestamptz not null default now()
);

-- ─── Model Router Config ────────────────────────────────────────────────────
create table if not exists model_router_config (
  id              uuid primary key default gen_random_uuid(),
  agent_type      text not null unique,
  default_model   text not null,
  fallback_model  text not null,
  updated_at      timestamptz not null default now(),
  updated_by      text not null default 'system'
);

-- Seed default config from reference doc Section 12
insert into model_router_config (agent_type, default_model, fallback_model) values
  ('ceo',              'claude-opus-4',    'claude-sonnet-4'),
  ('pod_factory',      'claude-sonnet-4',  'grok-3-fast'),
  ('sales',            'grok-3',           'grok-3-fast'),
  ('marketing',        'claude-sonnet-4',  'gemini-2.0-flash'),
  ('finance',          'claude-haiku-3.5', 'grok-3-fast'),
  ('customer_success', 'claude-sonnet-4',  'claude-haiku-3.5'),
  ('qa',               'claude-sonnet-4',  'claude-sonnet-4'),
  ('pod_task',         'claude-sonnet-4',  'gemini-2.0-flash')
on conflict (agent_type) do nothing;

-- ─── Model Upgrade Log ─────────────────────────────────────────────────────
create table if not exists model_upgrade_log (
  id                    uuid primary key default gen_random_uuid(),
  old_model             text not null,
  new_model             text not null,
  reason                text,
  benchmark_results_json jsonb default '{}',
  created_at            timestamptz not null default now()
);

-- ─── Triggers ───────────────────────────────────────────────────────────────
create trigger trg_pods_updated
  before update on pods
  for each row execute function update_updated_at();
