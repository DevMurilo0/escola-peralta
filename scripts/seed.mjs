// DEVELOPMENT ONLY. Every person and academic record below is fictional.
import { createClient } from "@supabase/supabase-js";
if (process.env.ALLOW_DEVELOPMENT_SEED !== "true")
  throw new Error(
    "Seed bloqueado. Use um projeto Supabase separado e defina ALLOW_DEVELOPMENT_SEED=true.",
  );
if (
  !process.env.DEMO_TEACHER_PASSWORD ||
  process.env.DEMO_TEACHER_PASSWORD.length < 12
)
  throw new Error("Defina DEMO_TEACHER_PASSWORD com pelo menos 12 caracteres.");
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const check = ({ data, error }) => {
  if (error) throw error;
  return data;
};
const classId = "d0000000-0000-4000-8000-000000000001";
const existing = check(await db.from("classes").select("id").eq("id", classId));
if (existing.length)
  throw new Error("Seed já carregado. Nenhum dado foi alterado.");
const email = "ana.oliveira@example.test";
const { user } = check(
  await db.auth.admin.createUser({
    email,
    password: process.env.DEMO_TEACHER_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Ana Oliveira (Demonstração)" },
  }),
);
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Recife",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const year = Number(today.slice(0, 4));
check(
  await db.from("classes").insert({
    id: classId,
    name: "3º Ano A · Demonstração",
    grade_level: "3º Ano",
    shift: "Manhã",
    school_year: year,
  }),
);
check(
  await db
    .from("teacher_classes")
    .insert({ teacher_id: user.id, class_id: classId }),
);
const teacher = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } },
);
check(
  await teacher.auth.signInWithPassword({
    email,
    password: process.env.DEMO_TEACHER_PASSWORD,
  }),
);
const names = [
  "Alice Exemplo",
  "Bruno Exemplo",
  "Clara Exemplo",
  "Daniel Exemplo",
];
const ids = [];
for (const name of names)
  ids.push(
    check(
      await teacher.rpc("save_student", {
        p_class: classId,
        p_name: name,
        p_birth: `${year - 8}-03-15`,
        p_student: null,
      }),
    ),
  );
check(
  await teacher.rpc("save_grades", {
    p_class: classId,
    p_term: 1,
    p_rows: ids.map((id, i) => ({
      student_id: id,
      activity_score: 7 + i,
      exam_score: 8,
    })),
  }),
);
check(
  await teacher.rpc("save_attendance", {
    p_class: classId,
    p_date: today,
    p_term: 1,
    p_rows: ids.map((id, i) => ({
      student_id: id,
      status: i === 1 ? "absent" : i === 2 ? "justified" : "present",
    })),
    p_expected: null,
  }),
);
console.log(
  "Dados fictícios carregados. Professor: ana.oliveira@example.test. Senha: a definida em DEMO_TEACHER_PASSWORD.",
);
