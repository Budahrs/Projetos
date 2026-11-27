import {test} from 'node:test';
import assert from 'node:assert/strict';
import {juntarCaminhosCraft,dividirGradeCraft} from '../js/nucleo/craft/caminhos.js';
import {lerCaminho,limitesDe} from '../js/nucleo/vetor.js';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {NOS,scriptParaRuntime,executarScript} from '../js/nucleo/visualScript.js';
import {iconeHephaestus,ICONES_HP} from '../js/ui/iconesHephaestus.js';

test('Craft join: endpoints reversed, merged with Bézier handles and no input mutation',()=>{
 const cs=lerCaminho('M0 0 C2 0 8 0 10 0 M20 0 C18 5 12 5 10 0'),before=structuredClone(cs),r=juntarCaminhosCraft(cs,0.01);
 assert.equal(r.length,1);assert.equal(r[0].fechado,false);assert.equal(r[0].nos.length,3);
 assert.deepEqual(r[0].nos.map(n=>[n.x,n.y]),[[0,0],[10,0],[20,0]]);
 assert.deepEqual(r[0].nos[1].a,[8,0]);assert.deepEqual(r[0].nos[1].b,[12,5]);assert.deepEqual(cs,before);
});
test('Craft join: a single open path closes, independent closed paths pass through',()=>{
 const cs=lerCaminho('M0 0L20 0L20 20Z M50 0L70 0L70 20');const r=juntarCaminhosCraft(cs);assert.equal(r.length,2);assert.ok(r.every(c=>c.fechado));assert.deepEqual(r[0],cs[0]);
 const duplicate=lerCaminho('M0 0L10 0L10 10L0 0');assert.equal(juntarCaminhosCraft(duplicate)[0].nos.length,3);
});
test('Craft split grid: exact bounds, gaps, invalid dimensions and ID/history contract',()=>{
 const cs=dividirGradeCraft({x:10,y:20,largura:100,altura:60},2,3,5);assert.equal(cs.length,6);
 assert.deepEqual(limitesDe(cs),{x:10,y:20,largura:100,altura:60});assert.equal(cs[1].nos[0].x-cs[0].nos[1].x,5);
 for(const args of [[0,2,0],[2,0,0],[2.5,2,0],[2,2,1000],[2,2,-1]])assert.deepEqual(dividirGradeCraft({x:0,y:0,largura:100,altura:100},...args),[]);
 const n=new Nucleo(),id=n.criar('caixa',10,20,{largura:100,altura:60});const before=structuredClone(n.elemento(id));n.definirVetor(id,cs,'Craft grid');assert.equal(n.elemento(id).forma,'vetor');assert.ok(n.doc.elementos.__script.grafos.find(g=>g.origem==='designer').nos.some(no=>no.v.alvo===id));n.desfazer();assert.deepEqual(n.elemento(id),before);
});
test('Uploaded icon catalogue: accessible SVG markup, aliases and safe unknown fallback',()=>{
 assert.ok(ICONES_HP.size>200);for(const name of ['caneta','boolUnir','fio-dinamico','anotacao']){const svg=iconeHephaestus(name,22);assert.match(svg,/viewBox="0 0 24 24"/);assert.match(svg,/aria-hidden="true"/);assert.doesNotMatch(svg,/<script|onload=/);}
 assert.equal(iconeHephaestus('missing-tool'),null);
});
function environment(fn){const before={window:globalThis.window,document:globalThis.document,CSS:globalThis.CSS,CustomEvent:globalThis.CustomEvent};
 const attrs=new Map(),el=new EventTarget();el.style={position:'absolute',top:'12px'};el.getAttribute=k=>attrs.has(k)?attrs.get(k):null;el.setAttribute=(k,v)=>attrs.set(k,v);el.removeAttribute=k=>attrs.delete(k);
 const window=new EventTarget();Object.assign(window,{scrollX:40,scrollY:85});const document=new EventTarget();document.body={style:{overflow:'auto'}};
 Object.assign(globalThis,{window,document,CSS:{escape:s=>s},CustomEvent:class extends Event{constructor(t,opts){super(t,opts);this.detail=opts.detail;}}});
 try{fn({el,window,document,root:{querySelector:s=>s==='#a'?el:null}});}finally{Object.assign(globalThis,before);}
}
const script=(nos,ligacoes)=>scriptParaRuntime({variaveis:[],grafos:[{id:'g',nos,ligacoes}]});
const wire=(a,b,sp='exec',ep='exec')=>({de:a,para:b,sp,ep});
test('Runtime: press ignores secondary mouse button, scroll supplies coordinates, stop detaches',()=>environment(({el,window,root})=>{
 const logs=[];const stop=executarScript(root,script([{id:'press',tipo:'ev.pressionar',v:{alvo:'a'}},{id:'scroll',tipo:'ev.rolar',v:{}},{id:'log',tipo:'d.log',v:{mensagem:'press',nivel:'info'}},{id:'position',tipo:'d.log',v:{nivel:'info'}}],[wire('press','log'),wire('scroll','position'),wire('scroll','position','y','mensagem')]),{aoDepurar:d=>{if(d.tipo==='log')logs.push(d.msg);}});
 const press=b=>{const e=new Event('pointerdown');e.button=b;el.dispatchEvent(e);};press(2);assert.deepEqual(logs,[]);press(0);window.dispatchEvent(new Event('scroll'));assert.deepEqual(logs,['press','85']);stop();press(0);window.dispatchEvent(new Event('scroll'));assert.equal(logs.length,2);
}));
test('Runtime: state, sticky and concurrent scroll locks restore original styles on stop',()=>environment(({el,document,root})=>{
 const nodes=[{id:'start',tipo:'ev.iniciar',v:{}},{id:'lock1',tipo:'ui.scrollLock',v:{ativo:true,trava:'menu'}},{id:'lock2',tipo:'ui.scrollLock',v:{ativo:true,trava:'modal'}},{id:'sticky',tipo:'ui.sticky',v:{alvo:'a',ativo:true,topo:7}},{id:'state',tipo:'ui.estado',v:{alvo:'a',estado:'cheio'}}];
 const errors=[],stop=executarScript(root,script(nodes,[wire('start','lock1'),wire('lock1','lock2'),wire('lock2','sticky'),wire('sticky','state')]),{aoDepurar:d=>{if(d.nivel==='erro')errors.push(d);}});
 assert.deepEqual(errors,[]);assert.equal(document.body.style.overflow,'hidden');assert.equal(el.style.position,'sticky');assert.equal(el.style.top,'7px');assert.equal(el.getAttribute('data-hp-state'),'cheio');stop();assert.equal(document.body.style.overflow,'auto');assert.equal(el.style.position,'absolute');assert.equal(el.style.top,'12px');assert.equal(el.getAttribute('data-hp-state'),null);
}));
test('Runtime: a different node releases a named scroll lock without releasing other locks',()=>environment(({el,document,root})=>{
 const nodes=[{id:'start',tipo:'ev.iniciar',v:{}},{id:'menu',tipo:'ui.scrollLock',v:{ativo:true,trava:'menu'}},{id:'modal',tipo:'ui.scrollLock',v:{ativo:true,trava:'modal'}},{id:'releaseMenu',tipo:'ui.scrollLock',v:{ativo:false,trava:'menu'}},{id:'click',tipo:'ev.clique',v:{alvo:'a'}},{id:'releaseModal',tipo:'ui.scrollLock',v:{ativo:false,trava:'modal'}}];
 const stop=executarScript(root,script(nodes,[wire('start','menu'),wire('menu','modal'),wire('modal','releaseMenu'),wire('click','releaseModal')]));assert.equal(document.body.style.overflow,'hidden');el.dispatchEvent(new Event('click'));assert.equal(document.body.style.overflow,'auto');stop();
}));
