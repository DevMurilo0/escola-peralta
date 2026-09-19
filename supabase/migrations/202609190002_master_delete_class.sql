begin;

create or replace function public.master_delete_class(
  p_class uuid,
  p_actor uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_grade_level text;
  v_school_year integer;
begin
  select c.name, c.grade_level, c.school_year
    into v_name, v_grade_level, v_school_year
  from public.classes c
  where c.id = p_class;

  if not found then
    raise exception 'Turma não encontrada.';
  end if;

  delete from public.attendance_records ar
  where ar.attendance_session_id in (
    select s.id
    from public.attendance_sessions s
    where s.class_id = p_class
  );

  delete from public.grades
  where class_id = p_class;

  delete from public.curriculum_records
  where class_id = p_class;

  delete from public.attendance_sessions
  where class_id = p_class;

  delete from public.teacher_classes
  where class_id = p_class;

  delete from public.enrollments
  where class_id = p_class;

  delete from public.classes
  where id = p_class;

  insert into public.audit_logs(
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    p_actor,
    'master_class_deleted',
    'classes',
    p_class,
    jsonb_build_object(
      'name', v_name,
      'grade_level', v_grade_level,
      'school_year', v_school_year
    )
  );
end
$$;

revoke all on function public.master_delete_class(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.master_delete_class(uuid, uuid)
  to service_role;

commit;
