import { test, expect } from "@playwright/test";
for (const width of [360, 375, 390, 430, 768, 1024, 1440]) {
  test(`site e login sem overflow em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    if (width === 1440)
      await page.screenshot({
        path: "test-results/site-1440.png",
        fullPage: true,
      });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Educação que acolhe",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width <= 800) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
    }
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("link", { name: "Portal do Professor" })
      .click();
    await expect(page).toHaveURL(/\/portal\/login/);
    await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
test("páginas privadas exigem autenticação", async ({ page }) => {
  for (const route of [
    "/portal",
    "/portal/turmas",
    "/portal/admin",
    "/portal/turmas/20000000-0000-4000-8000-000000000001",
    "/portal/perfil",
    "/portal/calendario",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/portal\/login/);
  }
});
test("SEO público e noindex do portal", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Escola Peralta/);
  expect(
    JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) || "{}",
    )["@type"],
  ).toBe("EducationalOrganization");
  await page.goto("/portal/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /portal");
});
test("navegação por teclado e página inexistente", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  await page.goto("/pagina-inexistente");
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
});

test("menu mobile fecha com Escape, restaura scroll e navega às seções", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "A Escola", exact: true })
    .click();
  await expect(page).toHaveURL(/#escola/);
  await expect(
    page.getByRole("button", { name: "Abrir menu" }),
  ).toHaveAttribute("aria-expanded", "false");
});
test("reduced motion mantém seções visíveis e sem animações", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#contato").scrollIntoViewIfNeeded();
  expect(
    await page
      .locator("[data-reveal]")
      .evaluateAll((nodes) =>
        nodes.every((n) => getComputedStyle(n).opacity === "1"),
      ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    ),
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator("[data-reveal]")
      .evaluateAll((nodes) =>
        nodes.every((n) => getComputedStyle(n).opacity === "1"),
      ),
  ).toBe(true);
});
test("conteúdo institucional permanece acessível sem JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page
      .locator("[data-reveal]")
      .evaluateAll((nodes) =>
        nodes.every((n) => getComputedStyle(n).opacity === "1"),
      ),
  ).toBe(true);
  await context.close();
});
