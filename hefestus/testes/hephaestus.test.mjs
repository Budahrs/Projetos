import {test} from 'node:test';
import assert from 'node:assert/strict';
import {iniciarAreas,trocarArea,ABAS_DESIGNER,ABAS_SCRIPT} from '../js/app/areasHephaestus.js';
import {abasHephaestus} from '../js/ui/abasHephaestus.js';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {adicionarPontosCraft,suavizarCraft,removerRedundantesCraft} from '../js/nucleo/craft/caminhos.js';
import {lerCaminho,segmentos} from '../js/nucleo/vetor.js';
import {gerarSVGDesigner,contextoSelecao} from '../js/nucleo/designerHephaestus.js';
import {NOS,scriptParaRuntime,executarScript} from '../js/nucleo/visualScript.js';
test('áreas: alternância preserva documento, histórico e abas individuais',()=>{
 const n=new Nucleo();n.criar('botao',10,20);const antes=JSON.stringify({doc:n.doc,historico:n.historico()});const ui=iniciarAreas({});ui.aba='aparencia';trocarArea(ui,'visual-script');assert.equal(ui.hibrido,true);assert.equal(ui.areaAtiva,'visual-script');ui.aba='logica';trocarArea(ui,'designer');assert.equal(ui.aba,'aparencia');trocarArea(ui,'forja');assert.equal(ui.aba,'logica');assert.equal(JSON.stringify({doc:n.doc,historico:n.historico()}),antes);
});
test('Ribbon: sete abas no Designer e seis no Visual Script, sem abas extras',()=>{
 const app={n:new Nucleo(),ui:iniciarAreas({})};
 assert.deepEqual(abasHephaestus(app).map(a=>a.id),ABAS_DESIGNER);
 trocarArea(app.ui,'visual-script');const abas=abasHephaestus(app);
 assert.deepEqual(abas.map(a=>a.id),ABAS_SCRIPT);
 for(const a of abas)for(const g of a.grupos)for(const c of g.cmds)if(c.id.startsWith('no-'))assert.ok(NOS[c.id.slice(3)],c.id);
});
test('conversão vetorial conserva ID, eventos e referência no grafo',()=>{
 const n=new Nucleo(),id=n.criar('caixa',10,20,{eventos:[{tipo:'onClick',dispara:'clicado',acao:'',alvo:''}]});
 const eventos=structuredClone(n.elemento(id).eventos);const ids=n.converterEmVetor([id]);
 assert.deepEqual(ids,[id]);assert.equal(n.elemento(id).tipo,'forma');assert.deepEqual(n.elemento(id).eventos,eventos);
 assert.ok(n.doc.elementos.__script.grafos.find(g=>g.origem==='designer').nos.some(x=>x.id===id&&x.v.alvo===id));n.desfazer();assert.equal(n.elemento(id).tipo,'caixa');n.refazer();assert.equal(n.elemento(id).tipo,'forma');
});
test('Craft: pontos médios preservam uma curva Bézier e não alteram o argumento',()=>{
 const cs=lerCaminho('M0 0 C0 100 100 100 100 0'),antes=JSON.stringify(cs),r=adicionarPontosCraft(cs);
 assert.equal(r[0].nos.length,3);assert.equal(r[0].nos[1].x,50);assert.equal(r[0].nos[1].y,75);assert.equal(JSON.stringify(cs),antes);
 const rect=adicionarPontosCraft(lerCaminho('M0 0L100 0L100 100L0 100Z'));assert.equal(rect[0].nos.length,8);assert.equal(rect[0].fechado,true);
});
test('Craft: suavização move alças, mantém âncoras e extremos do caminho aberto',()=>{
 const cs=lerCaminho('M0 0L50 100L100 0'),r=suavizarCraft(cs,1);
 assert.deepEqual(r[0].nos.map(n=>[n.x,n.y]),cs[0].nos.map(n=>[n.x,n.y]));assert.equal(r[0].nos[0].a,null);assert.equal(r[0].nos[2].b,null);assert.ok(r[0].nos[1].a[0]<50);assert.ok(r[0].nos[1].b[0]>50);assert.equal(cs[0].nos[1].a,null);assert.deepEqual(suavizarCraft(cs,0)[0].nos.map(n=>[n.x,n.y]),cs[0].nos.map(n=>[n.x,n.y]));
});
test('Craft: redundância colinear é removida sem apagar curvas ou voltar no caminho',()=>{
 const cs=lerCaminho('M0 0L25 0L50 0L100 0');assert.equal(removerRedundantesCraft(cs)[0].nos.length,2);assert.equal(cs[0].nos.length,4);
 const curva=lerCaminho('M0 0C20 10 30 50 50 0C60 20 70 30 100 0');assert.deepEqual(removerRedundantesCraft(curva),curva);
 const volta=lerCaminho('M0 0L100 0L50 0');assert.equal(removerRedundantesCraft(volta)[0].nos.length,3);
});
test('SVG: caminhos e textos saem como vetores, com escape de conteúdo',()=>{
 const n=new Nucleo();const id=n.criar('forma',10,20,{forma:'estrela',lados:5});n.criar('texto',20,30,{texto:'<script>alert(1)</script>'});const r=gerarSVGDesigner(n.doc);
 assert.match(r.svg,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);assert.match(r.svg,/<path/);assert.match(r.svg,/&lt;script&gt;/);assert.doesNotMatch(r.svg,/<script>/);assert.ok(r.svg.includes(id));n.selecionar(id);assert.match(contextoSelecao(n),/pontos/);
});
test('Visual Script: Ao arrastar entrega deltas e remove ouvintes ao parar',()=>{
 const ant={window:globalThis.window,document:globalThis.document,CSS:globalThis.CSS};globalThis.window=new EventTarget();globalThis.document=new EventTarget();globalThis.CSS={escape:s=>s};
 const el=new EventTarget(),logs=[],root={querySelector:s=>s==='#a'?el:null};
 const script={grafos:[{id:'g',nome:'G',nos:[{id:'drag',tipo:'ev.arrastar',v:{alvo:'a'}},{id:'log',tipo:'d.log',v:{nivel:'info'}}],ligacoes:[{de:'drag',sp:'exec',para:'log',ep:'exec'},{de:'drag',sp:'x',para:'log',ep:'mensagem'}]}],variaveis:[]};
 const stop=executarScript(root,scriptParaRuntime(script),{aoDepurar:d=>{if(d.tipo==='log')logs.push(d.msg);}});
 const ev=(tipo,x,y)=>{const e=new Event(tipo);Object.assign(e,{button:0,pointerId:1,clientX:x,clientY:y});return e;};
 try{el.dispatchEvent(ev('pointerdown',5,6));document.dispatchEvent(ev('pointermove',25,30));assert.deepEqual(logs,['20']);document.dispatchEvent(ev('pointerup',25,30));document.dispatchEvent(ev('pointermove',40,50));assert.equal(logs.length,1);stop();el.dispatchEvent(ev('pointerdown',1,1));document.dispatchEvent(ev('pointermove',3,3));assert.equal(logs.length,1);}finally{stop();Object.assign(globalThis,ant);}
});

test('conversão de botão conserva também o texto visível',()=>{const n=new Nucleo();const id=n.criar('botao',0,0,{rotulo:'Confirmar'});n.converterEmVetor([id]);assert.equal(n.elemento(id).texto,'Confirmar');assert.match(n.html(),/Confirmar/);});
