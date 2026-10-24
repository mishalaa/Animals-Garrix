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
