-- Proof photo storage for quest evidence uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proof-photos',
  'proof-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload own proof photos'
  ) then
    create policy "Users can upload own proof photos"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'proof-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can read own proof photos'
  ) then
    create policy "Users can read own proof photos"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'proof-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update own proof photos'
  ) then
    create policy "Users can update own proof photos"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'proof-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'proof-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete own proof photos'
  ) then
    create policy "Users can delete own proof photos"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'proof-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
