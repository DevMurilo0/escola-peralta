import { expect, test } from "@playwright/test";

test("conteúdo fora da tela nasce invisível e só aparece durante o reveal", async ({
  page,
}) => {
  await page.goto("/");
  const root = page.locator(".institutional");
  const title = page.locator("#contato h2").first();

  await expect(root).toHaveClass(/motion-ready/);
  await expect(title).toHaveAttribute("data-motion-state", "pending");
  await expect(title).toHaveCSS("opacity", "0");

  await title.scrollIntoViewIfNeeded();
  await expect(title).toHaveAttribute("data-motion-state", "complete", {
    timeout: 7000,
  });
  await expect(title).toHaveCSS("opacity", "1");
});

test("pausar libera imediatamente todos os conteúdos pendentes", async ({
  page,
}) => {
  await page.goto("/");
  const title = page.locator("#contato h2").first();
  await expect(title).toHaveAttribute("data-motion-state", "pending");
  await page.getByRole("button", { name: "Pausar movimento" }).click();
  await expect(page.locator(".institutional")).not.toHaveClass(/motion-ready/);
  await expect(title).toHaveCSS("opacity", "1");
  await expect(title).toBeVisible();

  await page.getByRole("button", { name: "Retomar movimento" }).click();
  await expect(page.locator(".institutional")).toHaveClass(/motion-ready/);
  await expect(title).toHaveAttribute("data-motion-state", "pending");
});

test("acessibilidade: redução de movimento nunca esconde textos ou fotos", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".institutional")).not.toHaveClass(
    /motion-ready/,
  );
  const title = page.locator("#contato h2").first();
  await expect(title).toHaveCSS("opacity", "1");
  await expect(title).toBeVisible();
});

test("fallback sem API de animação mantém página acessível", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Element.prototype, "animate", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/");
  await expect(page.locator(".institutional")).not.toHaveClass(
    /motion-ready/,
  );
  await expect(page.locator("#contato h2").first()).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-line-ink").first()).toHaveCSS("opacity", "1");
});
