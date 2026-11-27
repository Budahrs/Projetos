# Hefestus 0.41 — Craft: converter traço em forma

20/10/2026. Backup dos arquivos anteriores em `work/hefestus-antes-041`.

## O que entrou

**Organizar › Combinar formas › Traço em forma**: a borda do elemento vira uma forma preenchida,
como o "Contornar traçado" do Illustrator. Usa `stroke_outline` do FigCraft (`pathops`), já incorporado na 0.40.

- Funciona com a borda simples (Estilo e cores) e com a lista de traços avançados (`estilo.tracos`).
- Respeita posição (dentro, centro, fora), pontas, junções e tracejado/pontilhado.
- A forma nova fica logo acima do elemento, com a cor do traço; o elemento perde o traço. Ctrl+Z desfaz os dois juntos.
- Só na janela própria: no navegador aparece um aviso, porque não existe versão em JS desta ferramenta.

## Arquivos

- `src-tauri/src/craft_vetor.rs`: `contornar_traco` + 3 testes novos (6 no total: `cargo test craft` em `src-tauri`).
- `src-tauri/src/lib.rs`: comando `craft_contornar_traco`.
- `js/nucleo/nucleo.js`: `converterTracoEmForma`, `podeConverterTraco`, `tracoDoElemento`.
- `js/nucleo/nativo.js`, `js/app.js`, `js/ui/ribbon.js`: a ponte, a ação e o botão.

## Verificação

- Navegador: o botão aparece e mostra o aviso da janela própria.
- Motor simulado: os parâmetros do traço chegam certos ao Rust; a forma nova sai com a cor do traço;
  a borda sai do original; desfazer volta tudo.
- Rust: só a sintaxe foi conferida aqui. Compile com `npm run janela`.
