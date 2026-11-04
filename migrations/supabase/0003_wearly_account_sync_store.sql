-- Wearly compatibility sync store. Each signed-in user can read/write only their own JSON snapshot.
create table if not exists public.wearly_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.wearly_user_data enable row level security;
drop policy if exists wearly_user_data_select_own on public.wearly_user_data;
drop policy if exists wearly_user_data_insert_own on public.wearly_user_data;
drop policy if exists wearly_user_data_update_own on public.wearly_user_data;
create policy wearly_user_data_select_own on public.wearly_user_data for select to authenticated using ((select auth.uid()) = user_id);
create policy wearly_user_data_insert_own on public.wearly_user_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy wearly_user_data_update_own on public.wearly_user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.wearly_user_data to authenticated;
