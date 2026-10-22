# Identidade da Escola Peralta

## Estado atual

A identidade usada no site é provisória. As referências públicas sustentam azul e verde como cores principais, com amarelo e coral em pequenos acentos, mas não substituem um manual de marca aprovado pela escola.

| Uso | Cor |
| --- | --- |
| Azul principal | `#2353A0` |
| Verde de apoio | `#397351` |
| Amarelo de destaque | `#F2CE55` |
| Coral de destaque | `#B64734` |
| Fundo claro | `#FBF9F2` |
| Texto escuro | `#20324A` |

Bricolage Grotesque e DM Sans são escolhas editoriais hospedadas localmente, não fontes oficiais confirmadas.

## Configuração

- Logo e dados da escola: `src/config/school-config.ts`.
- Textos, fotos e enquadramentos: `src/config/institutional-content.ts`.
- Tokens do site institucional: `src/styles/institutional.css`.
- Tokens do portal: `src/styles/globals.css`.
- Arquivos oficiais de marca, quando fornecidos: `public/images/brand/`.

Prefira o logo original em SVG. Como alternativa, use PNG ou WebP transparente com boa resolução e preserve sua proporção. Depois de adicionar o arquivo, configure `school.logo`.

## Fotos e informações pendentes

Publique somente fotografias autorizadas pela escola e, quando houver pessoas identificáveis, confirme a autorização de uso de imagem. Prefira arquivos WebP/AVIF otimizados e não exponha nomes ou dados de alunos.

A escola ainda precisa confirmar o logo atual, a paleta oficial, tipografia, fotos autorizadas, missão, proposta pedagógica, contatos e descrição dos espaços.

## Referências

- [Instagram oficial](https://www.instagram.com/escolaperaltagravata/)
- [Cadastro público da escola](https://www.melhorescola.com.br/escola/escola-peralta-gravata)

## Experiência institucional refatorada

A direção atual está documentada em [Caderno de descobertas](design/INSTITUCIONAL.md). A página pública usa campos cromáticos, colagens com registros reais, Caderno Vivo manual e uma galeria navegável. `institutional.css` foi reconstruído e `peralta-renovacao.css` removido; o portal mantém sua identidade e configuração compartilhada.

A marca pública recortada está em `escola-peralta-logo-recortada.png` e `.webp`; consulte [proveniência e limitações](ASSETS-ESCOLA.md). A matriz original de 100×100 px permanece preservada. Não se trata de uma nova marca oficial homologada.

## Segunda rodada — um mundo de descobertas

Direção vigente em [DESIGN.md](../DESIGN.md): capa de papel ilustrado, fotos em camadas à esquerda no desktop e abaixo do título no mobile, livro interativo com dobra, mapa em moldura ampla e contracapa com letras como blocos de brincar. Os tons claros agora incluem creme `#fff8e9`, azul `#e1edf8`, pêssego `#f7e1d5`, rosa `#efcfc6` e verde `#e1eedc`.

As ilustrações locais, adaptadas sob licença MIT, estão documentadas em [ASSETS-LUDICOS.md](ASSETS-LUDICOS.md). A marca pública vigente usa `escola-peralta-logo-refinada.png` e `.webp`: canais RGB preservados, somente o alfa refinado. A tentativa de uma nova reconstrução com IA foi rejeitada por alterar as letras. A marca e os tokens do portal não mudaram.
