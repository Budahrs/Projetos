import { test } from "node:test";
import assert from "node:assert/strict";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { Agente } from "../js/agente/agente.js";
import * as V from "../js/nucleo/vetor.js";

const area = cs => cs.reduce((s, c) => { const p = V.achatar(c, 1); let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return s + Math.abs(a / 2); }, 0);
const R = (x, y, w, h) => V.retanguloContornos(x, y, w, h);

test("caminho: ler e escrever preservam a forma (arcos, relativos, quadráticas)", () => {
  const cs = V.lerCaminho("M10 10A5 5 0 1 1 20 10Q15 0 10 10zM0 0h5v5H0z");
  assert.equal(cs.length, 2);
  assert.ok(cs[0].fechado && cs[1].fechado);
  const d = V.escreverCaminho(cs);
  assert.equal(V.lerCaminho(d).length, 2);
  assert.ok(Math.abs(area(V.lerCaminho(d)) - area(cs)) / area(cs) < 1e-3);
});

test("booleanas: áreas corretas, arestas coincidentes e formas separadas", () => {
  const A = R(0, 0, 100, 100), B = R(50, 50, 100, 100);
  assert.equal(area(V.booleana(A, B, "unir")), 17500);
  assert.equal(area(V.booleana(A, B, "subtrair")), 7500);
  assert.equal(area(V.booleana(A, B, "intersectar")), 2500);
  assert.equal(V.booleana(A, B, "excluir").length, 2);
  const C = R(100, 0, 100, 100); // encostada
  assert.equal(area(V.booleana(A, C, "unir")), 20000);
  assert.equal(V.booleana(A, C, "intersectar").length, 0);
  assert.equal(area(V.booleana(A, R(0, 0, 50, 100), "subtrair")), 5000);
  assert.equal(V.booleana(A, R(500, 500, 10, 10), "intersectar").length, 0);
  assert.equal(V.booleana(A, V.elipseContornos(25, 25, 50, 50), "subtrair").length, 2); // furo
  const u = area(V.booleana(V.elipseContornos(0, 0, 100, 100), V.elipseContornos(60, 0, 100, 100), "unir"));
  assert.ok(Math.abs(u - (2 * Math.PI * 2500 - 2237)) < 60, `união de círculos ${u}`);
});

test("nós: inserir preserva a curva e alternar reto/suave", () => {
  const c = V.lerCaminho("M0 0C0 50 100 50 100 0Z")[0];
  const antes = area([c]);
  V.inserirNo(c, 0, 0.5);
  assert.equal(c.nos.length, 3);
  assert.ok(Math.abs(area([c]) - antes) / antes < 0.01);
  V.alternarSuave(c, 0);
  assert.ok(c.nos[0].a === null || c.nos[0].a);
});

test("núcleo: booleana, converter em vetor e editar nós viram comandos desfazíveis", () => {
  const n = new Nucleo();
  const a = n.criar("forma", 100, 100), b = n.criar("elipse", 150, 120);
  const r = n.booleana([a, b], "unir");
  assert.ok(r.id && !n.elemento(a) && !n.elemento(b));
  assert.equal(n.elemento(r.id).forma, "vetor");
  n.desfazer();
  assert.ok(n.elemento(a) && n.elemento(b) && !n.elemento(r.id));
  assert.ok(n.booleana([a], "unir").erro);
  const [v] = n.converterEmVetor([b]);
  assert.equal(n.elemento(v).tipo, "forma");
  const cs = n.contornosDoVetor(v);
  cs[0].nos[3].x -= 30; cs[0].nos[3].a[0] -= 30; cs[0].nos[3].b[0] -= 30;
  n.definirVetor(v, cs);
  assert.ok(n.elemento(v).largura > 120);
  const id = n.criarVetor([{ fechado: false, nos: [{ x: 10, y: 10, a: null, b: null }, { x: 90, y: 60, a: null, b: null }] }], { aberto: true });
  assert.equal(n.elemento(id).estilo.fundo, "transparent");
});

test("agente: combinar formas e converter em vetor por texto", async () => {
  const n = new Nucleo();
  const ag = new Agente(n, {});
  n.criar("forma", 100, 100); n.criar("elipse", 140, 110);
  n.selecionarTudo();
  await ag.enviar("subtrair as formas");
  const forma = n.elementos().filter(e => e.tipo === "forma");
  assert.equal(n.elementos().length, 1);
  assert.equal(forma[0].forma, "vetor");
  n.selecionar(forma[0].id);
  await ag.enviar("une as formas"); // só uma selecionada: não faz nada perigoso
  assert.equal(n.elementos().length, 1);
  const e = n.criar("elipse", 10, 10);
  n.selecionar(e);
  await ag.enviar("converte em vetor");
  assert.equal(n.elemento(e).tipo, "forma"); // Hephaestus preserva o ID e os vínculos ao converter.
  assert.equal(n.elementos().filter(x => x.tipo === "forma").length, 2);
});

import { Nucleo as NucleoM } from "../js/nucleo/nucleo.js";
import { css as cssEl } from "../js/nucleo/exportar.js";

test("importar SVG: path, círculo, grupo com transform e cores", () => {
  const n = new NucleoM();
  const svg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><script>x()</script>
    <g transform="translate(2 2)" fill="#ff0000"><circle cx="5" cy="5" r="4"/><path d="M0 12 L10 12 L5 20 Z" fill="none" stroke="#00f" stroke-width="2"/></g>
    <rect x="14" y="14" width="8" height="8" rx="2" style="fill:#0a0"/></svg>`;
  const r = n.importarSVG(svg, 10, 10, "ícone");
  assert.equal(r.formas, 3);
  const formas = n.elementos().filter(e => e.tipo === "forma");
  assert.equal(formas.length, 3);
  assert.ok(formas.every(f => f.forma === "vetor" && /^M/.test(f.caminho)));
  assert.equal(formas[0].estilo.fundo, "#ff0000");
  assert.equal(formas[1].estilo.fundo, "transparent");
  assert.equal(formas[1].estilo.borda, "#00f");
  assert.equal(formas[2].estilo.fundo, "#0a0");
  assert.ok(n.elementos().some(e => e.tipo === "container"));
  n.desfazer();
  assert.equal(n.elementos().length, 0);
  assert.ok(n.importarSVG("<p>nada</p>").erro);
});

test("máscara: recorta o alvo com o contorno da forma da frente e libera", () => {
  const n = new NucleoM();
  const a = n.criar("caixa", 0, 0); n.definir(a, { largura: 200, altura: 200 });
  const m = n.criar("elipse", 50, 50); n.definir(m, { largura: 100, altura: 100 });
  const r = n.criarMascara([a, m]);
  assert.equal(r.fonte, m);
  assert.equal(n.elemento(m).visivel, false);
  const el = { ...n.elemento(a), id: a };
  assert.match(el.mascara.d, /^M/);
  assert.match(cssEl(el), /mask:url\("data:image\/svg\+xml/);
  const l = n.liberarMascara(a);
  assert.equal(l.liberados, 1);
  assert.equal(n.elemento(a).mascara, undefined);
  assert.notEqual(n.elemento(m).visivel, false);
});

import { elipseContornos as eli, retanguloContornos as ret, booleana as boo, limitesDe as lim } from "../js/nucleo/vetor.js";
test("booleana devolve curvas de Bézier (poucos nós) e mantém a geometria", () => {
  const A = eli(0, 0, 100, 100), B = ret(50, 0, 100, 100, [0, 0, 0, 0]);
  for (const op of ["unir", "subtrair", "intersectar"]) {
    const r = boo(A, B, op);
    assert.equal(r.length, 1);
    assert.ok(r[0].nos.length <= 8, `${op}: ${r[0].nos.length} nós`);
    assert.ok(r[0].nos.some(n => n.a || n.b), `${op} sem curvas`);
  }
  const u = lim(boo(A, B, "unir"), 0.5);
  assert.ok(Math.abs(u.x - 0) < 1 && Math.abs(u.largura - 150) < 1 && Math.abs(u.altura - 100) < 1);
  const i = lim(boo(A, B, "intersectar"), 0.5);
  assert.ok(Math.abs(i.x - 50) < 1 && Math.abs(i.largura - 50) < 1);
});
