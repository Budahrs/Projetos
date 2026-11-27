# Hefestus 0.45 — todos os comandos ligados por padrão (PDF Studio 0.7)

21/10/2026. Backup dos arquivos anteriores em `work/hefestus-antes-045`.

## O que mudou

Ao exportar um programa, o Hefestus liga **todos** os sinais da interface sozinho. Não é mais preciso escrever
um arquivo de ligações para cada comando. Para cada sinal, vale a primeira regra que servir:

| Ordem | Origem | Exemplo |
| --- | --- | --- |
| 1 | `ligacoes/<programa>.json` (se existir; é encontrado sozinho pelo nome do programa) | Compactar → ponte do PDF Studio |
| 2 | Motor externo com uma operação de mesmo nome (`motor.operacoes`) | `compress` → `{"operation":"compress"}` |
| 3 | Motor de PDF embutido (programas com `documento.tipo = "pdf"`) | Girar, excluir, dividir, marca-d'água |
| 4 | Ações da janela (qualquer programa) | Desfazer, salvar, imprimir, zoom, ajuda, tema |
| 5 | Pendente: o botão diz o que falta, e a Ajuda lista | Proteger com senha |

O programa exportado leva `LIGACOES.md`, com cada comando e o que o faz funcionar.
Para ver antes de exportar: `npm run cli -- ligacoes projetos/pdf-studio.hefestus --nome "PDF Studio"`
(MCP: `hefestus_ligacoes`).

### Motor de PDF embutido

Ele vem dentro do programa (`programa/hefestus/`), com pdf.js (Apache-2.0) e pdf-lib (MIT), e não precisa de
instalação. Inclui:

- **Visualizador próprio**: página atual, zoom (Ctrl + roda), texto selecionável e impressão.
- **Edições em memória**, com desfazer e refazer (Ctrl+Z/Ctrl+Y). O original não muda até você usar
  **Salvar cópia** (Ctrl+S). Se houver alterações não salvas, o programa pergunta antes de fechar ou abrir outro.
- **Comandos**: girar, mover, duplicar, página em branco, excluir, numerar, marca-d'água, intercalar.
  Também dividir de 5 jeitos (por página, em grupos, por intervalos, por tamanho, por marcadores),
  recortar e remover recorte, inserir ou colar imagem, capturar a tela, comentário, realce, retângulo,
  assinatura desenhada, preencher e criar campos de formulário, páginas em PNG/JPG, extrair imagens,
  comparar PDFs e censurar.
- **Censurar** remove de verdade o que está sob a tarja: a página vira imagem.
- **Comandos da ponte com o documento editado**: o programa grava uma cópia temporária, e é ela que vai para o motor.

### Ações da janela (todo programa)

Todas as ferramentas (Ctrl+K), Recursos e limitações (F1), tema claro/escuro, recolher a faixa (clicar numa aba
abre de novo), copiar, recortar, colar, tela cheia, imprimir e sair.

## PDF Studio 0.7.0

74 de 85 comandos funcionando. 23 vêm da ponte original (Antares.PdfBridge), 34 do motor de PDF embutido e 17 da janela.
Ainda sem motor (11): proteger e remover senha, assinatura A1/PFX, PDF/X, resumir, traduzir, editar o texto original,
digitalizar, reconstruir imagem e página, lotes. Cada um diz isso no próprio botão.

## Para testar

    cd "C:\caminho\para\hefestus\programas\pdf-studio"
    npm run instalador

Instale o `PDF Studio_0.7.0_x64-setup.exe` (em `src-tauri\target\release\bundle\nsis\`).

## Verificação

Testei no Chromium com o Tauri simulado, rodando 40 comandos em sequência sobre um PDF de teste. Depois abri o arquivo
salvo de novo e conferi: rotação 90°, campos preenchidos ("Ana Souza", caixa marcada), o comentário (anotação /Text),
o recorte, as divisões em páginas e as imagens extraídas. O contrato que vai para a ponte usa a cópia temporária
quando o documento foi editado.

Programas sem documento também foram testados: a ajuda, a paleta e o aviso dos pendentes funcionam pelo aviso flutuante.

Rust: sintaxe conferida. Os comandos novos são `salvar_bytes`, `gravar_temporario` e `sair`; os dois primeiros
recebem os bytes direto, sem converter para texto.

Não testado aqui: a janela real do Windows (WebView2), a ponte real e o scanner.
