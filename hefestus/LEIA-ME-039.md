# Hefestus 0.39 — arquivos .hefestus e hefestus-cli

20/10/2026. Fase 1 do plano (núcleo portátil). Backup dos arquivos anteriores em `work/hefestus-antes-039`.

## O que mudou

- **Arquivo `.hefestus`**: o projeto agora tem formato próprio, com número de versão e lugar para migrações
  (`js/nucleo/arquivoProjeto.js`). Arquivos `.hefestus.json` antigos continuam abrindo.
  Um arquivo de um Hefestus mais novo é recusado com uma mensagem clara, em vez de abrir errado.
- **Abrir e Salvar de verdade na janela própria**: Arquivo › Abrir (Ctrl+O) mostra o diálogo do Windows.
  Salvar (Ctrl+S) pergunta onde só na primeira vez e depois grava no mesmo arquivo.
  Novo comando **Salvar como…** (Ctrl+Shift+S). A gravação usa um temporário e troca no fim,
  então uma queda de energia não deixa o arquivo pela metade.
- **No navegador nada muda**: Salvar continua baixando o arquivo (agora com a extensão `.hefestus`).
- **hefestus-cli** (`ferramentas/hefestus-cli.mjs`): cria e edita projetos sem abrir o editor,
  com as mesmas 27 ferramentas do agente, as mesmas validações e o mesmo histórico.
  Tudo responde em JSON, para você, scripts e IAs (Claude, Codex).
- Versão 0.39.0 no editor, no `package.json` e na janela Tauri.

## Usar o CLI

Na pasta do Hefestus:

    npm run cli -- descrever
    npm run cli -- novo painel.hefestus --nome "Painel NOC" --largura 1920 --altura 1080
    npm run cli -- executar painel.hefestus criar_elemento "{\"tipo\":\"botao\",\"x\":40,\"y\":40}"
    npm run cli -- lote painel.hefestus passos.json
    npm run cli -- resumo painel.hefestus
    npm run cli -- html painel.hefestus painel.html

`passos.json` é uma lista de passos. Se um passo falhar, nada é salvo:

    [
      { "ferramenta": "criar_elemento", "args": { "tipo": "texto", "x": 40, "y": 30, "propriedades": { "texto": "Daedalus NOC" } } },
      { "ferramenta": "inserir_modelo", "args": { "modelo": "barraStatus", "x": 0, "y": 1040 } }
    ]

O projeto gerado abre normalmente no editor, e Ctrl+Z desfaz o que o CLI fez, passo a passo.

## Para a janela própria pegar as mudanças

Os comandos de Abrir e Salvar são novos no motor Rust, então a janela precisa recompilar uma vez:

    npm run janela

Essa compilação é rápida (só o código do Hefestus muda, não as bibliotecas).

## Como foi verificado

- Núcleo: ida e volta de um projeto pelo formato novo, arquivos inválidos, de versão mais nova, sem versão e com BOM.
- Editor no navegador: abre sem erros; com o motor simulado, Abrir, Salvar, Salvar como e o Ctrl+S seguinte
  chamam os comandos certos.
- CLI: todos os comandos; um lote com passo inválido não salva nada; o arquivo gerado abre no editor.
- Rust: verificado só quanto à sintaxe (rustfmt). A compilação de verdade acontece no `npm run janela`.
- As suítes de `testes/` não foram rodadas nesta versão, por decisão do usuário.

## Reverter

Copie de `work/hefestus-antes-039` os arquivos `js/nucleo/nucleo.js`, `js/app.js`, `js/ui/ribbon.js`
e a pasta `src-tauri`, apague `js/nucleo/arquivoProjeto.js`, `js/nucleo/nativo.js` e
`ferramentas/hefestus-cli.mjs` e rode `node build.mjs`.

## 0.39.1 — abertura mais rápida

Medido no Chromium, que é o mesmo motor da janela própria, com o projeto de exemplo:

| | Antes (0.39.0) | Depois (0.39.1) |
| --- | --- | --- |
| Primeira pintura | ~1,7 s | ~0,7 s |
| JavaScript na inicialização | ~1,2 s | ~0,4 s |

- A faixa desenhava as miniaturas de todos os modelos a cada redesenho, só para montar a lista de comandos,
  e isso custava cerca de 0,8 s. Agora a miniatura é desenhada quando a galeria abre e fica guardada
  (`js/nucleo/modelos.js`, `js/ui/ribbon.js`).
- As fontes do Google carregam em paralelo e não seguram mais a primeira pintura (`build.mjs`).
  Sem internet, o editor abre com as fontes do sistema.
- A barra de título não sobrepõe mais o nome do projeto ao botão "Oficina de menus" (`css/hefestus.css`).
- Por isso a troca do `build.mjs` pelo esbuild não foi necessária: o tempo estava no código de inicialização,
  não no tamanho do arquivo.

Backup desta etapa em `work/hefestus-antes-0391`.
