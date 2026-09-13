import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const admin = "10000000-0000-4000-8000-000000000001",
  teacher = "10000000-0000-4000-8000-000000000002",
  outsider = "10000000-0000-4000-8000-000000000003";
const c1 = "20000000-0000-4000-8000-000000000001",
  c2 = "20000000-0000-4000-8000-000000000002";
let sid: string;
async function asUser<T>(id: string, query: string, args: unknown[] = []) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`,
  );
  try {
    return await db.query<T>(query, args);
  } finally {
    await db.exec("reset role");
  }
}
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Recife",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`,
  );
  for (const f of readdirSync("supabase/migrations").sort())
    await db.exec(readFileSync(`supabase/migrations/${f}`, "utf8"));
  await db.exec(
    `insert into auth.users values('${admin}','admin@example.test','{"full_name":"Admin Exemplo"}'),('${teacher}','teacher@example.test','{"full_name":"Professor Exemplo"}'),('${outsider}','outsider@example.test','{"full_name":"Outro Professor"}'); update public.profiles set role='admin' where id='${admin}'; insert into public.classes(id,name,grade_level,shift,school_year) values('${c1}','Turma Um','3º Ano','Manhã',${today.slice(0, 4)}),('${c2}','Turma Dois','4º Ano','Tarde',${today.slice(0, 4)}); insert into public.teacher_classes(teacher_id,class_id) values('${teacher}','${c1}');`,
  );
  const r = await asUser<{ id: string }>(
    teacher,
    "select public.save_student($1,$2,$3,null) as id",
    [c1, "Aluno Fictício", "2018-03-10"],
  );
  sid = r.rows[0].id;
});
afterAll(async () => {
  await db?.close();
});
describe.sequential(
  "Migrations e segurança executadas em PostgreSQL (PGlite)",
  () => {
    it("ativa RLS em todas as onze tabelas", async () => {
      const r = await db.query<{ relrowsecurity: boolean }>(
        "select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'",
      );
      expect(r.rows.length).toBe(11);
      expect(r.rows.every((r) => r.relrowsecurity)).toBe(true);
    });
    it("nega leitura de todas as tabelas acadêmicas a visitantes", async () => {
      for (const table of [
        "profiles",
        "classes",
        "teacher_classes",
        "students",
        "enrollments",
        "grades",
        "attendance_sessions",
        "attendance_records",
        "audit_logs",
        "school_settings",
        "curriculum_records",
      ]) {
        await db.exec("set role anon");
        try {
          await expect(
            db.query(`select * from public.${table}`),
          ).rejects.toThrow(/permission denied/);
        } finally {
          await db.exec("reset role");
        }
      }
    });
    it("isola as turmas atribuídas e permite visão global do admin", async () => {
      expect(
        (await asUser(teacher, "select * from public.classes")).rows,
      ).toHaveLength(1);
      expect(
        (await asUser(outsider, "select * from public.classes")).rows,
      ).toHaveLength(0);
      expect(
        (await asUser(admin, "select * from public.classes")).rows,
      ).toHaveLength(2);
      expect(
        (await asUser(outsider, "select * from public.students")).rows,
      ).toHaveLength(0);
    });
    it("impede autoelevação de role", async () => {
      await asUser(
        teacher,
        "update public.profiles set role='admin' where id=auth.uid()",
      );
      const r = await db.query<{ role: string }>(
        "select role from public.profiles where id=$1",
        [teacher],
      );
      expect(r.rows[0].role).toBe("teacher");
    });
    it("rejeita criação de aluno fora da turma atribuída", async () => {
      await expect(
        asUser(teacher, "select public.save_student($1,$2,$3,null)", [
          c2,
          "Aluno Intruso",
          "2018-01-01",
        ]),
      ).rejects.toThrow(/Acesso negado/);
    });
    it("respeita permissão específica de gestão de matrícula", async () => {
      await db.query(
        "update public.teacher_classes set can_manage_students=false where teacher_id=$1",
        [teacher],
      );
      await expect(
        asUser(teacher, "select public.save_student($1,$2,$3,null)", [
          c1,
          "Aluno Bloqueado",
          "2018-01-01",
        ]),
      ).rejects.toThrow(/Acesso negado/);
      await db.query(
        "update public.teacher_classes set can_manage_students=true where teacher_id=$1",
        [teacher],
      );
    });
    it("salva nota real com média gerada e auditoria", async () => {
      await asUser(teacher, "select public.save_grades($1,1,$2)", [
        c1,
        JSON.stringify([{ student_id: sid, activity_score: 8, exam_score: 9 }]),
      ]);
      const r = await asUser<{ average: string }>(
        teacher,
        "select average from public.grades",
      );
      expect(Number(r.rows[0].average)).toBe(8.5);
      expect(
        (
          await asUser(
            admin,
            "select * from public.audit_logs where entity_type='grades'",
          )
        ).rows.length,
      ).toBeGreaterThan(0);
    });
    it("impede escrita direta de notas e alteração da média", async () => {
      await expect(
        asUser(teacher, "update public.grades set activity_score=10"),
      ).rejects.toThrow(/permission denied/);
    });
    it("valida notas e reverte lote inteiro em caso de erro", async () => {
      for (const n of [-1, 15])
        await expect(
          asUser(teacher, "select public.save_grades($1,1,$2)", [
            c1,
            JSON.stringify([
              { student_id: sid, activity_score: 1, exam_score: 1 },
              { student_id: sid, activity_score: n, exam_score: 5 },
            ]),
          ]),
        ).rejects.toThrow();
      const r = await db.query<{ average: string }>(
        "select average from public.grades",
      );
      expect(Number(r.rows[0].average)).toBe(8.5);
    });
    it("valida bimestre também no banco", async () => {
      await expect(
        asUser(teacher, "select public.save_grades($1,5,$2)", [c1, "[]"]),
      ).rejects.toThrow();
    });
    it("salva e reabre chamada sem duplicação", async () => {
      await asUser(teacher, "select public.save_attendance($1,$2,1,$3,null)", [
        c1,
        today,
        JSON.stringify([{ student_id: sid, status: "present" }]),
      ]);
      const r = await asUser<{ updated_at: string }>(
        teacher,
        "select updated_at from public.attendance_sessions",
      );
      await asUser(teacher, "select public.save_attendance($1,$2,1,$3,$4)", [
        c1,
        today,
        JSON.stringify([{ student_id: sid, status: "justified" }]),
        r.rows[0].updated_at,
      ]);
      expect(
        (await asUser(teacher, "select * from public.attendance_sessions"))
          .rows,
      ).toHaveLength(1);
      const records = await asUser<{ status: string }>(
        teacher,
        "select status from public.attendance_records",
      );
      expect(records.rows[0].status).toBe("justified");
    });
    it("rejeita duplicação, edição concorrente e troca de bimestre", async () => {
      await expect(
        asUser(teacher, "select public.save_attendance($1,$2,1,$3,null)", [
          c1,
          today,
          JSON.stringify([{ student_id: sid, status: "absent" }]),
        ]),
      ).rejects.toThrow(/alterada/);
      await expect(
        db.query(
          "insert into public.attendance_sessions(class_id,date,term,created_by) values($1,$2,1,$3)",
          [c1, today, teacher],
        ),
      ).rejects.toThrow(/unique/);
      const r = await db.query<{ updated_at: string }>(
        "select updated_at from public.attendance_sessions",
      );
      await expect(
        asUser(teacher, "select public.save_attendance($1,$2,2,$3,$4)", [
          c1,
          today,
          JSON.stringify([{ student_id: sid, status: "present" }]),
          r.rows[0].updated_at,
        ]),
      ).rejects.toThrow(/outro bimestre/);
    });
    it("rejeita chamada futura e aluno de outra turma", async () => {
      await expect(
        asUser(teacher, "select public.save_attendance($1,$2,1,$3,null)", [
          c1,
          "2199-01-01",
          JSON.stringify([{ student_id: sid, status: "present" }]),
        ]),
      ).rejects.toThrow(/Data/);
      await expect(
        asUser(outsider, "select public.save_attendance($1,$2,1,$3,null)", [
          c1,
          today,
          "[]",
        ]),
      ).rejects.toThrow(/Acesso negado/);
    });
    it("rejeita parâmetros nulos sem criar chamadas vazias", async () => {
      await expect(
        asUser(admin, "select public.save_attendance($1,$2,1,null,null)", [
          c2,
          today,
        ]),
      ).rejects.toThrow(/Lista inválida/);
      await expect(
        asUser(teacher, "select public.save_grades($1,null,$2)", [c1, "[]"]),
      ).rejects.toThrow(/Dados inválidos/);
      await expect(
        asUser(teacher, "select public.save_grades($1,1,null)", [c1]),
      ).rejects.toThrow(/Dados inválidos/);
    });
    it("rejeita chamada vazia, aluno duplicado e status inválido", async () => {
      const r = await db.query<{ updated_at: string }>(
        "select updated_at from public.attendance_sessions where class_id=$1",
        [c1],
      );
      for (const rows of [
        [],
        [
          { student_id: sid, status: "present" },
          { student_id: sid, status: "present" },
        ],
        [{ student_id: sid, status: "invalid" }],
      ]) {
        await expect(
          asUser(teacher, "select public.save_attendance($1,$2,1,$3,$4)", [
            c1,
            today,
            JSON.stringify(rows),
            r.rows[0].updated_at,
          ]),
        ).rejects.toThrow();
      }
      const records = await db.query<{ status: string }>(
        "select status from public.attendance_records",
      );
      expect(records.rows[0].status).toBe("justified");
    });
    it("nega gravação de notas por outro professor", async () => {
      await expect(
        asUser(outsider, "select public.save_grades($1,1,$2)", [
          c1,
          JSON.stringify([
            { student_id: sid, activity_score: 10, exam_score: 10 },
          ]),
        ]),
      ).rejects.toThrow(/Acesso negado/);
    });
    it("nega funções acadêmicas a visitantes", async () => {
      await db.exec("set role anon");
      try {
        await expect(
          db.query("select public.save_grades($1,1,$2)", [c1, "[]"]),
        ).rejects.toThrow(/permission denied/);
      } finally {
        await db.exec("reset role");
      }
    });
    it("turma arquivada preserva consulta e bloqueia gravação", async () => {
      await asUser(
        admin,
        "update public.classes set active=false where id=$1",
        [c1],
      );
      expect(
        (await asUser(teacher, "select * from public.classes")).rows,
      ).toHaveLength(1);
      await expect(
        asUser(teacher, "select public.save_grades($1,1,$2)", [c1, "[]"]),
      ).rejects.toThrow(/arquivada/);
      await asUser(admin, "update public.classes set active=true where id=$1", [
        c1,
      ]);
    });
    it("inativa matrícula sem apagar histórico e bloqueia novas notas", async () => {
      await asUser(teacher, "select public.set_enrollment($1,$2,'inactive')", [
        c1,
        sid,
      ]);
      expect(
        (await asUser(teacher, "select * from public.grades")).rows,
      ).toHaveLength(1);
      expect(
        (await asUser(teacher, "select * from public.attendance_records")).rows,
      ).toHaveLength(1);
      await expect(
        asUser(teacher, "select public.save_grades($1,1,$2)", [
          c1,
          JSON.stringify([
            { student_id: sid, activity_score: 7, exam_score: 7 },
          ]),
        ]),
      ).rejects.toThrow(/inativa/);
    });
    it("mantém identidade e histórico ao matricular em outra turma", async () => {
      await asUser(admin, "select public.enroll_existing($1,$2)", [sid, c2]);
      expect(
        (await asUser(admin, "select * from public.students")).rows,
      ).toHaveLength(1);
      expect(
        (await asUser(admin, "select * from public.enrollments")).rows,
      ).toHaveLength(2);
      await expect(
        asUser(teacher, "select public.save_student($1,$2,$3,$4)", [
          c1,
          "Nome alterado",
          "2018-01-01",
          sid,
        ]),
      ).rejects.toThrow(/administração/);
    });
    it("restringe as novas operações globais de aluno a administradores", async () => {
      await expect(
        asUser(
          teacher,
          "select public.admin_update_student($1,'Nome Bloqueado','2018-01-01')",
          [sid],
        ),
      ).rejects.toThrow(/Acesso negado/);
      await expect(
        asUser(teacher, "select public.admin_transfer_student($1,$2)", [
          sid,
          c1,
        ]),
      ).rejects.toThrow(/Acesso negado/);
      await expect(
        asUser(teacher, "select public.admin_archive_student($1)", [sid]),
      ).rejects.toThrow(/Acesso negado/);
    });
    it("edita o aluno com validação e auditoria administrativa", async () => {
      await expect(
        asUser(
          admin,
          "select public.admin_update_student($1,'A','2199-01-01')",
          [sid],
        ),
      ).rejects.toThrow(/Confira/);
      await asUser(
        admin,
        "select public.admin_update_student($1,' Aluno Atualizado ','2018-02-03')",
        [sid],
      );
      const student = await asUser<{ full_name: string; birth_date: string }>(
        admin,
        "select full_name,birth_date from public.students where id=$1",
        [sid],
      );
      expect(student.rows[0]).toMatchObject({
        full_name: "Aluno Atualizado",
      });
      expect(new Date(student.rows[0].birth_date).toISOString().slice(0, 10)).toBe(
        "2018-02-03",
      );
      expect(
        (
          await asUser(
            admin,
            "select * from public.audit_logs where action='student_updated' and entity_id=$1",
            [sid],
          )
        ).rows,
      ).toHaveLength(1);
    });
    it("transfere atomicamente e preserva matrículas e dados acadêmicos", async () => {
      const priorYear = Number(today.slice(0, 4)) - 1;
      const historicalClass = "20000000-0000-4000-8000-000000000003";
      await db.query(
        "insert into public.classes(id,name,grade_level,shift,school_year) values($1,'Turma Histórica','2º Ano','Manhã',$2)",
        [historicalClass, priorYear],
      );
      await db.query(
        "insert into public.enrollments(student_id,class_id,school_year,status) values($1,$2,$3,'inactive')",
        [sid, historicalClass, priorYear],
      );
      await asUser(admin, "select public.save_grades($1,2,$2)", [
        c2,
        JSON.stringify([
          { student_id: sid, activity_score: 7, exam_score: 8 },
        ]),
      ]);
      await asUser(
        admin,
        "select public.save_attendance($1,$2,2,$3,null)",
        [
          c2,
          today,
          JSON.stringify([{ student_id: sid, status: "present" }]),
        ],
      );
      await db.query(
        "update public.enrollments set status='active' where student_id=$1 and class_id=$2",
        [sid, c1],
      );

      await asUser(admin, "select public.admin_transfer_student($1,$2)", [
        sid,
        c1,
      ]);
      const enrollments = await asUser<{
        class_id: string;
        school_year: number;
        status: string;
      }>(
        admin,
        "select class_id,school_year,status from public.enrollments where student_id=$1 order by school_year,class_id",
        [sid],
      );
      expect(
        enrollments.rows.filter(
          (row) =>
            row.school_year === Number(today.slice(0, 4)) &&
            row.status === "active",
        ),
      ).toEqual([
        expect.objectContaining({ class_id: c1, status: "active" }),
      ]);
      expect(
        enrollments.rows.find((row) => row.class_id === historicalClass),
      ).toMatchObject({ school_year: priorYear, status: "inactive" });
      expect(
        (
          await asUser(
            admin,
            "select * from public.grades where student_id=$1 and class_id=$2",
            [sid, c2],
          )
        ).rows,
      ).toHaveLength(1);
      expect(
        (
          await asUser(
            admin,
            "select r.* from public.attendance_records r join public.attendance_sessions s on s.id=r.attendance_session_id where r.student_id=$1 and s.class_id=$2",
            [sid, c2],
          )
        ).rows,
      ).toHaveLength(1);
    });
    it("arquiva logicamente o aluno sem apagar qualquer histórico", async () => {
      const before = await asUser<{ grades: number; records: number }>(
        admin,
        "select (select count(*) from public.grades where student_id=$1)::int as grades,(select count(*) from public.attendance_records where student_id=$1)::int as records",
        [sid],
      );
      await asUser(admin, "select public.admin_archive_student($1)", [sid]);
      const student = await asUser<{ active: boolean }>(
        admin,
        "select active from public.students where id=$1",
        [sid],
      );
      expect(student.rows[0].active).toBe(false);
      expect(
        (
          await asUser(
            admin,
            "select * from public.enrollments where student_id=$1 and status='active'",
            [sid],
          )
        ).rows,
      ).toHaveLength(0);
      const after = await asUser<{ grades: number; records: number }>(
        admin,
        "select (select count(*) from public.grades where student_id=$1)::int as grades,(select count(*) from public.attendance_records where student_id=$1)::int as records",
        [sid],
      );
      expect(after.rows[0]).toEqual(before.rows[0]);
      expect(
        (
          await asUser(
            admin,
            "select * from public.audit_logs where action='student_archived' and entity_id=$1",
            [sid],
          )
        ).rows,
      ).toHaveLength(1);
    });
    it("protege conteúdos curriculares com RLS, autoria e ano letivo", async () => {
      const inserted = await asUser<{ id: string; created_by: string }>(
        teacher,
        "insert into public.curriculum_records(class_id,term,date,subject,content) values($1,2,$2,' Matemática ',' Frações equivalentes ') returning id,created_by",
        [c1, today],
      );
      expect(inserted.rows[0].created_by).toBe(teacher);
      expect(
        (await asUser(teacher, "select * from public.curriculum_records"))
          .rows,
      ).toHaveLength(1);
      expect(
        (await asUser(outsider, "select * from public.curriculum_records"))
          .rows,
      ).toHaveLength(0);
      await expect(
        asUser(
          outsider,
          "insert into public.curriculum_records(class_id,term,date,subject,content) values($1,2,$2,'Ciências','Água')",
          [c1, today],
        ),
      ).rejects.toThrow(/row-level security/);
      await expect(
        asUser(
          teacher,
          "update public.curriculum_records set class_id=$1 where id=$2",
          [c2, inserted.rows[0].id],
        ),
      ).rejects.toThrow();
      await expect(
        asUser(
          teacher,
          "insert into public.curriculum_records(class_id,term,date,subject,content) values($1,2,'2199-01-01','Ciências','Água')",
          [c1],
        ),
      ).rejects.toThrow(/ano letivo/);
    });
    it("permite ao professor criar e administrar somente a própria turma", async () => {
      const created = await asUser<{ id: string }>(
        teacher,
        "select public.create_teacher_class(' 5º Ano A ','5º Ano','Tarde',$1) as id",
        [Number(today.slice(0, 4))],
      );
      const createdId = created.rows[0].id;
      const association = await asUser<{ can_manage_students: boolean }>(
        teacher,
        "select can_manage_students from public.teacher_classes where class_id=$1",
        [createdId],
      );
      expect(association.rows[0].can_manage_students).toBe(true);
      await asUser(
        teacher,
        "select public.update_teacher_class($1,'5º Ano B','5º Ano','Integral',$2,true)",
        [createdId, Number(today.slice(0, 4))],
      );
      await expect(
        asUser(
          outsider,
          "select public.update_teacher_class($1,'Turma invadida','5º Ano','Integral',$2,true)",
          [createdId, Number(today.slice(0, 4))],
        ),
      ).rejects.toThrow(/Acesso negado/);
      const row = await asUser<{ name: string; shift: string }>(
        teacher,
        "select name,shift from public.classes where id=$1",
        [createdId],
      );
      expect(row.rows[0]).toMatchObject({ name: "5º Ano B", shift: "Integral" });
    });
    it("desativação bloqueia imediatamente consulta e gravação", async () => {
      await db.query("update public.profiles set active=false where id=$1", [
        teacher,
      ]);
      expect(
        (await asUser(teacher, "select * from public.classes")).rows,
      ).toHaveLength(0);
      await expect(
        asUser(teacher, "select public.save_grades($1,1,$2)", [c1, "[]"]),
      ).rejects.toThrow(/Acesso negado/);
    });
    it("preserva o último administrador ativo", async () => {
      await expect(
        asUser(admin, "update public.profiles set active=false where id=$1", [
          admin,
        ]),
      ).rejects.toThrow(/último administrador/);
    });
  },
);
