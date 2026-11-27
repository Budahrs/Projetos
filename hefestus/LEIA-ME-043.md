# Hefestus 0.43 — exportar programas com janela própria e instalador

20/10/2026. Fase 3 do plano. Backup dos arquivos anteriores em `work/hefestus-antes-043`.

## O que entrou

**Exportar programa** (CLI `exportar-programa`, MCP `hefestus_exportar_programa`): o projeto vira um programa
de verdade em `programas/<nome>/`, com:

| Arquivo | O que é |
| --- | --- |
| `programa/index.html` | A interface final, com comportamentos e responsivo |
| `programa.hefestus` | O projeto original: reabra no Hefestus, edite e exporte de novo |
| `programa.json` | Descrição em linguagem de máquina: identidade, tela e os sinais dos elementos |
| `src-tauri/` | Janela própria (Tauri 2), ícone e instalador NSIS em português, sem pedir administrador |
| `LEIA-ME.md` | Como gerar o instalador e editar |

A janela do programa usa o mesmo modelo que o Hefestus já compilou e abriu no seu PC (0.38),
só com a parte da janela: abre escondida e aparece depois do primeiro desenho.

## Primeiro programa: PDF Studio

`programas/pdf-studio/` foi gerado a partir de `projetos/pdf-studio.hefestus` (o teste da 0.42),
versão 0.5.0, janela de 1600×900, 99 sinais descritos em `programa.json`.

Para gerar o instalador, no PowerShell:

    cd "C:\caminho\para\hefestus\programas\pdf-studio"
    npm install
    npm run instalador

A primeira compilação leva alguns minutos. O instalador fica em `src-tauri\target\release\bundle\nsis\`.
Para testar sem instalar: `npm run janela`.

Este é o menu clássico e as ferramentas do PDF Studio feitos no Hefestus (a interface). Os motores do
PDF Studio de verdade (abrir, editar e salvar PDF) continuam no programa PDF Studio; ligar os sinais desta
interface a eles é o passo seguinte.

## Para exportar outros projetos

    npm run cli -- exportar-programa projetos/<arquivo>.hefestus --nome "Nome do Programa" --versao 1.0.0

## Verificação

- Todos os arquivos gerados conferidos: JSON válidos, Rust com sintaxe correta (rustfmt), o projeto embutido
  reabre com os 178 elementos.
- A interface exportada funciona sozinha: clicar em "Editar" troca os comandos da faixa, sem erros.
- O servidor MCP exporta pela ferramenta nova.
- O Rust do programa não foi compilado aqui (sem acesso ao repositório de pacotes).

## 0.43.1 — correções achadas no primeiro programa instalado

O PDF Studio instalado abriu na janela própria, mas "nenhum botão funcionava". Causas e correções:

- **Painéis de todas as abas abertos ao mesmo tempo.** O componente não define qual aba começa escolhida;
  os 9 painéis apareciam empilhados e o da aba Ajuda cobria os outros, roubando os cliques.
  O runtime do Hefestus (`js/nucleo/runtime.js`) agora deixa só o painel da primeira aba quando vários
  do mesmo grupo começam abertos. Vale para a prévia, o HTML exportado e os programas.
- **Texto ilegível ao passar o mouse.** Os 99 botões ficavam azul-escuros com texto escuro (2,2:1).
  O auditor (`js/nucleo/auditoria.js`) passou a verificar o contraste nos estados hover e pressionado,
  e corrige com um tom do próprio botão. No PDF Studio: 369 problemas encontrados e corrigidos.
- **Comandos sem resposta.** Os comandos emitem sinais (ex.: "Abrir PDF" → `pdf|open`), mas ainda não há
  motor ligado. Os programas exportados agora mostram um aviso discreto dizendo isso, e oferecem
  `hefestusPrograma.aoSinal(fn)` para ligar os motores.
- **Faixa cortada à direita.** No programa, o que não cabe na janela rola.

`projetos/pdf-studio.hefestus` e `programas/pdf-studio/` foram refeitos (versão 0.5.1). Para atualizar o instalado:

    cd "C:\caminho\para\hefestus\programas\pdf-studio"
    npm run instalador

Desta vez só o código do programa recompila (as bibliotecas já estão prontas).
