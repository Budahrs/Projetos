import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarWorkspace } from "../js/app/workspace.js";
test("preferências antigas não reabrem o formulário híbrido na prévia", () => {
  const antigo = { modo: "previa", hibrido: true, esq: "biblioteca", dir: ["propriedades"] };
  const ui = normalizarWorkspace(antigo);
  assert.equal(ui.hibrido, false); assert.equal(ui.hibridoPausado, true);
  assert.equal(ui.esq, null); assert.deepEqual(ui.dir, []);
  assert.deepEqual(ui.paineisAntes, { esq: "biblioteca", dir: ["propriedades"] });
  assert.equal(antigo.hibrido, true); assert.deepEqual(antigo.dir, ["propriedades"]);
});
test("Designer preserva modo híbrido e configuração válida", () => {
  const ui = normalizarWorkspace({ modo: "designer", hibrido: true, dockAlt: 0.6, dockAba: "elemento" });
  assert.equal(ui.hibrido, true); assert.equal(ui.dockAlt, 0.6); assert.equal(ui.dockAba, "elemento");
});
test("Web pausa híbrido e preferências inválidas recebem valores utilizáveis", () => {
  assert.equal(normalizarWorkspace({ modo: "web", hibrido: true }).hibrido, false);
  const ui = normalizarWorkspace({ modo: "invalido", dir: "erro", dockAlt: 10, dockAba: "antiga" });
  assert.equal(ui.modo, "designer"); assert.deepEqual(ui.dir, []); assert.equal(ui.dockAlt, 0.75); assert.equal(ui.dockAba, "geral");
});
