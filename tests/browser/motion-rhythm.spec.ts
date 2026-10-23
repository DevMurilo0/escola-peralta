import { expect, test } from "@playwright/test";

// CI usa o mesmo Chrome presente no runner, sem baixar Chromium.
test.use({
  launchOptions: process.env.CI
    ? { executablePath: "/usr/bin/google-chrome" }
    : {},
});

test("cards pedagógicos e controles de galeria recebem entradas progressivas", async ({
  page,
}) => {
  await page.goto("/");
  const article = page.locator(".learning-concepts article").first();
  const galleryControls = page.locator(".gallery-controls");
  await expect(article).toHaveAttribute("data-motion-state", "pending");
  await expect(galleryControls).toHaveAttribute("data-motion-state", "pending");

  await article.scrollIntoViewIfNeeded();
  await expect(article).toHaveAttribute("data-motion-state", "complete", {
    timeout: 6000,
  });
  await expect(article).toHaveCSS("opacity", "1");

  await galleryControls.scrollIntoViewIfNeeded();
  await expect(galleryControls).toHaveAttribute("data-motion-state", "complete", {
    timeout: 6000,
  });
});

test("animações de scroll têm duração suave e atraso positivo", async ({
  page,
}) => {
  await page.goto("/");
  const target = page.locator(".learning-concepts article").first();
  await target.scrollIntoViewIfNeeded();

  await expect
    .poll(
      () =>
        target.evaluate((element) => {
          const effect = element.getAnimations().find((animation) =>
            animation.effect?.getTiming().duration,
          )?.effect;
          if (!effect) return null;
          const timing = effect.getTiming();
          return {
            duration: timing.duration,
            delay: timing.delay,
          };
        }),
      { timeout: 2500 },
    )
    .toEqual({ duration: 880, delay: expect.any(Number) });
  const delay = await target.evaluate(
    (element) => element.getAnimations()[0]?.effect?.getTiming().delay,
  );
  expect(delay).toBeGreaterThanOrEqual(85);
});

test("caderno mantém animações mais longas na troca de capítulo", async ({
  page,
}) => {
  await page.goto("/");
  const caderno = page.locator("#caderno");
  await caderno.scrollIntoViewIfNeeded();
  await caderno.getByRole("button", { name: "Conviver", exact: true }).click();
  await expect(caderno.locator(".caderno-content")).toHaveCSS(
    "animation-duration",
    "0.6s",
  );
  await expect(caderno.locator(".caderno-photo-page")).toHaveCSS(
    "animation-duration",
    "0.76s",
  );
});

test("movimento reduzido exibe os novos elementos sem espera", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const article = page.locator(".learning-concepts article").first();
  const controls = page.locator(".gallery-controls");
  await expect(article).toHaveCSS("opacity", "1");
  await expect(controls).toHaveCSS("opacity", "1");
  await expect(page.locator(".institutional")).not.toHaveClass(/motion-ready/);
});
