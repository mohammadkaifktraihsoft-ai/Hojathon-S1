do $$ begin
  create type public.blood_availability_status as enum ('available', 'limited', 'unavailable');
exception when duplicate_object then null;
end $$;

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  location text not null check (char_length(location) between 1 and 200),
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(name, location)
);

create table if not exists public.blood_inventory (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  blood_group text not null check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  availability public.blood_availability_status not null default 'unavailable',
  units integer check (units is null or units >= 0),
  updated_at timestamptz not null default now(),
  unique(hospital_id, blood_group)
);

create index if not exists blood_inventory_group_status_idx on public.blood_inventory(blood_group, availability);
alter table public.hospitals enable row level security;
alter table public.blood_inventory enable row level security;

drop policy if exists "authenticated users view hospitals" on public.hospitals;
create policy "authenticated users view hospitals" on public.hospitals for select to authenticated using (true);
drop policy if exists "authenticated users view blood inventory" on public.blood_inventory;
create policy "authenticated users view blood inventory" on public.blood_inventory for select to authenticated using (true);
drop policy if exists "admins manage hospitals" on public.hospitals;
create policy "admins manage hospitals" on public.hospitals for all to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
drop policy if exists "admins manage blood inventory" on public.blood_inventory;
create policy "admins manage blood inventory" on public.blood_inventory for all to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into public.hospitals (name, location, contact_phone) values ('Central City Hospital', 'Downtown', '+1 555 0100'), ('Riverside Medical Center', 'Riverside', '+1 555 0110') on conflict (name, location) do nothing;
