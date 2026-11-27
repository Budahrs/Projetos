// App Shell (issue #43, fase S0): perfis validados contra perfis/perfil.schema.json.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validarEsquema, validarPerfil, preferenciasDoPerfil } from "../js/shell/perfil.js";
import { ABAS_DESIGNER, ABAS_SCRIPT, iniciarAreas } from "../js/app/areasHephaestus.js";
import { TEMAS_UI, ALIAS_TEMA_UI } from "../js/ui/temas.js";
import { PERFIL_HEFESTUS } from "../js/shell/perfilHefestus.js";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ler = p => JSON.parse(readFileSync(join(raiz, p), "utf8"));
const esquema = ler("perfis/perfil.schema.json");
const temas = { temas: TEMAS_UI, apelidos: ALIAS_TEMA_UI };

test("perfis do repositório cumprem o esquema e as referências internas", () => {
  for (const arq of ["perfis/hefestus.perfil.json", "perfis/l-seed.perfil.json"]) {
    assert.deepEqual(validarPerfil(ler(arq), esquema, temas), [], arq);
  }
});

test("o perfil do Hefestus espelha o editor de verdade (sem divergir de areasHephaestus.js)", () => {
  const p = ler("perfis/hefestus.perfil.json");
  assert.deepEqual(p.areas.find(a => a.id === "designer").abas, ABAS_DESIGNER);
  assert.deepEqual(p.areas.find(a => a.id === "visual-script").abas, ABAS_SCRIPT);
  const ui = iniciarAreas({});
  const pref = preferenciasDoPerfil(p);
  for (const k of ["areaAtiva", "aba", "esq", "dir", "qat"]) assert.deepEqual(pref[k], ui[k], k);
  // O editor usa "ambar", apelido legado que não existe no catálogo e cai no tema do sistema;
  // o perfil declara isso explicitamente como "automatico".
  assert.equal(TEMAS_UI[ALIAS_TEMA_UI[ui.temaUI]], undefined);
  assert.ok(TEMAS_UI[pref.temaUI]);
});

test("o perfil em JS (usado pelo editor) é igual ao JSON do repositório", () => {
  assert.deepEqual(PERFIL_HEFESTUS, ler("perfis/hefestus.perfil.json"));
});

test("motores e servidores MCP declarados existem no repositório", t => {
  for (const arq of ["perfis/hefestus.perfil.json", "perfis/l-seed.perfil.json"]) {
    // O perfil L-SEED aponta para ../l-seed, que só existe no acervo completo.
    if (arq.includes("l-seed") && !existsSync(resolve(raiz, "../l-seed"))) { t.diagnostic(`${arq}: L-SEED ausente, não conferido`); continue; }
    const p = ler(arq);
    assert.ok(existsSync(join(raiz, p.motor.entrada)), `${arq}: motor ${p.motor.entrada}`);
    for (const a of p.mcp?.args ?? []) assert.ok(existsSync(join(raiz, a)), `${arq}: mcp ${a}`);
  }
});

test("erros do esquema e das referências viram mensagens claras", () => {
  const base = ler("perfis/hefestus.perfil.json");
  const ruim = { ...base, versao: 2, id: "Errado", extra: 1, destinos: ["tv"], areaInicial: "nao-existe",
    areas: [{ ...base.areas[0], abaInicial: "zzz" }], temaPadrao: "inexistente" };
  const erros = validarEsquema(ruim, esquema);
  for (const t of ["perfil.versao: deve ser 1", "perfil.id: fora do padrão", 'campo não previsto "extra"', "perfil.destinos[0]: deve ser um de"])
    assert.ok(erros.some(e => e.includes(t)), t);
  const refs = validarPerfil({ ...base, areaInicial: "nao-existe", areas: [{ ...base.areas[0], abaInicial: "zzz" }], temaPadrao: "inexistente" }, esquema, temas);
  for (const t of ['areaInicial: "nao-existe"', 'abaInicial: "zzz"', 'temaPadrao: "inexistente"'])
    assert.ok(refs.some(e => e.includes(t)), t);
  assert.ok(validarEsquema({}, esquema).some(e => e.includes('falta o campo "formato"')));
});
