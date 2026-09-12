begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table public.profiles(id uuid primary key references auth.users(id), full_name text not null check(length(full_name) between 3 and 150), email text not null, role text not null default 'teacher' check(role in ('admin','teacher')), active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.school_settings(id boolean primary key default true check(id), school_year integer not null check(school_year between 2000 and 2200), passing_grade numeric not null default 6 check(passing_grade between 0 and 10));
insert into public.school_settings values(true,extract(year from current_date)::int,6);
create table public.classes(id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 2 and 100), grade_level text not null, shift text not null check(shift in ('Manhã','Tarde','Integral')), school_year integer not null check(school_year between 2000 and 2200), active boolean not null default true, created_at timestamptz not null default now(), unique(id,school_year));
create table public.teacher_classes(id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.profiles(id), class_id uuid not null references public.classes(id), can_manage_students boolean not null default true, unique(teacher_id,class_id));
create table public.students(id uuid primary key default gen_random_uuid(), full_name text not null check(length(full_name) between 3 and 150), birth_date date not null check(birth_date <= current_date), active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.enrollments(id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id), class_id uuid not null, school_year integer not null, status text not null default 'active' check(status in ('active','inactive')), enrolled_at timestamptz not null default now(), foreign key(class_id,school_year) references public.classes(id,school_year), unique(student_id,class_id));
create table public.grades(id uuid primary key default gen_random_uuid(), student_id uuid not null, class_id uuid not null, term integer not null check(term between 1 and 4), activity_score numeric check(activity_score between 0 and 10), exam_score numeric check(exam_score between 0 and 10), average numeric generated always as ((activity_score+exam_score)/2) stored, updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(student_id,class_id) references public.enrollments(student_id,class_id), unique(student_id,class_id,term));
create table public.attendance_sessions(id uuid primary key default gen_random_uuid(), class_id uuid not null references public.classes(id), date date not null, term integer not null check(term between 1 and 4), created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(class_id,date));
create table public.attendance_records(id uuid primary key default gen_random_uuid(), attendance_session_id uuid not null references public.attendance_sessions(id), student_id uuid not null references public.students(id), status text not null check(status in ('present','absent','justified')), updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(attendance_session_id,student_id));
create table public.audit_logs(id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id), action text not null, entity_type text not null, entity_id uuid not null, metadata jsonb not null default '{}', created_at timestamptz not null default now());
create index on public.teacher_classes(class_id);
create index on public.enrollments(class_id,status);
create index on public.grades(class_id,term);
create index on public.attendance_sessions(class_id,term,date);
create index on public.attendance_records(student_id);
create index on public.audit_logs(created_at);
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.profiles where id=auth.uid() and active and role='admin') $$;
create function private.can_class(cid uuid, manage boolean default false) returns boolean language sql stable security definer set search_path='' as $$ select private.is_admin() or exists(select 1 from public.teacher_classes t join public.profiles p on p.id=t.teacher_id where t.class_id=cid and p.id=auth.uid() and p.active and (not manage or t.can_manage_students)) $$;
create function private.require_class(cid uuid, manage boolean default false) returns void language plpgsql security definer set search_path='' as $$ begin if not private.can_class(cid,manage) or not exists(select 1 from public.classes where id=cid and active) then raise exception 'Acesso negado ou turma arquivada'; end if; end $$;
create function private.audit() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),TG_OP,TG_TABLE_NAME,new.id,jsonb_build_object('changed_at',now())); return new; end $$;
create trigger grades_audit after insert or update on public.grades for each row execute function private.audit();
create trigger attendance_audit after insert or update on public.attendance_records for each row execute function private.audit();
create trigger enrollment_audit after insert or update on public.enrollments for each row execute function private.audit();
create function private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,full_name,email) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Professor Peralta'),new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.new_profile();
-- Every table is private. No anonymous privileges, no direct academic writes.
do $$ declare t text; begin foreach t in array array['profiles','school_settings','classes','teacher_classes','students','enrollments','grades','attendance_sessions','attendance_records','audit_logs'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon, authenticated',t); execute format('grant select on public.%I to authenticated',t); end loop; end $$;
create policy profiles_read on public.profiles for select to authenticated using(private.is_admin() or (id=auth.uid() and active) or (active and exists(select 1 from public.teacher_classes t where t.teacher_id=profiles.id and private.can_class(t.class_id))));
create policy settings_read on public.school_settings for select to authenticated using(exists(select 1 from public.profiles where id=auth.uid() and active));
create policy classes_read on public.classes for select to authenticated using(private.can_class(id));
create policy teachers_read on public.teacher_classes for select to authenticated using(private.can_class(class_id));
create policy students_read on public.students for select to authenticated using(private.is_admin() or exists(select 1 from public.enrollments e where e.student_id=students.id and private.can_class(e.class_id)));
create policy enrollments_read on public.enrollments for select to authenticated using(private.can_class(class_id));
create policy grades_read on public.grades for select to authenticated using(private.can_class(class_id));
create policy sessions_read on public.attendance_sessions for select to authenticated using(private.can_class(class_id));
create policy records_read on public.attendance_records for select to authenticated using(exists(select 1 from public.attendance_sessions s where s.id=attendance_session_id and private.can_class(s.class_id)));
create policy audit_read on public.audit_logs for select to authenticated using(private.is_admin());
-- Admin-only configuration writes are also enforced by RLS.
grant insert,update on public.classes to authenticated;
grant insert,delete on public.teacher_classes to authenticated;
grant update on public.profiles,public.school_settings to authenticated;
create policy class_admin on public.classes for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy teacher_admin on public.teacher_classes for all to authenticated using(private.is_admin()) with check(private.is_admin());
create policy profile_admin on public.profiles for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy settings_admin on public.school_settings for update to authenticated using(private.is_admin()) with check(private.is_admin());
create function public.save_student(p_class uuid,p_name text,p_birth date,p_student uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; yr int;
begin perform private.require_class(p_class,true); select school_year into yr from public.classes where id=p_class;
if p_student is null then insert into public.students(full_name,birth_date) values(trim(p_name),p_birth) returning id into sid; insert into public.enrollments(student_id,class_id,school_year) values(sid,p_class,yr);
else
 if not exists(select 1 from public.enrollments where student_id=p_student and class_id=p_class) then raise exception 'Matrícula não encontrada'; end if;
 -- Shared identity changes require access to every enrolled class.
 if exists(select 1 from public.enrollments where student_id=p_student and not private.can_class(class_id,true)) then raise exception 'Solicite a edição à administração'; end if;
 update public.students set full_name=trim(p_name),birth_date=p_birth,updated_at=now() where id=p_student; sid:=p_student;
end if; return sid; end $$;
create function public.set_enrollment(p_class uuid,p_student uuid,p_status text) returns void language plpgsql security definer set search_path='' as $$ begin perform private.require_class(p_class,true); update public.enrollments set status=p_status where class_id=p_class and student_id=p_student; if not found then raise exception 'Matrícula não encontrada'; end if; end $$;
create function public.save_grades(p_class uuid,p_term int,p_rows jsonb) returns void language plpgsql security definer set search_path='' as $$
declare r jsonb; begin perform private.require_class(p_class); if p_term is null or p_term not between 1 and 4 or p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>500 then raise exception 'Dados inválidos'; end if;
for r in select * from jsonb_array_elements(p_rows) loop
 if not exists(select 1 from public.enrollments where class_id=p_class and student_id=(r->>'student_id')::uuid and status='active') then raise exception 'Matrícula inativa ou inválida'; end if;
 insert into public.grades(student_id,class_id,term,activity_score,exam_score,updated_by) values((r->>'student_id')::uuid,p_class,p_term,(r->>'activity_score')::numeric,(r->>'exam_score')::numeric,auth.uid()) on conflict(student_id,class_id,term) do update set activity_score=excluded.activity_score,exam_score=excluded.exam_score,updated_by=auth.uid(),updated_at=now();
end loop; end $$;
create function public.save_attendance(p_class uuid,p_date date,p_term int,p_rows jsonb,p_expected timestamptz default null) returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; previous timestamptz; r jsonb; n int;
begin perform private.require_class(p_class);
if p_date > (now() at time zone 'America/Recife')::date or p_date is null or p_term not between 1 and 4 or p_term is null then raise exception 'Data ou bimestre inválido'; end if;
if extract(year from p_date)::int <> (select school_year from public.classes where id=p_class) then raise exception 'Data fora do ano letivo'; end if;
perform pg_advisory_xact_lock(hashtextextended(p_class::text||p_date::text,0));
select id,updated_at into sid,previous from public.attendance_sessions where class_id=p_class and date=p_date;
if sid is not null and (p_expected is null or previous<>p_expected) then raise exception 'Chamada alterada por outra pessoa. Reabra a data.'; end if;
if sid is not null and exists(select 1 from public.attendance_sessions where id=sid and term<>p_term) then raise exception 'Esta data pertence a outro bimestre'; end if;
if p_rows is null or jsonb_typeof(p_rows)<>'array' or jsonb_array_length(p_rows)>500 then raise exception 'Lista inválida'; end if;
select count(distinct x->>'student_id') into n from jsonb_array_elements(p_rows) x;
if n<>jsonb_array_length(p_rows) then raise exception 'Aluno duplicado'; end if;
-- Existing sessions retain the original roster; new sessions require all active enrollments.
if sid is null then
 if n<>(select count(*) from public.enrollments where class_id=p_class and status='active') or n=0 then raise exception 'Informe todos os alunos ativos'; end if;
else
 if n<>(select count(*) from public.attendance_records where attendance_session_id=sid) then raise exception 'Preserve os alunos da chamada original'; end if;
end if;
for r in select * from jsonb_array_elements(p_rows) loop
 if sid is null then
  if not exists(select 1 from public.enrollments where class_id=p_class and student_id=(r->>'student_id')::uuid and status='active') then raise exception 'Aluno fora da turma'; end if;
 else
  if not exists(select 1 from public.attendance_records where attendance_session_id=sid and student_id=(r->>'student_id')::uuid) then raise exception 'Aluno fora da chamada original'; end if;
 end if;
end loop;
if sid is null then insert into public.attendance_sessions(class_id,date,term,created_by) values(p_class,p_date,p_term,auth.uid()) returning id into sid; else update public.attendance_sessions set updated_at=clock_timestamp() where id=sid; end if;
for r in select * from jsonb_array_elements(p_rows) loop
 insert into public.attendance_records(attendance_session_id,student_id,status,updated_by) values(sid,(r->>'student_id')::uuid,r->>'status',auth.uid()) on conflict(attendance_session_id,student_id) do update set status=excluded.status,updated_by=auth.uid(),updated_at=now();
end loop; return sid; end $$;
-- Deny implicit PUBLIC execution, including helper/trigger functions.
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_admin(),private.can_class(uuid,boolean) to authenticated;
revoke all on function public.save_student(uuid,text,date,uuid),public.set_enrollment(uuid,uuid,text),public.save_grades(uuid,int,jsonb),public.save_attendance(uuid,date,int,jsonb,timestamptz) from public,anon;
grant execute on function public.save_student(uuid,text,date,uuid),public.set_enrollment(uuid,uuid,text),public.save_grades(uuid,int,jsonb),public.save_attendance(uuid,date,int,jsonb,timestamptz) to authenticated;
commit;
