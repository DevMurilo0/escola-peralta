import { test, expect } from "@playwright/test";
import {
  installSupabaseTransport,
  signIn,
  signInWithCredentials,
  classId,
  studentId,
} from "./supabase-transport";
import { todayRecife } from "../../src/shared/academic/utils";

for (const role of ["teacher", "admin"] as const) {
  test(`${role}: rotas diretas e refresh preservam sessão`, async ({
    page,
  }) => {
    const state = await installSupabaseTransport(page, role);
    await signIn(page, role);
    await expect(
      page.getByRole("heading", { name: "Olá, Ana." }),
    ).toBeVisible();
    const routes = [
      ["/portal", "Olá, Ana."],
      ["/portal/turmas", "Olá, Ana."],
      ["/portal/calendario", "Calendário de chamadas"],
      ["/portal/perfil", "Perfil"],
      ...(role === "admin" ? [["/portal/admin", "Administração"]] : []),
    ];
    for (const [path, heading] of routes) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(page).toHaveURL(path);
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    }
    expect(state.tokenRequests).toBe(1);
    const document = await page.evaluate(() => performance.timeOrigin);
    for (const label of ["Minhas turmas", "Calendário", "Perfil", "Início"]) {
      await page
        .getByRole("navigation", { name: "Portal", exact: true })
        .getByRole("link", { name: label, exact: true })
        .click();
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => performance.timeOrigin)).toBe(document);
    }
  });
}

test("confirmação de convite abre diretamente e aguarda clique", async ({
  page,
}) => {
  let verificationRequests = 0;
  await page.route("**/auth/v1/verify**", async (route) => {
    verificationRequests++;
    await route.fulfill({
      status: 400,
      json: { message: "Invalid test token" },
    });
  });
  await page.goto("/auth/confirm?token_hash=test&type=invite");
  await expect(
    page.getByRole("heading", { name: "Seu acesso ao Portal Peralta" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Confirmar meu acesso" }),
  ).toBeVisible();
  expect(verificationRequests).toBe(0);
  await page.getByRole("button", { name: "Confirmar meu acesso" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Link inválido ou expirado",
  );
  expect(verificationRequests).toBe(1);
});

test("professor: login, sessão persistida, notas e chamada persistem após refresh", async ({
  page,
}) => {
  const state = await installSupabaseTransport(page);
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Olá, Ana." })).toBeVisible();
  await page.getByRole("link", { name: /Acessar turma/ }).click();
  await page.getByRole("button", { name: "Abrir I Bimestre" }).click();
  await page.getByRole("button", { name: /Notas por atividade/ }).click();
  await page.getByLabel("1ª Nota de Alice Exemplo").fill("8");
  await page.getByLabel("2ª Nota de Alice Exemplo").fill("9");
  await expect(page.locator(".grade-average")).toContainText("8,5");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByRole("status")).toContainText("Notas salvas");
  await page.reload();
  await expect(page.getByLabel("1ª Nota de Alice Exemplo")).toHaveValue("8");
  await expect(page).toHaveURL(/term=1&module=grades/);
  expect(state.tokenRequests).toBe(1);
  await page.getByRole("button", { name: "3º Ano A", exact: true }).click();
  await page.getByRole("button", { name: "Abrir II Bimestre" }).click();
  await page.getByRole("button", { name: /Frequência diária/ }).click();
  await page
    .getByRole("button", { name: "Marcar todos como presentes" })
    .click();
  await page.getByLabel("Falta justificada", { exact: true }).check();
  await page.getByRole("button", { name: "Salvar frequência" }).click();
  await expect(page.getByRole("status")).toContainText("Frequência salva");
  await page.reload();
  await expect(page).toHaveURL(/term=2&module=attendance/);
  await expect(
    page.getByRole("heading", { name: "Frequência diária" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Falta justificada", { exact: true }),
  ).toBeChecked();
  expect(state.sessions).toHaveLength(1);
  expect(state.sessions[0].date).toBe(todayRecife());
});

test("professor cria turma própria pelo portal", async ({ page }) => {
  await installSupabaseTransport(page);
  await signIn(page);
  await page.getByRole("button", { name: "+ Nova turma" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Nome da turma/).fill("5º Ano A");
  await dialog.getByLabel(/Série\/Ano/).fill("5º Ano");
  await dialog.getByLabel(/Turno/).selectOption("Tarde");
  await dialog.getByRole("button", { name: "Criar turma" }).click();
  await expect(page).toHaveURL(new RegExp(`/portal/turmas/${classId}$`));
  await expect(page.getByRole("heading", { name: "5º Ano A" })).toBeVisible();
});

test("I–IV bimestres, conteúdos curriculares e resultado final ficam integrados", async ({
  page,
}) => {
  const state = await installSupabaseTransport(page);
  state.grades = [1, 2, 3, 4].map((term) => ({
    student_id: studentId,
    term,
    activity_score: 7,
    exam_score: 9,
    average: 8,
  }));
  await signIn(page);
  await page.getByRole("link", { name: /Acessar turma/ }).click();
  for (const term of ["I", "II", "III", "IV"])
    await expect(
      page.getByRole("button", { name: `Abrir ${term} Bimestre`, exact: true }),
    ).toBeVisible();

  await page.getByRole("button", { name: "Abrir I Bimestre" }).click();
  await page
    .getByRole("button", {
      name: /Registro dos conteúdos curriculares trabalhados/,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Conteúdos trabalhados" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "+ Registrar conteúdo" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Componente curricular/).fill("Matemática");
  await dialog.getByLabel(/Conteúdo trabalhado/).fill("Frações equivalentes");
  await dialog.getByRole("button", { name: "Salvar conteúdo" }).click();
  await expect(page.getByText("Frações equivalentes")).toBeVisible();

  await page.getByRole("button", { name: "3º Ano A", exact: true }).click();
  await page.getByRole("button", { name: /Resultado final/ }).click();
  await expect(
    page.getByRole("columnheader", { name: "Situação" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "8,0", exact: true }),
  ).toHaveCount(5);
  await expect(page.getByRole("cell", { name: "Aprovado" })).toBeVisible();

  state.grades = state.grades.slice(0, 3);
  await page.reload();
  await expect(page.getByRole("cell", { name: "Em andamento" })).toBeVisible();

  state.grades = [1, 2, 3, 4].map((term) => ({
    student_id: studentId,
    term,
    activity_score: 5,
    exam_score: 6,
    average: 5.5,
  }));
  await page.reload();
  await expect(
    page.getByRole("cell", { name: "5,5", exact: true }),
  ).toHaveCount(5);
  await expect(
    page.getByRole("cell", { name: "Abaixo da média" }),
  ).toBeVisible();
});

test("guard bloqueia professor em administração; logout encerra a sessão", async ({
  page,
}) => {
  await installSupabaseTransport(page);
  await signIn(page);
  await expect(page.getByRole("heading", { name: "Olá, Ana." })).toBeVisible();
  await page.goto("/portal/admin");
  await expect(
    page.getByRole("heading", { name: "Acesso não autorizado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(page).toHaveURL(/\/portal\/login/);
  await page.goto(`/portal/turmas/${classId}`);
  await expect(page).toHaveURL(/\/portal\/login/);
});

test("guard bloqueia conta inativa", async ({ page }) => {
  await installSupabaseTransport(page, "teacher", false);
  await signIn(page);
  await expect(
    page.getByRole("heading", { name: "Acesso não autorizado" }),
  ).toBeVisible();
});

test("admin comum gerencia professores sem poder criar contas", async ({
  page,
}) => {
  const state = await installSupabaseTransport(page, "admin");
  await signIn(page, "admin");
  await page.getByRole("link", { name: "Administração", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Administração", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Professores", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Criar professor/ }),
  ).toHaveCount(0);
  await expect(page.getByText(/Somente a direção Master/)).toBeVisible();
  const forbidden = await page.evaluate(async () => {
    const response = await fetch("/api/admin/teachers", {
      method: "POST",
      headers: {
        Authorization: "Bearer fixture-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ full_name: "Tentativa", email: "x@peralta.com" }),
    });
    return response.status;
  });
  expect(forbidden).toBe(403);
  await page.getByRole("button", { name: "Link de acesso" }).click();
  await expect(page.getByRole("status")).toContainText("Operação concluída");
  expect(state.workerRequests).toBe(2);
});

test("administração separa turmas em cards responsivos e sem contadores", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installSupabaseTransport(page, "admin");
  await signIn(page, "admin");
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page.getByRole("link", { name: "Administração", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Turmas", exact: true }),
  ).toBeVisible();
  const cards = page.locator(".admin-class");
  await expect(cards).toHaveCount(2);
  await expect(
    cards.getByRole("heading", { name: "Professores vinculados" }),
  ).toHaveCount(2);
  await expect(
    cards.getByRole("heading", { name: "Adicionar professor" }),
  ).toHaveCount(2);
  const presentation = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        borderStyle: style.borderStyle,
        borderRadius: Number.parseFloat(style.borderRadius),
        background: style.backgroundColor,
        top: box.top,
        bottom: box.bottom,
      };
    }),
  );
  expect(presentation.every((card) => card.borderStyle === "solid")).toBe(true);
  expect(presentation.every((card) => card.borderRadius >= 10)).toBe(true);
  expect(
    presentation.every((card) => card.background !== "rgba(0, 0, 0, 0)"),
  ).toBe(true);
  expect(presentation[1].top - presentation[0].bottom).toBeGreaterThanOrEqual(
    19,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("falha de configuração Master tem diagnóstico próprio e não libera criação", async ({
  page,
}) => {
  await installSupabaseTransport(page, "admin", true, "config-missing");
  await signIn(page, "admin");
  await page.getByRole("link", { name: "Administração", exact: true }).click();
  await page.getByRole("button", { name: "Professores", exact: true }).click();

  await expect(
    page.getByRole("heading", { name: "Professores", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText(
    "Configuração Master indisponível no servidor.",
  );
  await expect(
    page.getByRole("button", { name: /Criar professor/ }),
  ).toHaveCount(0);
});

test("Master cria professor real e o novo professor autentica pelo fluxo normal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await installSupabaseTransport(page, "admin", true, true);
  await signIn(page, "admin");
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page.getByRole("link", { name: "Administração", exact: true }).click();
  await page.getByRole("button", { name: "Professores", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Professores", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Nunca acessou", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "+ Criar professor" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Nome completo")).toBeVisible();
  await expect(dialog.getByLabel("E-mail")).toHaveAttribute(
    "placeholder",
    "nome@peralta.com",
  );
  await expect(dialog.getByLabel("Senha inicial")).toHaveAttribute(
    "type",
    "password",
  );
  await expect(dialog.getByLabel("Confirmar senha")).toBeVisible();
  await expect(
    dialog.getByText(/definirá a própria senha por um link/),
  ).toHaveCount(0);
  await dialog.getByLabel("Mostrar senha").check();
  await expect(dialog.getByLabel("Senha inicial")).toHaveAttribute(
    "type",
    "text",
  );

  await dialog.getByLabel("Nome completo").fill("Professor Criado");
  await dialog.getByLabel("E-mail").fill("teste@peralta.com");
  await dialog.getByLabel("Senha inicial").fill("curta");
  await dialog.getByLabel("Confirmar senha").fill("curta");
  await dialog.getByRole("button", { name: "Criar professor" }).click();
  expect(state.masterCreates).toBe(0);
  await dialog.getByLabel("Senha inicial").fill("senha-segura-123");
  await dialog.getByLabel("Confirmar senha").fill("senha-diferente-123");
  await dialog.getByRole("button", { name: "Criar professor" }).click();
  await expect(dialog.getByRole("status")).toContainText(
    "As senhas informadas não coincidem",
  );
  expect(state.masterCreates).toBe(0);
  await dialog.getByLabel("Confirmar senha").fill("senha-segura-123");
  await dialog.getByRole("button", { name: "Criar professor" }).click();
  await expect(page.getByText(/Professor criado com sucesso/)).toBeVisible();
  expect(state.masterCreates).toBe(1);
  await expect(
    page.getByRole("heading", { name: "Professor Criado" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await signInWithCredentials(page, "teste@peralta.com", "senha-segura-123");
  await expect(
    page.getByRole("heading", { name: "Olá, Professor." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Administração", exact: true }),
  ).toHaveCount(0);
  const forbidden = await page.evaluate(async () => {
    const response = await fetch("/api/master/status", {
      headers: { Authorization: "Bearer fixture-token" },
    });
    return response.status;
  });
  expect(forbidden).toBe(403);
});

test("refresh direto, API real sem autenticação e cabeçalhos privados", async ({
  page,
  request,
}) => {
  const response = await request.post("/api/admin/teachers", { data: {} });
  expect(response.status()).toBe(401);
  expect(response.headers()["content-type"]).toContain("application/json");
  const privatePage = await request.get("/portal/admin");
  expect(privatePage.status()).toBe(200);
  expect(privatePage.headers()["x-robots-tag"]).toContain("noindex");
  await page.goto(
    "/portal/turmas/20000000-0000-4000-8000-000000000001?term=4&module=attendance",
  );
  await expect(page).toHaveURL(/\/portal\/login/);
});
