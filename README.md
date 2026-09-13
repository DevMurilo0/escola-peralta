# Escola Peralta

Site institucional e Portal do Professor da Escola Peralta, em Gravatá. A aplicação reúne autenticação, turmas, alunos, notas, frequência, conteúdos curriculares e administração escolar.

## Stack

- React e TypeScript
- Vite e BrowserRouter
- Supabase Auth e PostgreSQL com RLS
- Cloudflare Workers com Static Assets
- Vitest, PGlite e Playwright

O navegador acessa o Supabase com a chave pública e o JWT do usuário. Operações administrativas privilegiadas ficam exclusivamente em `worker/`.

## Estrutura

```text
src/
  app/                 composição da aplicação, rotas e guards
  config/              conteúdo e configurações institucionais
  features/            módulos de autenticação, turmas e administração
  pages/               páginas públicas e do portal
  shared/              componentes, hooks, serviços e domínio compartilhados
  styles/              estilos globais e institucionais
  main.tsx              entrada React
public/                 fontes, favicon, headers e assets estáticos
scripts/                utilitários de desenvolvimento e segurança
supabase/migrations/    schema, RLS, triggers e RPCs
tests/                  testes unitários, de banco, Worker e navegador
worker/                 API privilegiada do Cloudflare Worker
```

A identidade visual provisória e as orientações para assets oficiais estão em [docs/BRAND.md](docs/BRAND.md).

## Desenvolvimento

Requer Node.js 22.18 ou superior da série 22.

```bash
npm install
cp .env.example .env.local
cp .dev.vars.example .dev.vars
npm run dev
```

Se os arquivos locais já existirem, não os sobrescreva. Abra `http://localhost:5173`.

O desenvolvimento usa Vite com HMR. Um adaptador local carrega o mesmo handler do Worker apenas quando uma rota `/api/*` é chamada.

## Variáveis

### Frontend

Variáveis `VITE_*` são incorporadas ao bundle e são sempre públicas:

| Variável                        | Uso                             |
| ------------------------------- | ------------------------------- |
| `VITE_SUPABASE_URL`             | URL pública do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública/publishable       |
| `VITE_SITE_URL`                 | Origem canônica do site         |

Use `.env.local` no desenvolvimento. Nunca coloque senhas, service role ou outros segredos em variáveis `VITE_*`.

### Worker

Variáveis privadas do runtime:

| Variável                    | Uso                                                    |
| --------------------------- | ------------------------------------------------------ |
| `SUPABASE_URL`              | URL do projeto Supabase                                |
| `SUPABASE_PUBLISHABLE_KEY`  | Validação da sessão e do perfil                        |
| `SUPABASE_SERVICE_ROLE_KEY` | Operações administrativas autorizadas                  |
| `MASTER_EMAIL`              | E-mail do administrador autorizado às operações Master |
| `ALLOWED_ORIGIN`            | Origem HTTPS permitida em produção                     |

No desenvolvimento, mantenha esses valores em `.dev.vars`. Em produção, configure-os como variables/secrets do Cloudflare Worker.

`MASTER_EMAIL` é uma configuração privada de runtime do Worker: não use `VITE_MASTER_EMAIL` nem a cadastre somente como variável de build. O `keep_vars` do Wrangler preserva variáveis já configuradas no Worker durante novos deploys, mas elas precisam existir no mesmo Worker e ambiente de produção publicados.

As variáveis `BOOTSTRAP_*`, `ALLOW_DEVELOPMENT_SEED` e `DEMO_TEACHER_PASSWORD` são exclusivas dos scripts manuais de bootstrap e seed. Nenhum build ou deploy as executa automaticamente.

## Scripts

| Comando                | Função                                                           |
| ---------------------- | ---------------------------------------------------------------- |
| `npm run dev`          | Inicia o Vite com HMR e API local                                |
| `npm run build`        | Executa TypeScript, builds do cliente/Worker e verifica o bundle |
| `npm run lint`         | Executa ESLint                                                   |
| `npm run typecheck`    | Verifica os tipos sem emitir arquivos                            |
| `npm test`             | Executa Vitest e testes PostgreSQL isolados                      |
| `npm run test:browser` | Executa Playwright sobre o build local                           |
| `npm run deploy`       | Faz build e publica com Wrangler                                 |

Faça o build antes dos testes de navegador:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

## Banco

O projeto usa o Supabase existente. As migrations estão em `supabase/migrations/` e devem continuar versionadas em ordem.

Em um ambiente novo e vazio, execute todas as migrations na ordem dos nomes. No banco hospedado existente:

- não execute novamente migrations iniciais já aplicadas;
- confirme o histórico antes de aplicar mudanças;
- aplique somente migrations incrementais ainda pendentes;
- não recrie usuários, administrador ou dados acadêmicos.

O acesso acadêmico é protegido por RLS. Professores acessam somente turmas autorizadas; matrículas inativas e turmas arquivadas preservam o histórico. RPCs e triggers realizam validações e auditoria no PostgreSQL.

Os testes com PGlite executam os SQLs reais em um banco isolado e não acessam o Supabase hospedado.

## Deploy

O deploy utiliza Cloudflare Workers com Static Assets. O cliente é gerado em `dist/client/`, e o Worker continua responsável pelas rotas `/api/*`.

Configure primeiro as variáveis públicas no ambiente de build. Depois adicione os secrets do Worker:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put MASTER_EMAIL
npx wrangler secret put ALLOWED_ORIGIN
npm run deploy
```

Em builds conectados ao GitHub, use:

- instalação: `npm ci`;
- build: `npm run build`;
- deploy: `npx wrangler deploy`;
- Node.js: série 22.

Mantenha `VITE_SITE_URL`, `ALLOWED_ORIGIN` e as URLs de redirect do Supabase alinhadas ao domínio publicado. O fallback SPA do Worker preserva refresh direto nas rotas do BrowserRouter.

## Segurança

- A service role só pode ser importada e utilizada em `worker/` ou scripts administrativos locais.
- `src/` nunca deve importar o Worker nem credenciais privadas.
- Não faça commit de `.env`, `.env.local` ou `.dev.vars`.
- `.env.example` e `.dev.vars.example` devem conter somente placeholders.
- Não registre tokens, links de convite ou dados de alunos em logs.
- Convites e recuperação exigem sessão administrativa validada pelo Worker.
- O build inspeciona `dist/client` e falha se detectar credencial privilegiada.
- `public/_headers` protege as rotas privadas contra indexação e cache público.

Antes de publicar, valide login, rotas privadas, criação de turma, notas, frequência, conteúdos e administração usando contas autorizadas do ambiente correto.
