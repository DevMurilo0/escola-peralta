import { readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { handleRequest, type Env } from "../worker";
const userId = "10000000-0000-4000-8000-000000000001";
const teacherId = "10000000-0000-4000-8000-000000000002";
const env: Env = {
  SUPABASE_URL: "https://supabase.example.test",
  SUPABASE_PUBLISHABLE_KEY: "public-test-key",
  SUPABASE_SERVICE_ROLE_KEY: "private-test-key",
  ALLOWED_ORIGIN: "https://peralta.example.test",
  ASSETS: { fetch: async () => new Response("SPA") },
};
const masterEnv: Env = {
  ...env,
  MASTER_EMAIL: " master@peralta.com ",
};
function request(
  body: unknown = { full_name: "Ana Exemplo", email: "ana@example.test" },
  path = "/api/admin/teachers",
  token = "valid-token",
  origin = env.ALLOWED_ORIGIN,
) {
  return new Request(`https://peralta.example.test${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(body),
  });
}
function backend(
  options: {
    role?: string;
    active?: boolean;
    authFail?: boolean;
    inviteFail?: boolean;
    auditFail?: boolean;
    inactiveTeacher?: boolean;
  } = {},
) {
  const calls: { path: string; authorization: string | null; body: unknown }[] =
    [];
  const fetcher = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const headers = new Headers(init?.headers);
      const body =
        typeof init?.body === "string" ? JSON.parse(init.body) : null;
      calls.push({
        path: url.pathname,
        authorization: headers.get("authorization"),
        body,
      });
      const reply = (value: unknown, status = 200) =>
        new Response(JSON.stringify(value), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      if (url.pathname === "/auth/v1/user")
        return options.authFail
          ? reply({ message: "expired", code: "bad_jwt" }, 401)
          : reply({
              id: userId,
              email: "admin@example.test",
              aud: "authenticated",
            });
      if (url.pathname === "/rest/v1/profiles")
        return reply(
          url.searchParams.has("role")
            ? { email: "ana@example.test", active: !options.inactiveTeacher }
            : {
                role: options.role || "admin",
                active: options.active !== false,
              },
        );
      if (url.pathname === "/auth/v1/admin/generate_link")
        return options.inviteFail
          ? reply({ message: "internal-secret-detail" }, 422)
          : reply({
              id: teacherId,
              email: "ana@example.test",
              hashed_token: "one-time-token",
              action_link: "https://supabase.example.test/verify",
              email_otp: "123456",
              verification_type: "invite",
              redirect_to: "https://peralta.example.test/auth/confirm",
            });
      if (url.pathname === "/rest/v1/rpc/log_admin_event")
        return options.auditFail
          ? reply({ message: "internal SQL" }, 500)
          : reply(null);
      throw new Error(`Unexpected upstream: ${url.pathname}`);
    },
  );
  return { fetcher: fetcher as typeof fetch, calls };
}
describe("Worker administrativo", () => {
  it("não consulta serviço sem bearer", async () => {
    const b = backend();
    const r = await handleRequest(
      request(undefined, undefined, ""),
      env,
      b.fetcher,
    );
    expect(r.status).toBe(401);
    expect(b.calls).toHaveLength(0);
  });
  it("rejeita token inválido", async () => {
    const b = backend({ authFail: true });
    const r = await handleRequest(request(), env, b.fetcher);
    expect(r.status).toBe(401);
    expect(b.calls).toHaveLength(1);
  });
  it.each([{ role: "teacher" }, { active: false }])(
    "bloqueia perfil sem privilégio ativo: %j",
    async (options) => {
      const b = backend(options);
      const r = await handleRequest(request(), env, b.fetcher);
      expect(r.status).toBe(403);
      expect(
        b.calls.every((c) => c.authorization === "Bearer valid-token"),
      ).toBe(true);
      expect(b.calls.some((c) => c.path.includes("/admin/"))).toBe(false);
    },
  );
  it("valida origem antes de tocar no Supabase", async () => {
    const b = backend();
    const r = await handleRequest(
      request(undefined, undefined, undefined, "https://evil.test"),
      env,
      b.fetcher,
    );
    expect(r.status).toBe(403);
    expect(b.calls).toHaveLength(0);
    expect(r.headers.has("Access-Control-Allow-Origin")).toBe(false);
  });
  it.each([
    { full_name: "A", email: "invalid" },
    { full_name: "Ana Exemplo", email: "ana@example.test", role: "admin" },
  ])(
    "não permite contornar o Master pelo endpoint legado: %j",
    async (body) => {
      const b = backend();
      const r = await handleRequest(request(body), env, b.fetcher);
      expect(r.status).toBe(403);
      expect(b.calls.some((c) => c.path.includes("/admin/"))).toBe(false);
    },
  );
  it("bloqueia criação por convite até para admin autenticado", async () => {
    const b = backend();
    const r = await handleRequest(request(), env, b.fetcher);
    expect(r.status).toBe(403);
    expect(b.calls.map((c) => c.path)).toEqual([
      "/auth/v1/user",
      "/rest/v1/profiles",
    ]);
    expect(r.headers.get("Cache-Control")).toBe("no-store");
  });
  it("gera recuperação somente para professor ativo", async () => {
    const b = backend();
    const r = await handleRequest(
      request({ id: teacherId }, "/api/admin/teachers/access-link"),
      env,
      b.fetcher,
    );
    expect(r.status).toBe(200);
    expect(((await r.json()) as { link: string }).link).toContain(
      "type=recovery",
    );
    expect(b.calls.at(-1)?.body).toMatchObject({
      type: "recovery",
      email: "ana@example.test",
    });
  });
  it("não gera link para professor inativo", async () => {
    const b = backend({ inactiveTeacher: true });
    const r = await handleRequest(
      request({ id: teacherId }, "/api/admin/teachers/access-link"),
      env,
      b.fetcher,
    );
    expect(r.status).toBe(404);
    expect(b.calls.some((c) => c.path.includes("/admin/"))).toBe(false);
  });
  it("sanitiza erro do serviço", async () => {
    const b = backend({ inviteFail: true });
    const r = await handleRequest(
      request({ id: teacherId }, "/api/admin/teachers/access-link"),
      env,
      b.fetcher,
    );
    expect(r.status).toBe(409);
    expect(await r.text()).not.toContain("internal-secret-detail");
  });
  it("explica criação Master parcial quando auditoria falha", async () => {
    const b = masterBackend({ auditFail: true });
    const r = await handleRequest(masterRequest("POST"), masterEnv, b.fetcher);
    expect(r.status).toBe(502);
    expect(await r.text()).toContain("Conta criada");
  });
  it("não expõe detalhes de falha de rede", async () => {
    const r = await handleRequest(request(), env, (async () => {
      throw new Error("private-test-key");
    }) as typeof fetch);
    expect(r.status).toBeGreaterThanOrEqual(400);
    expect(await r.text()).not.toContain("private-test-key");
  });
  it("limita corpo mesmo sem content-length", async () => {
    const b = masterBackend();
    const r = await handleRequest(
      masterRequest("POST", undefined, {
        full_name: "x".repeat(17000),
        email: "teste@peralta.com",
        password: "senha-segura-123",
      }),
      masterEnv,
      b.fetcher,
    );
    expect(r.status).toBe(400);
    expect(b.calls.some((c) => c.path.includes("/admin/"))).toBe(false);
  });
  it("API desconhecida não cai no HTML da SPA", async () => {
    const r = await handleRequest(request({}, "/api/desconhecido"), env);
    expect(r.status).toBe(404);
    expect(r.headers.get("Content-Type")).toContain("application/json");
  });
  it("responde preflight estrito", async () => {
    const r = await handleRequest(
      new Request("https://peralta.example.test/api/admin/teachers", {
        method: "OPTIONS",
        headers: { Origin: env.ALLOWED_ORIGIN! },
      }),
      env,
    );
    expect(r.status).toBe(204);
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe(
      env.ALLOWED_ORIGIN,
    );
  });
  it("entrega rotas SPA ao binding de assets", async () => {
    expect(
      await (
        await handleRequest(
          new Request("https://peralta.example.test/portal/turmas/123"),
          env,
        )
      ).text(),
    ).toBe("SPA");
  });
});

function masterRequest(
  method: "GET" | "POST",
  path = "/api/master/teachers",
  body: unknown = {
    full_name: "Professor de Teste",
    email: " TESTE@PERALTA.COM ",
    password: "senha-segura-123",
  },
  token = "valid-token",
) {
  return new Request(`https://peralta.example.test${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
}

function masterBackend(
  options: {
    role?: "admin" | "teacher";
    active?: boolean;
    email?: string;
    authFail?: boolean;
    duplicate?: boolean;
    auditFail?: boolean;
    lastSignIn?: string | null;
  } = {},
) {
  const calls: {
    path: string;
    method: string;
    authorization: string | null;
    body: unknown;
  }[] = [];
  const fetcher = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const headers = new Headers(init?.headers);
      const body =
        typeof init?.body === "string" ? JSON.parse(init.body) : null;
      calls.push({
        path: url.pathname,
        method: init?.method || "GET",
        authorization: headers.get("authorization"),
        body,
      });
      const reply = (
        value: unknown,
        status = 200,
        responseHeaders: Record<string, string> = {},
      ) =>
        new Response(JSON.stringify(value), {
          status,
          headers: { "Content-Type": "application/json", ...responseHeaders },
        });
      if (url.pathname === "/auth/v1/user")
        return options.authFail
          ? reply({ message: "expired" }, 401)
          : reply({
              id: userId,
              email: options.email ?? "Master@Peralta.com",
              aud: "authenticated",
            });
      if (url.pathname === "/rest/v1/profiles") {
        if (url.searchParams.get("id")?.includes(teacherId))
          return reply({
            id: teacherId,
            role: "teacher",
            active: true,
          });
        if (headers.get("authorization") === "Bearer private-test-key") {
          return reply([
            {
              id: teacherId,
              full_name: "Ana Exemplo",
              email: "ana@peralta.com",
              active: true,
              created_at: "2026-09-01T12:00:00.000Z",
            },
            {
              id: "10000000-0000-4000-8000-000000000003",
              full_name: "Bruno Exemplo",
              email: "bruno@peralta.com",
              active: false,
              created_at: "2026-09-02T12:00:00.000Z",
            },
          ]);
        }
        return reply({
          role: options.role ?? "admin",
          active: options.active !== false,
        });
      }
      if (url.pathname === "/rest/v1/classes") {
        if ((init?.method || "GET") === "GET") return reply([]);
        if (init?.method === "POST")
          return reply({
            id: "20000000-0000-4000-8000-000000000010",
            ...(body as Record<string, unknown>),
          }, 201);
        if (init?.method === "DELETE") return reply(null, 204);
      }
      if (
        url.pathname === "/rest/v1/teacher_classes" &&
        init?.method === "POST"
      )
        return reply(null, 201);
      if (url.pathname === "/auth/v1/admin/users" && init?.method === "POST")
        return options.duplicate
          ? reply(
              { message: "User already registered", code: "email_exists" },
              422,
            )
          : reply({
              user: {
                id: teacherId,
                email: "teste@peralta.com",
                created_at: "2026-09-12T20:00:00.000Z",
                last_sign_in_at: null,
                user_metadata: { full_name: "Professor de Teste" },
                app_metadata: {},
                aud: "authenticated",
              },
            });
      if (url.pathname === "/auth/v1/admin/users")
        return reply({
          users: [
            {
              id: teacherId,
              email: "ana@peralta.com",
              last_sign_in_at: options.lastSignIn ?? null,
            },
            {
              id: "10000000-0000-4000-8000-000000000003",
              email: "bruno@peralta.com",
              last_sign_in_at: "2026-09-12T21:30:00.000Z",
            },
          ],
        });
      if (url.pathname === "/rest/v1/rpc/log_admin_event")
        return options.auditFail
          ? reply({ message: "private SQL" }, 500)
          : reply(null);
      throw new Error(`Unexpected upstream: ${url.pathname}`);
    },
  );
  return { fetcher: fetcher as typeof fetch, calls };
}

describe("Worker Master", () => {
  it("exige bearer antes de consultar serviços", async () => {
    const backend = masterBackend();
    const response = await handleRequest(
      masterRequest("GET", "/api/master/status", undefined, ""),
      masterEnv,
      backend.fetcher,
    );
    expect(response.status).toBe(401);
    expect(backend.calls).toHaveLength(0);
  });

  it.each([
    ["professor", { role: "teacher" as const }, 403],
    ["admin comum", { email: "admin@peralta.com" }, 403],
    ["perfil inativo", { active: false }, 403],
  ])("bloqueia %s", async (_name, options, status) => {
    const backend = masterBackend(options);
    const response = await handleRequest(
      masterRequest("GET", "/api/master/status"),
      masterEnv,
      backend.fetcher,
    );
    expect(response.status).toBe(status);
  });

  it("reconhece Master com e-mails normalizados", async () => {
    const backend = masterBackend();
    const response = await handleRequest(
      masterRequest("GET", "/api/master/status"),
      masterEnv,
      backend.fetcher,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ isMaster: true });
  });

  it("retorna erro seguro quando MASTER_EMAIL está ausente", async () => {
    const backend = masterBackend();
    const response = await handleRequest(
      masterRequest("GET", "/api/master/status"),
      { ...masterEnv, MASTER_EMAIL: "" },
      backend.fetcher,
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "Serviço Master não configurado.",
      code: "MASTER_CONFIG_MISSING",
    });
  });

  it("mantém MASTER_EMAIL apenas no runtime preservado do Worker", () => {
    const wrangler = readFileSync("wrangler.jsonc", "utf8");
    const vite = readFileSync("vite.config.ts", "utf8");
    const publicExample = readFileSync(".env.example", "utf8");
    const workerExample = readFileSync(".dev.vars.example", "utf8");
    expect(wrangler).toMatch(/"keep_vars"\s*:\s*true/);
    expect(wrangler).not.toContain("MASTER_EMAIL");
    expect(vite).not.toContain("VITE_MASTER_EMAIL");
    expect(publicExample).not.toContain("MASTER_EMAIL");
    expect(workerExample).toMatch(/^MASTER_EMAIL=$/m);
  });

  it("Master cria turma padronizada e vincula o professor selecionado", async () => {
    const backend = masterBackend();
    const response = await handleRequest(
      masterRequest("POST", "/api/master/classes", {
        grade_level: "Jardim",
        group: "2",
        shift: "Manhã",
        school_year: 2026,
        teacher_id: teacherId,
      }),
      masterEnv,
      backend.fetcher,
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      success: true,
      schoolClass: {
        name: "Jardim 2",
        grade_level: "Jardim",
        shift: "Manhã",
        school_year: 2026,
      },
    });
    const classCreate = backend.calls.find(
      (call) =>
        call.path === "/rest/v1/classes" && call.method === "POST",
    );
    expect(classCreate?.authorization).toBe("Bearer valid-token");
    expect(classCreate?.body).toMatchObject({
      name: "Jardim 2",
      grade_level: "Jardim",
      shift: "Manhã",
      school_year: 2026,
      active: true,
    });
    const association = backend.calls.find(
      (call) =>
        call.path === "/rest/v1/teacher_classes" && call.method === "POST",
    );
    expect(association?.body).toEqual({
      class_id: "20000000-0000-4000-8000-000000000010",
      teacher_id: teacherId,
      can_manage_students: true,
    });
  });

  it("admin comum não cria turma pela API Master", async () => {
    const backend = masterBackend({ email: "admin@peralta.com" });
    const response = await handleRequest(
      masterRequest("POST", "/api/master/classes", {
        grade_level: "3º Ano",
        group: "A",
        shift: "Manhã",
        school_year: 2026,
        teacher_id: teacherId,
      }),
      masterEnv,
      backend.fetcher,
    );
    expect(response.status).toBe(403);
    expect(
      backend.calls.some(
        (call) =>
          call.path === "/rest/v1/classes" && call.method === "POST",
      ),
    ).toBe(false);
  });

  it("cria usuário confirmado e audita sem retornar senha", async () => {
    const backend = masterBackend();
    const response = await handleRequest(
      masterRequest("POST"),
      masterEnv,
      backend.fetcher,
    );
    expect(response.status).toBe(201);
    expect(await response.text()).not.toContain("senha-segura-123");
    const createCall = backend.calls.find(
      (call) => call.path === "/auth/v1/admin/users",
    );
    expect(createCall?.authorization).toBe("Bearer private-test-key");
    expect(createCall?.body).toMatchObject({
      email: "teste@peralta.com",
      password: "senha-segura-123",
      email_confirm: true,
      user_metadata: { full_name: "Professor de Teste" },
    });
    const audit = backend.calls.find((call) =>
      call.path.includes("log_admin_event"),
    );
    expect(audit?.authorization).toBe("Bearer valid-token");
    expect(audit?.body).toEqual({
      p_action: "master_teacher_created",
      p_entity: teacherId,
    });
    expect(JSON.stringify(audit?.body)).not.toContain("senha-segura-123");
  });

  it.each([
    [
      { full_name: "A", email: "a@peralta.com", password: "senha-segura-123" },
      "nome",
    ],
    [
      { full_name: "Professor", email: "a@peralta.com", password: "curta" },
      "senha inicial",
    ],
    [
      {
        full_name: "Professor",
        email: "a@example.com",
        password: "senha-segura-123",
      },
      "@peralta.com",
    ],
  ])("valida payload Master: %j", async (body, message) => {
    const backend = masterBackend();
    const response = await handleRequest(
      masterRequest("POST", undefined, body),
      masterEnv,
      backend.fetcher,
    );
    expect(response.status).toBe(400);
    expect((await response.text()).toLowerCase()).toContain(message);
    expect(
      backend.calls.some((call) => call.path === "/auth/v1/admin/users"),
    ).toBe(false);
  });

  it("trata e-mail duplicado sem expor erro interno", async () => {
    const backend = masterBackend({ duplicate: true });
    const response = await handleRequest(
      masterRequest("POST"),
      masterEnv,
      backend.fetcher,
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Já existe uma conta com este e-mail.",
    });
  });

  it("exige service role somente após autorizar o Master", async () => {
    const backend = masterBackend();
    const response = await handleRequest(
      masterRequest("POST"),
      { ...masterEnv, SUPABASE_SERVICE_ROLE_KEY: "" },
      backend.fetcher,
    );
    expect(response.status).toBe(503);
    expect(
      backend.calls.some((call) => call.path === "/auth/v1/admin/users"),
    ).toBe(false);
  });

  it("lista professores combinando acessos presentes e ausentes", async () => {
    const backend = masterBackend({
      lastSignIn: "2026-09-12T21:00:00.000Z",
    });
    const response = await handleRequest(
      masterRequest("GET"),
      masterEnv,
      backend.fetcher,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      teachers: [
        expect.objectContaining({
          id: teacherId,
          last_sign_in_at: "2026-09-12T21:00:00.000Z",
        }),
        expect.objectContaining({
          id: "10000000-0000-4000-8000-000000000003",
          last_sign_in_at: "2026-09-12T21:30:00.000Z",
        }),
      ],
    });
    expect(
      backend.calls.filter((call) => call.path === "/rest/v1/profiles"),
    ).toHaveLength(2);
    expect(
      backend.calls.filter((call) => call.path === "/auth/v1/admin/users"),
    ).toHaveLength(1);
  });

  it("representa como nulo quem nunca acessou", async () => {
    const backend = masterBackend({ lastSignIn: null });
    const response = await handleRequest(
      masterRequest("GET"),
      masterEnv,
      backend.fetcher,
    );
    const result = (await response.json()) as {
      teachers: { last_sign_in_at: string | null }[];
    };
    expect(result.teachers[0].last_sign_in_at).toBeNull();
  });
});
