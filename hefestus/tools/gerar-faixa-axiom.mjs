// Gera, a partir do modelo "faixaAxiom", o HTML+CSS+dados de runtime que o Axiom r38 embute.
// Uso: node tools/gerar-faixa-axiom.mjs saida.json
import { writeFileSync } from "node:fs";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { MODELOS } from "../js/nucleo/modelos.js";
import { compilar } from "../js/nucleo/compilador.js";
import { dadosRuntime, ligarRuntime } from "../js/nucleo/runtime.js";

const n = new Nucleo();
const m = MODELOS.find(x => x.id === "faixaAxiom");
n.inserirModelo(m, 0, 0);
const c = compilar(n.doc, { escopo: "#hefRibbon", modo: "previa" });
const saida = { css: c.css, html: c.html, dados: dadosRuntime(c.elementos), runtime: ligarRuntime.toString(), elementos: c.elementos.length };
writeFileSync(process.argv[2] ?? "faixa-axiom.json", JSON.stringify(saida));
console.log("elementos:", saida.elementos, "css:", c.css.length, "html:", c.html.length, "regras:", saida.dados.regras.length);
