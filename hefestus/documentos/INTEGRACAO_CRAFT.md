# Craft no Hephaestus 2.0

Fontes oficiais inspecionadas em 26/10/2026:
- https://github.com/storytold/vectorcraft
- https://github.com/storytold/figcraft

Snapshot de VectorCraft: e2a8280134a7c3c9b4e117ee668b9b3e7eb3e315.
A licença MIT completa e os fontes originais usados estão em terceiros/vectorcraft/. As marcas e ícones do ArtCraft não foram importados.

## Integrado agora
- Adicionar pontos de ancoragem nos pontos médios dos segmentos: adaptação de add_anchor_points, com divisão Bézier exata pelo kernel do Hephaestus.
- Suavizar caminho: adaptação de smooth do Rust para os contornos JavaScript; preserva posições das âncoras e move suas alças.
- Simplificar segmentos lineares redundantes: adaptação do ramo linear de remove_redundant_points/merge_pair; retém juntas Bézier.
- Juntar caminhos abertos: adaptação de `edit.rs::join`, preservando alças, invertendo a orientação quando necessário e escolhendo extremos mais próximos. Um único caminho aberto é fechado; vários subcaminhos abertos do mesmo objeto são unidos.
- Dividir em grade: adaptação de `edit.rs::split_into_grid`, com linhas, colunas e espaçamento. Gera contornos retangulares em um único objeto, com um Undo e ID preservado. Não é um recorte booleano do desenho original.
- O motor FigCraft de booleanas e contornar traço já estava na base src-tauri/craft. Foi preservado com suas licenças e ponte nativa.

## Inspecionado, ainda não ligado
VectorCraft offset_path, outline_stroke, ajuste de curvas e Shape Builder dependem de kurbo, linesweeper e tipos internos Rust. O repositório também tem motores de texto, imagem, efeitos e formatos. Copiar esses diretórios não os torna executáveis no navegador.

Não há toolchain Cargo/Rust instalado neste ambiente. Portanto, a compilação do backend Rust e a integração dos motores pesados não foram homologadas nesta entrega. O pacote HTML executa as cinco ferramentas adaptadas em JavaScript; a ponte nativa existente depende de construir a versão desktop.

## Contrato de adaptação
Objetos são convertidos mantendo seus IDs, eventos e metadados. As operações passam por Nucleo.definirVetor, preservando undo/redo e a proteção das decisões. Os testes verificam forma geométrica, suavização, não mutação dos argumentos e sincronização com os nós.
