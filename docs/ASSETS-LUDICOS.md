# Assets lúdicos — proveniência e adaptações

Consulta em 22/10/2026. Não há imagens de outras escolas no projeto.

## Tabler Icons

Fontes vetoriais de [Tabler Icons](https://github.com/tabler/tabler-icons), sob [licença MIT](https://github.com/tabler/tabler-icons/blob/main/LICENSE), copyright 2020–2026 Paweł Kuna. A licença integral acompanha os arquivos em `public/images/playful/LICENSE.tabler.txt`.

Arquivos de origem: `https://raw.githubusercontent.com/tabler/tabler-icons/main/icons/outline/{nome}.svg` para balloon, books, pencil, blocks, cloud, star e rainbow.

Todas as sete ilustrações foram **editadas antes do uso**: viewport ampliado para evitar cortes, preenchimentos infantis da paleta Peralta, contorno azul uniforme de 1,05 unidade, contorno externo creme de 2,8 unidades como acabamento de adesivo e remoção de metadados desnecessários. Arco-íris recebeu traços em coral, azul e verde. Permanecem SVGs editáveis, locais e leves, sem hotlink, marca d'água ou dependência do CDN.

A pipa, as flores, trilhas, sublinhados, fitas e bordas de papel são ilustrações editoriais autorais em SVG/CSS, coerentes com os assets adaptados. São decoração conceitual, não símbolos oficiais nem registros de atividades específicas da escola.

## Fotografias e marca

Tentativa nova de acesso ao perfil exato @escolaperaltagravata via Firecrawl e endpoint público do Instagram: indisponíveis. As 12 fotografias reais locais continuam com a proveniência descrita em [ASSETS-ESCOLA.md](ASSETS-ESCOLA.md).

Uma imagem de 828×806 px foi localizada em cadastro público com nome e endereço correspondentes, mas mostra uma versão antiga do mascote de máscara. Foi inspecionada e **descartada**, sem incorporação ao projeto. A marca corrente continua baseada nos originais locais preservados.

## Refinamento da transparência atual

A tentativa de limpeza com Imagegen foi inspecionada e descartada porque redesenhou as letras. **Essa nova saída gerada não foi incorporada ao site.** A arte anterior foi preservada: `escola-peralta-logo-refinada.png` reutiliza exatamente os canais RGB de `escola-peralta-logo-recortada.png` e retrabalha somente a máscara alfa.

Método: extração da máscara alfa, superamostragem 3×, erosão de 1 pixel nessa escala (aproximadamente 1/3 de pixel no tamanho final) para retirar franjas, reamostragem antialias e normalização do canal. O alfa refinado é recomposto sobre os pixels originais. Não há remoção grosseira por cor, novas letras ou mudança do mascote. PNG RGBA de 640×525 e WebP transparente otimizado em qualidade 94; fontes originais e o derivado anterior permanecem no repositório.

Conferência sobre creme, azul e amarelo. Como as letras são pretas, no rodapé azul a aplicação recebe um suporte de papel claro, sem adicionar um halo à imagem. A única matriz original disponível continua sendo a de 100×100 px; o refinamento não a transforma em um original vetorial.

Prompt da tentativa descartada (Imagegen integrado): limpeza precisa do alfa da logo existente, preservando composição, palavras “Escola Peralta”, letras, mascote, plantas e cores, com remoção de franjas e transparência real. A saída falhou no requisito de preservação tipográfica e foi rejeitada na inspeção.
