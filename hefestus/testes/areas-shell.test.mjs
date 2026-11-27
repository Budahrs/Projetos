// App Shell (#43, fase S1): as áreas do Hephaestus, agora montadas a partir do perfil, se comportam
// exatamente como a versão anterior (cópia em testes/referencia/).
import test from "node:test";
import assert from "node:assert/strict";
import * as novo from "../js/app/areasHephaestus.js";
import * as antes from "./referencia/areasHephaestus-antes-s1.js";
import { criarAreas } from "../js/shell/areas.js";

const AREAS = ["designer", "visual-script", "codigo", "code", "visualscript", "forja", "web", "outra", "", undefined];
const ABAS = ["arquivo", "inicio", "inserir", "modificar", "aparencia", "layout", "exibir", "gatilhos", "acoes", "logica", "variaveis", "componentes", "compilar", "inexistente", undefined];
function aleatorio(semente) { let s = semente; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; }
const escolher = (r, l) => l[Math.floor(r() * l.length)];
const normal = o => Array.isArray(o) ? o.map(normal) : o && typeof o === "object" ? Object.fromEntries(Object.keys(o).sort().map(k => [k, normal(o[k])])) : o;

function estadosIniciais(r) {
  return [{}, { hephaestusLayout: 1, areaAtiva: escolher(r, AREAS), aba: escolher(r, ABAS), codigoVisao: escolher(r, ["grafo", "blocos", "fonte", "x", undefined]) },
    { hephaestusLayout: 1, areaAtiva: "codigo", abasPorArea: { designer: "layout", codigo: "logica" } }, { temaUI: "dark" }];
}

test("mesma sequência de operações dá o mesmo estado nas duas versões (2.000 sequências)", () => {
  const r = aleatorio(44);
  for (let i = 0; i < 500; i++) {
    for (const inicial of estadosIniciais(r)) {
      const a = structuredClone(inicial), b = structuredClone(inicial);
      antes.iniciarAreas(a); novo.iniciarAreas(b);
      assert.deepEqual(normal(b), normal(a), `iniciar ${JSON.stringify(inicial)}`);
      for (let k = 0; k < 6; k++) {
        if (r() < 0.4) { const aba = escolher(r, ABAS); a.aba = aba; b.aba = aba; }
        const area = escolher(r, AREAS);
        antes.trocarArea(a, area); novo.trocarArea(b, area);
        assert.deepEqual(normal(b), normal(a), `trocar para ${area}`);
      }
    }
  }
  assert.deepEqual(novo.ABAS_DESIGNER, antes.ABAS_DESIGNER);
  assert.deepEqual(novo.ABAS_SCRIPT, antes.ABAS_SCRIPT);
});

test("o módulo genérico serve outro perfil sem nada do Hefestus", () => {
  const perfil = { id: "l-seed", areas: [{ id: "conversa", abas: ["leila", "aura"], abaInicial: "leila" }, { id: "memoria", abas: ["fila"], abaInicial: "fila" }],
    areaInicial: "conversa", paineis: { esquerda: ["personas"], direita: ["contexto"] }, acessoRapido: ["lseed.buscar"], temaPadrao: "automatico" };
  const { iniciarAreas, trocarArea } = criarAreas(perfil);
  const ui = iniciarAreas({});
  assert.deepEqual([ui.areaAtiva, ui.aba, ui.esq, ui.dir, ui.qat, ui.temaUI], ["conversa", "leila", "personas", ["contexto"], ["lseed.buscar"], "automatico"]);
  ui.aba = "aura"; trocarArea(ui, "memoria"); assert.equal(ui.aba, "fila");
  trocarArea(ui, "conversa"); assert.equal(ui.aba, "aura");
  trocarArea(ui, "nao-existe"); assert.equal(ui.areaAtiva, "conversa");
  assert.equal(ui.hibrido, undefined);
});
