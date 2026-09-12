# Validação da migração — 12/09/2026

A inspeção encontrou a migração Vite/React/TypeScript/BrowserRouter/Worker já implementada. Esta finalização preservou o site, o Worker, o adaptador local, o Supabase, as duas migrations, RLS e RPCs existentes. A pasta fornecida não contém `.git`, portanto não foi possível comparar com commits anteriores.

## Resultado final

- `npm run lint`: aprovado, sem erros ou avisos.
- `npm run typecheck`: aprovado.
- `npm test`: **56/56**, em 3 arquivos (última execução: 6,74 s).
- `npm run build`: aprovado; Worker em 2,66 s e frontend em 13,59 s, além da checagem TypeScript e preparação do plugin.
- `npm run test:browser`: **27/27**, um worker Chromium, aproximadamente 1,4 minuto, sem retries.
- **83 testes aprovados** no total, além das verificações manuais de runtime, credenciais no bundle e login real descritas abaixo.

## Correções desta finalização

- Corrigidas as rotas descendentes de `/portal/*`: agora usam caminhos relativos, evitando que `/portal/login` e as demais páginas exibam “Página não encontrada”.
- `/auth/confirm` carrega diretamente sua página, que só consome o token após clique explícito.
- Preview do Playwright usa `--strictPort`: uma porta ocupada gera erro imediato em vez de iniciar noutra porta e deixar os testes esperando.
- Seletor de bimestre do teste de frequência usa correspondência exata, sem confundir o botão com a descrição de um dia do calendário.
- Acrescentados testes para acesso direto, refresh e navegação sem recarregar o documento, com professor/admin, e confirmação de convite.

Nenhum timeout foi aumentado para esconder falhas de aplicação. O Playwright continua com um único worker e preview Vite leve.

## Integridade e segurança

- `next`, `@supabase/ssr`, `server-only`, `eslint-config-next` e `@cloudflare/workers-types` ausentes do manifesto, lockfile e instalação. `npm install` concluiu com código zero e auditoria sem vulnerabilidades reportadas.
- Não há `src/app`, configuração Next, `next-env.d.ts` nem imports ativos de Next/SSR/server-only ou variáveis `NEXT_PUBLIC_*`.
- Supabase no frontend utiliza `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. `VITE_SITE_URL` permanece como configuração pública de SEO institucional.
- Nenhum import do Worker em `src/`. Service role restrita ao Worker, scripts privados e testes. `.env.local` contém apenas valores públicos; `.dev.vars` mantém os privados.
- O build verificou ausência de service role em `dist/client`. Uma inspeção adicional dos 36 arquivos públicos procurou também os valores privados locais e chaves `sb_secret_`, sem encontrar vazamentos.
- `dist/client` contém a SPA; `dist/escola_peralta` contém o Worker e a configuração gerada. A cópia privada `.dev.vars` criada pelo plugin para preview fica no diretório do Worker, fora dos assets públicos. Publique pelo Wrangler; não compartilhe `dist` inteiro.

## Escopo funcional validado

| Verificação | Evidência |
| --- | --- |
| `/`, login e portal | Navegador real, responsividade e acessibilidade básica |
| `/portal/turmas`, calendário, perfil e admin | Acesso direto, refresh e navegação interna |
| Login e sessão | Transporte isolado no Playwright; login e renovação também verificados no Supabase real |
| Admin real | Login pelo frontend local, acesso às cinco páginas privadas, refresh e logout |
| Professor sem acesso ao admin | Guard no navegador, handler Worker e permissões PostgreSQL isoladas |
| Notas e frequência | Edição, gravação e reabertura no navegador com transporte isolado; RPCs/RLS reais em PostgreSQL PGlite |
| Criação de professor | Painel envia bearer; handler real do Worker valida admin, chama geração de convite e audita, com upstream controlado |
| Convites | Página direta e refresh; nenhum consumo de token antes do clique |
| SPA na Cloudflare | Preview oficial workerd entregou index.html com HTTP 200 em todas as rotas solicitadas e em rota profunda com query string |
| API na Cloudflare | Sem bearer: 401 JSON; endpoint desconhecido: 404 JSON, inclusive com navegação de documento |
| Headers privados | `noindex, nofollow` preservado nas rotas do portal no runtime Cloudflare |
| Publicação | `wrangler deploy --dry-run` aceitou Worker e assets e terminou com código zero; nenhum deploy efetuado |

Os testes não criaram professores, notas ou chamadas no Supabase hospedado. A criação de professor e as gravações acadêmicas foram confirmadas em testes isolados, não como transações de produção. O domínio publicado e seus secrets de runtime precisam ser verificados após a publicação.

## Medições locais

Node 22.23.2. Medições incluem inicialização pelo npm e Chromium real; variam conforme carga, cache e rede do Supabase.

| Medida | Primeira execução, com verificações concorrentes | Segunda execução, sem lint/build concorrente e com cache |
| --- | --- | --- |
| npm até Vite pronto | 1,62 s | 1,13 s |
| Tempo informado pelo Vite | 1,30 s | 0,67 s |
| npm até primeira resposta HTTP | 3,44 s | 1,23 s |
| Primeira renderização do site no navegador | 14,70 s | 1,73 s |
| Primeira navegação site → login | 1,53 s | 0,97 s |
| Navegação entre páginas já carregadas | 30–48 ms | 31–44 ms |

A primeira passagem pelas páginas pode consultar o Supabase; na segunda medição variou de 38 a 546 ms. As transições seguintes não recarregaram o documento. Nenhum erro JavaScript foi observado. A árvore de `npm run dev` continha somente npm e o processo Node/Vite, inclusive após chamar a API local. Nenhum workerd ou Miniflare foi iniciado por `dev`.

O preview Cloudflare iniciou em aproximadamente 9 s apenas para a verificação explícita e foi encerrado. Ele não faz parte do desenvolvimento normal nem do Playwright padrão.

## Reproduzir

```bash
npm install
npm run lint
npm test
npm run build
npm run test:browser
npm run dev
```

Para verificar o runtime oficial separadamente:

```bash
npm run preview:cloudflare -- --host 127.0.0.1 --port 3101 --strictPort
```

O dry-run pode ser executado sem consulta de atualização do banner/telemetria, que nesta máquina prolongou a saída do Wrangler após o empacotamento:

```bash
WRANGLER_SEND_METRICS=false WRANGLER_HIDE_BANNER=true npx wrangler deploy --dry-run
```

A arquitetura, configuração local, variáveis e comandos de publicação estão no [README](../README.md). A configuração de fallback segue a [documentação oficial de SPA da Cloudflare](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/).
