import { test } from "node:test";
import assert from "node:assert/strict";
import { MODELOS } from "../js/nucleo/modelos.js";
import { Nucleo } from "../js/nucleo/nucleo.js";
import { examinarDocumento } from "../js/nucleo/recuperacao.js";
import { dadosRuntime } from "../js/nucleo/runtime.js";

const referencias=MODELOS.filter(m=>m.cat==="Referências visuais");
test("onze modelos de referência são nativos, válidos e têm alvos internos remapeados",()=>{
  assert.equal(referencias.length,11);
  for(const m of referencias){
    const n=new Nucleo(); n.novo(false); const ids=n.inserirModelo(m,0,0);
    assert.ok(ids.length>5,m.nome);
    const erros=examinarDocumento(n.doc).problemas;
    assert.deepEqual(erros,[],m.nome);
    for(const id of ids) for(const ev of n.elemento(id).eventos??[]) if(ev.alvo) assert.ok(ids.includes(ev.alvo),`${m.nome}: ${ev.alvo}`);
    assert.ok(n.html().includes("<!doctype html>"));
    n.desfazer(); assert.equal(n.elementos().length,0);
    n.refazer(); assert.equal(n.elementos().length,ids.length);
  }
});
test("ribbons têm três abas exclusivas e primeira aba aberta",()=>{
  for(const m of referencias.filter(m=>m.id.startsWith("ref-ribbon"))){
    const abas=m.elementos.filter(e=>e.el.acessibilidade?.role==="tab");
    assert.equal(abas.length,3);
    assert.ok(abas.every(e=>e.el.eventos[0].acao==="mostrarSo"));
    const alvos=abas.map(e=>m.elementos.find(f=>f.ref===e.el.eventos[0].alvo));
    assert.deepEqual(alvos.map(e=>e.el.abertura.iniciaFechado),[false,true,true]);
  }
});
test("paletas e galerias transportam seus parâmetros no runtime",()=>{
  for(const id of ["ref-contexto-claro","ref-contexto-escuro","ref-galeria-formas"]){
    const n=new Nucleo();n.novo(false);n.inserirModelo(MODELOS.find(m=>m.id===id));
    const regras=dadosRuntime(n.elementos()).regras;
    if(id.includes("contexto")) assert.ok(regras.some(r=>r.acao==="aplicarEstilo"&&r.estilo?.fundo));
    else assert.ok(regras.some(r=>r.acao==="aplicarForma"&&r.caminho?.length));
  }
});
test("instâncias do mesmo modelo não controlam elementos de outra instância",()=>{
  const n=new Nucleo();n.novo(false); const m=MODELOS.find(m=>m.id==="ref-contexto-claro");
  const a=n.inserirModelo(m,0,0),b=n.inserirModelo(m,50,50);
  for(const id of b) for(const ev of n.elemento(id).eventos??[]) if(ev.alvo){assert.ok(b.includes(ev.alvo));assert.ok(!a.includes(ev.alvo));}
});
