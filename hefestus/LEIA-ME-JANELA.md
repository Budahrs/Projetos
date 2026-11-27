# Hefestus em janela própria (Tauri 2)

Base: modelo oficial `create-tauri-app` (template vanilla, commit 16a7547), adaptado ao Hefestus.
A interface é o mesmo `dist/hefestus.html`; nada do editor foi alterado.

## O que vem pronto

| Arquivo | Função |
| --- | --- |
| `package.json` | Comandos `npm run janela` e `npm run instalador` |
| `src-tauri/tauri.conf.json` | Nome, ícone, instalador NSIS em português, sem console |
| `src-tauri/src/lib.rs` | O motor em Rust: abre a janela e tem os comandos `salvar_disco`, `mostrar_janela` e `info_motor` |
| `src-tauri/ponte.js` | Roda antes do Hefestus: carrega o projeto do disco, espelha cada salvamento e só mostra a janela depois do primeiro desenho |
| `src-tauri/icons/` | Gerados a partir do `hefestus.ico` |

## Primeira vez (uma vez só por máquina)

1. Instale o Rust: baixe `rustup-init.exe` em https://rustup.rs e aceite o padrão.
   Ele pede o "Visual Studio C++ Build Tools"; aceite também.
2. O WebView2 já vem no Windows 11.
3. Abra o terminal na pasta do Hefestus e rode `npm install`.

## Uso

- `npm run janela`: abre o Hefestus na janela própria, para testar. A primeira compilação leva alguns minutos; as seguintes, segundos.
- `npm run instalador`: gera `src-tauri\target\release\bundle\nsis\Hefestus_0.44.0_x64-setup.exe`.
  Instala sem pedir administrador, com ícone no menu Iniciar.

Os dois comandos rodam `node build.mjs` antes, então a janela sempre usa a versão atual do editor.

## Onde ficam os projetos

- Em `%APPDATA%\br.hefestus.editor\projeto.json`, com a versão anterior em `projeto.anterior.json`.
- A janela não enxerga o que está salvo no navegador. Antes da primeira vez, exporte o projeto
  no Hefestus aberto pelo navegador e importe na janela nova.

## Próximos passos (roadmap, Fase 1 e 2)

- Trocar o espelho do `localStorage` por arquivos `.hefestus` abertos e salvos pelo menu Arquivo
  (o plugin de diálogo já está instalado).
- Medir o tempo de abertura: o console da janela mostra `[Hefestus] pronto em … ms`.
- Trazer para o `lib.rs` as primeiras partes em Rust do ArtCraft.

Este modelo não foi compilado antes da entrega: o ambiente onde foi montado não tem acesso ao crates.io.
Se a primeira compilação acusar erro, copie a mensagem para o Claude.
