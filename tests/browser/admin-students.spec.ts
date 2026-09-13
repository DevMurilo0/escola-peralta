import { test, expect } from "@playwright/test";
import {
  classId,
  installSupabaseTransport,
  signIn,
  studentId,
} from "./supabase-transport";

test("admin pesquisa e consulta o histórico acadêmico do aluno", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await installSupabaseTransport(page, "admin");
  state.grades.push({
    student_id: studentId,
    class_id: classId,
    term: 1,
    activity_score: 8.5,
    exam_score: 7,
    average: 7.75,
  });
  state.sessions.push({
    id: "40000000-0000-4000-8000-000000000010",
    class_id: classId,
    date: "2026-03-12",
    term: 1,
    updated_at: "2026-03-12T12:00:00.000Z",
    attendance_records: [{ student_id: studentId, status: "present" }],
  });
  await signIn(page, "admin");
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await page.getByRole("link", { name: "Administração", exact: true }).click();
  await page.getByRole("button", { name: "Alunos", exact: true }).click();

  const search = page.getByPlaceholder("Pesquisar aluno por nome...");
  await search.fill("  aLiCe   eXeMpLo  ");
  await expect(
    page.getByRole("button", { name: /Alice Exemplo/ }),
  ).toBeVisible();
  await expect(page.getByText("15/03/2018")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Alice Exemplo/ }),
  ).toContainText("3º Ano A");
  await search.fill("nome inexistente");
  await expect(page.getByText("Nenhum aluno encontrado.")).toBeVisible();
  await search.fill("");

  await page.getByRole("button", { name: /Alice Exemplo/ }).click();
  await expect(
    page.getByRole("heading", { name: "Alice Exemplo" }),
  ).toBeVisible();
  await expect(page.locator(".student-detail-heading")).toContainText(
    "Turma atual: 3º Ano A",
  );
  await expect(page.getByText("8,5", { exact: true })).toBeVisible();
  await expect(page.getByText("7,75", { exact: true })).toBeVisible();
  await expect(page.getByText("Presente", { exact: true })).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();

  for (const term of [2, 3, 4]) {
    await page.getByRole("button", { name: `${term}º Bimestre` }).click();
    await expect(page.getByText(/Sem notas registradas/)).toBeVisible();
    await expect(page.getByText(/Nenhuma chamada registrada/)).toBeVisible();
  }
  await page.getByRole("button", { name: "1º Bimestre" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("admin edita, transfere e arquiva sem perder histórico", async ({
  page,
}) => {
  const state = await installSupabaseTransport(page, "admin");
  state.grades.push({
    student_id: studentId,
    class_id: classId,
    term: 1,
    activity_score: 9,
    exam_score: 8,
    average: 8.5,
  });
  state.sessions.push({
    id: "40000000-0000-4000-8000-000000000011",
    class_id: classId,
    date: "2026-03-13",
    term: 1,
    updated_at: "2026-03-13T12:00:00.000Z",
    attendance_records: [{ student_id: studentId, status: "absent" }],
  });
  await signIn(page, "admin");
  await page.getByRole("link", { name: "Administração", exact: true }).click();
  await page.getByRole("button", { name: "Alunos", exact: true }).click();
  await page.getByRole("button", { name: /Alice Exemplo/ }).click();

  await page.getByRole("button", { name: "Editar informações" }).click();
  const edit = page.getByRole("dialog", { name: "Editar informações" });
  await edit.getByLabel("Nome completo").fill("Alice Atualizada");
  await edit.getByLabel("Data de nascimento").fill("2018-04-20");
  await edit.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByText("Informações do aluno atualizadas."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Alice Atualizada" }),
  ).toBeVisible();

  await page
    .getByLabel("Nova turma")
    .selectOption("20000000-0000-4000-8000-000000000002");
  await page.getByRole("button", { name: "Mudar de turma" }).click();
  const transfer = page.getByRole("dialog", { name: /Mudar Alice Atualizada/ });
  await expect(transfer).toContainText(
    "Notas, frequência e histórico da turma anterior serão preservados.",
  );
  await expect(page.locator(".student-detail-heading")).toContainText(
    "Turma atual: 3º Ano A",
  );
  await transfer.getByRole("button", { name: "Confirmar mudança" }).click();
  await expect(page.getByText(/foi transferido para 3º Ano B/)).toBeVisible();
  await expect(page.locator(".student-detail-heading")).toContainText(
    "Turma atual: 3º Ano B",
  );

  await page.getByLabel("Matrícula / turma").selectOption("e1");
  await expect(page.getByText("8,5", { exact: true })).toBeVisible();
  await expect(page.getByText("Falta", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Remover aluno" }).click();
  const archive = page.getByRole("dialog", {
    name: /Remover cadastro de Alice Atualizada/,
  });
  await expect(archive).toContainText(
    "histórico acadêmico existente será preservado",
  );
  await archive.getByRole("button", { name: "Remover aluno" }).click();
  await expect(page.getByText("Cadastro do aluno removido.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Alunos", exact: true }),
  ).toBeVisible();
  expect(state.grades).toHaveLength(1);
  expect(state.sessions).toHaveLength(1);
});
