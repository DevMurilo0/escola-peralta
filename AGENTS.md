# Escola Peralta

O projeto utiliza Vite + React + TypeScript e BrowserRouter. O backend sensível está em worker/index.ts, para Cloudflare Workers com Static Assets. Não reintroduza Next.js.

- Preserve o Supabase existente, migrations, RLS e RPCs acadêmicas.
- Nunca importe o Worker ou service role no frontend (src/).
- Secrets locais ficam em .dev.vars; somente valores públicos usam VITE_*.
- Preserve os estilos e conteúdo institucional existentes.
- Antes de finalizar mudanças, execute lint, testes, build e testes de navegador apropriados.
