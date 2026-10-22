# Escola Peralta — caderno de descobertas

## Escopo e verdade

Refatoração exclusiva da página pública em Vite/React. Famílias devem conhecer a escola e agendar uma visita. Portal, autenticação, Worker, banco e regras acadêmicas permanecem fora do escopo.

Inventário próprio: nome Peralta, mascote do planeta sorridente com plantas, azul e verde da marca, amarelo dos brinquedos, uniformes azuis, pátio colorido, registros da Terça da Nutri, caderno interativo existente, Gravatá, Rua Izaltino Poggi 73, perfil @escolaperaltagravata e WhatsApp já configurado.

Ideia: os registros da Terça da Nutri e o planeta com suas plantas tornam-se páginas cromáticas de um caderno vivo da Peralta. A flor e os caminhos remetem ao crescimento e às descobertas; não são novos símbolos oficiais.

## Narrativa e evidência

- Hero: conhecer a Peralta começa pelas crianças; fotografia real do pátio e registros complementares.
- A escola: infância e convivência; texto institucional existente e atividade coletiva.
- Proposta: descobrir, participar e conviver; conceitos existentes, sem metodologia ou resultados inventados.
- Caderno Vivo: explorar três capítulos com registros reais e controles manuais.
- Ensino: Educação Infantil e Fundamental I; descrições existentes, sem novas faixas etárias.
- Estrutura: conhecer os ambientes em uma visita; registros mostram pessoas nos espaços, não vistas arquitetônicas.
- Vivências: o cotidiano é a prova; seis fotografias locais com legendas descritivas.
- Convite: agendar visita pelo WhatsApp existente.
- Localização: endereço configurado e mapa Google incorporado, com alternativa externa.
- Rodapé: marca, convite, navegação, contatos e crédito do desenvolvedor.

## Direção

Plugins consultados: Taste Frontend Design, Impeccable UI e Emil Design Engineering. Referência estudada em checkout separado: DevMurilo0/meus-primeiros-passos (DESIGN.md, PRODUCT.md, Home.tsx). Princípios absorvidos: densidade fotográfica, capítulos cromáticos e movimento coordenado. Componentes e identidade não copiados.

Taste sorteou page-is-the-object, borrowed-category e colour-chapters. Escolhida colour-chapters pela correspondência entre capítulos do caderno e paleta da marca. A foto principal solicitada prevalece sobre o hero tipográfico puro sorteado. Layout de equipe não se aplica porque não existem perfis de equipe; usam-se foto coletiva e texto existente. Mapa grande solicitado prevalece sobre endereço somente em linhas. A altura acompanha o conteúdo em vez de impor telas vazias. Decoração, creme, coral e profundidade foram expressamente solicitados e prevalecem sobre restrições genéricas do plugin.

Bricolage Grotesque e DM Sans locais. Azul #2353a0, azul profundo #183c76, verde #285c49, amarelo #f2ce55, coral #b64734 e creme #faf5e9; tons claros derivados para campos e contraste. CSS institucional isolado de globals.css, sem pilhas de overrides.

Movimento: títulos por máscara, fotos por recorte, texto em cascata de 60ms, feedback de controles entre 160–240ms. Parallax limitado e apenas com ponteiro fino. Entradas por Web Animations API com conteúdo visível como padrão; observer e animação não controlam a disponibilidade do conteúdo. Reduced motion desliga deslocamentos e animações. Nenhum vídeo disponível: nenhum registro fictício foi criado.

## Fontes e limitações

As 12 fotos existentes têm 1080×1350 px e origem documentada em docs/ASSETS-ESCOLA.md. O Firecrawl não permite recuperar Instagram; não foram incorporadas novas fotografias não verificadas. Logo original: somente 100×100 px, sem matriz vetorial. Tratamento derivado e limitações documentados junto aos assets.

## Crítica visual após a implementação

Primeira rodada: capturas em 1440, 1366, 768, 390 e 360 px. Foram corrigidos o excesso de texto no hero mobile, a quebra do título de Ensino, legendas pequenas e a sobreposição de uma legenda na colagem. A segunda rodada confirmou o ritmo entre campos azul, amarelo, creme, verde e coral; as fotografias preservam proporção e não há áreas vazias sustentadas por altura artificial. O tablet recebe composição própria para Caderno e Ensino.

Autoavaliação da execução, não certificação externa: design 8/10, usabilidade 8/10, criatividade 7/10, conteúdo 8/10; ponderação do Taste 7,8/10. A principal limitação é a variedade de imagens: um único carrossel sobre alimentação não documenta toda a estrutura física ou todos os projetos da escola.

Exceções justificadas do Taste: sombras das fotografias e do mapa atendem à profundidade solicitada; creme e coral pertencem à paleta pedida; legendas de fotos não são kickers; numeração do Caderno comunica a posição na sequência; a faixa horizontal é uma galeria explicitamente navegável com botões, arraste e progresso. Não há vídeo oficial disponível. Tamanhos fluidos e legenda do wordmark produzem mais tamanhos medidos que as cinco categorias tipográficas conceituais. O contraste medido do texto supera AA; a regra de 7:1 do plugin é mais restritiva. O contador do inspector subestima WAAPI de curta duração: instrumentação direta de Element.animate registrou 70 elementos no desktop e 68 no mobile durante a rolagem, sem alongar animações só para satisfazer o detector.

A suíte completa revelou um seletor legado ambíguo no teste de perfil: a busca parcial por “Escolher foto” encontrava também o input “Escolher foto de perfil” no Chromium atual. A busca por “Nova senha” também encontrava “Confirmar nova senha”. Esses seletores foram restringidos aos nomes exatos; o código do portal não foi alterado.
