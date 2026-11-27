# Hefestus 0.44 — programas com motor ligado (PDF Studio 0.6)

21/10/2026. Backup dos arquivos anteriores em `work/hefestus-antes-044`.

## O que entrou

**Ligações**: um arquivo `ligacoes/<programa>.json` (formato `hefestus.ligacoes`) diz, sinal por sinal, o que
cada comando da interface faz. O programa exportado com `--ligacoes` ganha:

- **Motor**: qualquer programa de linha de comando que recebe um contrato JSON e responde em JSON.
  Roda sem janela de console. Se não for encontrado, aparece "Localizar motor…" na barra do visualizador.
- **Visualizador**: o documento aberto aparece abaixo da interface, no leitor de PDF do próprio Windows/Edge
  (páginas, zoom, busca e impressão vêm dele).
- **Diálogos do Windows** para abrir e salvar, **pedido de valores** (ex.: páginas "1, 3-5"),
  **barra de status** com o resultado ou o erro do motor.

Arquivos: `ferramentas/programa-ligacoes.js` (o executor dentro do programa),
`ferramentas/programa-motor.rs` (diálogos e execução do motor, em Rust),
`ferramentas/exportarPrograma.mjs`, CLI `--ligacoes` e MCP `ligacoes`.

## PDF Studio 0.6.0

`ligacoes/pdf-studio.json` liga a interface ao motor do PDF Studio original, a ponte
`Antares.PdfBridge.exe` (em `PdfStudio\src\PdfTool.Automation\bin\Release\net8.0-windows\win-x64\`),
com o LibreOffice de `PdfStudio\Motores\LibreOffice`.

| Comando | O que faz |
| --- | --- |
| Abrir PDF | Diálogo do Windows, mostra no visualizador e conta as páginas |
| Novo PDF | Cria um PDF em branco |
| Juntar / Inserir PDF | Junta outros PDFs ao atual |
| Extrair páginas | Pede as páginas (ex.: 1, 3-5) e gera um PDF novo |
| Imagens → PDF, Office → PDF | Converte e abre o resultado |
| PDF → Word, Excel, PowerPoint | Converte pelo motor |
| PDF/A, Compactar, Reparar | Gera um PDF novo e abre |
| OCR, PDF pesquisável | Reconhece texto (português e inglês) |
| Extrair texto, PDF → texto, PDF → Markdown | Mostra ou salva o texto |
| Verificar assinaturas, Propriedades | Mostra o resultado |
| Página anterior/próxima, zoom, imprimir | Explicam o atalho do visualizador |
| Tela cheia | Alterna a tela cheia |

Os outros comandos (girar, excluir páginas, senha, marca-d'água, editar objetos, comentários, formulários,
assinatura desenhada, captura, scanner…) ainda mostram o aviso de que não há motor ligado.
Os motores do PDF Studio já fazem quase todos; falta expor cada um na ponte (C#). É o próximo passo.

## Para testar

    cd "C:\caminho\para\hefestus\programas\pdf-studio"
    npm run instalador

Desta vez compila o diálogo de arquivos (alguns minutos). Instale o `PDF Studio_0.6.0_x64-setup.exe`.

Os resultados são sempre salvos como arquivo novo (o diálogo pergunta onde); o PDF original não é alterado.

## Verificação

- Fluxo completo no Chromium com a ponte simulada no formato exato dela: abrir, compactar, extrair páginas
  ("1, 3-5" vira ["1","3","4","5"]), PDF → Markdown, verificar assinaturas, erro do motor e avisos.
- Os contratos enviados conferem com o que `Antares.PdfBridge` lê (`operation`, `input`, `inputs`, `output`,
  `pages`, `format`, `dpi`, `quality`, `languages`, `overwrite`).
- Rust: sintaxe conferida; usa as mesmas funções de diálogo que o Hefestus já compilou.
- Não testado aqui: a ponte real e o leitor de PDF do Edge (só existem no Windows).
