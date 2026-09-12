// Test-only HTTP double. The production app always uses Supabase; real SQL/RLS is
// exercised independently in database.test.ts. Never mutates the hosted school.
import type { Page } from "@playwright/test";
import { todayRecife } from "../../src/shared/academic/utils";
export const classId = "20000000-0000-4000-8000-000000000001";
export const studentId = "30000000-0000-4000-8000-000000000001";
const teacherId = "10000000-0000-4000-8000-000000000001";
export async function installSupabaseTransport(
  page: Page,
  role: "teacher" | "admin" = "teacher",
  active = true,
  master = false,
) {
  const user = {
    id: teacherId,
    aud: "authenticated",
    role: "authenticated",
    email: `${role}@example.test`,
    created_at: new Date().toISOString(),
    app_metadata: { provider: "email" },
    user_metadata: {},
  };
  const profile = {
    id: teacherId,
    full_name: "Ana Exemplo",
    email: user.email,
    role,
    active,
  };
  let createdCredentials: { email: string; password: string } | null = null;
  const masterTeachers = [
    {
      id: "10000000-0000-4000-8000-000000000004",
      full_name: "Maria Ferreira",
      email: "maria@peralta.com",
      active: true,
      created_at: "2026-09-01T12:00:00.000Z",
      last_sign_in_at: null,
    },
  ];
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: teacherId, exp: Math.floor(Date.now() / 1000) + 3600, aud: "authenticated", role: "authenticated" })).toString("base64url")}.c2lnbmF0dXJl`;
  const session = () => ({
    access_token: token,
    refresh_token: "test-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user,
  });
  const student = {
    id: studentId,
    full_name: "Alice Exemplo",
    birth_date: "2018-03-15",
    active: true,
  };
  const schoolClass = {
    id: classId,
    name: "3º Ano A",
    grade_level: "3º Ano",
    shift: "Manhã",
    school_year: Number(todayRecife().slice(0, 4)),
    active: true,
    enrollments: [{ id: "e1", status: "active" }],
  };
  const state: {
    grades: Record<string, unknown>[];
    sessions: Record<string, unknown>[];
    curriculum: Record<string, unknown>[];
    tokenRequests: number;
    workerRequests: number;
  } = { grades: [], sessions: [], curriculum: [], tokenRequests: 0, workerRequests: 0 };
  await page.route("**/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/logout")) {
      await route.fulfill({ status: 204 });
      return;
    }
    if (url.pathname.endsWith("/token")) {
      state.tokenRequests++;
      const credentials = route.request().postDataJSON() as {
        email?: string;
        password?: string;
      };
      if (
        createdCredentials &&
        credentials.email === createdCredentials.email &&
        credentials.password === createdCredentials.password
      ) {
        user.email = createdCredentials.email;
        profile.email = createdCredentials.email;
        profile.full_name = "Professor Criado";
        profile.role = "teacher";
      }
    }
    await route.fulfill({
      json: url.pathname.endsWith("/user") ? user : session(),
    });
  });
  await page.route("**/rest/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const entity = url.pathname.split("/").at(-1);
    if (url.pathname.includes("/rpc/")) {
      const body = req.postDataJSON();
      if (entity === "save_grades")
        state.grades = body.p_rows.map(
          (row: {
            activity_score: number | null;
            exam_score: number | null;
          }) => ({
            ...row,
            term: body.p_term,
            average:
              row.activity_score === null || row.exam_score === null
                ? null
                : (row.activity_score + row.exam_score) / 2,
          }),
        );
      if (entity === "save_attendance")
        state.sessions = [
          {
            id: "40000000-0000-4000-8000-000000000001",
            class_id: classId,
            date: body.p_date,
            term: body.p_term,
            updated_at: new Date().toISOString(),
            attendance_records: body.p_rows,
          },
        ];
      if (entity === "create_teacher_class") {
        schoolClass.name = body.p_name;
        schoolClass.grade_level = body.p_grade_level;
        schoolClass.shift = body.p_shift;
        schoolClass.school_year = body.p_school_year;
        await route.fulfill({ json: classId });
        return;
      }
      if (entity === "update_teacher_class") {
        schoolClass.name = body.p_name;
        schoolClass.grade_level = body.p_grade_level;
        schoolClass.shift = body.p_shift;
        schoolClass.school_year = body.p_school_year;
      }
      await route.fulfill({ json: null });
      return;
    }
    const single = req.headers().accept?.includes("vnd.pgrst.object");
    let data: unknown;
    if (entity === "profiles")
      data =
        url.searchParams.get("role") === "eq.teacher"
          ? [profile]
          : single
            ? profile
            : [profile];
    else if (entity === "classes") data = single ? schoolClass : [schoolClass];
    else if (entity === "enrollments")
      data = [
        {
          id: "e1",
          student_id: studentId,
          status: "active",
          students: student,
        },
      ];
    else if (entity === "students") data = [student];
    else if (entity === "grades") data = state.grades;
    else if (entity === "attendance_sessions") data = state.sessions;
    else if (entity === "school_settings")
      data = {
        id: true,
        passing_grade: 6,
        school_year: schoolClass.school_year,
      };
    else if (entity === "teacher_classes")
      data = [
        {
          id: "a1",
          teacher_id: teacherId,
          class_id: classId,
          can_manage_students: true,
          profiles: { full_name: "Ana Exemplo" },
        },
      ];
    else if (entity === "curriculum_records") {
      if (req.method() === "POST") {
        const body = req.postDataJSON();
        const record = {
          ...body,
          id: "50000000-0000-4000-8000-000000000001",
          created_by: teacherId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        state.curriculum = [record];
        data = record;
      } else if (req.method() === "PATCH") {
        state.curriculum = state.curriculum.map((record) => ({
          ...record,
          ...req.postDataJSON(),
        }));
        data = state.curriculum[0];
      } else if (req.method() === "DELETE") {
        const deleted = state.curriculum[0];
        state.curriculum = [];
        data = deleted;
      } else data = state.curriculum;
    }
    else throw new Error(`Unexpected query ${entity}`);
    await route.fulfill({ json: data });
  });
  await page.route("**/api/master/**", async (route) => {
    if (profile.role !== "admin" || !master) {
      await route.fulfill({
        status: 403,
        json: { error: "Acesso não autorizado." },
      });
      return;
    }
    if (!route.request().headers().authorization?.startsWith("Bearer "))
      throw new Error("Master request missing token");
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/status")) {
      await route.fulfill({ json: { isMaster: true } });
      return;
    }
    if (route.request().method() === "GET") {
      await route.fulfill({ json: { teachers: masterTeachers } });
      return;
    }
    const body = route.request().postDataJSON() as {
      full_name: string;
      email: string;
      password: string;
    };
    createdCredentials = { email: body.email, password: body.password };
    const teacher = {
      id: "10000000-0000-4000-8000-000000000005",
      full_name: body.full_name,
      email: body.email,
      active: true,
      created_at: new Date().toISOString(),
      last_sign_in_at: null,
    };
    masterTeachers.push(teacher);
    await route.fulfill({ status: 201, json: { success: true, teacher } });
  });
  await page.route("**/api/admin/**", async (route) => {
    state.workerRequests++;
    if (profile.role !== "admin") {
      await route.fulfill({
        status: 403,
        json: { error: "Acesso não autorizado." },
      });
      return;
    }
    if (!route.request().headers().authorization?.startsWith("Bearer "))
      throw new Error("Worker request missing token");
    await route.fulfill({
      status: 201,
      json: {
        success: true,
        link: "https://peralta.example.test/auth/confirm?token_hash=test&type=invite",
      },
    });
  });
  return state;
}
export async function signIn(page: Page, role = "teacher") {
  return signInWithCredentials(
    page,
    `${role}@example.test`,
    "senha-ficticia-apenas-teste",
  );
}

export async function signInWithCredentials(
  page: Page,
  email: string,
  password: string,
) {
  await page.goto("/portal/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar no portal" }).click();
}
