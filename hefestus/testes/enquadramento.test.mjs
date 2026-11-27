import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enquadrar } from '../js/nucleo/enquadramento.js';
test('enquadra o conteúdo e centraliza mesmo fora da origem, sem mudar o desenho',()=>{
  const caixas=[{x:800,y:400,largura:600,altura:300}];
  const antes=structuredClone(caixas), r=enquadrar(caixas,1000,600);
  assert.equal(r.zoom,1.53); assert.deepEqual(r.centro,[1100,550]); assert.deepEqual(caixas,antes);
});
test('limites e caixas inválidas não produzem zoom infinito',()=>{
  assert.equal(enquadrar([],1000,600),null);
  assert.equal(enquadrar([{x:0,y:0,largura:0,altura:0}],1000,600),null);
  assert.equal(enquadrar([{x:0,y:0,largura:1,altura:1}],1000,600).zoom,2);
  assert.equal(enquadrar([{x:0,y:0,largura:100,altura:100}],40,40),null);
});
