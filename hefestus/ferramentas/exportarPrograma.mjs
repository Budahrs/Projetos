// Exporta um projeto do Hefestus como PROGRAMA: um projeto Tauri completo, com janela própria,
// ícone e instalador (NSIS). A janela usa o mesmo modelo que o Hefestus usa para si mesmo.
//
// O programa leva junto:
//  - programa/index.html   a interface final (o mesmo HTML de "Baixar HTML")
//  - programa.hefestus     o projeto original, para reabrir e editar no Hefestus
//  - programa.json         a descrição em linguagem de máquina: identidade, tela e sinais (eventos)
//
// Para gerar o instalador, na pasta do programa: npm install  →  npm run instalador

import { writeFileSync, mkdirSync, copyFileSync, existsSync, readFileSync, cpSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, dirname, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { textoDoProjeto } from "../js/nucleo/arquivoProjeto.js";
import { documentosProjeto } from "../js/nucleo/documentacaoProjeto.js";
import { ligarTudo, relatorioMarkdown } from "./ligacoes-auto.mjs";

const RAIZ_HEFESTUS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ICONES = ["32x32.png", "128x128.png", "128x128@2x.png", "icon.png", "icon.ico"];

const slugDe = texto => String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "programa";
const literalRust = s => JSON.stringify(String(s)); // string JSON é string Rust válida para texto simples

/**
 * Camada que só os programas exportados recebem (o HTML do editor fica igual):
 *  - o que não cabe na janela rola, em vez de ficar cortado;
 *  - hefestusPrograma.aoSinal(fn): onde os motores do programa se ligam aos sinais da interface;
 *  - enquanto um sinal não tem motor ligado, aparece um aviso discreto com o comando e o sinal.
 */
export function htmlDoPrograma(html, ligacoes = null) {
  const estilo = `<style id="hefestus-programa">
.hf-arte{overflow:auto}
#hp-aviso{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);max-width:min(560px,90vw);padding:10px 16px;border-radius:8px;
  background:#1f2937;color:#f9fafb;font:13px/1.4 system-ui,"Segoe UI",sans-serif;box-shadow:0 6px 24px #0004;opacity:0;pointer-events:none;transition:opacity .2s;z-index:2147483647}
#hp-aviso.on{opacity:1}
#hp-aviso code{font:12px Consolas,monospace;color:#fde68a}
@media (prefers-reduced-motion:reduce){#hp-aviso{transition:none}}
</style>`;
  const script = `<script id="hefestus-programa-js">
(() => {
  const ouvintes = [];
  const aviso = document.createElement("div");
  aviso.id = "hp-aviso"; aviso.setAttribute("role", "status"); aviso.setAttribute("aria-live", "polite");
  document.body.append(aviso);
  let t;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  window.hefestusPrograma = {
    /** fn({ sinal, origem, evento, elemento }) — devolva true se tratou o sinal. */
    aoSinal(fn) { ouvintes.push(fn); return () => ouvintes.splice(ouvintes.indexOf(fn), 1); },
  };
  document.addEventListener("hefestus:sinal", e => {
    const d = e.detail || {};
    if (!d.sinal) return;
    const elemento = document.getElementById(d.origem);
    let tratou = false;
    for (const fn of ouvintes) { try { tratou = fn({ ...d, elemento }) === true || tratou; } catch (err) { console.error("[programa] erro ao tratar", d.sinal, err); } }
    console.info("[programa] sinal", d.sinal, d);
    if (tratou) return;
    const nome = elemento?.getAttribute("aria-label") || elemento?.textContent?.trim() || d.origem;
    aviso.innerHTML = "<b>" + esc(nome) + "</b> emitiu o sinal <code>" + esc(d.sinal) + "</code>. Ainda não há um motor ligado a ele.";
    aviso.classList.add("on"); clearTimeout(t); t = setTimeout(() => aviso.classList.remove("on"), 2600);
  });
})();
</script>`;
  const pdf = ligacoes?.documento?.tipo === "pdf"
    ? `<script id="hefestus-pdf">window.__HEFESTUS_PDF__ = import("./hefestus/programa-pdf.js");</script>\n`
    : "";
  const extra = ligacoes
    ? `${pdf}<script id="hefestus-ligacoes">window.__HEFESTUS_LIGACOES__ = ${JSON.stringify(ligacoes).replace(/</g, "\\u003c")};</script>\n<script id="hefestus-ligacoes-js">\n${readFileSync(join(RAIZ_HEFESTUS, "ferramentas/programa-ligacoes.js"), "utf8").replace(/<\/script/gi, "<\\/script")}\n</script>`
    : "";
  let out = html.includes("</head>") ? html.replace("</head>", `${estilo}\n</head>`) : estilo + html;
  out = out.includes("</body>") ? out.replace(/<\/body>(?![\s\S]*<\/body>)/, () => `${script}\n${extra}\n</body>`) : out + script + extra;
  return out;
}

/** Descrição do programa em linguagem de máquina: quem é, tamanho da tela e os sinais que ele emite. */
export function descricaoDoPrograma(n, { nome, id, versao }) {
  const sinais = n.elementos().flatMap(e => (e.eventos ?? []).map(ev => ({
    elemento: e.id, nomeElemento: e.nome, texto: String(e.rotulo ?? e.texto ?? "").trim() || undefined, evento: ev.tipo, sinal: ev.dispara || null, acao: ev.acao || null, alvo: ev.alvo || null,
  })));
  return {
    formato: "hefestus.programa", versao: 1,
    programa: { id, nome, versao },
    tela: { largura: n.tela.largura, altura: n.tela.altura, fundo: n.tela.fundo },
    elementos: n.elementos().length,
    sinais,
    geradoEm: new Date().toISOString(),
  };
}

/** Id do programa (pasta, pacote, arquivo de ligações): "PDF Studio" → "pdf-studio". */
export const idDoPrograma = nome => slugDe(nome).replace(/^(?=\d)/, "programa-");

/**
 * Liga todos os sinais do programa (ferramentas/ligacoes-auto.mjs).
 * `ligacoes`: objeto do arquivo de ligações; null/undefined = procura ligacoes/<id>.json no Hefestus; false = nenhum arquivo.
 */
export function ligacoesDoPrograma(n, { nome, id, versao = "1.0.0", ligacoes } = {}) {
  nome = String(nome || n.nome || "Programa");
  id ??= idDoPrograma(nome);
  let explicitas = ligacoes ?? null;
  if (explicitas === null) {
    const padrao = join(RAIZ_HEFESTUS, "ligacoes", `${id}.json`);
    if (existsSync(padrao)) explicitas = JSON.parse(readFileSync(padrao, "utf8").replace(/^\uFEFF/, ""));
  }
  return ligarTudo(descricaoDoPrograma(n, { nome, id, versao }), explicitas || null);
}

/**
 * Gera o projeto Tauri do programa em `pasta`.
 * opcoes: { nome, id, versao, identificador, pasta, larguraJanela, alturaJanela }
 * Devolve { pasta, arquivos: [...] }.
 */
export function exportarPrograma(n, opcoes = {}) {
  const nome = String(opcoes.nome || n.nome || "Programa");
  // nome de pacote Rust não pode começar com número (ex.: "3D Sprite Studio")
  const id = idDoPrograma(opcoes.id || nome);
  const versao = /^\d+\.\d+\.\d+$/.test(opcoes.versao ?? "") ? opcoes.versao : "1.0.0";
  const identificador = opcoes.identificador || `br.hefestus.programas.${id.replace(/-/g, "")}`;
  const pasta = resolve(opcoes.pasta);
  const largura = Math.round(Math.min(Math.max(Number(opcoes.larguraJanela) || n.tela.largura || 1280, 480), 1920));
  const altura = Math.round(Math.min(Math.max(Number(opcoes.alturaJanela) || n.tela.altura || 800, 360), 1080));
  const crate = id.replace(/-/g, "_");
  const arquivos = [];
  const gravar = (rel, conteudo) => {
    const p = join(pasta, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, conteudo);
    arquivos.push(rel);
  };

  // ---- ligações: TODOS os sinais ligados por padrão (arquivo de ligações, motor, PDF embutido, interface)
  const descricao = descricaoDoPrograma(n, { nome, id, versao });
  const { ligacoes, relatorio } = ligacoesDoPrograma(n, { nome, id, versao, ligacoes: opcoes.ligacoes });
  const comPdf = ligacoes.documento?.tipo === "pdf";
  const recursosMotor={};
  const executavelMotor=ligacoes.motor?.executavel;
  if(executavelMotor&&!isAbsolute(executavelMotor)&&!executavelMotor.split(/[\\/]/).includes('..')){
    const relativo=dirname(executavelMotor).replaceAll('\\','/');
    if(relativo!=='.'&&existsSync(join(pasta,'src-tauri',executavelMotor)))recursosMotor[relativo+'/']=relativo+'/';
  }

  // ---- interface, projeto embutido e descrição
  gravar("programa/index.html", htmlDoPrograma(n.html(), ligacoes));
  gravar("programa/ligacoes.json", JSON.stringify(ligacoes, null, 2) + "\n");
  gravar("programa.hefestus", textoDoProjeto(n.serializar()));
  gravar("programa.json", JSON.stringify(descricao, null, 2) + "\n");
  gravar("LIGACOES.md", relatorioMarkdown(nome, relatorio));
  for (const [caminho, conteudo] of Object.entries(documentosProjeto(n.doc))) gravar(caminho, conteudo);
  if (comPdf) {
    // motor de PDF embutido: pdf.js (Apache-2.0) + pdf-lib (MIT), servidos junto com a interface
    const destino = join(pasta, "programa/hefestus");
    rmSync(destino, { recursive: true, force: true }); // sem sobras de uma exportação anterior
    cpSync(join(RAIZ_HEFESTUS, "ferramentas/vendor/pdf"), destino, { recursive: true });
    copyFileSync(join(RAIZ_HEFESTUS, "ferramentas/programa-pdf.mjs"), join(destino, "programa-pdf.js"));
    const listar = d => readdirSync(d).flatMap(f => statSync(join(d, f)).isDirectory() ? listar(join(d, f)) : [join(d, f)]);
    for (const f of listar(destino)) arquivos.push(f.slice(pasta.length + 1).replace(/\\/g, "/"));
  }

  // ---- npm (só para a ferramenta do Tauri)
  gravar("package.json", JSON.stringify({
    name: id, private: true, version: versao, type: "module",
    scripts: { janela: "tauri dev", instalador: "tauri build" },
    devDependencies: { "@tauri-apps/cli": "^2" },
  }, null, 2) + "\n");
  gravar(".gitignore", "node_modules/\nsrc-tauri/target/\nsrc-tauri/gen/schemas\n");

  // ---- Tauri
  gravar("src-tauri/Cargo.toml", `# Gerado pelo Hefestus. Programa: ${nome}.
[package]
name = "${id}"
version = "${versao}"
description = ${literalRust(`${nome} (feito no Hefestus)`)}
edition = "2021"

[lib]
name = "${crate}_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[profile.release]
codegen-units = 1
lto = true
opt-level = 3
panic = "abort"
strip = true
`);
  gravar("src-tauri/build.rs", "fn main() {\n    tauri_build::build()\n}\n");
  gravar("src-tauri/src/main.rs", `// Evita abrir uma janela de console junto no Windows (versão final). Não remover.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ${crate}_lib::run()
}
`);
  gravar("src-tauri/src/lib.rs", `// ${nome}: programa feito no Hefestus. Janela própria (Tauri 2).
// A interface está em ../programa/index.html. Para mudar a interface, edite programa.hefestus no Hefestus
// e exporte de novo; este arquivo só precisa mudar para acrescentar comandos nativos.

use std::{thread, time::Duration};
use tauri::{WebviewUrl, WebviewWindowBuilder};

/// Comandos ligados à interface (ligacoes.json): diálogos, documentos e motor externo.
mod motor;

/// Só mostra a janela depois do primeiro desenho: abre sem piscar em branco.
const PONTE: &str = r#"(() => {
  if (window.top !== window) return;
  const mostrar = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__TAURI_INTERNALS__.invoke("mostrar_janela").catch(() => {});
  }));
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", mostrar);
  else mostrar();
})();"#;

#[tauri::command]
fn mostrar_janela(window: tauri::WebviewWindow) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            mostrar_janela,
            motor::motor_executar,
            motor::motor_configuracao,
            motor::motor_definir,
            motor::escolher_arquivos,
            motor::escolher_destino,
            motor::ler_documento,
            motor::salvar_texto,
            motor::salvar_bytes,
            motor::gravar_temporario,
            motor::sair
        ])
        .setup(|app| {
            let janela =
                WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                    .title(${literalRust(nome)})
                    .inner_size(${largura}.0, ${altura}.0)
                    .visible(false)
                    .initialization_script(PONTE)
                    .build()?;
            // Reserva: se a interface não pedir para mostrar em 5 s, mostra assim mesmo.
            let reserva = janela.clone();
            thread::spawn(move || {
                thread::sleep(Duration::from_secs(5));
                if !reserva.is_visible().unwrap_or(true) {
                    let _ = reserva.show();
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect(${literalRust(`erro ao iniciar ${nome}`)});
}
`);
  {
    gravar("src-tauri/src/motor.rs", readFileSync(join(RAIZ_HEFESTUS, "ferramentas/programa-motor.rs"), "utf8"));
    const m = ligacoes.motor ?? {};
    gravar("src-tauri/motor-padrao.json", JSON.stringify({ nome: m.nome ?? "", executavel: m.executavel ?? "", ambiente: m.ambiente ?? {}, caminhoExtra: m.caminhoExtra ?? [] }, null, 2) + "\n");
  }
  gravar("src-tauri/tauri.conf.json", JSON.stringify({
    $schema: "https://schema.tauri.app/config/2",
    productName: nome, version: versao, identifier: identificador,
    build: { frontendDist: "../programa" },
    app: { withGlobalTauri: false, windows: [], security: { csp: null } },
    bundle: {
      active: true, targets: ["nsis"], useLocalToolsDir: true,
      resources: recursosMotor,
      icon: ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.ico"],
      windows: { nsis: { installMode: "currentUser", languages: ["PortugueseBR"] } },
    },
  }, null, 2) + "\n");
  gravar("src-tauri/capabilities/default.json", JSON.stringify({
    $schema: "../gen/schemas/desktop-schema.json", identifier: "default",
    description: `Permissões da janela de ${nome}`, windows: ["main"], permissions: ["core:default"],
  }, null, 2) + "\n");
  gravar("src-tauri/.gitignore", "/target/\n/gen/schemas\n");

  // ---- ícones: os do Hefestus como ponto de partida
  mkdirSync(join(pasta, "src-tauri/icons"), { recursive: true });
  for (const ic of ICONES) {
    const origem = join(RAIZ_HEFESTUS, "src-tauri/icons", ic);
    if (existsSync(origem)) { copyFileSync(origem, join(pasta, "src-tauri/icons", ic)); arquivos.push(`src-tauri/icons/${ic}`); }
  }

  gravar("LEIA-ME.md", `# ${nome}

Programa feito no Hefestus, versão ${versao}. Gerado em ${new Date().toLocaleDateString("pt-BR")}.

## Gerar o instalador

Na pasta deste programa (a primeira vez leva alguns minutos; as próximas, bem menos):

    npm install
    npm run instalador

O instalador fica em \`src-tauri\\target\\release\\bundle\\nsis\\\`. Para testar sem instalar: \`npm run janela\`.

## Editar

- **Interface**: abra \`programa.hefestus\` no Hefestus, edite e exporte de novo para esta mesma pasta.
- **Ícone**: troque com \`npx tauri icon minha-imagem.png\` (PNG quadrado, de preferência 1024×1024).
- **Comandos nativos**: \`src-tauri/src/lib.rs\`.

## Linguagem de máquina

\`programa.json\` descreve o programa para outras ferramentas e IAs: identidade, tela e os
${descricao.sinais.length} sinais que os elementos emitem.

## Ligações

O Hefestus liga todos os comandos sozinho: ${relatorio.ligados} de ${relatorio.total} já funcionam.
\`LIGACOES.md\` mostra cada comando e o que faz ele funcionar; \`programa/ligacoes.json\` é o mesmo em linguagem de máquina.
Para mudar uma ligação, edite \`ligacoes/${id}.json\` no Hefestus (vale sobre a automática) e exporte de novo.
`);

  return { pasta, id, nome, versao, identificador, janela: { largura, altura }, arquivos, ligacoes: relatorio };
}
