# Validação da experiência institucional

Data: 22 de outubro de 2026. Navegador: Chromium real via Playwright, em modo headless. Os tamanhos representam viewports emulados, não testes em aparelhos físicos.

## Evidências

- Lint, typecheck e build executados; verificação do bundle confirma ausência de service role no frontend.
- Vitest: 102 testes aprovados, incluindo Worker e regras acadêmicas existentes.
- Página pública: 20 cenários aprovados, com larguras 360, 375, 390, 430, 768, 1024, 1366 e 1440 px; fotos locais, marca, ausência de overflow, menu, teclado, acesso ao portal, SEO, Caderno Vivo, galeria, destinos de contato, mapa e crédito.
- Animação: preferência por movimento reduzido, alteração da preferência em execução, fallback sem Element.animate, parallax e progresso/arraste da galeria verificados. Entradas instrumentadas: 70 elementos no desktop e 68 no mobile.
- Axe: zero violações detectadas na página institucional em 1440 e 390 px. O documento externo do Google Maps foi excluído dessa auditoria; seu funcionamento foi inspecionado separadamente.
- Maps: iframe carregou a cartografia real e o marcador do endereço configurado. Links externos de rotas e WhatsApp conferidos. O endereço e as configurações compartilhadas foram preservados.
- PNG e WebP da logo possuem canal alfa real e cantos transparentes. Versões conferidas sobre creme, azul e amarelo.
- Taste: lint sem falhas; inspeção em 1440, 768 e 390 px sem falhas após as exceções justificadas no documento de direção. Avisos de estilo não foram confundidos com falhas funcionais.

## Escopo preservado

Nenhuma alteração em worker/, Supabase, migrations, RLS, RPCs, autenticação, permissões, administração, componentes do portal, turmas, alunos, notas, frequência ou calendário. Duas buscas ambíguas nos testes legados do portal foram tornadas exatas, sem modificar sua implementação.

Não foi executado deploy de produção.

## Capturas

Os arquivos WebP na pasta [screenshots](screenshots/) mostram hero em 1440, 1366, 768, 390 e 360 px, páginas completas em desktop/mobile, mapas carregados e a logo sobre três fundos. As capturas de página completa usam movimento reduzido para registrar o conteúdo já revelado.

## Limitações

O Instagram não permitiu recuperar novas imagens; as 12 fotos locais foram preservadas e reaproveitadas. Todas são do mesmo carrossel, portanto não documentam toda a estrutura ou a diversidade de projetos da escola. A matriz da logo disponível tem apenas 100×100 px; o derivado refinado com IA não substitui um original vetorial de alta resolução. A comparação de marca e o prompt estão em [ASSETS-ESCOLA.md](../ASSETS-ESCOLA.md).

## Resultado da suíte completa

A execução completa percorreu 45 cenários: 43 passaram de primeira e 2 falharam por seletores parciais ambíguos dos testes legados. Após restringir as buscas aos nomes exatos, ambos passaram novamente (2/2). A página pública foi repetida integralmente no build final (20 cenários). Os demais cenários do portal já aprovados não tiveram código de aplicação modificado.
