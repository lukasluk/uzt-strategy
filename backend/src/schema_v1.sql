create extension if not exists pgcrypto;

create table if not exists institutions (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists platform_users (
  id uuid primary key,
  email text not null unique,
  display_name text not null,
  password_salt text not null,
  password_hash text not null,
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamptz not null default now()
);

create table if not exists institution_memberships (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  user_id uuid not null references platform_users(id) on delete cascade,
  role text not null check (role in ('member', 'institution_admin')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamptz not null default now(),
  unique (institution_id, user_id)
);

create table if not exists institution_invites (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  email text not null,
  role text not null check (role in ('member', 'institution_admin')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists strategy_cycles (
  id uuid primary key,
  institution_id uuid not null references institutions(id) on delete cascade,
  title text not null,
  state text not null default 'open' check (state in ('open', 'closed')),
  results_published boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists strategy_guidelines (
  id uuid primary key,
  cycle_id uuid not null references strategy_cycles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'merged', 'hidden')),
  line_side text not null default 'auto',
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists strategy_comments (
  id uuid primary key,
  guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  author_id uuid not null references platform_users(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists strategy_votes (
  id uuid primary key,
  guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  voter_id uuid not null references platform_users(id) on delete cascade,
  score integer not null check (score between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guideline_id, voter_id)
);

create table if not exists strategy_initiatives (
  id uuid primary key,
  cycle_id uuid not null references strategy_cycles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'disabled', 'merged', 'hidden')),
  line_side text not null default 'auto',
  map_x integer,
  map_y integer,
  created_by uuid references platform_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists strategy_initiative_guidelines (
  id uuid primary key,
  initiative_id uuid not null references strategy_initiatives(id) on delete cascade,
  guideline_id uuid not null references strategy_guidelines(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (initiative_id, guideline_id)
);

create table if not exists strategy_initiative_comments (
  id uuid primary key,
  initiative_id uuid not null references strategy_initiatives(id) on delete cascade,
  author_id uuid not null references platform_users(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists strategy_initiative_votes (
  id uuid primary key,
  initiative_id uuid not null references strategy_initiatives(id) on delete cascade,
  voter_id uuid not null references platform_users(id) on delete cascade,
  score integer not null check (score between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (initiative_id, voter_id)
);

create table if not exists audit_events (
  id uuid primary key,
  institution_id uuid references institutions(id) on delete cascade,
  actor_id uuid references platform_users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_memberships_institution on institution_memberships(institution_id);
create index if not exists idx_memberships_user on institution_memberships(user_id);
create index if not exists idx_invites_institution on institution_invites(institution_id);
create index if not exists idx_invites_email on institution_invites(email);
create index if not exists idx_cycles_institution on strategy_cycles(institution_id);
create index if not exists idx_guidelines_cycle on strategy_guidelines(cycle_id);
create index if not exists idx_comments_guideline on strategy_comments(guideline_id);
create index if not exists idx_votes_guideline on strategy_votes(guideline_id);
create index if not exists idx_votes_voter on strategy_votes(voter_id);
create index if not exists idx_initiatives_cycle on strategy_initiatives(cycle_id);
create index if not exists idx_initiative_guidelines_initiative on strategy_initiative_guidelines(initiative_id);
create index if not exists idx_initiative_guidelines_guideline on strategy_initiative_guidelines(guideline_id);
create index if not exists idx_initiative_comments_initiative on strategy_initiative_comments(initiative_id);
create index if not exists idx_initiative_votes_initiative on strategy_initiative_votes(initiative_id);
create index if not exists idx_initiative_votes_voter on strategy_initiative_votes(voter_id);

alter table if exists strategy_guidelines
  add column if not exists relation_type text not null default 'orphan';

alter table if exists strategy_guidelines
  add column if not exists parent_guideline_id uuid references strategy_guidelines(id) on delete set null;

create index if not exists idx_guidelines_parent on strategy_guidelines(parent_guideline_id);

alter table if exists strategy_cycles
  add column if not exists map_x integer;

alter table if exists strategy_cycles
  add column if not exists map_y integer;

alter table if exists strategy_guidelines
  add column if not exists map_x integer;

alter table if exists strategy_guidelines
  add column if not exists map_y integer;

alter table if exists strategy_guidelines
  add column if not exists line_side text not null default 'auto';

alter table if exists strategy_guidelines
  drop constraint if exists strategy_guidelines_status_check;

alter table if exists strategy_guidelines
  add constraint strategy_guidelines_status_check
  check (status in ('active', 'disabled', 'merged', 'hidden'));

alter table if exists strategy_initiatives
  add column if not exists line_side text not null default 'auto';

alter table if exists strategy_initiatives
  add column if not exists map_x integer;

alter table if exists strategy_initiatives
  add column if not exists map_y integer;

alter table if exists strategy_initiatives
  drop constraint if exists strategy_initiatives_status_check;

alter table if exists strategy_initiatives
  add constraint strategy_initiatives_status_check
  check (status in ('active', 'disabled', 'merged', 'hidden'));

alter table if exists strategy_cycles
  drop constraint if exists strategy_cycles_state_check;

update strategy_cycles
set state = case
  when state = 'open' then 'open'
  when state = 'closed' then 'closed'
  else 'closed'
end
where state not in ('open', 'closed')
   or state is null;

alter table if exists strategy_cycles
  alter column state set default 'open';

alter table if exists strategy_cycles
  add constraint strategy_cycles_state_check
  check (state in ('open', 'closed'));
