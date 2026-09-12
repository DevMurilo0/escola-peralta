import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  ALLOWED_ORIGIN?: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}
const teacherSchema = z
  .object({
    full_name: z.string().trim().min(3).max(150),
    email: z.email().max(254),
  })
  .strict();
const idSchema = z.object({ id: z.uuid() }).strict();
const maxBody = 16384;
async function readPayload(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("payload");
  if (Number(request.headers.get("content-length") || 0) > maxBody)
    throw new Error("payload");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("payload");
  let text = "",
    size = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBody) throw new Error("payload");
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } finally {
    await reader.cancel();
  }
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
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    return new Response(null, { status: 204, headers });
  }
  if (
    !["/api/admin/teachers", "/api/admin/teachers/access-link"].includes(
      url.pathname,
    )
  )
    return json({ error: "Endpoint não encontrado." }, 404);
  if (request.method !== "POST") {
    headers.set("Allow", "POST, OPTIONS");
    return json({ error: "Método não permitido." }, 405);
  }
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return json({ error: "Entre novamente para continuar." }, 401);
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY)
    return json(
      { error: "Serviço indisponível. Contate a administração." },
      503,
    );
  try {
    const userClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: { Authorization: `Bearer ${token}` },
          fetch: fetcher,
        },
      },
    );
    // Validate the JWT remotely; never trust roles from the body or JWT metadata.
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser(token);
    if (authError || !user)
      return json({ error: "Sessão inválida ou expirada." }, 401);
    const { data: profile, error } = await userClient
      .from("profiles")
      .select("role,active")
      .eq("id", user.id)
      .single();
    if (error || !profile?.active || profile.role !== "admin")
      return json({ error: "Acesso não autorizado." }, 403);
    let payload: unknown;
    try {
      payload = await readPayload(request);
    } catch {
      return json(
        { error: "Envie dados válidos em JSON (máximo 16 KB)." },
        400,
      );
    }
    const creating = url.pathname === "/api/admin/teachers";
    const parsed = creating
      ? teacherSchema.safeParse(payload)
      : idSchema.safeParse(payload);
    if (!parsed.success)
      return json(
        { error: "Confira o nome, o e-mail ou o identificador informado." },
        400,
      );
    let email: string;
    let fullName: string | undefined;
    if (creating) {
      const values = teacherSchema.parse(payload);
      email = values.email;
      fullName = values.full_name;
    } else {
      const { id } = idSchema.parse(payload);
      const { data: teacher } = await userClient
        .from("profiles")
        .select("email,active")
        .eq("id", id)
        .eq("role", "teacher")
        .single();
      if (!teacher?.active)
        return json({ error: "Professor inativo ou não encontrado." }, 404);
      email = teacher.email;
    }
    // Privileged client is created ONLY after live user/profile authorization and validation.
    if (!env.SUPABASE_SERVICE_ROLE_KEY)
      return json({ error: "Serviço administrativo indisponível." }, 503);
    const service = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: { fetch: fetcher },
      },
    );
    const redirectTo = `${allowed}/auth/confirm`;
    const invite = await service.auth.admin.generateLink(
      creating
        ? {
            type: "invite",
            email,
            options: { data: { full_name: fullName }, redirectTo },
          }
        : { type: "recovery", email, options: { redirectTo } },
    );
    if (invite.error)
      return json(
        {
          error:
            "Não foi possível gerar o acesso. Verifique se o e-mail já está cadastrado e tente novamente.",
        },
        409,
      );
    if (creating) {
      const audit = await userClient.rpc("log_admin_event", {
        p_action: "teacher_created",
        p_entity: invite.data.user.id,
      });
      if (audit.error)
        return json(
          {
            error:
              "Conta criada, mas houve falha ao registrar auditoria. Gere um link na lista de professores; não repita o cadastro.",
          },
          502,
        );
    }
    const link = new URL(redirectTo);
    link.searchParams.set("token_hash", invite.data.properties.hashed_token);
    link.searchParams.set("type", creating ? "invite" : "recovery");
    return json({ success: true, link: link.toString() }, creating ? 201 : 200);
  } catch {
    // Do not return upstream messages, tokens, SQL or service credentials.
    return json(
      { error: "Não foi possível concluir a operação. Tente novamente." },
      502,
    );
  }
}
export default {
  fetch: (request: Request, env: Env) => handleRequest(request, env),
};
