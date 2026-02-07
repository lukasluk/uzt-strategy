create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key,
  name text not null,
  role text not null check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists guidelines (
  id uuid primary key,
  title text not null,
  description text,
  tags text,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key,
  guideline_id uuid not null references guidelines(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists proposals (
  id uuid primary key,
  guideline_id uuid not null references guidelines(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists initiatives (
  id uuid primary key,
  guideline_id uuid not null references guidelines(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  action text not null,
  kpi text,
  created_at timestamptz not null default now()
);

create table if not exists votes (
  id uuid primary key,
  guideline_id uuid not null references guidelines(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  score integer not null check (score between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guideline_id, user_id)
);

create table if not exists settings (
  key text primary key,
  value text not null
);

insert into settings (key, value)
  values ('results_published', 'false')
  on conflict (key) do nothing;
