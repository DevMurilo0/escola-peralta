import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MASTER_EMAIL?: string;
  ALLOWED_ORIGIN?: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const masterTeacherSchema = z
  .object({
    full_name: z.string().trim().min(3).max(150),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254)
      .email()
      .refine((email) => email.endsWith("@peralta.com"), {
        message: "domain",
      }),
    password: z.string().min(12).max(128),
  })
  .strict();
const masterClassSchema = z
  .object({
    grade_level: z.enum([
      "Infantil",
      "Jardim",
      "1º Ano",
      "2º Ano",
      "3º Ano",
      "4º Ano",
      "5º Ano",
    ]),
    group: z.enum(["1", "2", "3", "A", "B", "C"]),
    shift: z.enum(["Manhã", "Tarde", "Integral"]),
    school_year: z.number().int().min(2000).max(2200),
    teacher_id: z.uuid(),
  })
  .strict();

const idSchema = z.object({ id: z.uuid() }).strict();
const maxBody = 16384;

class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
}

async function readPayload(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ApiError(400, "Envie os dados em formato JSON.");
  if (Number(request.headers.get("content-length") || 0) > maxBody)
    throw new ApiError(400, "Envie dados válidos em JSON (máximo 16 KB).");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Envie os dados em formato JSON.");
  let text = "";
  let size = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBody)
        throw new ApiError(400, "Envie dados válidos em JSON (máximo 16 KB).");
      text += decoder.decode(value, { stream: true });
    }
    try {
      return JSON.parse(text + decoder.decode()) as unknown;
    } catch {
      throw new ApiError(400, "Envie dados válidos em JSON (máximo 16 KB).");
    }
  } finally {
    await reader.cancel();
  }
}

function bearerToken(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) throw new ApiError(401, "Entre novamente para continuar.");
  return token;
}

function assertPublicConfig(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY)
    throw new ApiError(503, "Serviço indisponível. Contate a administração.");
}

function serviceClient(env: Env, fetcher: typeof fetch) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY)
    throw new ApiError(503, "Serviço administrativo indisponível.");
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: fetcher },
  });
}

async function requireAdmin(token: string, env: Env, fetcher: typeof fetch) {
  assertPublicConfig(env);
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: fetcher,
    },
  });
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser(token);
  if (authError || !user)
    throw new ApiError(401, "Sessão inválida ou expirada.");
  const { data: profile, error } = await client
    .from("profiles")
    .select("role,active")
    .eq("id", user.id)
    .single();
  if (error || !profile?.active || profile.role !== "admin")
    throw new ApiError(403, "Acesso não autorizado.");
  return { client, user };
}

export async function requireMaster(
  token: string,
  env: Env,
  fetcher: typeof fetch = fetch,
) {
  const context = await requireAdmin(token, env, fetcher);
  const masterEmail = env.MASTER_EMAIL?.trim().toLowerCase();
  if (!masterEmail)
    throw new ApiError(
      503,
      "Serviço Master não configurado.",
      "MASTER_CONFIG_MISSING",
    );
  if (context.user.email?.trim().toLowerCase() !== masterEmail)
    throw new ApiError(403, "Acesso não autorizado.", "MASTER_FORBIDDEN");
  return context;
}

function masterValidationMessage(error: z.ZodError) {
  const issue = error.issues[0];
  const field = issue?.path[0];
  if (field === "full_name") return "Informe um nome entre 3 e 150 caracteres.";
  if (field === "password")
    return "A senha inicial deve ter entre 12 e 128 caracteres.";
  if (field === "email" && issue?.message === "domain")
    return "Utilize um e-mail @peralta.com.";
  if (field === "email") return "Informe um e-mail válido.";
  return "Confira os dados informados.";
}

async function handleAdminEndpoint(
  path: string,
  request: Request,
  env: Env,
  fetcher: typeof fetch,
  allowed: string,
) {
  const token = bearerToken(request);
  const { client } = await requireAdmin(token, env, fetcher);
  if (path === "/api/admin/teachers")
    throw new ApiError(
      403,
      "Somente a direção Master pode criar novas contas de professores.",
    );
  const payload = await readPayload(request);
  const parsed = idSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiError(400, "Confira o identificador informado.");
  const { data: teacher } = await client
    .from("profiles")
    .select("email,active")
    .eq("id", parsed.data.id)
    .eq("role", "teacher")
    .single();
  if (!teacher?.active)
    throw new ApiError(404, "Professor inativo ou não encontrado.");

  const service = serviceClient(env, fetcher);
  const redirectTo = `${allowed}/auth/confirm`;
  const invite = await service.auth.admin.generateLink({
    type: "recovery",
    email: teacher.email,
    options: { redirectTo },
  });
  if (invite.error)
    throw new ApiError(
      409,
      "Não foi possível gerar o acesso. Verifique se o e-mail já está cadastrado e tente novamente.",
    );
  const link = new URL(redirectTo);
  link.searchParams.set("token_hash", invite.data.properties.hashed_token);
  link.searchParams.set("type", "recovery");
  return {
    body: { success: true, link: link.toString() },
    status: 200,
  };
}

async function createMasterTeacher(
  request: Request,
  env: Env,
  fetcher: typeof fetch,
  client: Awaited<ReturnType<typeof requireMaster>>["client"],
) {
  const payload = await readPayload(request);
  const parsed = masterTeacherSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiError(400, masterValidationMessage(parsed.error));

  const service = serviceClient(env, fetcher);
  const { full_name, email, password } = parsed.data;
  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (created.error) {
    const code = created.error.code?.toLowerCase();
    const duplicate =
      code === "email_exists" ||
      code === "user_already_exists" ||
      created.error.message.toLowerCase().includes("already");
    throw new ApiError(
      duplicate ? 409 : 502,
      duplicate
        ? "Já existe uma conta com este e-mail."
        : "Não foi possível criar o professor. Tente novamente.",
    );
  }
  if (!created.data.user)
    throw new ApiError(
      502,
      "Não foi possível criar o professor. Tente novamente.",
    );

  const audit = await client.rpc("log_admin_event", {
    p_action: "master_teacher_created",
    p_entity: created.data.user.id,
  });
  if (audit.error)
    throw new ApiError(
      502,
      "Conta criada, mas houve falha ao registrar auditoria. Não repita o cadastro.",
    );

  return {
    success: true,
    teacher: {
      id: created.data.user.id,
      full_name,
      email,
      active: true,
      created_at: created.data.user.created_at,
      last_sign_in_at: created.data.user.last_sign_in_at ?? null,
    },
  };
}

async function createMasterClass(
  request: Request,
  client: Awaited<ReturnType<typeof requireMaster>>["client"],
) {
  const payload = await readPayload(request);
  const parsed = masterClassSchema.safeParse(payload);
  if (!parsed.success)
    throw new ApiError(400, "Confira a série/ano, turma, turno e professor.");

  const { grade_level, group, shift, school_year, teacher_id } = parsed.data;
  const name = `${grade_level} ${group}`;

  const teacher = await client
    .from("profiles")
    .select("id,active,role")
    .eq("id", teacher_id)
    .eq("role", "teacher")
    .maybeSingle();
  if (teacher.error || !teacher.data?.active)
    throw new ApiError(400, "Selecione um professor ativo.");

  const existing = await client
    .from("classes")
    .select("id")
    .eq("name", name)
    .eq("school_year", school_year)
    .limit(1);
  if (existing.error)
    throw new ApiError(502, "Não foi possível verificar as turmas existentes.");
  if ((existing.data ?? []).length > 0)
    throw new ApiError(409, "Esta turma já existe neste ano letivo.");

  const created = await client
    .from("classes")
    .insert({
      name,
      grade_level,
      shift,
      school_year,
      active: true,
    })
    .select("id,name,grade_level,shift,school_year,active")
    .single();
  if (created.error || !created.data)
    throw new ApiError(502, "Não foi possível criar a turma.");

  const linked = await client.from("teacher_classes").insert({
    class_id: created.data.id,
    teacher_id,
    can_manage_students: true,
  });
  if (linked.error) {
    await client.from("classes").delete().eq("id", created.data.id);
    throw new ApiError(
      502,
      "Não foi possível vincular o professor. A turma não foi mantida.",
    );
  }

  return { success: true, schoolClass: created.data };
}

async function listMasterTeachers(env: Env, fetcher: typeof fetch) {
  const service = serviceClient(env, fetcher);
  const profilesResult = await service
    .from("profiles")
    .select("id,full_name,email,active,created_at")
    .eq("role", "teacher")
    .order("full_name");
  if (profilesResult.error)
    throw new ApiError(502, "Não foi possível carregar os professores.");

  const authUsers = [];
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const result = await service.auth.admin.listUsers({ page, perPage });
    if (result.error)
      throw new ApiError(502, "Não foi possível carregar os professores.");
    authUsers.push(...result.data.users);
    if (result.data.users.length < perPage) break;
  }
  const authById = new Map(authUsers.map((user) => [user.id, user]));
  const teachers = (profilesResult.data ?? []).map((profile) => {
    const authUser = authById.get(profile.id);
    return {
      id: profile.id,
      full_name: profile.full_name,
      email: authUser?.email ?? profile.email,
      active: profile.active,
      created_at: profile.created_at,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    };
  });
  return { teachers };
}

export async function handleRequest(
  request: Request,
  env: Env,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
  const allowed = env.ALLOWED_ORIGIN || url.origin;
  const origin = request.headers.get("origin");
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    Vary: "Origin",
  });
  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (origin && origin !== allowed)
    return json({ error: "Origem não permitida." }, 403);
  if (origin) headers.set("Access-Control-Allow-Origin", allowed);
  if (request.method === "OPTIONS") {
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    return new Response(null, { status: 204, headers });
  }

  const methods = new Map<string, string[]>([
    ["/api/admin/teachers", ["POST"]],
    ["/api/admin/teachers/access-link", ["POST"]],
    ["/api/master/status", ["GET"]],
    ["/api/master/teachers", ["GET", "POST"]],
    ["/api/master/classes", ["POST"]],
  ]);
  const accepted = methods.get(url.pathname);
  if (!accepted) return json({ error: "Endpoint não encontrado." }, 404);
  if (!accepted.includes(request.method)) {
    headers.set("Allow", `${accepted.join(", ")}, OPTIONS`);
    return json({ error: "Método não permitido." }, 405);
  }
  if (!request.headers.get("authorization")?.match(/^Bearer (\S+)$/i))
    return json({ error: "Entre novamente para continuar." }, 401);

  try {
    if (url.pathname.startsWith("/api/admin/")) {
      const result = await handleAdminEndpoint(
        url.pathname,
        request,
        env,
        fetcher,
        allowed,
      );
      return json(result.body, result.status);
    }

    const token = bearerToken(request);
    const master = await requireMaster(token, env, fetcher);
    if (url.pathname === "/api/master/status") return json({ isMaster: true });
    if (url.pathname === "/api/master/classes")
      return json(await createMasterClass(request, master.client), 201);
    if (
      url.pathname === "/api/master/teachers" &&
      request.method === "POST"
    )
      return json(
        await createMasterTeacher(request, env, fetcher, master.client),
        201,
      );
    return json(await listMasterTeachers(env, fetcher));
  } catch (error) {
    if (
      error instanceof ApiError ||
      (error instanceof Error &&
        error.name === "ApiError" &&
        "status" in error &&
        typeof error.status === "number")
    )
      return json(
        {
          error: error.message,
          ...((error as ApiError).code
            ? { code: (error as ApiError).code }
            : {}),
        },
        (error as ApiError).status,
      );
    return json(
      { error: "Não foi possível concluir a operação. Tente novamente." },
      502,
    );
  }
}

export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
};
