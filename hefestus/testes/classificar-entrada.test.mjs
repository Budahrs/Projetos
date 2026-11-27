import test from 'node:test';
import assert from 'node:assert/strict';
import {classificarEntrada} from '../js/aplicacao/classificarEntrada.js';

test('HTML declara fidelidade parcial sem prometer execução de scripts',()=>{
 const x=classificarEntrada({nome:'painel.html',mime:'text/html; charset=utf-8'});
 assert.equal(x.tipo,'html');assert.equal(x.modo,'nativo-parcial');
 assert.ok(x.avisos.some(a=>a.includes('subconjunto')));
});
test('MIME divergente não é convertido automaticamente',()=>{
 const x=classificarEntrada({nome:'painel.html',mime:'image/svg+xml'});
 assert.equal(x.tipo,'desconhecido');assert.equal(x.divergencia,true);
});
test('classifica recursos sem alegar conversão nativa',()=>{
 for(const [nome,tipo] of [['arte.svg','svg'],['dados.json','json'],['foto.png','imagem'],['som.wav','audio'],['app.js','javascript']]){
  assert.equal(classificarEntrada({nome}).tipo,tipo);
 }
});
test('rejeita conteúdo não textual e tipos inválidos',()=>{
 assert.throws(()=>classificarEntrada({nome:123}),TypeError);
 assert.throws(()=>classificarEntrada({conteudo:{}}),TypeError);
});
