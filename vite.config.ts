import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { localWorker } from "./scripts/vite-worker-dev.ts";
import { fileURLToPath } from "node:url";
// The app does not use geolocation/request.cf; avoid a network fetch at every local start.
process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
export default defineConfig(async ({ mode, command, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  for (const [key, value] of Object.entries(env)) {
    let privileged =
      /SERVICE|SECRET|PASSWORD/i.test(key) || value.startsWith("sb_secret_");
    try {
      privileged ||=
        JSON.parse(
          Buffer.from(value.split(".")[1] || "", "base64url").toString(),
        ).role === "service_role";
    } catch {
      /* Non-JWT public setting. */
    }
    if (privileged)
      throw new Error(
        "Credencial privada em variável VITE_. Remova-a antes de continuar.",
      );
  }
  const site = env.VITE_SITE_URL?.replace(/\/$/, "") || "http://localhost:5173";
  return {
    plugins: [
      react(),
      ...(command === "build" || (isPreview && mode === "cloudflare")
        ? (await import("@cloudflare/vite-plugin")).cloudflare({ remoteBindings: false, inspectorPort: false })
        : [localWorker()]),
      {
        name: "peralta-seo",
        transformIndexHtml: {
          order: "pre",
          handler: () => [
            {
              tag: "link",
              attrs: { rel: "canonical", href: site },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { property: "og:url", content: site },
              injectTo: "head",
            },
          ],
        },
        generateBundle() {
          if (this.environment.name !== "client") return;
          this.emitFile({
            type: "asset",
            fileName: "robots.txt",
            source: `User-agent: *\nAllow: /\nDisallow: /portal\nDisallow: /auth\nSitemap: ${site}/sitemap.xml\n`,
          });
          const escaped = site
            .replaceAll("&", "&amp;")
            .replaceAll('"', "&quot;")
            .replaceAll("<", "&lt;");
          this.emitFile({
            type: "asset",
            fileName: "sitemap.xml",
            source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escaped}/</loc><changefreq>monthly</changefreq><priority>1</priority></url></urlset>`,
          });
        },
      },
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      host: "127.0.0.1", port: 5173,
      fs: { deny: ["**/.env*", "**/.dev.vars*", "**/*.{crt,pem}", "**/.git/**", "**/dist/escola_peralta/**"] },
    },
    build: { sourcemap: false, ...(isPreview && mode !== "cloudflare" ? { outDir: "dist/client" } : {}) },
  };
});
