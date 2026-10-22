# Validação — segunda rodada visual da Escola Peralta

22/10/2026. Escopo: somente experiência institucional. Direção em [DESIGN.md](../../DESIGN.md); fontes e adaptações em [ASSETS-LUDICOS.md](../ASSETS-LUDICOS.md).

## Resultado

- Lint, typecheck e build aprovados no código final. Verificação do bundle confirma ausência de service role no frontend.
- Vitest: **102 testes aprovados**, incluindo Worker e regras acadêmicas existentes.
- Navegador: **47 cenários validados**. A execução longa foi interrompida pelo limite de duração do terminal após 39 cenários aprovados, sem falhas; os 25 cenários do portal já estavam completos. Os **22 cenários públicos foram executados integralmente em separado no build final, todos aprovados**.
- Larguras cobertas: 360, 375, 390, 430, 768, 1024, 1366 e 1440 px. Inspeção visual e capturas nos cinco tamanhos solicitados: 1440, 1366, 768, 390 e 360.
- Axe: **zero violações detectadas** no documento institucional em 1440 e 390 px. Documento externo do Google Maps excluído do Axe e verificado funcionalmente em separado.
- Impeccable detect: lista vazia de achados nas superfícies alteradas.
- Taste: lint sem falhas, com apenas um aviso de borda no botão de menu; inspeção em 1440, 768 e 390 sem falhas após as exceções explícitas do briefing. Avisos: variação de tamanhos fluidos, heurística de fonte, ausência de vídeo real disponível e galeria horizontal deliberada com controles.

## Interações e conteúdo

Fotografias reais locais decodificadas; nenhuma imagem de outra escola. Zero imagens quebradas, zero erros de JavaScript nas capturas e nenhum overflow horizontal nos cinco tamanhos solicitados.

Menu mobile abre, fecha com Escape, restaura o scroll e navega. Link do Portal do Professor abre o login. Caderno Vivo troca os três capítulos por clique e teclado. Galeria funciona com botões, arraste, progresso e navegação por teclado.

Movimento: títulos por linhas, máscara fotográfica, sublinhados desenhados, blur reveal e entradas decorativas. Flutuações são limitadas a três ciclos, sem loop infinito. Pausar cancela animações e parallax; retomar restaura a camada. Conteúdo e controles funcionam com movimento reduzido ou sem Element.animate. O fallback sem JavaScript permanece acessível.

Mapas: iframe real carregado em desktop e mobile; imagens cartográficas Google /maps/vt confirmadas como completas e com dimensão natural. Endereço preservado: Rua Izaltino Poggi, 73, Prado, Gravatá — Pernambuco. Destinos do Google Maps, WhatsApp, Instagram, Portal e crédito do desenvolvedor verificados.

## Marca e assets

Sete SVGs do Tabler foram adaptados sob MIT: paleta, preenchimento, espessura de contorno e acabamento de adesivo. A licença acompanha os assets. Pipa, flores, trilhas, fitas, textura e bordas editoriais são autorais. Os arquivos são locais, sem hotlink ou marca d'água.

A nova tentativa de IA foi descartada porque alterava as letras. PNG refinado preserva exatamente os canais RGB da versão anterior; comparação pixel a pixel confirmou igualdade de cor. Somente o alfa foi retrabalhado, com cantos totalmente transparentes. Conferência sobre creme, azul e amarelo; suporte claro no rodapé preserva contraste das letras pretas. Originais preservados.

## Escopo técnico preservado

Nenhuma alteração em Worker, Supabase, migrations, RLS, RPCs, autenticação, permissões, administração, componentes do portal, turmas, alunos, notas, frequência, calendário ou configurações compartilhadas da escola. Nenhuma dependência nova de produção. Não foi executado deploy de produção.

## Capturas e limites

Capturas vigentes em [screenshots/rodada-2](screenshots/rodada-2/). Primeira rodada mantida no diretório superior para comparação. Layout e interações foram verificados em viewports usuais de desktop e mobile; as capturas do mapa usam viewport alto para manter o componente inteiro visível. Como o Chromium suprime a pintura de iframe fora da dobra em capturas longas, as páginas integrais combinam a captura da página com a captura real do componente, no mesmo tamanho e posição, sem alterar seu conteúdo. Os recortes reais do mapa também estão disponíveis separadamente. Capturas estáticas usam movimento reduzido.

São viewports emulados em Chromium real, não testes em aparelhos físicos. O Instagram continua indisponível para extração; as 12 fotografias locais foram mantidas. Elas vêm de um mesmo carrossel e não documentam toda a estrutura ou diversidade de projetos. A matriz original da marca tem apenas 100×100 px; o refinamento não substitui um original vetorial.
