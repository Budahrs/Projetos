# Hefestus 0.40 — primeira ferramenta do Craft incorporada

20/10/2026. Backup dos arquivos anteriores em `work/hefestus-antes-040`.

## O que entrou

As operações de forma (Organizar › Unir, Subtrair, Interseção, Excluir sobreposição) usam agora,
na janela própria, o motor de caminhos do **FigCraft** (`pathops`):

- **Curvas exatas.** A versão em JS transformava as curvas em pequenas retas; a do Craft mantém as curvas.
- **Robusta.** Usa o algoritmo de varredura do `linesweeper`, feito para formas que se tocam,
  se cruzam ou têm furos.
- No navegador, ou se o motor falhar, o Hefestus usa a versão em JS de sempre. O agente e o CLI
  também continuam com a versão em JS, por enquanto.
- A mensagem depois de combinar diz "(curvas exatas, motor Craft)" quando foi o Craft que fez.

## Onde está

| Pasta / arquivo | O que é |
| --- | --- |
| `src-tauri/craft/geom`, `color`, `doc`, `pathops` | Código do FigCraft (commit d9c924c), cerca de 15 mil linhas de Rust, agora dentro do Hefestus. Pode mudar à vontade. |
| `src-tauri/craft/LICENSE-MIT`, `LICENSE-APACHE`, `NOTICE` | Licença do FigCraft. Mantenha junto. |
| `src-tauri/src/craft_vetor.rs` | A ponte: recebe os caminhos no formato SVG, chama o Craft e devolve o resultado. Tem 3 testes. |
| `js/nucleo/nucleo.js` › `booleanaPrecisa` | Decide entre o Craft (janela própria) e o JS (navegador). |

Para ver o que o motor tem, no console da janela: `await hefestusMotor.info()` mostra a lista `craft`.

## Para usar

    npm run janela

Desta vez a compilação baixa as bibliotecas que o Craft usa (kurbo, linesweeper, imbl) e leva alguns minutos.
O Craft pede Rust 1.95 ou mais novo; o seu é 1.99.

Testes do Rust (opcional):

    cd src-tauri
    cargo test craft

## Como foi verificado

- Editor no navegador: combinar formas continua igual (JS).
- Com o motor simulado: o Hefestus chama `craft_booleana`, usa o caminho devolvido e o resultado entra
  no histórico (Ctrl+Z volta).
- O formato que o Craft devolve (SVG do kurbo) é lido corretamente pelo Hefestus.
- O Rust não foi compilado aqui (sem acesso ao repositório de pacotes); só a sintaxe foi conferida.
  Se a compilação acusar erro, mande a mensagem.

## Próximas ferramentas do Craft candidatas

- `pathops::stroke_outline`: "Converter traço em forma" (contorno do traço como preenchimento).
- `figcraft-svg`: importação de SVG completa (o importador atual é simples).
- `figcraft-layout`: auto layout no estilo Figma, para comparar com os containers do Hefestus.
- Do PhotoCraft: `compose` e `ops` (camadas e filtros de imagem), úteis para o Anima Studio.
