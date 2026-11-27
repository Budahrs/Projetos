import test from 'node:test';
import assert from 'node:assert/strict';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {DocumentoAtivo} from '../js/aplicacao/documentoAtivo.js';
import {analisarHTMLNativo} from '../js/nucleo/htmlNativo.js';
const botao=(id,texto=id)=>'<button id="'+id+'" style="position:absolute;left:10px;top:10px;width:120px;height:40px">'+texto+'</button>';
const texto=id=>'<p id="'+id+'" style="position:absolute;left:200px;top:10px;width:120px;height:40px">'+id+'</p>';
const caixa=(id,conteudo)=>'<section id="'+id+'" style="position:absolute;left:0;top:0;width:600px;height:300px">'+conteudo+'</section>';
function criar(html=botao('a')+texto('b')){const n=new Nucleo(),d=new DocumentoAtivo(n),r=d.importarHTML({html});return {n,d,r};}
const escolhas=(plano,valor='fonte')=>Object.fromEntries(plano.conflitos.filter(c=>c.tipo==='remocao').map(c=>[c.chave,valor]));
function igualEstado(n,fn,codigo){const antes=JSON.stringify({doc:n.doc,h:n.projeto.historico,cursor:n.projeto.cursor});assert.throws(fn,e=>e.codigo===codigo);assert.equal(JSON.stringify({doc:n.doc,h:n.projeto.historico,cursor:n.projeto.cursor}),antes);}
test('adição antes dos elementos existentes mantém IDs e não muda o documento ao comparar',()=>{
 const {n,d,r}=criar(),antes=JSON.stringify(n.doc),p=d.prepararReimportacao(r.raiz,botao('novo')+botao('a')+texto('b'));
 assert.equal(p.adicoes.length,1);assert.equal(p.mapa.a,r.ids.a);assert.equal(p.mapa.b,r.ids.b);assert.notEqual(p.adicoes[0].id,r.ids.a);assert.equal(JSON.stringify(n.doc),antes);d.aplicarReimportacao(p);assert.equal(n.elemento(p.mapa.novo).rotulo,'novo');assert.equal(n.elemento(r.raiz).importacaoNativa.mapa.novo,p.mapa.novo);
});
test('container adicionado recebe filho existente sem trocar a identidade do filho',()=>{
 const {n,d,r}=criar(),p=d.prepararReimportacao(r.raiz,caixa('grupo',botao('a'))+texto('b'));d.aplicarReimportacao(p);assert.equal(n.elemento(r.ids.a).pai,p.mapa.grupo);assert.equal(n.elemento(p.mapa.grupo).tipo,'container');assert.equal(n.elemento(p.mapa.grupo).pai,r.raiz);
});
test('remoção exige escolha e fica em uma transação após salvar e reabrir',()=>{
 const {n,d,r}=criar(),p=d.prepararReimportacao(r.raiz,texto('b')),h=n.projeto.historico.length;assert.equal(p.remocoes[0].id,r.ids.a);igualEstado(n,()=>d.aplicarReimportacao(p),'CONFLITO');d.aplicarReimportacao(p,escolhas(p));assert.equal(n.projeto.historico.length,h+1);assert.equal(n.elemento(r.ids.a),undefined);assert.equal(n.elemento(r.raiz).importacaoNativa.mapa.a,undefined);assert.ok(!n.doc.elementos.__script.grafos.find(g=>g.origem==='designer').nos.some(no=>no.id===r.ids.a));const m=new Nucleo();m.abrirTexto(JSON.stringify(n.serializar()));assert.equal(m.projeto.historico.at(-1).pedido,'Atualizar HTML por comparação de três versões');m.desfazer();assert.equal(m.elemento(r.ids.a).rotulo,'a');m.refazer();assert.equal(m.elemento(r.ids.a),undefined);
});
test('Manter local conserva ajustes e desvincula; reaparecer não recaptura o objeto local',()=>{
 const {n,d,r}=criar();n.definir(r.ids.a,{rotulo:'Minha versão','estilo.raio':19},'Edição local');const p=d.prepararReimportacao(r.raiz,texto('b'));d.aplicarReimportacao(p,escolhas(p,'local'));assert.equal(n.elemento(r.ids.a).rotulo,'Minha versão');assert.equal(n.elemento(r.ids.a).estilo.raio,19);assert.equal(n.elemento(r.ids.a).origemHTML,undefined);assert.equal(n.elemento(r.ids.a).origemHTMLAnterior.chave,'a');const p2=d.prepararReimportacao(r.raiz,botao('a','Nova versão')+texto('b'));assert.notEqual(p2.mapa.a,r.ids.a);d.aplicarReimportacao(p2);assert.equal(n.elemento(r.ids.a).rotulo,'Minha versão');assert.equal(n.elemento(p2.mapa.a).rotulo,'Nova versão');
});
test('remoção de árvore inteira é coerente; manter filho impede apagar seu pai',()=>{
 const {n,d,r}=criar(caixa('grupo',botao('a'))+texto('b')),p=d.prepararReimportacao(r.raiz,texto('b'));igualEstado(n,()=>d.aplicarReimportacao(p,{...escolhas(p),['a|@remover']:'local'}),'ELEMENTO_REFERENCIADO');d.aplicarReimportacao(p,escolhas(p));assert.equal(n.elemento(r.ids.grupo),undefined);assert.equal(n.elemento(r.ids.a),undefined);assert.ok(n.elemento(r.ids.b));
});
test('referências de valor, código literal e chave impedem remoção sem alteração parcial',()=>{
 for(const modo of ['valor','codigo','chave']){const {n,d,r}=criar(),extra=modo==='valor'?{destino:r.ids.a}:modo==='codigo'?{codigo:{css:'#'+r.ids.a+'{opacity:0}'}}:{vinculos:{[r.ids.a]:true}},id=n.criar('texto',300,200,{texto:'Local',...extra}),p=d.prepararReimportacao(r.raiz,texto('b'));igualEstado(n,()=>d.aplicarReimportacao(p,escolhas(p)),'ELEMENTO_REFERENCIADO');assert.ok(n.elemento(id));}
});
test('fio autoral ligado ao nó derivado não é apagado pela sincronização',()=>{
 const {n,d,r}=criar();n.comando({texto:'Fio autoral',alvos:['__script'],propriedades:['*']},doc=>doc.elementos.__script.grafos.find(g=>g.origem==='designer').ligacoes.push({id:'fio-autoral',de:r.ids.a,sp:'r',para:r.raiz,ep:'pai'}));const p=d.prepararReimportacao(r.raiz,texto('b'));igualEstado(n,()=>d.aplicarReimportacao(p,escolhas(p)),'ELEMENTO_REFERENCIADO');assert.ok(n.doc.elementos.__script.grafos.find(g=>g.origem==='designer').ligacoes.some(l=>l.id==='fio-autoral'));
});
test('identidades automáticas aceitam propriedades mas não mudanças estruturais',()=>{
 const {n,d,r}=criar('<button>Antes</button>');d.aplicarReimportacao(d.prepararReimportacao(r.raiz,'<button>Depois</button>'));assert.equal(n.elemento(r.ids['html-1']).rotulo,'Depois');igualEstado(n,()=>d.prepararReimportacao(r.raiz,'<button>Depois</button>'+texto('novo')),'IDENTIDADE_ESTRUTURAL');
});
test('base antiga sem marcador usa a fonte preservada para conferir IDs explícitos',()=>{
 const {n,d,r}=criar();for(const e of n.elemento(r.raiz).importacaoNativa.base.elementos)delete e.identidadeExplicita;const p=d.prepararReimportacao(r.raiz,botao('novo')+botao('a')+texto('b'));d.aplicarReimportacao(p);assert.ok(n.elemento(p.mapa.novo));
});
test('IDs novos não reutilizam IDs retirados na mesma operação e plano alterado é recalculado',()=>{
 const {n,d,r}=criar(),p=d.prepararReimportacao(r.raiz,botao('novo')+texto('b'));assert.notEqual(p.mapa.novo,r.ids.a);const novo=p.mapa.novo;p.adicoes=[];p.alteracoes=[{id:r.ids.b,campo:'texto',fonte:'Dado inventado'}];p.mapa={};d.aplicarReimportacao(p,escolhas(p));assert.equal(n.elemento(novo).rotulo,'novo');assert.equal(n.elemento(r.ids.b).texto,'b');
});
test('identidades reservadas não corrompem o mapa de importação',()=>{
 for(const id of ['__proto__','constructor','prototype'])assert.throws(()=>analisarHTMLNativo(botao(id)),/reservada/);
});
test('novo parentesco que colide com escolha local não cria ciclo',()=>{
 const {n,d,r}=criar(caixa('a',botao('x'))+caixa('b',''));n.definir(r.ids.a,{pai:r.ids.b},'Agrupar local');const p=d.prepararReimportacao(r.raiz,caixa('a',botao('x')+caixa('b','')));igualEstado(n,()=>d.aplicarReimportacao(p),'HIERARQUIA_INVALIDA');
});
