import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {Script,createContext} from 'node:vm';
import {analisarHTMLImportado,prepararHTMLImportado,documentoHTMLImportado} from '../js/nucleo/importarHTML.js';
import {Nucleo} from '../js/nucleo/nucleo.js';import {marcacaoCompleta} from '../js/nucleo/exportar.js';import {compilar,gerarHTML} from '../js/nucleo/compilador.js';
import {gerarReact,gerarVue,gerarWebComponent} from '../js/nucleo/artefatos.js';
import {arquivosAplicativo} from '../js/nucleo/pacoteWindows.js';
const exemplo=readFileSync(new URL('./fixtures/botao-engrenagem.html',import.meta.url),'utf8');
const carrossel=readFileSync(new URL('./fixtures/carrossel-animado.html',import.meta.url),'utf8');

test('fundo da página importada é transparente por padrão e pode ser preservado',()=>{
 const codigo=prepararHTMLImportado({html:'<style>body{background:black}</style><button>Original</button>'}).codigo;
 const documento=documentoHTMLImportado(codigo);
 assert.ok(documento.includes('body{background:black}'));
 assert.ok(documento.includes('background:transparent!important'));
 assert.ok(documento.indexOf('data-hefestus-fundo')>documento.indexOf('body{background:black}'));
 assert.ok(!documentoHTMLImportado({...codigo,preservarFundoPagina:true}).includes('data-hefestus-fundo'));
});

test('entende a estrutura do exemplo sem executá-lo e preserva todo o código',()=>{
 const a=analisarHTMLImportado(exemplo);assert.equal(a.titulo,'Botão Engrenagem Premium');assert.equal(a.botoes,1);assert.equal(a.menus,1);assert.equal(a.svg,1);assert.equal(a.links,9);assert.ok(a.eventos.includes('click'));assert.ok(a.eventos.includes('keydown'));assert.equal(a.recursosExternos.length,1);
 const p=prepararHTMLImportado({html:exemplo,nome:a.titulo});assert.equal(p.codigo.html,exemplo);assert.equal(p.codigo.isolado,true);assert.equal(p.codigo.recursosExternos,false);
});
test('HTML inválido como entrada, limites e dimensões não mudam o projeto',()=>{
 for(const entrada of [{html:''},{html:23},{html:'x',largura:0},{html:'x',altura:Infinity},{html:'x'.repeat(2*1024*1024+1)}])assert.throws(()=>prepararHTMLImportado(entrada));
 const n=new Nucleo();n.novo(false);const antes=JSON.stringify(n.doc);assert.throws(()=>n.importarHTML({html:''}));assert.equal(JSON.stringify(n.doc),antes);
});
test('criar artefato é desfazível, reabre com código e pode ser reutilizado como modelo',()=>{
 const n=new Nucleo();n.novo(false);const id=n.importarHTML({html:exemplo,nome:'Engrenagem'});assert.ok(id);assert.equal(n.elemento(id).codigo.html,exemplo);
 const modelo=n.modeloDaSelecao([id],'Engrenagem reutilizável');assert.ok(JSON.stringify(modelo).includes('gearBtn'));
 const m=new Nucleo();m.restaurar(n.serializar());assert.equal(m.elemento(id).codigo.isolado,true);assert.equal(m.elemento(id).codigo.html,exemplo);
 n.desfazer();assert.equal(n.elemento(id),undefined);n.refazer();assert.equal(n.elemento(id).codigo.html,exemplo);
});
test('Designer bloqueia scripts e interação; prévia e exportação usam sandbox sem acesso ao editor',()=>{
 const n=new Nucleo();n.novo(false);const id=n.importarHTML({html:exemplo});const el={id,...n.elemento(id)};
 const designer=marcacaoCompleta(el);assert.ok(designer.includes('sandbox=""'));assert.ok(designer.includes('pointer-events:none'));assert.ok(!designer.includes('sandbox="allow-scripts"'));
 const c=compilar(n.doc);assert.ok(c.html.includes('sandbox="allow-scripts"'));assert.ok(!c.html.includes('allow-same-origin'));assert.ok(c.html.includes('gearBtn'));assert.ok(c.html.includes('radial-gradient'));
 for(const texto of [gerarReact(n.doc),gerarVue(n.doc),gerarWebComponent(n.doc)])assert.ok(texto.includes('hf-html-importado'));
 const html=gerarHTML(n.doc);for(const [,script]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(script);
 assert.ok(arquivosAplicativo(n.doc,{nome:'Teste HTML'}).arquivos['main.cjs'].includes("frame-src 'self' blob: data:"));
});
test('documento estático não libera rede ou scripts; HTTPS externo é uma escolha explícita',()=>{
 const codigo=prepararHTMLImportado({html:exemplo,online:true}).codigo;
 const estatico=documentoHTMLImportado(codigo);assert.ok(estatico.includes("script-src 'none'"));assert.ok(estatico.includes("connect-src 'none'"));
 const interativo=documentoHTMLImportado(codigo,{executar:true});assert.ok(interativo.includes("script-src 'unsafe-inline' https:"));assert.ok(interativo.includes('hefestus:html-evento'));
 codigo.recursosExternos=false;assert.ok(documentoHTMLImportado(codigo,{executar:true}).includes("connect-src 'none'"));
});
test('script original do exemplo abre o menu e fecha por clique fora e Esc',()=>{
 const criar=()=>{const classes=new Set(),eventos={};return {eventos,classList:{toggle(k,valor){const ativo=valor??!classes.has(k);ativo?classes.add(k):classes.delete(k);return ativo;},remove(k){classes.delete(k);},contains:k=>classes.has(k)},contains(alvo){return alvo===this;},addEventListener:(t,f)=>eventos[t]=f};};
 const gear=criar(),menu=criar(),eventos={},document={getElementById:id=>id==='gearBtn'?gear:menu,addEventListener:(t,f)=>eventos[t]=f};
 const script=[...exemplo.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];new Script(script).runInContext(createContext({document}));
 gear.eventos.click({stopPropagation(){}});assert.equal(menu.classList.contains('open'),true);assert.equal(gear.classList.contains('active'),true);
 eventos.click({target:{}});assert.equal(menu.classList.contains('open'),false);
 gear.eventos.click({stopPropagation(){}});eventos.keydown({key:'Escape'});assert.equal(menu.classList.contains('open'),false);
});
test('carrossel diferencia transição interativa de avanço automático e preserva o novo script',()=>{
 const manual=analisarHTMLImportado('<title>Cards</title><style>.card{transition:transform .5s}#c1:checked~.cards{opacity:1}</style><input type="radio">');
 assert.equal(manual.radios,1);assert.equal(manual.estadosCSS,true);assert.equal(manual.transicoesCSS,true);assert.equal(manual.animacaoAutomaticaCSS,false);assert.equal(manual.temporizadorJS,false);
 const a=analisarHTMLImportado(carrossel);assert.equal(a.temporizadorJS,true);assert.equal(a.transicoesCSS,true);assert.equal(a.botoes,9);
 for(const [,script]of carrossel.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(script);
 assert.equal(prepararHTMLImportado({html:carrossel}).nome,'Menu Carrossel de Cards — animado');
});
test('composição com rádio cria artefato novo sem alterar o original e um único undo desfaz',()=>{
 const n=new Nucleo();n.novo(false);const ids=n.inserirRadio(),originais=JSON.parse(JSON.stringify(n.doc));
 const root=n.comporHTMLComSelecao({html:carrossel,nome:'Carrossel com rádio',largura:800,altura:440},ids);assert.ok(root);
 for(const id of ids)assert.deepEqual(n.elemento(id),originais.elementos[id]);
 const partes=n.filhos(root).map(id=>n.elemento(id));assert.equal(partes.length,2);assert.ok(partes.every(p=>p.codigo.isolado));assert.ok(partes[1].codigo.html.includes('RADIOS_EMBUTIDAS'));assert.equal(partes[1].codigo.recursosExternos,true);
 const modelo=n.modeloDaSelecao([root],'Carrossel com rádio');const m=new Nucleo();m.novo(false);m.inserirModelo(modelo);assert.equal(m.elementos().filter(e=>e.codigo?.isolado).length,2);
 n.desfazer();assert.equal(n.elemento(root),undefined);assert.deepEqual(n.doc,originais);n.refazer();assert.ok(n.elemento(root));
});
test('carrossel animado avança pelo temporizador, responde às setas e permite pausar',()=>{
 const node=()=>({dataset:{},eventos:{},attrs:{},addEventListener(t,f){this.eventos[t]=f;},setAttribute(k,v){this.attrs[k]=v;}});
 const botoes=Array.from({length:3},node),titulos=['Explorar','Artefatos','Configurações'],cards=botoes.map((b,i)=>({...node(),querySelector:s=>s==='button'?b:{textContent:titulos[i]}}));
 const palco=node(),pausa=node(),status=node(),prev=node(),next=node(),indicadores=Array.from({length:3},node),host={...node(),querySelector:s=>({'.palco':palco,'#pausar':pausa,'.status':status,'#anterior':prev,'#proximo':next})[s],querySelectorAll:s=>s==='.card'?cards:indicadores,contains:()=>false};
 let timer=null;const document={hidden:false,querySelector:()=>host,addEventListener(){},dispatchEvent(){}};
 const script=[...carrossel.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
 new Script(script).runInContext(createContext({document,matchMedia:()=>({matches:false,addEventListener(){}}),setInterval:f=>{timer=f;return 1;},clearInterval:()=>timer=null,setTimeout:f=>f(),CustomEvent:class{constructor(t,d){this.type=t;this.detail=d.detail;}}}));
 assert.deepEqual(cards.map(c=>c.dataset.pos),['0','1','2']);assert.equal(typeof timer,'function');timer();assert.equal(cards[1].dataset.pos,'0');
 next.eventos.click();assert.equal(cards[2].dataset.pos,'0');palco.eventos.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(cards[1].dataset.pos,'0');
 pausa.eventos.click();assert.equal(timer,null);assert.equal(pausa.textContent,'Ativar avanço');
});
