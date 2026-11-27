import { test } from "node:test";
import assert from "node:assert/strict";
import { ligarComplemento } from "../js/nucleo/complemento.js";

function ambiente(t) {
  class No extends EventTarget {
    children = []; textContent = "";
    append(...els) { for (const el of els) { el.parentNode = this; this.children.push(el); } }
    appendChild(el) { this.append(el); return el; }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(el => el !== this); }
    matches(s) { return s === ".hf-arte"; }
    querySelector(s) { return s === "#campo" ? campo : null; }
    querySelectorAll() { return []; }
    pause() { this.pausado = true; }
    removeAttribute() {} load() {}
  }
  const doc = new No(), raiz = new No(), sombra = new No(), campo = new No();
  sombra.append(raiz); doc.body = new No(); doc.head = new No();
  doc.createElement = () => new No();
  let seq = 0; const timers = new Map();
  const win = new EventTarget();
  win.setTimeout = win.setInterval = win.requestAnimationFrame = fn => { const id = ++seq; timers.set(id, fn); return id; };
  win.clearTimeout = win.clearInterval = win.cancelAnimationFrame = id => timers.delete(id);
  const anteriores = { window: globalThis.window, document: globalThis.document, CSS: globalThis.CSS };
  Object.assign(globalThis, { window: win, document: doc, CSS: { escape: v => v } });
  t.after(() => { for (const [k, v] of Object.entries(anteriores)) if (v === undefined) delete globalThis[k]; else globalThis[k] = v; });
  return { doc, raiz, sombra, campo, timers };
}

test("complemento isola buscas, elementos e eventos na raiz da prévia", t => {
  const a = ambiente(t);
  const limpar = ligarComplemento({ css: "body{background:red}", js: `
    document.body.append(document.createElement('dialog'));
    window.document.getElementById('campo').textContent='local';
    document.addEventListener('teste',()=>document.getElementById('campo').textContent='evento');
  ` }, a.raiz);
  assert.equal(a.doc.body.children.length, 0);
  assert.equal(a.raiz.children.length, 1);
  assert.equal(a.campo.textContent, "local");
  a.doc.dispatchEvent(new Event("teste")); assert.equal(a.campo.textContent, "local");
  a.raiz.dispatchEvent(new Event("teste")); assert.equal(a.campo.textContent, "evento");
  limpar(); a.campo.textContent = "limpo"; a.raiz.dispatchEvent(new Event("teste"));
  assert.equal(a.campo.textContent, "limpo");
  assert.equal(a.sombra.children.length, 1);
});
test("sair da prévia cancela timers, intervalos e quadros pendentes", t => {
  const a = ambiente(t);
  const limpar = ligarComplemento({ js: `
    setTimeout(()=>{},100); setInterval(()=>{},100); requestAnimationFrame(()=>{});
    window.setTimeout(()=>{},100); window.requestAnimationFrame(()=>{});
  ` }, a.raiz);
  assert.equal(a.timers.size, 5); limpar(); assert.equal(a.timers.size, 0); limpar();
});
test("complemento só de CSS também é instalado e removido", t => {
  const a = ambiente(t); const limpar = ligarComplemento({ css: ".teste{color:red}" }, a.raiz);
  assert.equal(a.sombra.children.length, 2); limpar(); assert.equal(a.sombra.children.length, 1);
});
