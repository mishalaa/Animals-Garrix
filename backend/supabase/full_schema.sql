-- =========================================
-- 20261019000001_helpers_and_profiles.sql
-- =========================================
-- PetPassport · helpers and profiles
-- User profiles, created automatically on sign-up, plus the shared updated_at trigger.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  language    text not null default 'en' check (language in ('en', 'bn')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();


-- =========================================
-- 20261019000002_pets_and_sharing.sql
-- =========================================
-- PetPassport · pets and sharing
-- Pets, per-pet membership (owner / editor / viewer) and the sharing functions.

-- ---------------------------------------------------------------------------
-- Pets and sharing
-- ---------------------------------------------------------------------------

create table public.pets (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name                  text not null,
  species               text not null default 'cat'
                          check (species in ('cat', 'dog', 'bird', 'rabbit', 'other')),
  breed                 text,                -- e.g. 'Persian', 'Local / Deshi', 'Mixed'
  breed_mix             text,                -- e.g. '50% Persian, 50% Deshi'
  coat_type             text,                -- short / long / hairless
  coat_pattern          text,                -- tabby / calico / tuxedo ...
  sex                   text not null default 'unknown' check (sex in ('male', 'female', 'unknown')),
  birth_date            date,
  birth_date_estimated  boolean not null default false,
  weight_kg             numeric(6, 2),
  neutered              boolean,
  microchip             text,
  distinguishing_marks  text,
  photo_path            text,                -- path in the pet-files bucket
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create table public.pet_members (
  pet_id      uuid not null references public.pets(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('owner', 'editor', 'viewer')),
  created_at  timestamptz not null default now(),
  primary key (pet_id, user_id)
);

-- Role check used by every policy. security definer avoids recursive RLS on pet_members.
create or replace function public.pet_role(p_pet uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.pet_members where pet_id = p_pet and user_id = auth.uid()
$$;

create or replace function public.can_view_pet(p_pet uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.pet_role(p_pet) is not null
$$;

create or replace function public.can_edit_pet(p_pet uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.pet_role(p_pet) in ('owner', 'editor')
$$;

-- The creator of a pet becomes its owner.
create or replace function public.add_pet_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.pet_members (pet_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;

create trigger pets_add_owner after insert on public.pets
  for each row execute function public.add_pet_owner();
create trigger pets_updated_at before update on public.pets
  for each row execute function public.set_updated_at();

-- Owners share a pet with another registered user by email.
create or replace function public.share_pet(p_pet uuid, p_email text, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
begin
  if public.pet_role(p_pet) is distinct from 'owner' then
    raise exception 'Only the owner can share this pet';
  end if;
  if p_role not in ('editor', 'viewer') then
    raise exception 'Role must be editor or viewer';
  end if;
  select id into v_user from auth.users where lower(email) = lower(p_email);
  if v_user is null then
    raise exception 'No account found for %', p_email;
  end if;
  insert into public.pet_members (pet_id, user_id, role) values (p_pet, v_user, p_role)
  on conflict (pet_id, user_id) do update set role = excluded.role;
end $$;

-- Lists who a pet is shared with, including names and emails, for members only.
create or replace function public.pet_members_detail(p_pet uuid)
returns table (user_id uuid, role text, full_name text, email text)
language sql stable security definer set search_path = public as $$
  select m.user_id, m.role, p.full_name, u.email::text
  from public.pet_members m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  where m.pet_id = p_pet and public.can_view_pet(p_pet)
  order by case m.role when 'owner' then 0 when 'editor' then 1 else 2 end
$$;


-- =========================================
-- 20261019000003_health_records.sql
-- =========================================
-- PetPassport · health records
-- Origin story, medical history, visits, medicines, dose logs and reports.
-- Every record belongs to one pet. updated_at and deleted_at allow offline sync later.

-- ---------------------------------------------------------------------------
-- Identity: origin (1:1 with pet)
-- ---------------------------------------------------------------------------

create table public.origins (
  pet_id               uuid primary key references public.pets(id) on delete cascade,
  source               text not null default 'other'
                         check (source in ('street_rescue', 'shelter', 'breeder', 'pet_shop', 'gift', 'born_at_home', 'other')),
  found_location       text,
  found_lat            double precision,
  found_lng            double precision,
  acquired_date        date,
  condition_at_rescue  text,
  rescuer_or_shelter   text,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create trigger origins_updated_at before update on public.origins
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Medical history
-- ---------------------------------------------------------------------------

create table public.conditions (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references public.pets(id) on delete cascade,
  name          text not null,
  kind          text not null default 'illness' check (kind in ('illness', 'chronic', 'injury', 'surgery')),
  status        text not null default 'active' check (status in ('active', 'managed', 'resolved')),
  severity      text check (severity in ('mild', 'moderate', 'severe')),
  diagnosed_on  date,
  resolved_on   date,
  symptoms      text,
  treatment     text,
  diagnosed_by  text,
  pre_adoption  boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index conditions_pet_idx on public.conditions(pet_id);
create trigger conditions_updated_at before update on public.conditions
  for each row execute function public.set_updated_at();

create table public.allergies (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references public.pets(id) on delete cascade,
  allergen    text not null,
  kind        text not null default 'other' check (kind in ('food', 'medicine', 'environment', 'other')),
  reaction    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index allergies_pet_idx on public.allergies(pet_id);
create trigger allergies_updated_at before update on public.allergies
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Vet visits, medicines and dose logs
-- ---------------------------------------------------------------------------

create table public.visits (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references public.pets(id) on delete cascade,
  condition_id  uuid references public.conditions(id) on delete set null,
  visit_date    date not null default current_date,
  clinic        text,
  vet_name      text,
  reason        text,
  diagnosis     text,
  notes         text,
  cost          numeric(10, 2),
  currency      text not null default 'BDT',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index visits_pet_idx on public.visits(pet_id, visit_date desc);
create trigger visits_updated_at before update on public.visits
  for each row execute function public.set_updated_at();

create table public.medicines (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references public.pets(id) on delete cascade,
  visit_id      uuid references public.visits(id) on delete set null,
  condition_id  uuid references public.conditions(id) on delete set null,
  name          text not null,
  kind          text not null default 'medicine'
                  check (kind in ('medicine', 'vaccine', 'deworming', 'flea_tick', 'supplement')),
  dose          text,
  frequency     text not null default 'daily'
                  check (frequency in ('once', 'daily', 'twice_daily', 'weekly', 'monthly', 'yearly')),
  times         text[] not null default array['09:00'],   -- local times of day, HH:MM
  start_date    date not null default current_date,
  end_date      date,
  total_doses   integer,
  next_due      date,                                      -- vaccines / deworming
  notes         text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index medicines_pet_idx on public.medicines(pet_id);
create trigger medicines_updated_at before update on public.medicines
  for each row execute function public.set_updated_at();

create table public.dose_logs (
  id             uuid primary key default gen_random_uuid(),
  pet_id         uuid not null references public.pets(id) on delete cascade,
  medicine_id    uuid not null references public.medicines(id) on delete cascade,
  scheduled_for  timestamptz not null,
  status         text not null check (status in ('done', 'skipped')),
  logged_by      uuid default auth.uid() references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  unique (medicine_id, scheduled_for)
);
create index dose_logs_pet_idx on public.dose_logs(pet_id, scheduled_for desc);
create trigger dose_logs_updated_at before update on public.dose_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reports (files live in the pet-files storage bucket)
-- ---------------------------------------------------------------------------

create table public.reports (
  id                    uuid primary key default gen_random_uuid(),
  pet_id                uuid not null references public.pets(id) on delete cascade,
  visit_id              uuid references public.visits(id) on delete set null,
  condition_id          uuid references public.conditions(id) on delete set null,
  title                 text not null,
  kind                  text not null default 'other'
                          check (kind in ('lab', 'xray', 'prescription', 'vaccine_card', 'invoice', 'other')),
  report_date           date not null default current_date,
  file_path             text,
  mime_type             text,
  extracted             jsonb,                -- AI scan output (Phase 2), unconfirmed until reviewed
  extraction_confirmed  boolean not null default false,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index reports_pet_idx on public.reports(pet_id, report_date desc);
create trigger reports_updated_at before update on public.reports
  for each row execute function public.set_updated_at();


-- =========================================
-- 20261019000004_row_level_security.sql
-- =========================================
-- PetPassport · row level security
-- Who can read and write what: members read, owners and editors write.

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles    enable row level security;
alter table public.pets        enable row level security;
alter table public.pet_members enable row level security;
alter table public.origins     enable row level security;
alter table public.conditions  enable row level security;
alter table public.allergies   enable row level security;
alter table public.visits      enable row level security;
alter table public.medicines   enable row level security;
alter table public.dose_logs   enable row level security;
alter table public.reports     enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- owner_id check lets "insert ... returning" read the new row before the owner trigger has run.
create policy "members read pets" on public.pets
  for select using (owner_id = auth.uid() or public.can_view_pet(id));
create policy "users create own pets" on public.pets
  for insert with check (owner_id = auth.uid());
create policy "editors update pets" on public.pets
  for update using (public.can_edit_pet(id)) with check (public.can_edit_pet(id));
create policy "owners delete pets" on public.pets
  for delete using (public.pet_role(id) = 'owner');

create policy "members read membership" on public.pet_members
  for select using (public.can_view_pet(pet_id));
create policy "owners manage membership" on public.pet_members
  for delete using (public.pet_role(pet_id) = 'owner' and user_id <> auth.uid());

-- Same rules for every pet-scoped table: members read, owners/editors write.
do $$
declare t text;
begin
  foreach t in array array['origins', 'conditions', 'allergies', 'visits', 'medicines', 'dose_logs', 'reports'] loop
    execute format('create policy "members read" on public.%I for select using (public.can_view_pet(pet_id))', t);
    execute format('create policy "editors insert" on public.%I for insert with check (public.can_edit_pet(pet_id))', t);
    execute format('create policy "editors update" on public.%I for update using (public.can_edit_pet(pet_id)) with check (public.can_edit_pet(pet_id))', t);
    execute format('create policy "editors delete" on public.%I for delete using (public.can_edit_pet(pet_id))', t);
  end loop;
end $$;


-- =========================================
-- 20261019000005_storage.sql
-- =========================================
-- PetPassport · storage
-- Private file bucket for pet photos and reports, stored as <pet_id>/<file>.

-- ---------------------------------------------------------------------------
-- Storage: private bucket, files stored as <pet_id>/<file>
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('pet-files', 'pet-files', false)
on conflict (id) do nothing;

create policy "members read pet files" on storage.objects
  for select using (
    bucket_id = 'pet-files' and public.can_view_pet(((storage.foldername(name))[1])::uuid)
  );
create policy "editors upload pet files" on storage.objects
  for insert with check (
    bucket_id = 'pet-files' and public.can_edit_pet(((storage.foldername(name))[1])::uuid)
  );
create policy "editors update pet files" on storage.objects
  for update using (
    bucket_id = 'pet-files' and public.can_edit_pet(((storage.foldername(name))[1])::uuid)
  );
create policy "editors delete pet files" on storage.objects
  for delete using (
    bucket_id = 'pet-files' and public.can_edit_pet(((storage.foldername(name))[1])::uuid)
  );
