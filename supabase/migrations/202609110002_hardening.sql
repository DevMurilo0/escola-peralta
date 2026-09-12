begin;
-- Active teachers cannot grant themselves roles or write outside the validated RPCs.
create function public.enroll_existing(p_student uuid,p_class uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if not private.is_admin() then raise exception 'Acesso negado'; end if;
 perform private.require_class(p_class,true);
 insert into public.enrollments(student_id,class_id,school_year) select p_student,id,school_year from public.classes where id=p_class on conflict(student_id,class_id) do update set status='active';
end $$;
create function public.log_admin_event(p_action text,p_entity uuid) returns void language plpgsql security definer set search_path='' as $$ begin
 if not private.is_admin() or p_action not in ('teacher_created') then raise exception 'Acesso negado'; end if;
 insert into public.audit_logs(user_id,action,entity_type,entity_id) values(auth.uid(),p_action,'profiles',p_entity);
end $$;
revoke all on function public.enroll_existing(uuid,uuid),public.log_admin_event(text,uuid) from public,anon;
grant execute on function public.enroll_existing(uuid,uuid),public.log_admin_event(text,uuid) to authenticated;
create function private.validate_association() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if not exists(select 1 from public.profiles where id=new.teacher_id and role='teacher' and active) then raise exception 'Selecione um professor ativo'; end if;
 return new; end $$;
create trigger validate_teacher before insert or update on public.teacher_classes for each row execute function private.validate_association();
create function private.validate_session() returns trigger language plpgsql set search_path='' as $$ begin
 if new.date>(now() at time zone 'America/Recife')::date then raise exception 'Não é permitido registrar chamadas futuras'; end if;
 if extract(year from new.date)::int<>(select school_year from public.classes where id=new.class_id) then raise exception 'Data fora do ano letivo'; end if;
 return new; end $$;
create trigger validate_session before insert or update on public.attendance_sessions for each row execute function private.validate_session();
create function private.validate_record() returns trigger language plpgsql set search_path='' as $$ begin
 if not exists(select 1 from public.enrollments e join public.attendance_sessions s on s.class_id=e.class_id where s.id=new.attendance_session_id and e.student_id=new.student_id) then raise exception 'Aluno fora da turma'; end if;return new;end $$;
create trigger validate_record before insert or update on public.attendance_records for each row execute function private.validate_record();
create trigger profile_audit after update on public.profiles for each row execute function private.audit();
-- Defense against accidental removal of the last active administrator, including API calls.
create function private.protect_last_admin() returns trigger language plpgsql security definer set search_path='' as $$ begin
 perform pg_advisory_xact_lock(721991);
 if old.role='admin' and old.active and (new.role<>'admin' or not new.active) and not exists(select 1 from public.profiles where role='admin' and active and id<>old.id) then raise exception 'Não é possível desativar o último administrador'; end if; return new;end $$;
create trigger protect_last_admin before update on public.profiles for each row execute function private.protect_last_admin();
revoke all on function private.validate_association(),private.validate_session(),private.validate_record(),private.protect_last_admin() from public,anon,authenticated;
commit;
