import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import type { Env } from "../worker/index.ts";
type Handler = typeof import("../worker/index.ts").handleRequest;

// Local adapter only. Cloudflare production always executes worker/index.ts.
// No emulator or privileged module is loaded while browsing the public frontend.
function middleware(load: () => Promise<Handler>) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (/^\/(portal|auth)(\/|\?|$)/.test(req.url || "")) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.setHeader("Cache-Control", "no-store");
    }
    if (!req.url?.startsWith("/api/")) { next(); return; }
    try {
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 16384) {
          res.writeHead(413, { "Content-Type": "application/json", "Cache-Control": "no-store" });
          res.end(JSON.stringify({ error: "Dados excedem o limite permitido." }));
          return;
        }
        chunks.push(chunk);
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      const url = new URL(req.url, `http://${req.headers.host || "localhost:5173"}`);
      const request = new Request(url, { method: req.method, headers, ...(["GET", "HEAD"].includes(req.method || "GET") ? {} : { body: new Uint8Array(Buffer.concat(chunks)) }) });
      const values = existsSync(".dev.vars") ? parseEnv(readFileSync(".dev.vars", "utf8")) : {};
      const env: Env = { SUPABASE_URL: values.SUPABASE_URL || "", SUPABASE_PUBLISHABLE_KEY: values.SUPABASE_PUBLISHABLE_KEY || "", SUPABASE_SERVICE_ROLE_KEY: values.SUPABASE_SERVICE_ROLE_KEY || "", ALLOWED_ORIGIN: values.ALLOWED_ORIGIN, ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
      const handler = await load();
      const result = await handler(request, env);
      res.writeHead(result.status, Object.fromEntries(result.headers));
      res.end(Buffer.from(await result.arrayBuffer()));
    } catch {
      res.writeHead(502, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ error: "Não foi possível conectar ao serviço administrativo." }));
    }
  };
}
export function localWorker(): Plugin {
  return {
    name: "peralta-worker-local",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(middleware(async () => (await server.ssrLoadModule("/worker/index.ts")).handleRequest));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(async () => (await import("../worker/index.ts")).handleRequest));
    },
  };
}
