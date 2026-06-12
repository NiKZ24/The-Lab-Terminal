-- ============================================================================
-- THE LAB TERMINAL — Supabase schema
-- Run this ENTIRE file once in: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run (uses if-not-exists / create-or-replace).
-- ============================================================================

-- ---- admin email (must match ADMIN_EMAIL in src/lib/supabase.js) -----------
-- Used by policies/functions below to grant admin rights.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select lower(email) = 'nicksonjuans@gmail.com' from auth.users where id = auth.uid()),
    false);
$$;

-- ---- profiles --------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  approved    boolean not null default false,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  prefs       jsonb not null default '{}'::jsonb        -- watchlist, wallets, rules, log, settings
);

alter table public.profiles enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
drop policy if exists "admin reads all"    on public.profiles;
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin reads all"    on public.profiles for select using (public.is_admin());

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, approved, is_admin)
  values (new.id, new.email,
          lower(new.email) = 'nicksonjuans@gmail.com',   -- admin auto-approved
          lower(new.email) = 'nicksonjuans@gmail.com')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- invite codes ----------------------------------------------------------
create table if not exists public.invite_codes (
  code           text primary key,
  created_at     timestamptz not null default now(),
  used_by        uuid references auth.users(id),
  used_by_email  text,
  used_at        timestamptz
);

alter table public.invite_codes enable row level security;

-- only the admin can list/create codes; nobody else can read them directly
drop policy if exists "admin manages codes" on public.invite_codes;
create policy "admin manages codes" on public.invite_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- redeem function (callable by any signed-in user) ----------------------
-- Atomically claims an unused code and approves the caller's profile.
create or replace function public.redeem_invite_code(p_code text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_row   public.invite_codes%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Not signed in.');
  end if;

  select email into v_email from auth.users where id = v_uid;

  -- already approved? treat as success
  if exists (select 1 from public.profiles where id = v_uid and approved) then
    return jsonb_build_object('ok', true);
  end if;

  -- lock the code row to avoid double-spend
  select * into v_row from public.invite_codes
    where code = upper(trim(p_code)) for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid code.');
  end if;
  if v_row.used_by is not null then
    return jsonb_build_object('ok', false, 'error', 'This code has already been used.');
  end if;

  update public.invite_codes
     set used_by = v_uid, used_by_email = v_email, used_at = now()
   where code = v_row.code;

  insert into public.profiles (id, email, approved) values (v_uid, v_email, true)
    on conflict (id) do update set approved = true, email = excluded.email;

  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.redeem_invite_code(text) to authenticated;
grant execute on function public.is_admin() to authenticated;
