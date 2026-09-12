import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const root = "dist/client";
if (!existsSync(join(root, "index.html")))
  throw new Error("Build frontend ausente em dist/client.");
const secrets = [process.env.SUPABASE_SERVICE_ROLE_KEY];
if (existsSync(".dev.vars")) {
  const match = readFileSync(".dev.vars", "utf8").match(
    /^SUPABASE_SERVICE_ROLE_KEY\s*=\s*(.+)$/m,
  );
  if (match) secrets.push(match[1].trim().replace(/^["']|["']$/g, ""));
}
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
  );
for (const file of walk(root)) {
  if (!/\.(js|css|html|json|map|txt)$/.test(file)) continue;
  const text = readFileSync(file, "utf8");
  if (
    text.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    secrets
      .filter((s) => s && s.length > 20)
      .some((secret) => text.includes(secret))
  )
    throw new Error(
      "Credencial privilegiada detectada no frontend. Build bloqueado.",
    );
  for (const token of text.match(
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  ) || []) {
    let payload;
    try {
      payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString(),
      );
    } catch {
      continue;
    }
    if (payload.role === "service_role")
      throw new Error("JWT privilegiado detectado no bundle.");
  }
}
console.log("Bundle frontend verificado: nenhuma service role detectada.");
