import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {criarZIP,lerZIP} from '../js/nucleo/zip.js';
import {documentosProjeto} from '../js/nucleo/documentacaoProjeto.js';
import {gerarPacoteWindows} from '../js/nucleo/pacoteWindows.js';
function exemplo(){const n=new Nucleo();n.novo(false);const a=n.criar('caixa',100,100),b=n.criar('caixa',300,100);const g=n.agruparEmContainer([a,b]);return {n,a,b,g};}
test('grupo move pelo painel e pelo núcleo inteiro; desfazer restaura filhos',()=>{
 const {n,a,b,g}=exemplo(),antes=JSON.parse(JSON.stringify(n.doc));const x=n.elemento(g).x;
 n.definir(g,{x:x+25},'Mover grupo');assert.equal(n.elemento(a).x,antes.elementos[a].x+25);assert.equal(n.elemento(b).x,antes.elementos[b].x+25);
 n.desfazer();assert.equal(n.elemento(a).x,antes.elementos[a].x);
 n.mover(g,x+50,n.elemento(g).y);assert.equal(n.elemento(b).x,antes.elementos[b].x+50);
});
test('redimensionar grupo livre transforma os filhos e mantém proporções',()=>{
 const {n,a,b,g}=exemplo(),grupo={...n.elemento(g)},filho={...n.elemento(b)},largura=n.elemento(a).largura;
 n.geometria(g,{largura:grupo.largura*2,altura:grupo.altura*2});
 assert.equal(n.elemento(a).largura,largura*2);assert.equal(n.elemento(b).x,grupo.x+(filho.x-grupo.x)*2);
 n.desfazer();assert.equal(n.elemento(b).x,filho.x);
});
test('arraste não move duas vezes e editar filho não desagrupa',()=>{
 const {n,a,g}=exemplo(),x=n.elemento(a).x;n.moverEncaixando([g],40,0);assert.equal(n.elemento(a).x,x+40);
 n.moverEncaixando([a],2000,0);assert.equal(n.elemento(a).pai,g);
});
test('pacote salvo reabre o documento e mantém documentação com ferramentas separadas',async()=>{
 const {n}=exemplo();let arquivo;n.baixar=async(nome,bytes)=>{arquivo={name:nome,arrayBuffer:async()=>bytes};return 'salvo';};await n.salvarPacoteDocumentado();
 const arquivos=lerZIP(await arquivo.arrayBuffer());assert.ok(arquivos['documentos/arquitetura.txt']);assert.ok(arquivos['documentos/ferramentas/runtime.txt']);
 const contexto=JSON.parse(new TextDecoder().decode(arquivos['documentos/contexto_ia.json']));assert.deepEqual(contexto.documento,n.doc);assert.equal(contexto.repertorio.length,6);
 const m=new Nucleo();await m.abrirArquivo(arquivo);assert.deepEqual(m.doc,n.doc);
 const docs=documentosProjeto(n.doc);assert.ok(!docs['documentos/nucleo.txt'].includes('function ligarRuntime'));
 const pacote=gerarPacoteWindows(n.doc,{nome:'Meu App'});assert.ok(lerZIP(pacote.bytes)['documentos/nucleo.txt']);
});
test('leitor recusa corrupção e truncamento antes de restaurar projeto',()=>{
 const bytes=criarZIP({'projeto.hefestus.json':'{}'});const corrompido=bytes.slice();corrompido[52]^=1;assert.throws(()=>lerZIP(corrompido));assert.throws(()=>lerZIP(bytes.subarray(0,20)));
});
test('HTML e componentes exportados incluem a pasta documentos',async()=>{
 const {n}=exemplo();let bytes;n.baixar=async(nome,conteudo,tipo)=>{assert.ok(nome.endsWith('.zip'));assert.equal(tipo,'application/zip');bytes=conteudo;return 'salvo';};
 await n.exportarHTML();assert.ok(lerZIP(bytes)['documentos/contexto_ia.json']);
 await n.exportarArtefato('react');assert.ok(lerZIP(bytes)['documentos/ferramentas/motor_menus.txt']);
 n.exportarProjetoSeparado();const nomes=Object.keys(lerZIP(bytes));assert.ok(nomes.some(n=>n.endsWith('.historico.jsonl')));assert.ok(nomes.includes('documentos/arquitetura.txt'));
});
