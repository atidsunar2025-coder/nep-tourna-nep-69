create extension if not exists pgcrypto;

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game text not null,
  format text not null default 'Single Elimination',
  description text,
  starts_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','live','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.tournaments enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "published tournaments are readable" on public.tournaments;
create policy "published tournaments are readable" on public.tournaments for select using (true);

-- Only authenticated administrators can create, edit, or delete tournaments.
drop policy if exists "admins can insert tournaments" on public.tournaments;
create policy "admins can insert tournaments" on public.tournaments for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can update tournaments" on public.tournaments;
create policy "admins can update tournaments" on public.tournaments for update to authenticated using (exists (select 1 from public.admin_users a where a.user_id = auth.uid())) with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can delete tournaments" on public.tournaments;
create policy "admins can delete tournaments" on public.tournaments for delete to authenticated using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- An administrator can verify their own admin row. Normal users cannot read the table.
drop policy if exists "admins can read own admin row" on public.admin_users;
create policy "admins can read own admin row" on public.admin_users for select to authenticated using (user_id = auth.uid());

-- SETUP: first create your administrator account through the app's normal sign-up page,
-- then run the following in Supabase SQL Editor, replacing the email with that account:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'YOUR_ADMIN_EMAIL';
