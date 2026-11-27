# Hefestus 0.42 — servidor MCP e manual para IAs

20/10/2026. Fase 4 do plano. Backup dos arquivos anteriores em `work/hefestus-antes-042`.

## O que entrou

- **Servidor MCP de verdade** (`ferramentas/hefestus-mcp.mjs`): o Claude, o Codex ou outra IA criam e editam
  projetos `.hefestus` com 34 ferramentas — as 27 do agente do editor (cada uma com o parâmetro `arquivo`)
  e mais: `hefestus_manual`, `hefestus_listar_projetos`, `hefestus_modelos`, `hefestus_novo_projeto`,
  `hefestus_resumo`, `hefestus_lote` (tudo ou nada) e `hefestus_exportar_html`.
  As ferramentas de snapshot da 0.37 continuam, quando existe `hefestus-contexto.json` na pasta.
  Só lê e grava `.hefestus` e `.html` dentro da pasta de trabalho.
- **`AGENTS.md`**: o manual que as IAs seguem para montar um programa (fluxo, peças prontas, convenções,
  exemplo de lote testado, e como ligar o servidor no Claude e no Codex).
- **Pasta `projetos/`**: pasta de trabalho dos programas criados. `npm run mcp` inicia o servidor nela.
- **CLI**: base comum com o servidor (`ferramentas/motor-projetos.mjs`) e dois comandos novos:
  `modelos` (lista as peças prontas) e `importar` (abre um componente da Biblioteca ou da Oficina de menus como projeto).

## Teste pedido: abrir o PDF Studio, atualizar tudo e salvar

Feito pelo CLI, sem abrir o editor e sem mexer no programa PDF Studio:

1. Abriu o componente mais recente do PDF Studio (`modelos-pdf-studio/menu-classico-v05/componente.hefestus.json`,
   "Editor PDF · menu clássico e ferramentas", 178 elementos) como projeto novo.
2. Auditou: 171 problemas, todos de acessibilidade (anel de foco com pouco contraste em 99 elementos e
   nomes repetidos em 72, como vários "Mais ações").
3. Aplicou as correções automáticas: 171 corrigidos, 0 restantes na auditoria seguinte.
4. Salvou em `projetos/pdf-studio.hefestus` (2 passos no histórico: abrir e corrigir; Ctrl+Z desfaz no editor)
   e gerou a prévia `projetos/pdf-studio.html`.

Visualmente nada mudou (comparado em imagem antes/depois): as correções só aparecem ao navegar pelo teclado
e nos nomes internos. O componente original em `modelos-pdf-studio/` não foi alterado.

Para refazer:

    npm run cli -- importar projetos/pdf-studio.hefestus modelos-pdf-studio/menu-classico-v05/componente.hefestus.json --nome "PDF Studio" --substituir
    npm run cli -- executar projetos/pdf-studio.hefestus auditar_interface "{\"corrigir\":true}"

## Verificação

- Servidor MCP testado por stdio como um cliente: inicializar, listar, criar, lote, passo inválido recusado,
  caminho fora da pasta recusado, resumo, HTML, listar projetos e manual.
- O exemplo de lote do `AGENTS.md` foi executado exatamente como está escrito.
- CLI: todos os comandos depois da mudança para a base comum.
- Nada de Rust mudou nesta versão. As versões 0.39 a 0.41 ainda precisam do `npm run janela` para compilar.
