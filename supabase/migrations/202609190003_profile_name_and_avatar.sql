begin;

alter table public.profiles
  add column if not exists avatar_path text;

create or replace function public.update_own_profile_name(
  p_full_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_full_name, ''));
begin
  if auth.uid() is null then
    raise exception 'Sessão inválida.';
  end if;

  if length(v_name) < 3 or length(v_name) > 150 then
    raise exception 'Informe um nome entre 3 e 150 caracteres.';
  end if;

  update public.profiles
  set full_name = v_name,
      updated_at = now()
  where id = auth.uid()
    and active;

  if not found then
    raise exception 'Perfil não encontrado ou inativo.';
  end if;
end
$$;

create or replace function public.update_own_profile_avatar(
  p_avatar_path text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_path text := nullif(trim(coalesce(p_avatar_path, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Sessão inválida.';
  end if;

  if v_path is not null
     and split_part(v_path, '/', 1) <> auth.uid()::text then
    raise exception 'Caminho de avatar inválido.';
  end if;

  update public.profiles
  set avatar_path = v_path,
      updated_at = now()
  where id = auth.uid()
    and active;

  if not found then
    raise exception 'Perfil não encontrado ou inativo.';
  end if;
end
$$;

revoke all on function public.update_own_profile_name(text)
  from public, anon;
revoke all on function public.update_own_profile_avatar(text)
  from public, anon;
grant execute on function public.update_own_profile_name(text)
  to authenticated;
grant execute on function public.update_own_profile_avatar(text)
  to authenticated;

do $do$
begin
  if exists(select 1 from pg_namespace where nspname = 'storage') then
    execute $bucket$
      insert into storage.buckets(
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
      )
      values(
        'profile-avatars',
        'profile-avatars',
        true,
        3145728,
        array['image/jpeg','image/png','image/webp']
      )
      on conflict (id) do update
        set public = excluded.public,
            file_size_limit = excluded.file_size_limit,
            allowed_mime_types = excluded.allowed_mime_types
    $bucket$;

    execute 'drop policy if exists profile_avatars_insert on storage.objects';
    execute 'drop policy if exists profile_avatars_update on storage.objects';
    execute 'drop policy if exists profile_avatars_delete on storage.objects';

    execute $policy$
      create policy profile_avatars_insert
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
    $policy$;

    execute $policy$
      create policy profile_avatars_update
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
    $policy$;

    execute $policy$
      create policy profile_avatars_delete
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'profile-avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
    $policy$;
  end if;
end
$do$;

notify pgrst, 'reload schema';

commit;
