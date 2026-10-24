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
