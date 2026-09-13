begin;

create function public.admin_update_student(
  p_student uuid,
  p_name text,
  p_birth date
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'Acesso negado'; end if;
  if p_student is null
     or p_name is null
     or length(trim(p_name)) not between 3 and 150
     or p_birth is null
     or p_birth > current_date then
    raise exception 'Confira os dados do aluno';
  end if;

  update public.students
     set full_name = trim(p_name), birth_date = p_birth, updated_at = now()
   where id = p_student and active;
  if not found then raise exception 'Aluno ativo não encontrado'; end if;

  insert into public.audit_logs(user_id, action, entity_type, entity_id)
    values(auth.uid(), 'student_updated', 'students', p_student);
end;
$$;

create function public.admin_transfer_student(
  p_student uuid,
  p_target_class uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_year integer;
begin
  if not private.is_admin() then raise exception 'Acesso negado'; end if;
  if p_student is null or p_target_class is null then
    raise exception 'Confira o aluno e a turma';
  end if;

  perform 1 from public.students where id = p_student and active for update;
  if not found then raise exception 'Aluno ativo não encontrado'; end if;

  select school_year into target_year
    from public.classes
   where id = p_target_class and active
   for update;
  if target_year is null then raise exception 'Turma ativa não encontrada'; end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_student::text || ':' || target_year::text, 0)
  );

  update public.enrollments
     set status = 'inactive'
   where student_id = p_student
     and school_year = target_year
     and status = 'active'
     and class_id <> p_target_class;

  insert into public.enrollments(student_id, class_id, school_year, status)
    values(p_student, p_target_class, target_year, 'active')
    on conflict(student_id, class_id)
    do update set status = 'active';

  insert into public.audit_logs(user_id, action, entity_type, entity_id, metadata)
    values(
      auth.uid(),
      'student_transferred',
      'students',
      p_student,
      jsonb_build_object('target_class_id', p_target_class, 'school_year', target_year)
    );
end;
$$;

create function public.admin_archive_student(p_student uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'Acesso negado'; end if;
  if p_student is null then raise exception 'Confira o aluno'; end if;

  update public.students
     set active = false, updated_at = now()
   where id = p_student and active;
  if not found then raise exception 'Aluno ativo não encontrado'; end if;

  update public.enrollments
     set status = 'inactive'
   where student_id = p_student and status = 'active';

  insert into public.audit_logs(user_id, action, entity_type, entity_id)
    values(auth.uid(), 'student_archived', 'students', p_student);
end;
$$;

revoke all on function public.admin_update_student(uuid, text, date) from public, anon;
revoke all on function public.admin_transfer_student(uuid, uuid) from public, anon;
revoke all on function public.admin_archive_student(uuid) from public, anon;
grant execute on function public.admin_update_student(uuid, text, date) to authenticated;
grant execute on function public.admin_transfer_student(uuid, uuid) to authenticated;
grant execute on function public.admin_archive_student(uuid) to authenticated;

commit;
