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
  ])("rejeita payload inválido e papel injetado", async (body) => {
    const b = backend();
    const r = await handleRequest(request(body), env, b.fetcher);
    expect(r.status).toBe(400);
    expect(b.calls.some((c) => c.path.includes("/admin/"))).toBe(false);
  });
  it("cria professor depois de validar admin e audita com JWT do autor", async () => {
    const b = backend();
    const r = await handleRequest(request(), env, b.fetcher);
    expect(r.status).toBe(201);
    expect(await r.json()).toEqual({
      success: true,
      link: "https://peralta.example.test/auth/confirm?token_hash=one-time-token&type=invite",
    });
    expect(b.calls.map((c) => c.path)).toEqual([
      "/auth/v1/user",
      "/rest/v1/profiles",
      "/auth/v1/admin/generate_link",
      "/rest/v1/rpc/log_admin_event",
    ]);
    expect(b.calls[2].authorization).toBe("Bearer private-test-key");
    expect(b.calls[2].body).toMatchObject({
      type: "invite",
      email: "ana@example.test",
      data: { full_name: "Ana Exemplo" },
    });
    expect(b.calls[3].authorization).toBe("Bearer valid-token");
    expect(b.calls[3].body).toEqual({
      p_action: "teacher_created",
      p_entity: teacherId,
    });
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
    const r = await handleRequest(request(), env, b.fetcher);
    expect(r.status).toBe(409);
    expect(await r.text()).not.toContain("internal-secret-detail");
  });
  it("explica criação parcial quando auditoria falha", async () => {
    const b = backend({ auditFail: true });
    const r = await handleRequest(request(), env, b.fetcher);
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
    const b = backend();
    const r = await handleRequest(
      request({ text: "x".repeat(17000) }),
      env,
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
