import { test, expect } from "@playwright/test";
for (const width of [360, 375, 390, 430, 768, 1024, 1440]) {
  test(`site e login sem overflow em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Educação que acolhe",
    );
    if ([375, 390, 768, 1440].includes(width)) {
      const photos = page.locator("img.editorial-photo");
      for (let index = 0; index < (await photos.count()); index++) {
        const photo = photos.nth(index);
        await photo.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            photo.evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0,
            ),
          )
          .toBe(true);
      }
      await page.evaluate(() => scrollTo(0, 0));
      await expect(page.locator(".hero-picture img")).toBeVisible();
      await page.screenshot({
        path: `test-results/site-${width}.png`,
        fullPage: true,
      });
    }
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

test("marca e fotografias oficiais são locais, acessíveis e carregam corretamente", async ({
  page,
  request,
}) => {
  const assets = [
    "/images/brand/escola-peralta-logo.webp",
    "/images/brand/favicon-32.png",
    "/images/brand/favicon.png",
    "/images/school/hero-escola.webp",
    "/images/school/escola-cotidiano.webp",
    "/images/school/educacao-infantil.webp",
    "/images/school/fundamental.webp",
    "/images/school/estrutura-patio.webp",
    "/images/school/estrutura-convivencia.webp",
    ...Array.from(
      { length: 6 },
      (_, index) => `/images/school/vivencia-0${index + 1}.webp`,
    ),
  ];
  for (const asset of assets)
    expect((await request.get(asset)).ok()).toBe(true);

  await page.goto("/");
  const logo = page.locator(".site-nav .brand-signature img");
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute("alt", "Logo da Escola Peralta");
  expect(
    await logo.evaluate((image: HTMLImageElement) => ({
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedWidth: image.getBoundingClientRect().width,
    })),
  ).toEqual({ naturalWidth: 100, naturalHeight: 100, renderedWidth: 60 });

  const photos = page.locator("img.editorial-photo");
  await expect(photos).toHaveCount(12);
  for (let index = 0; index < (await photos.count()); index++) {
    const photo = photos.nth(index);
    await photo.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        photo.evaluate(
          (image: HTMLImageElement) =>
            image.complete &&
            image.naturalWidth > 0 &&
            image.src.includes("/images/school/") &&
            Boolean(image.alt.trim()),
        ),
      )
      .toBe(true);
  }
  expect(await page.locator('img[src*="cdninstagram"]').count()).toBe(0);
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute(
    "href",
    "/images/brand/favicon-32.png",
  );
  await expect(page.locator('link[rel="icon"][sizes="48x48"]')).toHaveAttribute(
    "href",
    "/images/brand/favicon.png",
  );
});

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

test("movimento do hero, header compacto e progresso da galeria respondem à interação", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".institutional")).toHaveClass(/motion-ready/);
  await expect(page.locator(".hero-title-line")).toHaveCount(2);

  await page.evaluate(() => scrollTo(0, 360));
  await expect(page.locator(".site-nav")).toHaveClass(/is-scrolled/);
  await expect
    .poll(() =>
      page
        .locator(".opening-scene")
        .evaluate((element) =>
          Number(
            (element as HTMLElement).style.getPropertyValue("--hero-scroll"),
          ),
        ),
    )
    .toBeGreaterThan(0);

  const rail = page.locator(".life-rail");
  await rail.scrollIntoViewIfNeeded();
  await rail.evaluate((element) => {
    element.scrollLeft = element.scrollWidth - element.clientWidth;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect
    .poll(() =>
      page
        .locator(".school-life")
        .evaluate((element) =>
          Number(
            (element as HTMLElement).style.getPropertyValue(
              "--gallery-progress",
            ),
          ),
        ),
    )
    .toBeGreaterThan(0.9);

  await rail.evaluate((element) => {
    element.scrollLeft = 0;
  });
  const box = await rail.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    const startX = Math.min(1380, Math.max(420, box.x + box.width * 0.65));
    const pointerY = Math.min(
      860,
      Math.max(40, box.y + Math.min(box.height / 2, 220)),
    );
    await page.mouse.move(startX, pointerY);
    await page.mouse.down();
    await expect(rail).toHaveClass(/is-dragging/);
    await page.mouse.move(startX - 320, pointerY, { steps: 8 });
    await expect
      .poll(() => rail.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(80);
    await page.mouse.up();
    await expect(rail).not.toHaveClass(/is-dragging/);
  }
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
