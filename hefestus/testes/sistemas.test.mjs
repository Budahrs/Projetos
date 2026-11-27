import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MODELOS} from '../js/nucleo/modelos.js';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {examinarDocumento} from '../js/nucleo/recuperacao.js';
for(const id of ['menuHefestus','janelaTesteHefestus','menuAxiom']) test(`${id}: modelo nativo válido, sinais e alvos internos`,()=>{
 const modelo=MODELOS.find(m=>m.id===id);assert.ok(modelo);assert.equal(modelo.cat,'Sistemas');
 const n=new Nucleo();n.novo(false);const ids=n.inserirModelo(modelo,0,0);
 assert.deepEqual(examinarDocumento(n.doc).problemas,[]);
 for(const id of ids)for(const e of n.elemento(id).eventos??[])if(e.alvo)assert.ok(ids.includes(e.alvo));
 assert.ok(ids.some(id=>n.elemento(id).eventos?.some(e=>e.dispara)));
 n.desfazer();assert.equal(n.elementos().length,0);n.refazer();assert.equal(n.elementos().length,ids.length);
});
test('Hefestus: uma aba por aba do menu real, com troca exclusiva; Axiom: código de perfil editável',async()=>{
 const {HEFESTUS_MENU_SPEC}=await import('../js/nucleo/hefestusMenuSpec.js');
 const m=MODELOS.find(m=>m.id==='menuHefestus');const abas=m.elementos.filter(e=>e.el.acessibilidade?.role==='tab');assert.equal(abas.length,HEFESTUS_MENU_SPEC.length);assert.ok(abas.every(e=>e.el.eventos[0].acao==='mostrarSo'));
 const a=MODELOS.find(m=>m.id==='menuAxiom');assert.ok(a.elementos.some(e=>e.el.codigo?.js.includes("aplicar('avancado')")));
});
