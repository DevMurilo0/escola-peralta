begin;

-- Incremental: retain all existing tables, associations, RLS and academic RPCs.
-- No teacher_id parameter: identity comes exclusively from the authenticated JWT.
create function public.create_teacher_class(p_name text, p_grade_level text, p_shift text, p_school_year integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare cid uuid; actor_role text;
begin
  select role into actor_role from public.profiles where id = auth.uid() and active;
  if actor_role is null then raise exception 'Acesso negado'; end if;
  if p_name is null or length(trim(p_name)) not between 2 and 100
     or p_grade_level is null or length(trim(p_grade_level)) not between 1 and 100
     or p_shift is null or p_shift not in ('Manhã','Tarde','Integral')
     or p_school_year is null or p_school_year not between 2000 and 2200 then
    raise exception 'Confira os dados da turma';
  end if;
  insert into public.classes(name, grade_level, shift, school_year)
    values(trim(p_name), trim(p_grade_level), p_shift, p_school_year) returning id into cid;
  -- Admins retain global access; the existing trigger only accepts teachers in this association.
  if actor_role = 'teacher' then
    insert into public.teacher_classes(teacher_id, class_id, can_manage_students)
      values(auth.uid(), cid, true);
  end if;
  insert into public.audit_logs(user_id,action,entity_type,entity_id)
    values(auth.uid(),'class_created','classes',cid);
  return cid;
end $$;

-- Direct class writes remain admin-only under existing RLS. Teachers use this limited RPC.
create function public.update_teacher_class(p_class uuid, p_name text, p_grade_level text, p_shift text, p_school_year integer, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare previous public.classes;
begin
  if not private.can_class(p_class, true) then raise exception 'Acesso negado'; end if;
  select * into previous from public.classes where id=p_class for update;
  if not found then raise exception 'Turma não encontrada'; end if;
  if not previous.active and not private.is_admin() then raise exception 'Turma arquivada: somente consulta'; end if;
  if p_name is null or length(trim(p_name)) not between 2 and 100
     or p_grade_level is null or length(trim(p_grade_level)) not between 1 and 100
     or p_shift is null or p_shift not in ('Manhã','Tarde','Integral')
     or p_school_year is null or p_school_year not between 2000 and 2200 or p_active is null then
    raise exception 'Confira os dados da turma';
  end if;
  if p_school_year <> previous.school_year and (
    exists(select 1 from public.enrollments where class_id=p_class) or
    exists(select 1 from public.attendance_sessions where class_id=p_class) or
    exists(select 1 from public.curriculum_records where class_id=p_class)
  ) then raise exception 'Preserve o ano letivo de turmas com histórico. Crie uma nova turma para outro ano.'; end if;
  update public.classes set name=trim(p_name), grade_level=trim(p_grade_level), shift=p_shift,
    school_year=p_school_year, active=p_active where id=p_class;
  insert into public.audit_logs(user_id,action,entity_type,entity_id)
    values(auth.uid(),case when previous.active and not p_active then 'class_archived' else 'class_updated' end,'classes',p_class);
end $$;

create table public.curriculum_records (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id),
  term integer not null check(term between 1 and 4),
  date date not null,
  subject text not null check(length(trim(subject)) between 1 and 150),
  content text not null check(length(trim(content)) between 1 and 10000),
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index curriculum_class_term_date on public.curriculum_records(class_id,term,date desc,id);
alter table public.curriculum_records enable row level security;
revoke all on public.curriculum_records from public, anon, authenticated;
grant select,insert,update,delete on public.curriculum_records to authenticated;
create policy curriculum_read on public.curriculum_records for select to authenticated
  using(private.can_class(class_id));
create policy curriculum_create on public.curriculum_records for insert to authenticated
  with check(created_by=auth.uid() and private.can_class(class_id) and exists(select 1 from public.classes c where c.id=class_id and c.active));
create policy curriculum_edit on public.curriculum_records for update to authenticated
  using(private.can_class(class_id) and exists(select 1 from public.classes c where c.id=class_id and c.active))
  with check(private.can_class(class_id) and exists(select 1 from public.classes c where c.id=class_id and c.active));
create policy curriculum_delete on public.curriculum_records for delete to authenticated
  using(private.can_class(class_id) and exists(select 1 from public.classes c where c.id=class_id and c.active));

create function private.validate_curriculum() returns trigger language plpgsql set search_path='' as $$
begin
  if TG_OP='UPDATE' and (new.id is distinct from old.id or new.class_id is distinct from old.class_id
     or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at) then
    raise exception 'Não é permitido transferir conteúdo ou alterar sua autoria';
  end if;
  if extract(year from new.date)::int <> (select school_year from public.classes where id=new.class_id) then
    raise exception 'Data fora do ano letivo';
  end if;
  new.subject := trim(new.subject); new.content := trim(new.content);
  new.updated_at := clock_timestamp();
  if TG_OP='INSERT' then new.created_at := new.updated_at; end if;
  return new;
end $$;
create trigger validate_curriculum before insert or update on public.curriculum_records
  for each row execute function private.validate_curriculum();
create function private.audit_curriculum() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.audit_logs(user_id,action,entity_type,entity_id)
    values(auth.uid(),TG_OP,'curriculum_records',case when TG_OP='DELETE' then old.id else new.id end);
  return null;
end $$;
create trigger curriculum_audit after insert or update or delete on public.curriculum_records
  for each row execute function private.audit_curriculum();
revoke all on function private.validate_curriculum(), private.audit_curriculum() from public,anon,authenticated;
revoke all on function public.create_teacher_class(text,text,text,integer), public.update_teacher_class(uuid,text,text,text,integer,boolean) from public,anon;
grant execute on function public.create_teacher_class(text,text,text,integer), public.update_teacher_class(uuid,text,text,text,integer,boolean) to authenticated;
commit;
