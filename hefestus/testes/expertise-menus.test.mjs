import {test} from 'node:test';import assert from 'node:assert/strict';
import {motorMenus} from '../js/nucleo/motorMenus.js';
import {recomendarMenu,auditarMenus,REGRAS_MENUS} from '../js/nucleo/expertiseMenus.js';
import {interpretar} from '../js/agente/local.js';
import {criarFerramentas} from '../js/agente/ferramentas.js';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {MODELOS} from '../js/nucleo/modelos.js';
import {gerarHTML,compilar} from '../js/nucleo/compilador.js';
import {dadosRuntime} from '../js/nucleo/runtime.js';
import {Script} from 'node:vm';

test('posicionamento troca lado, limita dimensões e respeita bordas e RTL',()=>{
 const {posicionar}=motorMenus();
 const p=posicionar({left:880,right:920,top:600,bottom:630},300,400,1000,700,{lado:'direita'});
 assert.equal(p.lado,'esquerda');assert.ok(p.x>=8&&p.x+p.largura<=992);assert.ok(p.y+p.altura<=692);
 const cima=posicionar({left:100,right:200,top:600,bottom:630},200,250,1000,700);
 assert.equal(cima.lado,'cima');assert.ok(cima.y<600);
 const gigante=posicionar({left:0,right:40,top:0,bottom:40},2000,2000,390,600);
 assert.equal(gigante.largura,374);assert.ok(gigante.y+gigante.altura<=592);
 const rtl=posicionar({left:400,right:500,top:20,bottom:40},200,100,1000,700,{rtl:true});assert.equal(rtl.x,300);
});
test('intenção do submenu mantém diagonal e recusa movimento oposto ou indefinido',()=>{
 const {corredor}=motorMenus(),rect={left:200,right:400,top:60,bottom:300};
 assert.equal(corredor({x:150,y:130},{x:100,y:100},rect),true);
 assert.equal(corredor({x:80,y:130},{x:100,y:100},rect),false);
 assert.equal(corredor({x:150,y:500},{x:100,y:100},rect),false);
 assert.equal(corredor({x:300,y:200},{x:100,y:100},rect),true);
 assert.equal(corredor(null,null,rect),false);
});
test('medições próprias não provocam novo passe; fontes e alterações externas invalidam',()=>{
 const {medicaoNecessaria,planejar}=motorMenus();
 assert.equal(medicaoNecessaria(800,800),false);assert.equal(medicaoNecessaria(800,800.1),false);
 assert.equal(medicaoNecessaria(800,799),true);assert.equal(medicaoNecessaria(800,800,true),true);
 const gs=[{id:'a',larguras:[300,150,72]},{id:'b',larguras:[200,100,72]}];
 for(const w of [63,64,65,199,200,201,499,500,501])assert.deepEqual(planejar(gs,w),planejar(gs,w));
});
function ambienteBarra(rtl=false){
 const doc={activeElement:null,defaultView:{getComputedStyle:()=>({visibility:'visible',direction:rtl?'rtl':'ltr'})}};
 const criar=(disabled=false)=>({disabled,hidden:false,ownerDocument:doc,attrs:new Map(),getClientRects:()=>[{}],getAttribute(k){return this.attrs.get(k)??null;},setAttribute(k,v){this.attrs.set(k,v);},removeAttribute(k){this.attrs.delete(k);},focus(){doc.activeElement=this;},contains(e){return e===this;},closest(){return null;}});
 const els=[criar(),criar(true),criar()],eventos=new Map();
 const host={ownerDocument:doc,querySelectorAll:()=>els,addEventListener:(t,f)=>eventos.set(t,f),removeEventListener:t=>eventos.delete(t)};
 return {doc,els,host,emit(key,target=doc.activeElement){const e={key,target,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){}};eventos.get('keydown')(e);return e;}};
}
test('toolbar: um ponto de Tab, setas ignoram botão desabilitado, Home/End, RTL e cleanup',()=>{
 const a=ambienteBarra(),barra=motorMenus().tecladoBarra(a.host);
 assert.equal(a.els[0].tabIndex,0);assert.equal(a.els[2].tabIndex,-1);
 a.els[0].focus();a.emit('ArrowRight');assert.equal(a.doc.activeElement,a.els[2]);
 a.emit('Home');assert.equal(a.doc.activeElement,a.els[0]);a.emit('End');assert.equal(a.doc.activeElement,a.els[2]);
 assert.equal(a.emit('Tab').defaultPrevented,false);barra.destruir();
 const b=ambienteBarra(true);motorMenus().tecladoBarra(b.host);b.els[0].focus();b.emit('ArrowLeft');assert.equal(b.doc.activeElement,b.els[2]);
});
test('expertise recomenda modelos existentes e separa os tipos de menu',()=>{
 const casos=[['navegação entre páginas','sidebar'],['edição com muitos comandos','ribbon'],['botão direito contextual','contexto'],['menu circular radial','radial'],['menu simples','menubar']];
 for(const [texto,tipo]of casos){const p=recomendarMenu(texto);assert.equal(p.tipo,tipo);assert.ok(MODELOS.some(m=>m.id===p.modelo));assert.ok(p.regras.every(id=>REGRAS_MENUS.some(r=>r.id===id)));}
 assert.equal(new Set(REGRAS_MENUS.map(r=>r.id)).size,REGRAS_MENUS.length);
});
test('agente planeja sem alterar documento e cria sidebar pelo pedido adaptativo',()=>{
 const n=new Nucleo();n.novo(false);const antes=JSON.stringify(n.doc);
 const p=interpretar('planejar menu para navegação entre páginas',n);assert.equal(p.acoes.length,0);assert.match(p.resposta,/sidebar/);
 assert.equal(JSON.stringify(n.doc),antes);
 const criacao=interpretar('crie uma barra lateral adaptativa',n);assert.equal(criacao.acoes[0].entrada.modelo,'sidebarAdaptativa');
 const ferramenta=criarFerramentas(n,{}).find(t=>t.name==='planejar_menu');assert.equal(ferramenta.execute({descricao:'ribbon de edição'}).tipo,'ribbon');
});
test('auditoria ensina contratos e correções são reversíveis pelo núcleo',()=>{
 const els=[{id:'a',nome:'Menu misturado',tipo:'container',menu:{sidebar:true,adaptativo:true},layout:{modo:'coluna'}}];
 const itens=auditarMenus(els);assert.ok(itens.some(i=>i.regra==='menu-contrato'));assert.ok(itens.some(i=>i.regra==='menu-layout'));
 assert.equal(auditarMenus(els,new Set(['outro'])).length,0);
 const n=new Nucleo();n.novo(false);const id=n.criar('container',0,0);n.definir(id,{'menu.adaptativo':true,'layout.modo':'coluna'},'Faixa');
 const problemas=n.auditar().filter(p=>p.regra==='menu-layout');assert.equal(problemas.length,1);
 n.corrigirAuditoria(problemas);assert.equal(n.elemento(id).layout.modo,'linha');n.desfazer();assert.equal(n.elemento(id).layout.modo,'coluna');
});
test('exportação carrega teclado, posicionamento e intenção sem referências externas faltantes',()=>{
 const n=new Nucleo();n.novo(false);n.inserirModelo(MODELOS.find(m=>m.id==='faixaAxiom'));
 const html=gerarHTML(n.doc);for(const [,js]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(js);
 assert.ok(html.includes('function protegerSubmenu'));assert.ok(html.includes('function tecladoBarra'));
 assert.ok(dadosRuntime(compilar(n.doc).elementos).menusAdaptativos.length);
});

