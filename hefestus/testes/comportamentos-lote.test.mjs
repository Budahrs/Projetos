import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {aplicarComportamentoLote} from '../js/nucleo/comportamentosLote.js';
import {dadosRuntime} from '../js/nucleo/runtime.js';
import {lerProjeto,textoDoProjeto} from '../js/nucleo/arquivoProjeto.js';
const criar=()=>{const n=new Nucleo();n.autosalvar=()=>{};n.novo(false);return n;};

test('seleção recebe comportamento em um passo e desfazer restaura todos',()=>{
  const n=criar(),a=n.criar('botao'),b=n.criar('botao'),antes=[a,b].map(id=>structuredClone(n.elemento(id).eventos));
  const cursor=n.projeto.cursor;
  aplicarComportamentoLote(n,[a,b],{tipo:'onClick',acao:'alternar',alvo:b,dispara:'alternar_painel'});
  assert.equal(n.projeto.cursor,cursor+1);
  assert.equal(n.elemento(a).eventos.at(-1).alvo,b);
  assert.equal(n.elemento(b).eventos.at(-1).dispara,'alternar_painel');
  n.desfazer();
  assert.deepEqual([a,b].map(id=>n.elemento(id).eventos),antes);
});

test('evento incompatível ou alvo inexistente não deixa lote parcial',()=>{
  const n=criar(),a=n.criar('botao'),b=n.criar('campo'),antes=JSON.stringify(n.doc);
  assert.throws(()=>aplicarComportamentoLote(n,[a,b],{tipo:'onChange',dispara:'mudar'}),/não aceita/);
  assert.throws(()=>aplicarComportamentoLote(n,[a],{tipo:'onClick',acao:'abrir',alvo:'inexistente'}),/elemento/);
  assert.equal(JSON.stringify(n.doc),antes);
});

test('regras desligadas persistem ao reabrir sem executar e o pacote leva interface e motor',()=>{
  const n=criar(),a=n.criar('botao');
  aplicarComportamentoLote(n,[a],{tipo:'onClick',dispara:'teste_desligado',suspenso:true});
  const d=lerProjeto(textoDoProjeto(n.serializar()));
  assert.equal(d.documento.elementos[a].eventos.at(-1).suspenso,true);
  assert.ok(!dadosRuntime(n.elementos()).regras?.some(r=>r.dispara==='teste_desligado'));
  assert.match(d.pacote.arquivos['interface/index.html'],/<!doctype html>/i);
  assert.match(d.pacote.arquivos['motor/runtime.js'],/export const ligarRuntime/);
  assert.equal(d.pacote.manifesto.entrada,'interface/index.html');
});
