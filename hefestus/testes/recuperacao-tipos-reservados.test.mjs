import test from 'node:test';
import assert from 'node:assert/strict';
import {examinarDocumento} from '../js/nucleo/recuperacao.js';

test('recuperação trata nomes herdados como tipos desconhecidos',()=>{
 for(const tipo of ['constructor','toString','__proto__']){
  const doc={elementos:{__canvas:{nome:'Teste',largura:640,altura:480},
   item:{tipo,nome:'Entrada',x:0,y:0,largura:100,altura:100}}};
  const resultado=examinarDocumento(doc);
  assert.equal(resultado.valido,false);
  assert.equal(resultado.doc.elementos.item.tipo,'caixa');
  assert.ok(resultado.problemas.some(p=>p.id==='item'));
 }
});
test('recuperação não altera o documento fornecido',()=>{
 const doc={elementos:{__canvas:{nome:'Teste',largura:640,altura:480},
  item:{tipo:'constructor',nome:'Entrada',x:0,y:0,largura:100,altura:100}}};
 examinarDocumento(doc);
 assert.equal(doc.elementos.item.tipo,'constructor');
});
