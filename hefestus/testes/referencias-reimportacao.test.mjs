import test from 'node:test';
import assert from 'node:assert/strict';
import {referenciasRemanescentes} from '../js/aplicacao/reimportacaoHTML.js';

const documento = (valor) => ({elementos:{
  'objeto-local':{tipo:'texto',codigo:{expressao:valor}},
  '__script':{grafos:[]}
}});

test('IDs com pontuação são tratados literalmente na busca de referências',()=>{
  for(const id of ['a.b','a+b','a[b]','a(b)','a\\b','a$b','a{b}']){
    const referencias=referenciasRemanescentes(documento('ref:'+id+';'),new Set([id]));
    assert.ok(referencias.some(x=>x.includes(' → '+id)),id);
  }
});

test('pontuação não funciona como curinga e não bloqueia referências diferentes',()=>{
  assert.deepEqual(referenciasRemanescentes(documento('ref:axb;'),new Set(['a.b'])),[]);
  assert.deepEqual(referenciasRemanescentes(documento('ref:ab;'),new Set(['a+b'])),[]);
});

test('referências exatas em propriedades e chaves continuam detectadas',()=>{
  const doc={elementos:{obj:{tipo:'texto',vinculos:{'a.b':true},destino:'a+b'},__script:{grafos:[]}}};
  const refs=referenciasRemanescentes(doc,new Set(['a.b','a+b']));
  assert.ok(refs.some(x=>x.includes('a.b')));
  assert.ok(refs.some(x=>x.includes('a+b')));
});
