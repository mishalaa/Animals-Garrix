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
