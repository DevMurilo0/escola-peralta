# Etapa 2 — identidade, direção de arte e fotografias

Pesquisa realizada em 11/09/2026. Este documento distingue referência pública, inferência visual e material aprovado para publicação. Nenhum arquivo de imagem pesquisado foi incorporado ao site sem comprovação suficiente de origem/atualidade e autorização.

## Fontes e evidências

| Fonte                                                                           | O que foi encontrado                                                                      | Uso / limite                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Instagram oficial](https://www.instagram.com/escolaperaltagravata/)            | Resultado indexado da bio: “educando com VALORES”, Educação Infantil ao Fundamental I.    | Acesso direto bloqueado por throttling. O resultado indexado sustenta o tema de valores e os segmentos, não a identidade gráfica atual inteira. Não foi realizado scraping do feed.                            |
| [Publicação oficial de 03/02/2025](https://www.instagram.com/reel/DFoOfQ0MTCl/) | Legenda indexada sobre reencontrar amigos e se divertir na escola.                        | Referência para convivência e tom humano. Nenhuma foto ou vídeo reutilizado.                                                                                                                                   |
| [Publicação oficial de 26/11/2024](https://www.instagram.com/reel/DC2rRlGNkCV/) | Legenda indexada mencionando trabalhos do 4º ano.                                         | Referência para projetos e atividades; não foi inventado nome de projeto.                                                                                                                                      |
| [Melhor Escola](https://www.melhorescola.com.br/escola/escola-peralta-gravata)  | Endereço, segmentos, metodologia construtivista; miniatura cadastrada como logo; galeria. | Fonte secundária, com material aparentemente antigo. As fotografias foram vistas apenas para pesquisa; não constituem autorização de republicação.                                                             |
| [Quero Bolsa](https://querobolsa.com.br/escolas/279187-colegio-ideal)           | Cadastro com o mesmo nome/endereço, metodologia, telefone e e-mail.                       | O slug “colegio-ideal” e as divergências entre cadastros pedem validação. Não adicionar automaticamente telefone, e-mail, história ou tempo de funcionamento. Não é confirmação independente do Melhor Escola. |
| Facebook indexado em busca por “Escola Peralta Gravatá”                         | Descrição com endereço e um telefone diferente dos diretórios.                            | A abertura redirecionou para página genérica/bloqueada do Facebook. Sem permalink verificável do perfil, não foi criado link oficial nem publicado telefone.                                                   |
| Google / Maps                                                                   | Pesquisa por nome e endereço; referências de diretórios.                                  | Não foi obtido perfil comercial verificável com acervo atual autorizado. O link de localização existente foi preservado.                                                                                       |

Também apareceram cadastros empresariais divergentes. Datas de CNPJ não foram convertidas em data de fundação da escola. Números de alunos, anos de funcionamento, preços e promessas não foram incorporados.

## O que foi possível observar visualmente

O cadastro Melhor Escola referencia:

- Miniatura `20200828162129427.jpeg`: globo azul/verde com rosto e máscara branca, coração vermelho. Arquivo consultado de 128 × 128 px. Não é um logo atual em qualidade de uso e a variante com máscara parece contextual; não foi copiada nem redesenhada.
- Imagem `20200828162146472.jpeg`: grupo de adultos e crianças num espaço externo com árvore e brinquedo. Útil como referência de atmosfera, mas sem comprovação de autorização de reutilização.
- Miniaturas `20200828162146594.jpeg` e `20200828162146284.jpeg`: crianças em atividades; uniformes predominantemente brancos com azul, e elementos coloridos nas produções.
- Miniatura `20200828162146290.jpeg`: grupo diante de edifício. Não foi presumido que o edifício seja a fachada da escola.

Arquivos de pesquisa ficaram apenas em `/tmp/peralta-research`, fora do conteúdo publicado. Não há hotlink ou download de Instagram no runtime.

## Paleta e tipografia

O site usa tokens em `src/styles/institutional.css`. Na refatoração do Portal de 12/09/2026, a mesma direção provisória foi aplicada de forma contida às telas autenticadas: azul na navegação e ações, verde em apoio, amarelo em pequenos acentos e superfícies claras. Bricolage Grotesque e DM Sans, já hospedadas localmente, também passaram a compor o Portal sem chamadas externas.

| Token                | Cor       | Motivo                                                                                                                                                   |
| -------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--brand-primary`    | `#2353A0` | Azul observado nos uniformes e no símbolo cadastrado; tom ajustado para leitura e navegação.                                                             |
| `--brand-secondary`  | `#397351` | Verde observado no globo e nos espaços externos; acento de convivência/ambientes.                                                                        |
| `--brand-accent`     | `#F2CE55` | Amarelo visto em produções e elementos lúdicos; usado como pequena superfície, com texto escuro.                                                         |
| `--brand-coral`      | `#B64734` | Vermelho/coral presente no detalhe do símbolo e materiais; apenas detalhes editoriais, escurecido para contraste de leitura (5,06:1 no fundo principal). |
| `--brand-background` | `#FBF9F2` | Neutro de suporte escolhido para o site, sem alegação de cor oficial.                                                                                    |
| `--brand-surface`    | `#FFFFFF` | Branco dos uniformes e superfície neutra.                                                                                                                |
| `--brand-text`       | `#20324A` | Tom escuro de suporte para contraste.                                                                                                                    |
| `--brand-muted`      | `#5B6673` | Texto secundário legível.                                                                                                                                |

**Esta é uma interpretação provisória do material público histórico, não um manual oficial confirmado.** O reconhecimento da identidade atual ainda depende do logo original e de referências recentes fornecidas pela escola.

Bricolage Grotesque nos títulos: formas expressivas e amigáveis, sem imitar a marca. DM Sans nos textos: legibilidade e contraste de escala. São escolhas editoriais, não fontes oficiais identificadas. Dois arquivos variáveis WOFF2 latinos hospedados localmente, `font-display: swap`, com licenças OFL em `public/fonts`. Não há chamada a Google Fonts durante navegação ou build.

## Alterações de direção de arte

A versão anterior repetia a mesma composição abstrata nas imagens, dois cards semelhantes de segmentos, tipografia serifada de marca temporária e seções muito uniformes. A nova versão tem:

- Hero de página editorial, texto em grande escala, imagem deslocada, anotação lateral e chamada circular; composição própria para o celular.
- História com foto em posição assimétrica, texto mais direto e destaque do tema “educar com valores”.
- Proposta pedagógica com três conceitos visuais; a classificação “construtivista” não é apresentada como afirmação institucional confirmada, pois apareceu apenas em fonte secundária.
- Segmentos em composições diferentes e sequenciais, sem dois cards de dashboard.
- Estrutura com fotografia principal, detalhe secundário e chamada de visita. Não foi afirmada a existência atual de biblioteca/quadra sem validação.
- Vida na Peralta com faixa horizontal nativa, scroll-snap e convite ao perfil oficial. Não é um feed automático, nem galeria de fotos fictícias.
- CTA de visita em azul, com amarelo pontual. Texto editorial editável, não slogan oficial.
- Contato em diretório simples; removida a composição que simulava um mapa. Link para mapa real preservado.
- Header sticky com mudança sutil ao scroll; menu mobile, foco contido, Escape, bloqueio/restauração de scroll e fechamento ao mudar para desktop.

## Motion e acessibilidade

Reveals de até 600 ms e stagger máximo de 180 ms via IntersectionObserver + Web Animations. Observadores são desligados após a primeira entrada. Hover de botões, setas e fotografias, sem parallax ou animação infinita. Não há autoplay, scroll sequestrado ou biblioteca nova de motion.

Após a migração para SPA, o HTML oferece um fallback sem JavaScript com identificação da escola e link para o Instagram; a experiência completa utiliza React. `prefers-reduced-motion` é respeitado no CSS e no JavaScript, inclusive quando a preferência muda com a página aberta. Fontes e estilos são exclusivos da homepage. Imagens com `img`, dimensões reservadas, carregamento lazy e prioridade apenas no hero e enquadramento separado para celular.

## Fotos que a escola precisa fornecer

Configuração: `src/config/institutional-content.ts`, objeto `photos`. Os campos `src`, `position` e `mobilePosition` permitem trocar imagem e enquadramento sem editar o layout. Os campos antigos `school.heroImage`, `school.segments[].image`, `school.gallery` e `school.logo` continuam aceitos para compatibilidade.

| Slot              | Material solicitado                                                                                                          | Formato recomendado                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `hero`            | Pátio/ambiente característico, com espaço livre para recorte; preferir sem pessoas identificáveis se não houver autorização. | Horizontal, 2000 × 1300 px ou maior.    |
| `about`           | Entrada ou equipe da escola, com identificação contextual clara.                                                             | Retrato, 1200 × 1500 px.                |
| `infantil`        | Atividade da Educação Infantil; pode mostrar materiais e mãos, sem rostos identificáveis.                                    | Horizontal ou quadrado, mínimo 1400 px. |
| `fundamental`     | Produção ou atividade do Fundamental I; sem nomes legíveis de alunos.                                                        | Retrato ou quadrado, mínimo 1400 px.    |
| `structureMain`   | Vista ampla atual do pátio/ambiente interno, identificada pela direção.                                                      | Retrato, 1400 × 1800 px.                |
| `structureDetail` | Detalhe complementar: espaço de leitura, convivência ou material pedagógico.                                                 | Horizontal, 1400 × 1000 px.             |
| `lifeProject`     | Registro de um projeto com título e breve contexto confirmado.                                                               | Retrato/quadrado, mínimo 1200 px.       |
| `lifePlay`        | Brincadeira/atividade com autorização de publicação ou sem identificação de menores.                                         | Retrato/quadrado, mínimo 1200 px.       |
| `lifeTogether`    | Evento/encontro real, com data/contexto e autorização adequada.                                                              | Retrato/quadrado, mínimo 1200 px.       |

Não é necessário preencher tudo: começar com hero, escola, dois segmentos e uma foto de estrutura já substitui as principais reservas. Prefira WebP/AVIF com tamanho de arquivo moderado. Envie confirmação de direitos/autorização de uso das pessoas identificáveis e de autoria das imagens. Não basta a foto estar pública no Instagram.

Logo: fornecer **SVG original** ou PNG/WebP transparente, preferencialmente com ao menos 800 px de largura. Salvar em `public/images/brand/` e preencher `school.logo`. Header e footer respeitam o arquivo original sem redesenho.

## Informações pendentes de validação

Logo e paleta atuais; fotos autorizadas; missão/história/proposta pedagógica; nomenclatura dos ambientes; telefone/WhatsApp/e-mail; grafia/endereço atual; textos de matrícula e disponibilidade de visita. A bio indexada e os diretórios divergem no tempo de funcionamento, por isso nenhum número de anos foi publicado. Conteúdo institucional novo está centralizado e explicitamente marcado como redação editável.
