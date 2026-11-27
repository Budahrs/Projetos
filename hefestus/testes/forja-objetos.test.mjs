import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Nucleo } from '../js/nucleo/nucleo.js';
import { MODELOS } from '../js/nucleo/modelos.js';
import { sincronizarObjetosForja } from '../js/nucleo/forjaObjetos.js';
import { executarScript, scriptParaRuntime, validarScript } from '../js/nucleo/visualScript.js';
const grafo=n=>n.doc.elementos.__script.grafos.find(g=>g.origem==='designer');
test('Forja: criação, renomeação, exclusão, desfazer e reabertura preservam os IDs dos objetos',()=>{
 const n=new Nucleo(),id=n.criar('botao',10,20);
 assert.equal(grafo(n).nos.find(x=>x.id===id).v.alvo,id);
 n.definir(id,{nome:'Confirmar'},'Renomear botão');
 assert.equal(grafo(n).nos.find(x=>x.id===id).titulo,'Confirmar');
 const node=grafo(n).nos.find(x=>x.id===id);node.x=777;
 const snapshot=n.serializar();const m=new Nucleo();m.restaurar(snapshot);
 assert.equal(grafo(m).nos.find(x=>x.id===id).x,777);
 n.remover(id);assert.ok(!grafo(n).nos.some(x=>x.id===id));
 n.desfazer();assert.ok(grafo(n).nos.some(x=>x.id===id));
 n.refazer();assert.ok(!grafo(n).nos.some(x=>x.id===id));
});
test('Forja: todos os componentes inseridos por modelo têm nó e fios de hierarquia',()=>{
 const n=new Nucleo();const ids=n.inserirModelo(MODELOS.find(m=>m.id==='barraApp'),0,0);
 assert.ok(ids.length>1);const g=grafo(n);
 for(const id of ids) assert.ok(g.nos.some(x=>x.id===id));
 for(const e of n.elementos().filter(e=>e.pai)) assert.ok(g.ligacoes.some(l=>l.hierarquia&&l.para===e.id&&l.de===e.pai));
 assert.deepEqual(validarScript(n.doc.elementos.__script,n.elementos().map(e=>e.id)).filter(p=>p.nivel==='erro'),[]);
});
test('Forja: composição do formulário gera e remove nós junto com seus componentes',()=>{
 const n=new Nucleo();const {id,ok}=n.adicionarItemConstrutor('caixa');assert.ok(ok);
 const ids=n.elementos().filter(e=>e.construtor===id).map(e=>e.id);assert.ok(ids.length>=2);
 for(const x of ids)assert.ok(grafo(n).nos.some(no=>no.id===x));
 n.atualizarConstrutor(s=>{s.itens=[];},'Remover componente',id,{remover:true});
 for(const x of ids)assert.ok(!grafo(n).nos.some(no=>no.id===x));
 n.desfazer();for(const x of ids)assert.ok(grafo(n).nos.some(no=>no.id===x));
});
test('Forja: sincronização preserva lógica, posição e conexões manuais sem duplicar nós',()=>{
 const d={elementos:{a:{tipo:'container',nome:'Grupo'},b:{tipo:'botao',nome:'Botão',pai:'a'}}};
 sincronizarObjetosForja(d);const g=d.elementos.__script.grafos.find(g=>g.origem==='designer');
 g.nos[0].x=555;g.nos.push({id:'log',tipo:'d.log',v:{mensagem:'Oi'}});g.ligacoes.push({id:'l',de:'b',sp:'exec',para:'log',ep:'exec'});
 for(let i=0;i<4;i++)sincronizarObjetosForja(d);
 assert.equal(g.nos.length,3);assert.equal(g.nos[0].x,555);assert.equal(g.ligacoes.filter(l=>l.hierarquia).length,1);assert.ok(g.ligacoes.some(l=>l.id==='l'));
 delete d.elementos.b;sincronizarObjetosForja(d);assert.ok(!g.ligacoes.some(l=>l.de==='b'||l.para==='b'));assert.ok(g.nos.some(n=>n.id==='log'));
});
test('Forja runtime: clique no nó de objeto aciona porta de ocultar de outro objeto uma única vez',()=>{
 const anterior={window:globalThis.window,document:globalThis.document,CSS:globalThis.CSS};
 globalThis.window=new EventTarget();globalThis.document=new EventTarget();globalThis.CSS={escape:s=>s};
 const a=new EventTarget(),b=new EventTarget();b.hidden=false;
 const raiz={querySelector:s=>s==='#a'?a:s==='#b'?b:null};
 const doc={elementos:{a:{tipo:'botao',nome:'Origem'},b:{tipo:'caixa',nome:'Destino'}}};sincronizarObjetosForja(doc);
 const s=doc.elementos.__script,g=s.grafos.find(g=>g.origem==='designer');g.ligacoes.push({id:'l',de:'a',sp:'exec',para:'b',ep:'fechar'});
 let vezes=0;const dispose=executarScript(raiz,scriptParaRuntime(s),{aoDepurar:d=>{if(d.tipo==='no'&&d.no==='b')vezes++;}});
 try {a.dispatchEvent(new Event('click'));assert.equal(b.hidden,true);assert.equal(vezes,1);dispose();b.hidden=false;a.dispatchEvent(new Event('click'));assert.equal(b.hidden,false);}
 finally {dispose();Object.assign(globalThis,anterior);}
});
test('Forja: exportação inclui runtime dos nós e preserva runtime de menus',()=>{
 const n=new Nucleo();n.criar('botao',0,0);const html=n.html();assert.match(html,/"ui.objeto"/);assert.match(html,/const motorMenus/);assert.match(html,/function executarScript/);
});
