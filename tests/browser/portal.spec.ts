import { test, expect } from "@playwright/test";

for (const width of [360, 375, 390, 430, 768, 1440]) {
  test(`fluxo progressivo da turma em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("http://127.0.0.1:4174");
    await expect(page.getByRole("heading", { name: "3º Ano A" })).toBeVisible();
    await expect(page.locator("#main").getByText("Ana Oliveira (Teste)")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bimestres" })).toBeVisible();
    await expect(page.getByText("Notas por atividade")).toHaveCount(0);
    await expectNoHorizontalScroll(page);

    await page.getByRole("button", { name: "Abrir I Bimestre" }).click();
    await expect(page).toHaveURL(/\?term=1$/);
    await expect(page.getByRole("heading", { name: "Selecione o módulo" })).toBeVisible();

    await page.getByRole("button", { name: /Notas por atividade/ }).click();
    await expect(page).toHaveURL(/term=1&module=grades/);
    await page.getByLabel("1ª Nota de Alice Exemplo").fill("8");
    await page.getByLabel("2ª Nota de Alice Exemplo").fill("9");
    await expect(page.locator(".grade-average").first()).toContainText("8,5");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("status")).toContainText("Notas salvas com sucesso");
    await page.getByRole("button", { name: "Voltar aos módulos" }).click();

    await page.getByRole("button", { name: /Frequência diária/ }).click();
    await expect(page).toHaveURL(/term=1&module=attendance/);
    await page.getByRole("button", { name: "Calendário" }).click();
    await expect(page.locator("#attendance-calendar")).toBeVisible();
    await page.getByRole("button", { name: "Marcar todos como presentes" }).click();
    await page
      .getByRole("group", { name: /Bruno Exemplo/ })
      .getByText("Falta", { exact: true })
      .click();
    await page
      .getByRole("group", { name: /Clara Exemplo/ })
      .getByText("Falta justificada", { exact: true })
      .click();
    await expectNoHorizontalScroll(page);
    await page.getByRole("button", { name: "Salvar frequência" }).click();
    await expect(page.getByRole("status")).toContainText("Frequência salva");
    await page.getByRole("button", { name: "Voltar aos módulos" }).click();

    await page
      .getByRole("button", { name: /Registro dos conteúdos curriculares trabalhados/ })
      .click();
    await expect(page).toHaveURL(/term=1&module=curriculum/);
    await expect(page.getByRole("heading", { name: "Conteúdos trabalhados" })).toBeVisible();
    await page.getByRole("button", { name: "Voltar aos módulos" }).click();
    await page.getByRole("button", { name: "Voltar para a turma" }).click();

    await page.getByRole("button", { name: /^Alunos 3/ }).click();
    await expect(page).toHaveURL(/section=students/);
    await page.getByRole("button", { name: "Adicionar aluno" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Fechar janela" }).click();
    await page.getByRole("button", { name: "Notas e frequência" }).first().click();
    await expect(page.getByRole("heading", { name: "Alice Exemplo" })).toBeVisible();
    await page.getByRole("button", { name: "Consultar I Bimestre" }).click();
    await expect(page.getByText("somente leitura")).toBeVisible();
    await expect(page.getByLabel("1ª Nota de Alice Exemplo")).toBeDisabled();
    await expect(page.getByRole("button", { name: "Salvar alterações" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Salvar frequência" })).toHaveCount(0);
    await page.getByRole("button", { name: "Voltar aos bimestres" }).click();
    await page.getByRole("button", { name: "Voltar para alunos" }).click();
    await page.getByRole("button", { name: "Voltar para a turma" }).click();

    await page.getByRole("button", { name: /Resultado final/ }).click();
    await expect(page).toHaveURL(/section=results/);
    await expect(page.getByRole("heading", { name: "Resultado final" })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
}

test("impede sair das notas sem confirmação", async ({ page }) => {
  await page.goto("http://127.0.0.1:4174?term=1&module=grades");
  await page.getByLabel("1ª Nota de Alice Exemplo").fill("8");
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Voltar aos módulos" }).click();
  await expect(page.getByLabel("1ª Nota de Alice Exemplo")).toHaveValue("8");
  await expect(page).toHaveURL(/module=grades/);
});

async function expectNoHorizontalScroll(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true);
}
