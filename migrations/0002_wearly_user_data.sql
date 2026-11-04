create table if not exists wearly_user_data (
  user_id text primary key references "user" ("id") on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
