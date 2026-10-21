begin;

-- Keep profiles as stable historical author identities after Auth removal.
alter table public.profiles
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_token uuid;

-- Production inspection confirmed this is the only public -> auth.users FK.
alter table public.profiles drop constraint if exists profiles_id_fkey;

create index if not exists profiles_active_role_idx
  on public.profiles(role, active) where deleted_at is null;

-- Authorization always checks current database state. An unexpired JWT alone
-- is insufficient after a profile is disabled or archived.
create or replace function private.is_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles
    where id=auth.uid() and active and deleted_at is null)
$$;
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles
    where id=auth.uid() and active and deleted_at is null and role='admin')
$$;
create or replace function private.can_class(cid uuid, manage boolean default false)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_admin() or exists(
    select 1 from public.teacher_classes t
    join public.profiles p on p.id=t.teacher_id
    where t.class_id=cid and p.id=auth.uid() and p.active
      and p.deleted_at is null and (not manage or t.can_manage_students))
$$;
revoke all on function private.is_active(),private.is_admin(),private.can_class(uuid,boolean)
  from public,anon,authenticated;
grant execute on function private.is_active(),private.is_admin(),private.can_class(uuid,boolean)
  to authenticated;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using(
  private.is_admin()
  or (id=auth.uid() and active and deleted_at is null)
  or (active and deleted_at is null and exists(
    select 1 from public.teacher_classes t
    where t.teacher_id=profiles.id and private.can_class(t.class_id)))
);
drop policy if exists settings_read on public.school_settings;
create policy settings_read on public.school_settings for select to authenticated
  using(private.is_active());

create or replace function private.validate_association()
returns trigger language plpgsql security definer set search_path='' as $$ begin
 if not exists(select 1 from public.profiles where id=new.teacher_id
   and role='teacher' and active and deleted_at is null)
 then raise exception 'Selecione um professor ativo'; end if;
 return new; end $$;

create or replace function private.protect_last_admin()
returns trigger language plpgsql security definer set search_path='' as $$ begin
 perform pg_advisory_xact_lock(721991);
 if old.role='admin' and old.active and old.deleted_at is null
   and (new.role<>'admin' or not new.active or new.deleted_at is not null)
   and not exists(select 1 from public.profiles where role='admin' and active
     and deleted_at is null and id<>old.id)
 then raise exception 'Não é possível desativar o último administrador'; end if;
 return new; end $$;

-- Self-service RPCs explicitly reject stale sessions too.
create or replace function public.update_own_profile_name(p_full_name text)
returns void language plpgsql security definer set search_path='' as $$
declare v_name text:=trim(coalesce(p_full_name,'')); begin
 if auth.uid() is null then raise exception 'Sessão inválida.'; end if;
 if length(v_name)<3 or length(v_name)>150 then
   raise exception 'Informe um nome entre 3 e 150 caracteres.'; end if;
 update public.profiles set full_name=v_name,updated_at=now()
 where id=auth.uid() and active and deleted_at is null;
 if not found then raise exception 'Perfil não encontrado ou inativo.'; end if;
end $$;
create or replace function public.update_own_profile_avatar(p_avatar_path text)
returns void language plpgsql security definer set search_path='' as $$
declare v_path text:=nullif(trim(coalesce(p_avatar_path,'')),''); begin
 if auth.uid() is null then raise exception 'Sessão inválida.'; end if;
 if v_path is not null and split_part(v_path,'/',1)<>auth.uid()::text then
   raise exception 'Caminho de avatar inválido.'; end if;
 update public.profiles set avatar_path=v_path,updated_at=now()
 where id=auth.uid() and active and deleted_at is null;
 if not found then raise exception 'Perfil não encontrado ou inativo.'; end if;
end $$;

-- The original allow-list did not include the existing Worker action names.
create or replace function public.log_admin_event(p_action text,p_entity uuid)
returns void language plpgsql security definer set search_path='' as $$ begin
 if not private.is_admin() or p_action not in
   ('teacher_created','master_teacher_created','master_teacher_updated')
 then raise exception 'Acesso negado'; end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id)
 values(auth.uid(),p_action,'profiles',p_entity);
end $$;

-- Persistent snapshot makes compensation retryable even after a Worker crash.
-- The private schema is inaccessible to frontend roles.
create table if not exists private.teacher_deletion_operations(
 teacher_id uuid primary key references public.profiles(id),
 token uuid not null unique,
 actor_id uuid not null references public.profiles(id),
 profile_snapshot jsonb not null,
 links_snapshot jsonb not null,
 created_at timestamptz not null default now()
);
revoke all on private.teacher_deletion_operations from public,anon,authenticated;

create or replace function public.master_prepare_teacher_deletion(
 p_teacher uuid,p_actor uuid,p_token uuid
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_profile public.profiles; v_operation private.teacher_deletion_operations;
 v_links jsonb; begin
 if p_teacher is null or p_actor is null or p_token is null or p_teacher=p_actor
 then raise exception 'Operação inválida'; end if;
 if not exists(select 1 from public.profiles where id=p_actor and role='admin'
   and active and deleted_at is null)
 then raise exception 'Administrador inválido'; end if;
 select * into v_profile from public.profiles where id=p_teacher for update;
 if not found or v_profile.role<>'teacher' then raise exception 'Professor não encontrado'; end if;
 select * into v_operation from private.teacher_deletion_operations
 where teacher_id=p_teacher;
 if found then return jsonb_build_object('status','prepared','token',v_operation.token,
   'avatar_path',v_operation.profile_snapshot->>'avatar_path'); end if;
 if v_profile.deleted_at is not null then
   return jsonb_build_object('status','already_deleted'); end if;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into v_links from (
   select teacher_id,class_id,can_manage_students from public.teacher_classes
   where teacher_id=p_teacher) t;
 insert into private.teacher_deletion_operations(teacher_id,token,actor_id,profile_snapshot,links_snapshot)
 values(p_teacher,p_token,p_actor,jsonb_build_object(
   'full_name',v_profile.full_name,'email',v_profile.email,'active',v_profile.active,
   'avatar_path',v_profile.avatar_path),v_links);
 delete from public.teacher_classes where teacher_id=p_teacher;
 update public.profiles set full_name='Professor excluído',
   email='deleted+'||p_teacher::text||'@invalid.peralta.local',avatar_path=null,
   active=false,deleted_at=clock_timestamp(),deletion_token=p_token,
   updated_at=clock_timestamp() where id=p_teacher and role='teacher';
 return jsonb_build_object('status','prepared','token',p_token,
   'avatar_path',v_profile.avatar_path);
end $$;

create or replace function public.master_restore_teacher_deletion(
 p_teacher uuid,p_token uuid
) returns boolean language plpgsql security definer set search_path='' as $$
declare v_operation private.teacher_deletion_operations; v_link jsonb; begin
 select * into v_operation from private.teacher_deletion_operations
 where teacher_id=p_teacher and token=p_token for update;
 if not found then return false; end if;
 update public.profiles set full_name=v_operation.profile_snapshot->>'full_name',
   email=v_operation.profile_snapshot->>'email',
   active=(v_operation.profile_snapshot->>'active')::boolean,
   avatar_path=v_operation.profile_snapshot->>'avatar_path',deleted_at=null,
   deletion_token=null,updated_at=clock_timestamp()
 where id=p_teacher and deletion_token=p_token;
 if not found then return false; end if;
 for v_link in select * from jsonb_array_elements(v_operation.links_snapshot) loop
   insert into public.teacher_classes(teacher_id,class_id,can_manage_students)
   values((v_link->>'teacher_id')::uuid,(v_link->>'class_id')::uuid,
     (v_link->>'can_manage_students')::boolean)
   on conflict(teacher_id,class_id) do nothing;
 end loop;
 delete from private.teacher_deletion_operations where teacher_id=p_teacher;
 return true;
end $$;

create or replace function public.master_finalize_teacher_deletion(
 p_teacher uuid,p_actor uuid,p_token uuid
) returns boolean language plpgsql security definer set search_path='' as $$ begin
 perform 1 from private.teacher_deletion_operations
 where teacher_id=p_teacher and token=p_token for update;
 if not found then return exists(select 1 from public.profiles
   where id=p_teacher and deleted_at is not null); end if;
 update public.profiles set deletion_token=null,updated_at=clock_timestamp()
 where id=p_teacher and deletion_token=p_token and deleted_at is not null;
 if not found then raise exception 'Estado de exclusão inconsistente'; end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id)
 values(p_actor,'master_teacher_deleted','profiles',p_teacher);
 delete from private.teacher_deletion_operations where teacher_id=p_teacher;
 return true;
end $$;

revoke all on function public.master_prepare_teacher_deletion(uuid,uuid,uuid),
 public.master_restore_teacher_deletion(uuid,uuid),
 public.master_finalize_teacher_deletion(uuid,uuid,uuid)
 from public,anon,authenticated;
do $do$ begin
 if exists(select 1 from pg_roles where rolname='service_role') then
  execute 'grant execute on function public.master_prepare_teacher_deletion(uuid,uuid,uuid) to service_role';
  execute 'grant execute on function public.master_restore_teacher_deletion(uuid,uuid) to service_role';
  execute 'grant execute on function public.master_finalize_teacher_deletion(uuid,uuid,uuid) to service_role';
 end if;
end $do$;

-- Avatar writes must not trust auth.uid() alone because old JWTs can remain
-- cryptographically valid until expiration.
do $do$ begin
 if exists(select 1 from pg_namespace where nspname='storage') then
  execute 'drop policy if exists profile_avatars_insert on storage.objects';
  execute 'drop policy if exists profile_avatars_update on storage.objects';
  execute 'drop policy if exists profile_avatars_delete on storage.objects';
  execute $policy$ create policy profile_avatars_insert on storage.objects
   for insert to authenticated with check(bucket_id='profile-avatars'
    and (storage.foldername(name))[1]=auth.uid()::text and private.is_active()) $policy$;
  execute $policy$ create policy profile_avatars_update on storage.objects
   for update to authenticated using(bucket_id='profile-avatars'
    and (storage.foldername(name))[1]=auth.uid()::text and private.is_active())
   with check(bucket_id='profile-avatars'
    and (storage.foldername(name))[1]=auth.uid()::text and private.is_active()) $policy$;
  execute $policy$ create policy profile_avatars_delete on storage.objects
   for delete to authenticated using(bucket_id='profile-avatars'
    and (storage.foldername(name))[1]=auth.uid()::text and private.is_active()) $policy$;
 end if;
end $do$;

notify pgrst,'reload schema';
commit;
