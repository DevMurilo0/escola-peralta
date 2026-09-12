# Escola Peralta — React, Vite, Supabase e Cloudflare

Site institucional e Portal Peralta para professores e administração. A migração preserva o design, as funcionalidades acadêmicas e o banco Supabase existente. Não há autenticação simulada nem armazenamento acadêmico em localStorage na aplicação.

## Arquitetura

```text
Navegador
├── React + TypeScript + Vite + BrowserRouter
├── Site institucional (CSS, fontes locais, motion com reduced motion)
├── Portal com páginas carregadas sob demanda
├── Supabase Auth: login, persistência e renovação de sessão
├── Consultas e RPCs acadêmicas → Supabase com JWT do usuário + RLS
└── POST /api/admin/* → Cloudflare Worker
    ├── valida JWT no Supabase Auth
    ├── consulta profiles com JWT do usuário: admin + active
    ├── valida payload com Zod
    └── utiliza service role apenas para gerar convites/recuperação

Cloudflare Workers Static Assets
├── dist/client/ → HTML, JS, CSS, fontes e imagens
├── Worker → API administrativa
└── fallback SPA → rotas diretas /portal/*

Supabase existente
└── Auth + PostgreSQL + RLS + RPCs + auditoria
```

Bibliotecas: React Router, Supabase JS, React Hook Form, Zod, date-fns, Lucide, Tailwind/CSS. O desenvolvimento inicia apenas Vite: um adaptador local carrega o mesmo handler do Worker sob demanda na primeira chamada de API. O preview padrão também utiliza o adaptador leve. Build e `preview:cloudflare` utilizam o plugin oficial; este último executa o Worker em workerd, como em produção. Nenhum servidor Next.js, SSR ou compilação por rota é necessário.

## Executar localmente

Node.js **22.18 ou superior da série 22** e npm.

```bash
npm install
cp .env.example .env.local
cp .dev.vars.example .dev.vars
# Preencha os dois arquivos antes de iniciar.
npm run dev
```

Abra **http://localhost:5173**. Frontend e Worker usam a mesma origem. Se os arquivos locais já estiverem preenchidos, não os sobrescreva com `cp`.

Nesta migração, as configurações locais existentes foram separadas sem criar novos usuários ou modificar dados. `.env.local` contém apenas configurações públicas; `.dev.vars` contém o ambiente privado do Worker. Reinicie o processo de desenvolvimento depois de mudar variáveis. Encerre manualmente qualquer processo antigo `next dev` que ainda esteja aberto em outro terminal.

```bash
npm run lint
npm test
npm run build
npm run preview
npm run test:browser
npm run deploy
```

- `dev`: Vite com HMR e adaptador local do handler Worker, sem iniciar emulador; não publica nada.
- `build`: TypeScript, build dos assets e Worker, auditoria automática do bundle público.
- `preview`: serve o build e o mesmo handler da API com o adaptador local leve (porta padrão 4173).
- `preview:cloudflare`: verifica o build no runtime oficial workerd; útil antes do deploy, exige mais memória.
- `deploy`: gera um build novo e publica via Wrangler; exige autenticação na Cloudflare.
- `test:browser`: usa preview próprio em 3100 e fixture isolada em 4174. Faça o build antes. Se necessário, instale Chromium com `npx playwright install chromium`.

## Variáveis

### Frontend: `.env.local` e ambiente de build da Cloudflare

| Variável | Conteúdo |
| --- | --- |
| `VITE_SUPABASE_URL` | URL do projeto Supabase já utilizado pela escola |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública/publishable do mesmo projeto (anon legada também é compatível) |
| `VITE_SITE_URL` | Origem canônica do site, sem barra final. Local: `http://localhost:5173` |

Tudo com prefixo `VITE_` é público. Nunca utilize service role, senha ou secret nesse prefixo. O build rejeita configurações privadas em variáveis públicas e verifica os arquivos de `dist/client` para impedir inclusão da chave privilegiada.

### Worker: `.dev.vars` local e secrets/variables da Cloudflare em produção

| Variável | Conteúdo |
| --- | --- |
| `SUPABASE_URL` | A mesma URL do projeto |
| `SUPABASE_PUBLISHABLE_KEY` | A mesma chave pública, usada para validar a sessão e consultar o perfil antes de obter privilégios |
| `SUPABASE_SERVICE_ROLE_KEY` | Credencial administrativa; exclusivamente no Worker, nunca no React |
| `ALLOWED_ORIGIN` | Origem HTTPS canônica permitida, sem barra final, por exemplo `https://escola.seudominio.com.br` |

Localmente, omitir `ALLOWED_ORIGIN` utiliza a origem da própria requisição; isso também permite testar preview em outra porta. Em produção, configure a origem canônica explicitamente. Não use `*`. Cabeçalhos CORS não substituem autenticação: o Worker sempre verifica o bearer e o perfil, inclusive em chamadas sem cabeçalho Origin.

`.env.local`, `.dev.vars`, builds e caches são ignorados pelo Git. Não copie o arquivo privado para `public/`. Não registre tokens, links de acesso ou dados de crianças em logs. Convites retornados pela API são de uso único e devem ser compartilhados apenas com o professor correto.

## Supabase: usar o projeto existente

**Não execute novamente as migrations iniciais no Supabase hospedado que já está configurado. Não recrie banco nem administrador.** Para habilitar a nova estrutura do Portal do Professor no projeto existente, execute somente a migration incremental indicada abaixo.

1. Em Project Settings/API (ou Connect), copie a URL e a publishable key existentes para as configurações acima.
2. Configure a service role apenas no ambiente privado do Worker.
3. Em Authentication → URL Configuration, atualize `Site URL` para o domínio Cloudflare/custom domain e cadastre os redirects:
   - `http://localhost:5173/auth/confirm` para desenvolvimento;
   - `https://SEU_DOMINIO/auth/confirm` para produção;
   - a URL de preview correspondente, somente se for usar convites nesse ambiente.
4. Mantenha login por e-mail/senha. Não habilite cadastro público para os professores; contas são criadas pelo administrador.
5. Preserve tabelas, constraints, políticas e funções do banco existente e aplique `supabase/migrations/202609120001_teacher_owned_classes_and_curriculum.sql`.

Arquivos SQL preservados:

```text
supabase/migrations/202609110001_initial.sql
supabase/migrations/202609110002_hardening.sql
supabase/migrations/202609120001_teacher_owned_classes_and_curriculum.sql
```

No **Supabase existente**, execute somente `202609120001_teacher_owned_classes_and_curriculum.sql`. Em um **novo ambiente de desenvolvimento vazio**, execute os três arquivos em ordem no SQL Editor ou com o fluxo de migrations da CLI Supabase. Não aplique o schema inicial por cima do banco da escola.

Tabelas: profiles, school_settings, classes, teacher_classes, students, enrollments, grades, attendance_sessions, attendance_records, curriculum_records e audit_logs. Visitantes não têm acesso acadêmico. Professores acessam apenas suas turmas. Matrículas inativas e turmas arquivadas mantêm histórico.

RPCs: `save_student`, `set_enrollment`, `enroll_existing`, `save_grades`, `save_attendance`, `log_admin_event`, `create_teacher_class` e `update_teacher_class`. Notas e chamadas continuam sendo gravadas atomicamente no PostgreSQL com o JWT do usuário. A média é gerada pelo banco com `(activity_score + exam_score) / 2`; notas aceitam 0 a 10. Chamadas possuem unicidade turma/data, controle de concorrência por versão, roster e validações de bimestre, matrícula e data. Conteúdos curriculares têm RLS, autoria e auditoria. Professores criam turmas vinculadas automaticamente ao próprio usuário autenticado.

## Primeiro administrador e seed

**O primeiro admin já existe. Entre com a conta atual.** Nenhum build, deploy ou inicialização executa bootstrap.

Para emergência/desenvolvimento em projeto separado e vazio, preencha manualmente `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` (mínimo 12 caracteres) e `BOOTSTRAP_ADMIN_NAME` em `.dev.vars` e execute:

```bash
npm run admin:create
```

O script recusa execução se já houver administrador ativo. A role é armazenada em profiles; não depende de comparação de e-mail no código. Remova as variáveis de bootstrap quando terminar.

O seed é opcional, apenas para desenvolvimento, contém **nomes e registros fictícios** e recusa repetição. Em um Supabase separado, configure `ALLOW_DEVELOPMENT_SEED=true`, `DEMO_TEACHER_PASSWORD` (12+ caracteres) e as credenciais privadas em `.dev.vars`:

```bash
npm run seed
```

Nunca execute esse seed no banco da escola. Não foi executado durante a migração.

## Rotas e experiência

| Rota | Conteúdo |
| --- | --- |
| `/` | Site institucional preservado |
| `/portal/login` | Login real por e-mail e senha |
| `/portal` | Dashboard, turmas atuais/históricas, chamadas de hoje |
| `/portal/turmas` | Turmas acessíveis ao usuário |
| `/portal/turmas/:id?term=1&module=grades` | Navegação progressiva por I–IV bimestres e módulos; alunos e resultado final são áreas anuais separadas |
| `/portal/calendario` | Chamadas recentes e acesso ao calendário de cada turma |
| `/portal/perfil` | Perfil e definição/troca de senha |
| `/portal/admin` | Professores, turmas, associações, matrículas e ano letivo |
| `/auth/confirm` | Confirmação de convite/recuperação e definição de senha |

Guards exibem loading inicial, sessão expirada, erro de conexão e acesso negado. O guard administrativo complementa RLS e a validação do Worker. A sessão Auth persiste no mecanismo padrão do Supabase; **dados acadêmicos não são persistidos em armazenamento do navegador**. Um cache transitório de consultas evita telas vazias entre navegações e é limpo ao trocar usuário/sair e invalidado após gravações. RLS verifica cada requisição, inclusive após desativação de conta.

## API administrativa

Ambos exigem `Authorization: Bearer <access_token>` e JSON, com limite de 16 KB:

```http
POST /api/admin/teachers
{"full_name":"Nome do professor","email":"professor@exemplo.com"}

POST /api/admin/teachers/access-link
{"id":"UUID_DO_PROFESSOR"}
```

O primeiro cria a conta como professor através do trigger existente e registra `teacher_created` com o JWT do administrador. O segundo gera recuperação para um professor ativo. Retornam `{ "success": true, "link": "..." }`; **não enviam e-mail automaticamente**. O painel permite obter o link para entrega individual. A confirmação exige um clique antes de consumir o token para evitar consumo por scanners de links.

Erros retornam `{ "error": "mensagem segura" }`, sem detalhes internos. Ausência/token inválido: 401; conta inativa/professor/origem indevida: 403; payload inválido: 400; recurso ausente: 404. Se uma conta for criada e a auditoria falhar, a mensagem informa o resultado parcial e orienta gerar link na lista, evitando repetição do cadastro.

Operações comuns (notas, frequência, alunos, turmas, vínculos e configuração) não usam service role. Continuam passando por RLS/RPCs do Supabase diretamente.

## Deploy Cloudflare

A escolha é **Workers com Static Assets**, seguindo a [integração oficial React/Vite](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/) e o [tutorial de SPA com API](https://developers.cloudflare.com/workers/vite-plugin/tutorial/). Não crie um projeto Pages paralelo para esse código.

### Publicação pela CLI

1. Crie/acesse sua conta Cloudflare e escolha um nome único em `wrangler.jsonc` (`escola-peralta` é o padrão).
2. Preencha as variáveis públicas com os valores de produção antes do build.
3. Autentique o Wrangler:

```bash
npx wrangler login
```

4. Configure as quatro variáveis do Worker como secrets. O Wrangler solicitará cada valor sem colocá-lo no código:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ALLOWED_ORIGIN
npm run deploy
```

Se o Worker ainda não existir, o Wrangler pode solicitar sua criação. Alternativamente crie o Worker no painel primeiro usando o mesmo nome. `.dev.vars` não é enviado como configuração de produção. O plugin pode criar uma cópia privada em `dist/escola_peralta/.dev.vars` para preview: não compartilhe o diretório dist inteiro. O Wrangler publica os assets de `dist/client` e o código do Worker, mantendo os secrets no ambiente Cloudflare.

### GitHub e deploy contínuo

1. Envie este repositório para GitHub (verifique `.gitignore` e nunca adicione segredos).
2. Cloudflare Dashboard → Workers & Pages → Create application/Import repository → selecione o repositório GitHub e a branch de produção.
3. Diretório raiz: raiz deste projeto. Node 22. Build command: **`npm run build`**. Deploy command: **`npx wrangler deploy`**. Instalação: `npm ci` (ou instalação automática do painel com o lockfile).
4. Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SITE_URL` nas variáveis de **build**.
5. Configure as quatro variáveis/secrets de **runtime do Worker** descritas acima em Settings → Variables and Secrets. A service role não é variável de build.
6. Workers Builds não usa o campo "output directory" do Pages. Os assets ficam em **`dist/client/`**; o plugin gera a configuração do Worker em `dist/` e informa o caminho ao Wrangler. Não publique somente os assets, pois a API também faz parte do deploy.
7. Em Settings → Domains & Routes, adicione seu Custom Domain e configure DNS conforme o painel. Atualize `VITE_SITE_URL`, `ALLOWED_ORIGIN` e URLs de redirect no Supabase para a mesma origem. Faça novo build após mudar variáveis públicas.
8. Atualizações: faça push na branch conectada ou execute `npm run deploy` localmente. Ambientes de preview precisam de variáveis próprias e, preferencialmente, Supabase de desenvolvimento separado.

`assets.not_found_handling = "single-page-application"` entrega index.html ao atualizar `/portal/admin` ou `/portal/turmas/:id`. `run_worker_first = ["/api/*"]` garante que endpoints recebam validação/JSON, inclusive se abertos diretamente. Arquivos `_headers` aplicam noindex/no-store ao portal e headers de proteção. Nunca adicione uma regra de cache público às respostas da API.

## SEO, imagens e performance

Título, descrição, Open Graph, favicon e canonical estão no HTML inicial. Robots e sitemap são gerados a partir de `VITE_SITE_URL`. O portal recebe noindex dinamicamente e `X-Robots-Tag` no servidor; robots.txt bloqueia `/portal` e `/auth`. O site utiliza JSON-LD EducationalOrganization. Por ser SPA, a renderização completa depende de JavaScript; há um fallback noscript com identificação e Instagram, sem prometer SSR.

Fontes locais Bricolage Grotesque e DM Sans, CSS institucional e animações foram preservados. O portal é carregado sob demanda e não compila ao abrir rotas. Fotos usam `img` com dimensões, decoding assíncrono, lazy loading e prioridade apenas no hero. O enquadramento desktop/mobile continua configurável. Use WebP/AVIF em dimensões adequadas ao substituir os slots; não há mais serviço de otimização Next/Image.

## Testes e limites de validação

Validação de 12/09/2026: **58 testes de regras/banco/API + 30 de navegador**, além de lint, TypeScript e build. `npm run dev` ficou pronto em aproximadamente 1,1–1,6 s; navegação com cache em 30–48 ms. Medições de primeiro carregamento, correções das rotas e limites dos testes reais/isolados estão no [relatório de validação](docs/VALIDACAO-MIGRACAO.md).

- Vitest: média, idade, notas, bimestres e estados de frequência.
- PGlite: executa os **três SQLs reais** em PostgreSQL isolado e testa constraints, RLS, permissões, histórico, criação de turma pelo professor, conteúdos curriculares, duplicidade, concorrência e auditoria. Não conecta ao Supabase hospedado.
- Worker: exercita o handler real com HTTP upstream controlado, incluindo validação de sessão/admin, criação/recuperação, origem, payload e sanitização de erros.
- Playwright: site e portal mobile, menu/teclado, reduced motion, login/logout, guards, persistência de sessão e reabertura de notas/chamadas. As interações autenticadas usam transporte HTTP de teste; os componentes e cliente da aplicação são reais. Não cria professores nem registros no banco da escola.
- Build: checagem TypeScript, artefatos Cloudflare e inspeção de `dist/client` para credenciais privilegiadas.

Depois de publicar, valide com contas autorizadas do seu ambiente: login de admin/professor, turma atribuída, gravação de nota, chamada passada/hoje, convite e recuperação pelo domínio definitivo. Os testes isolados não substituem essa verificação da configuração hospedada, secrets e domínio.

## Organização e identidade da escola

```text
src/
  main.tsx, App.tsx
  router/             BrowserRouter, guards e rotas lazy
  pages/              Home, Login, Dashboard, ClassPage, Calendar, Profile, Admin
  features/           auth, classes, students, grades, attendance, admin
  components/         navegação, formulários, feedback e elementos institucionais
  hooks/              cache transitório e proteção de alterações não salvas
  services/           sessão e chamada da API administrativa
  lib/supabase/       client.ts público
  config/             school-config.ts e institutional-content.ts
  schemas/, types/, utils/, styles/
worker/index.ts       backend privilegiado exclusivo Cloudflare
supabase/migrations/  SQLs existentes preservados
scripts/              adaptador de API local, bootstrap/seed e verificação do bundle
public/               fonts, images, favicon e headers
 tests/               regras, PostgreSQL, Worker e browser
vite.config.ts, wrangler.jsonc, index.html
.env.example, .dev.vars.example
```

Contatos, endereço, Instagram e imagens ficam em `src/config/school-config.ts`; textos, slots e enquadramento em `src/config/institutional-content.ts`; tokens institucionais em `src/styles/institutional.css`. A migração não alterou a identidade ou inventou informações da escola.

Ainda dependem da escola: logo original em qualidade adequada; fotos locais autorizadas (fachada, ambientes, segmentos e cotidiano); WhatsApp, telefone e e-mail oficiais; validação final de endereço, textos, proposta pedagógica e espaços existentes. Consulte [identidade e fotografias](docs/IDENTIDADE-E-FOTOGRAFIAS.md). Nenhuma imagem de criança foi obtida ou reutilizada automaticamente nesta migração.
