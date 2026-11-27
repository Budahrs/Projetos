import { motorMenus } from "./motorMenus.js";
// Artefatos derivados do projeto (nunca fonte paralela): componentes React, Vue e Web Component,
// e os tokens de tema em CSS. Todos só carregam a casca visual e emitem sinais; a lógica é de quem consome.
import { compilar } from "./compilador.js";
import { dadosRuntime, ligarRuntime } from "./runtime.js";
import { linkGoogleFonts } from "./fontes.js";
const ARTEFATOS = {
  react: { nome: "Componente React (.jsx)", ext: "jsx", mime: "text/javascript" },
  vue: { nome: "Componente Vue (.vue)", ext: "vue", mime: "text/plain" },
  webcomponent: { nome: "Web Component (.js)", ext: "js", mime: "text/javascript" },
  tema: { nome: "Tokens de tema (.css)", ext: "css", mime: "text/css" },
  storybook: { nome: "Storybook (.stories.jsx)", ext: "stories.jsx", mime: "text/javascript" },
  testes: { nome: "Testes visuais Playwright (.spec.js)", ext: "spec.js", mime: "text/javascript" },
};

const IMP = "import", EXP = "export"; // (o build do Hefestus reconhece "import" no começo de linha; aqui é texto gerado)
const js = v => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
const nomeComponente = tela => {
  const base = String(tela?.nome ?? "Interface").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, " ").trim();
  const n = base.split(" ").filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join("") || "Interface";
  return /^\d/.test(n) ? `Tela${n}` : n;
};

function partes(doc) {
  const tela = doc.elementos.__canvas ?? { largura: 1280, altura: 800, fundo: "#ffffff" };
  const c = compilar(doc, { escopo: ".hf-arte", modo: "componente" });
  return { tela, c, dados: dadosRuntime(c.elementos), fontes: linkGoogleFonts(c.elementos.map(e => e.estilo?.fonte)) };
}

const AJUDA = `Só a casca visual: a interface emite sinais { sinal, origem, evento } e quem a usa decide o que fazem.`;

function gerarReact(doc) {
  const { tela, c, dados, fontes } = partes(doc);
  const nome = nomeComponente(tela);
  return `// Gerado pelo Hefestus. ${AJUDA}
// Uso: <${nome} aoSinal={d => console.log(d.sinal, d.origem)} />
${IMP} { useEffect, useRef } from "react";

const ESTILOS = ${js(c.css)};
const HTML = ${js(c.html)};
const DADOS = ${js(dados)};
const motorMenus = ${motorMenus.toString()};
const ligarRuntime = ${ligarRuntime.toString()};
${fontes ? `const FONTES = ${js(fontes)};\n` : ""}
${EXP} default function ${nome}({ aoSinal, className }) {
  const raiz = useRef(null);
  const retorno = useRef(aoSinal);
  retorno.current = aoSinal;
  useEffect(() => {
    raiz.current.innerHTML = HTML;
    return ligarRuntime(raiz.current, DADOS, d => retorno.current?.(d));
  }, []);
  return (
    <>
      ${fontes ? `<link rel="stylesheet" href={FONTES} />\n      ` : ""}<style>{ESTILOS}</style>
      <main ref={raiz} className={"hf-arte" + (className ? " " + className : "")} />
    </>
  );
}
`;
}

function gerarVue(doc) {
  const { tela, c, dados, fontes } = partes(doc);
  return `<!-- Gerado pelo Hefestus. ${AJUDA} Uso: <${nomeComponente(tela)} @sinal="d => console.log(d.sinal)" /> -->
<script setup>
${IMP} { ref, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits(["sinal"]);
const raiz = ref(null);
const HTML = ${js(c.html)};
const DADOS = ${js(dados)};
const motorMenus = ${motorMenus.toString()};
const ligarRuntime = ${ligarRuntime.toString()};
let desligar = null;
onMounted(() => {
  raiz.value.innerHTML = HTML;
  desligar = ligarRuntime(raiz.value, DADOS, d => emit("sinal", d));
});
onBeforeUnmount(() => desligar && desligar());
<\/script>

<template>
  <main ref="raiz" class="hf-arte"></main>
</template>

<style>
${fontes ? `@import url("${fontes}");\n` : ""}${c.css.replace(/<\/style/gi, "<\\/style")}
</style>
`;
}

function gerarWebComponent(doc) {
  const { tela, c, dados, fontes } = partes(doc);
  const tag = `hf-${nomeComponente(tela).replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
  return `// Gerado pelo Hefestus. ${AJUDA}
// Uso: <${tag}></${tag}>   e   el.addEventListener("sinal", e => console.log(e.detail.sinal))
const ESTILOS = ${js((fontes ? `@import url("${fontes}");\n` : "") + c.css)};
const HTML = ${js(c.html)};
const DADOS = ${js(dados)};
const motorMenus = ${motorMenus.toString()};
const ligarRuntime = ${ligarRuntime.toString()};

class Interface extends HTMLElement {
  connectedCallback() {
    const sombra = this.shadowRoot ?? this.attachShadow({ mode: "open" });
    sombra.innerHTML = "<style></style><main class=\\"hf-arte\\"></main>";
    sombra.querySelector("style").textContent = ESTILOS;
    const raiz = sombra.querySelector("main");
    raiz.innerHTML = HTML;
    this._desligar = ligarRuntime(raiz, DADOS, d => this.dispatchEvent(new CustomEvent("sinal", { detail: d, bubbles: true, composed: true })));
  }
  disconnectedCallback() { this._desligar?.(); }
}
if (!customElements.get(${js(tag)})) customElements.define(${js(tag)}, Interface);
${EXP} default Interface;
`;
}

// ---------------------------------------------------------- tokens de tema
const HEX = /^#[0-9a-f]{3,8}$/i;
function extrairTema(doc) {
  const tela = doc.elementos.__canvas ?? {};
  const els = Object.entries(doc.elementos).filter(([id]) => !id.startsWith("__")).map(([id, e]) => e);
  const conta = (lista) => { const m = new Map(); for (const c of lista) if (typeof c === "string" && HEX.test(c)) m.set(c.toLowerCase(), (m.get(c.toLowerCase()) ?? 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]); };
  const fundos = conta(els.map(e => e.estilo?.fundo)), textos = conta(els.map(e => e.estilo?.cor)), bordas = conta(els.map(e => e.estilo?.borda));
  const primarias = conta(els.filter(e => e.tipo === "botao").map(e => e.estilo?.fundo));
  const hovers = conta(els.filter(e => e.tipo === "botao").map(e => e.estados?.hover?.fundo));
  const raios = [...new Set(els.map(e => Number(e.estilo?.raio)).filter(r => r > 0))].sort((a, b) => a - b);
  const fontes = [...new Set(els.map(e => e.estilo?.fonte).filter(f => f && f !== "sistema"))];
  const tokens = {};
  if (HEX.test(tela.fundo ?? "")) tokens["superficie"] = tela.fundo;
  if (primarias[0]) tokens["primaria"] = primarias[0];
  if (hovers[0]) tokens["primaria-hover"] = hovers[0];
  if (textos[0]) tokens["texto"] = textos[0];
  if (bordas[0]) tokens["borda"] = bordas[0];
  const usados = new Set(Object.values(tokens));
  [...fundos, ...textos].filter(c => !usados.has(c)).slice(0, 8).forEach((c, i) => { tokens[`cor-${i + 1}`] = c; usados.add(c); });
  const nomesRaio = ["pequeno", "medio", "grande"];
  raios.slice(0, 6).forEach((r, i, a) => { tokens[`raio-${a.length <= 3 ? nomesRaio[i] : i + 1}`] = `${r}px`; });
  return { tokens, fontes, tipografia: [...new Set(els.map(e => e.estilo?.tamanhoFonte).filter(Boolean))].sort((a, b) => a - b) };
}

function gerarTemaCSS(doc) {
  const { tokens, fontes, tipografia } = extrairTema(doc);
  const linhas = Object.entries(tokens).map(([k, v]) => `  --hf-${k}: ${v};`);
  tipografia.forEach(t => linhas.push(`  --hf-texto-${t}: ${t}px;`));
  if (fontes.length) linhas.push(`  --hf-fonte: ${fontes[0]};`);
  return `/* Tokens de tema extraídos do projeto pelo Hefestus (derivados, não editam o projeto). */\n:root {\n${linhas.join("\n") || "  /* nenhum token encontrado */"}\n}\n`;
}

const INTERATIVOS_ART = new Set(["botao", "campo", "toggle", "menu", "icone", "link"]);
const interativos = doc => Object.entries(doc.elementos).filter(([id, e]) => !id.startsWith("__") && e.visivel !== false && (INTERATIVOS_ART.has(e.tipo) || (e.eventos ?? []).length));

/** Storybook (CSF3): uma história da interface inteira e uma por controle, com o contrato de sinais como "action". */
function gerarStorybook(doc) {
  const nome = nomeComponente(partes(doc).tela);
  const sinais = [...new Set(interativos(doc).flatMap(([, e]) => (e.eventos ?? []).map(v => v.dispara).filter(Boolean)))];
  return `// Gerado pelo Hefestus. Importa o componente React exportado (${nome}.jsx) e documenta cada sinal.
${IMP} ${nome} from "./${nome}";

${EXP} default {
  title: "Hefestus/${nome}",
  component: ${nome},
  argTypes: { aoSinal: { action: "sinal" } },
  parameters: { docs: { description: { component: ${js(`Sinais emitidos: ${sinais.join(", ") || "nenhum"}. ${AJUDA}`)} } } },
};

${EXP} const Interface = {};
${interativos(doc).map(([id, e]) => `${EXP} const ${nomeComponente({ nome: `Foco ${e.nome ?? id}` })} = {
  name: ${js(`Foco: ${e.nome ?? id}`)},
  play: async ({ canvasElement }) => { canvasElement.querySelector("#${id}")?.focus(); },
};`).join("\n")}
`;
}

/** Testes visuais Playwright: cada controle em repouso, com hover, com foco e desabilitado. */
function gerarTestesVisuais(doc) {
  const lista = interativos(doc).map(([id, e]) => ({ id, nome: e.nome ?? id, tipo: e.tipo }));
  return `// Gerado pelo Hefestus. Rode: npx playwright test --update-snapshots (1ª vez) e depois npx playwright test
// Antes, baixe a interface com "Baixar HTML" e salve como interface.html ao lado deste arquivo.
${IMP} { test, expect } from "@playwright/test";
${IMP} path from "node:path";

const CONTROLES = ${js(lista)};

test.beforeEach(async ({ page }) => {
  await page.goto("file://" + path.resolve(__dirname, "interface.html"));
});

for (const c of CONTROLES) {
  test.describe(c.nome, () => {
    test("repouso", async ({ page }) => { await expect(page.locator("#" + c.id)).toHaveScreenshot(c.id + "-repouso.png"); });
    test("hover", async ({ page }) => { await page.locator("#" + c.id).hover(); await expect(page.locator("#" + c.id)).toHaveScreenshot(c.id + "-hover.png"); });
    test("foco", async ({ page }) => { await page.locator("#" + c.id).focus(); await expect(page.locator("#" + c.id)).toHaveScreenshot(c.id + "-foco.png"); });
    test("desabilitado", async ({ page }) => {
      await page.locator("#" + c.id).evaluate(el => { el.setAttribute("aria-disabled", "true"); el.setAttribute("data-indisp", ""); if ("disabled" in el) el.disabled = true; });
      await expect(page.locator("#" + c.id)).toHaveScreenshot(c.id + "-desabilitado.png");
    });
  });
}
`;
}

function gerarArtefato(doc, tipo) {
  const f = { react: gerarReact, vue: gerarVue, webcomponent: gerarWebComponent, tema: gerarTemaCSS, storybook: gerarStorybook, testes: gerarTestesVisuais }[tipo];
  if (!f) throw new Error(`artefato desconhecido: ${tipo}`);
  return f(doc);
}
export { ARTEFATOS, gerarReact, gerarVue, gerarWebComponent, extrairTema, gerarTemaCSS, gerarStorybook, gerarTestesVisuais, gerarArtefato };
