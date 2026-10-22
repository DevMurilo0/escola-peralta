# Um mundo de descobertas — Escola Peralta

## Direção desta rodada

O planetinha da marca é o centro de um universo infantil de livros, lápis, nuvens, blocos e brincadeiras. A página torna-se um caderno ilustrado: papéis, fitas, recortes, ilustrações locais e fotografias reais; a ação principal continua sendo conhecer a escola e agendar uma visita.

O briefing já define público, propósito, paleta, material, restrições, nível de decoração e liberdade criativa. As decisões seguem essas escolhas explícitas e a autorização de implementação, sem reabrir uma rodada de aprovação estética.

Taste: entre page-is-the-object, one-motif e borrowed-category, foi escolhida page-is-the-object. O objeto é o Caderno Vivo já existente; suas páginas, fitas, margem e recortes organizam a linguagem inteira. A fotografia real solicitada prevalece sobre qualquer blueprint sem fotografia. Não existem carta de fundador, equipe ou dados comerciais: composições incompatíveis não geram conteúdo inventado.

Impeccable: contexto carregado e seed:1d73b7ecd874b7ab consultado. O material e o mundo explícitos no briefing prevalecem sobre mundos incompatíveis, como detector de partículas ou interface em preto. Das alternativas, conserva-se a disciplina de densidade fotográfica da revista e de bordas físicas do papel, sem importar glitter, preços ou estética de cafeteria. Emil orienta feedback rápido, transformações sem saltos de rotação e movimento com pausa/reduced-motion.

## Sistema

- Bricolage Grotesque e DM Sans locais; títulos expressivos e texto legível.
- Azul #2353a0, verde #285c49, amarelo #f2ce55, coral #b64734, creme #fff8e9; campos pastel azul, pêssego e verde.
- Doodles com contorno azul uniforme, preenchimentos locais e acabamento de adesivo. Fontes, licenças e transformações em docs/ASSETS-LUDICOS.md.
- Fitas, margem de caderno, bordas onduladas e pequenos pontos como vocabulário de papel; máximo de dois focos decorativos dominantes por seção.
- Fotos reais têm prioridade sobre ilustração. Não criar fotografias falsas da escola.
- Mapa grande em moldura ilustrada, com cartão de endereço na composição e alternativa externa.
- Rodapé como contracapa: convite, logo, faixa ilustrada, contatos e crédito integrado.
- CSS exclusivamente sob .institutional; nenhum efeito sobre o portal.

## Movimento

Entradas coordenadas por seção, máscara fotográfica, títulos por linhas e pequenos reveals de desfoque. Doodles recebem um gesto curto na entrada; poucos flutuam durante até três ciclos, sem movimento contínuo infinito. Controle de pausa e prefers-reduced-motion cancelam movimento. Animação não controla visibilidade permanente do conteúdo.

## Inspeção visual e critérios

Duas rodadas em Chromium real, com 1440, 1366, 768, 390 e 360 px. Correções encontradas: pipa próxima demais do título/cabeçalho no mobile, legenda do Ensino com quebra pouco natural e uma tentativa de IA que alterava a tipografia da marca. Os arquivos RGB da marca vigente foram preservados; a comparação de pixels confirmou identidade exata dos canais de cor, com alteração somente do alfa.

Taste: inspeção em 1440, 768 e 390 sem falhas após exceções do briefing. Sombras e material de papel são solicitados explicitamente; legenda e posição do Caderno são conteúdo funcional. Galeria horizontal possui botões, arraste, foco e progresso. Não há vídeo real oficial disponível. Tamanhos fluidos e lettering decorativo explicam o aviso de variedade tipográfica. Todas as fontes dos títulos são Bricolage; o teste de mistura de fonte é heurístico. Impeccable detect retornou lista vazia nas superfícies alteradas. Axe não detectou violações no documento institucional em desktop e mobile, com iframe externo auditado funcionalmente em separado.

Crítica do resultado estático: a capa tem foco fotográfico, as seções alternam temperatura e material, o Caderno é o único objeto interativo dominante, a localização recebe uma moldura maior e a contracapa tem massa gráfica própria. Autoavaliação de execução, não premiação ou certificação externa: design 8, usabilidade 8, criatividade 8, conteúdo 8. Limitação principal: as fotos existentes ainda vêm de um mesmo carrossel sobre alimentação; não representam um inventário completo dos espaços ou projetos.
