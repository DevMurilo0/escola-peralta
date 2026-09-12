// Test-only renderer. Never imported by Vite or deployed as a route.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const js = readFileSync("node_modules/.cache/peralta/fixture.js", "utf8");
const css = readFileSync("src/styles/globals.css", "utf8").replace(
  /@import\s+["']tailwindcss["'];/,
  "",
);
createServer((req, res) => {
  if (req.url === "/app.js") {
    res.setHeader("Content-Type", "text/javascript");
    res.end(js);
  } else if (req.url === "/styles.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(css);
  } else {
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Componentes reais · fixture de teste</title><link rel="stylesheet" href="/styles.css"><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>',
    );
  }
}).listen(4174, "127.0.0.1");
