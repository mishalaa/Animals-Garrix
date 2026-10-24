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
