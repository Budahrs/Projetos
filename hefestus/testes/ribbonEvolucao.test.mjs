import {test} from 'node:test';import assert from 'node:assert/strict';
import {medirAcaoRibbon,registrarMetricaRibbon,exportarMetricasRibbon} from '../js/nucleo/metricasRibbon.js';
import {FaixaDeOpcoes} from '../js/ui/faixa.js';
import {Ribbon} from '../js/ui/ribbon.js';
import {MENU_PDF_PADRAO} from '../js/nucleo/menuPdfPadrao.js';
import {sincronizarMenu} from '../js/nucleo/menuEngine.js';
import {importarTemasUsuario} from '../js/ui/temas.js';
import {CATALOGO_TEMAS} from '../js/nucleo/temasCompartilhados.js';
test('telemetria distingue retorno e falha de handler sem texto de documento',async()=>{
 const ui={},record=(ok,ms)=>registrarMetricaRibbon(ui,'fixture',ok,ms);let tick=0;const clock=()=>++tick;
 assert.equal(medirAcaoRibbon(()=>42,record,clock),42);assert.throws(()=>medirAcaoRibbon(()=>{throw Error('falha');},record,clock));
 await assert.rejects(medirAcaoRibbon(()=>Promise.reject(Error('assíncrono')),record,clock));assert.equal(await medirAcaoRibbon(()=>Promise.resolve(7),record,clock),7);
 const p=exportarMetricasRibbon(ui);assert.equal(p.comandos.fixture.chamadas,4);assert.equal(p.comandos.fixture.falhas,2);assert.equal(p.comandos.fixture.sucessos,2);assert(!JSON.stringify(p).includes('assíncrono'));
});
test('botão direito fixa e recolhe grupo no escopo da aba',()=>{
 const ui={aba:'inicio'};let saves=0;const f=new FaixaDeOpcoes({app:{ui,salvarUI:()=>saves++,render(){}}});
 let menu=f.itensMenu(null,'Documentos');menu.find(i=>i.rotulo==='Fixar grupo').fazer();assert(ui.gruposFixados['inicio::Documentos']);
 menu=f.itensMenu(null,'Documentos');menu.find(i=>i.rotulo==='Recolher grupo').fazer();assert(ui.gruposRecolhidos['inicio::Documentos']);assert.equal(saves,2);
});
test('compactação prioriza grupo menos usado e respeita fixação',()=>{
 const high={dataset:{grupo:'Frequente',protegido:'true'},querySelectorAll:()=>[{dataset:{cmd:'high'}}]},low={dataset:{grupo:'Raro',protegido:'false'},querySelectorAll:()=>[{dataset:{cmd:'low'}}]};
 const groups=[low,high],width=g=>[160,120,90,50][Number(g.dataset.nivel)];
 const corpo={querySelectorAll:()=>groups,querySelector:()=>null,clientWidth:280,get scrollWidth(){return groups.reduce((n,g)=>n+width(g),0);}};
 Ribbon.prototype.compactar.call({corpo,ui:{aba:'inicio',uso:{high:{n:99},low:{n:1}}}});assert.equal(low.dataset.nivel,'1');assert.equal(high.dataset.nivel,'0');
});
test('HTML gerado inclui catálogo System, overflow real e todos os comandos',()=>{
 const n=sincronizarMenu(MENU_PDF_PADRAO),html=n.codigos.web.texto;
 assert.equal((html.match(/data-command=/g)||[]).length,66);assert(html.includes('<details><summary>Mais ('));assert(html.includes('prefers-color-scheme'));
 const data=html.match(/id="temas-compartilhados">([\s\S]*?)<\/script>/)[1];assert.equal(JSON.parse(data).formato,'hefestus.temas');
 const runtime=html.match(/<script>\(([\s\S]*?)\)\(\);<\/script>/)[1];assert.doesNotThrow(()=>new Function('return ('+runtime+')'));
 assert(n.temas.temas.every(t=>t.tokens.painel!=='#FFFFFF'));
});
test('importação de temas falha sem gravar um lote parcialmente válido',()=>{
 let writes=0;globalThis.localStorage={getItem:()=>null,setItem:()=>writes++};const good=JSON.parse(JSON.stringify(CATALOGO_TEMAS.light)),bad={...good,tokens:{...good.tokens,painel:'#FFFFFF'}};
 assert.throws(()=>importarTemasUsuario({formato:'hefestus.temas',versao:1,temas:[good,bad]}));assert.equal(writes,0);
 const result=importarTemasUsuario({formato:'hefestus.temas',versao:1,temas:[good]});assert.equal(result.reutilizados,1);assert.equal(result.adicionados,0);
});

test('catálogo de temas embutido preserva nomes e impede fechamento de script',()=>{const p=JSON.parse(JSON.stringify(MENU_PDF_PADRAO));p.temas={formato:'hefestus.temas',versao:1,temas:[{...JSON.parse(JSON.stringify(CATALOGO_TEMAS.light)),nome:'Exemplo </script><script>alert(1)'}]};const html=sincronizarMenu(p).codigos.web.texto;assert(!html.includes('<script>alert(1)'));const data=html.match(/id="temas-compartilhados">([\s\S]*?)<\/script>/)[1];assert.equal(JSON.parse(data).temas[0].nome,p.temas.temas[0].nome);});
