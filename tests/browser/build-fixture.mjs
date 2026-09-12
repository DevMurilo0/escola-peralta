import { build } from "esbuild";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("node_modules/.cache/peralta", { recursive: true });
const result = await build({
  entryPoints: ["tests/browser/fixture.tsx"],
  bundle: true,
  write: false,
  format: "esm",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  alias: {
    "@/features/classes/actions": resolve("tests/browser/fixture-actions.ts"),
    "@/features/auth/actions": resolve("tests/browser/fixture-actions.ts"),
    "@/hooks/use-resource": resolve("tests/browser/fixture-navigation.ts"),
  },
  logLevel: "error",
});

writeFileSync("node_modules/.cache/peralta/fixture.js",result.outputFiles[0].text);
