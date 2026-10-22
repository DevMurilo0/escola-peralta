import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const origin = "https://escola-peralta.escolaperalta.workers.dev";
const imageUrl = origin + "/images/social/escola-peralta-compartilhar.jpg";

describe("compartilhamento social da página institucional", () => {
  it("entrega o conteúdo Open Graph no HTML inicial, antes do React", () => {
    for (const name of ["og:title", "og:description", "og:url", "og:image", "og:image:alt"]) {
      expect(html).toContain('property="' + name + '"');
    }
    expect(html).toContain('content="' + imageUrl + '"');
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain('property="og:image:type" content="image/jpeg"');
    expect(html).toContain('rel="canonical" href="' + origin + '/"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:image"');
    expect(html).not.toContain("escolaperalta.com.br");
  });

  it("fornece uma foto estática JPEG no caminho anunciado", () => {
    const pathname = resolve(root, "public/images/social/escola-peralta-compartilhar.jpg");
    const jpeg = readFileSync(pathname);
    expect(statSync(pathname).size).toBeGreaterThan(30_000);
    expect(jpeg.subarray(0, 3).toString("hex")).toBe("ffd8ff");
    expect(jpeg.subarray(-2).toString("hex")).toBe("ffd9");
  });
});
