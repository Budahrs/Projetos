import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import { motorMenus } from '../js/nucleo/motorMenus.js';
import { CommandRegistry } from '../js/nucleo/comandos.js';
import { migrarMenu } from '../js/nucleo/formatoMenus.js';
import { Nucleo } from '../js/nucleo/nucleo.js';
import { MODELOS } from '../js/nucleo/modelos.js';
import { dadosRuntime } from '../js/nucleo/runtime.js';
import { compilar, gerarHTML } from '../js/nucleo/compilador.js';
import { gerarReact, gerarVue, gerarWebComponent } from '../js/nucleo/artefatos.js';

test('faixa: largura real, prioridade, overflow agrupado e restauração sem mutar a definição', () => {
  const motor = motorMenus(), gs = [
    { id:'editar', prioridade:100, larguras:[240,160,72] },
    { id:'extras', prioridade:10, larguras:[220,120,72] }
  ];
  const original = structuredClone(gs);
  assert.deepEqual(motor.planejar(gs,600).grupos.map(g=>g.nivel),[0,0]);
  const estreito = motor.planejar(gs,330,{espaco:8});
  assert.ok(estreito.cabe); assert.equal(estreito.grupos[0].nivel,0);
  assert.equal(estreito.grupos[1].nivel,2);
  const menor = motor.planejar(gs,64);
  assert.equal(menor.overflow.length,2); assert.ok(menor.cabe);
  assert.deepEqual(motor.planejar(gs,600).grupos.map(g=>g.nivel),[0,0]);
  assert.deepEqual(gs,original);
});
test('faixa: níveis forçados, grupos protegidos, largura inválida e limites sem loop', () => {
  const m=motorMenus(), g=[{id:'a',larguras:[300,160,72]}];
  assert.equal(m.planejar(g,1000,{forcar:2}).grupos[0].nivel,2);
  assert.equal(m.planejar([{...g[0],protegido:true}],20).cabe,false);
  assert.equal(m.planejar(g,NaN).overflow.length,1);
  for(let largura=64;largura<1500;largura+=7){
    const r=m.planejar(Array.from({length:12},(_,i)=>({id:String(i),prioridade:i%3,larguras:[180+i*11,110,72]})),largura,{espaco:6});
    assert.ok(r.cabe,`largura ${largura}`); assert.equal(r.grupos.length,12);
    assert.ok(r.grupos.every(g=>g.nivel>=0&&g.nivel<=3));
  }
});
test('sidebar: limites exatos, overlay não comprime, preferência e volta direta entre modos', () => {
  const s=motorMenus().sidebar;
  assert.equal(s(639).modo,'minimal'); assert.equal(s(640).modo,'compact'); assert.equal(s(1024).modo,'open');
  assert.equal(s(390,{aberto:true}).deslocamento,0);
  assert.equal(s(390,{aberto:true}).largura,264);
  assert.equal(s(390).aberto,false);
  assert.equal(s(1200,{recolhida:true}).modo,'compact');
  assert.equal(s(1200,{modo:'minimal',aberto:true}).overlay,true);
  assert.equal(s(40,{aberto:true}).largura,40);
});
test('registro: IDs independentes do rótulo, estado contextual, observação e comando bloqueado', () => {
  const ctx={texto:false,negrito:false}; let execucoes=0,notificacoes=0;
  const r=new CommandRegistry(()=>ctx); const off=r.observar(()=>notificacoes++);
  r.registrar({id:'texto.negrito',rotulo:'Negrito',contexto:c=>c.texto,ativo:c=>c.negrito,acao:()=>{execucoes++;ctx.negrito=!ctx.negrito;}});
  assert.equal(r.executar('texto.negrito'),false);
  ctx.texto=true; r.notificar(); r.executar('texto.negrito');
  assert.equal(r.estado('texto.negrito').marcado,true); assert.equal(execucoes,1);
  assert.equal(notificacoes,2); off();
  r.registrar({id:'texto.negrito',rotulo:'Bold',acao:()=>execucoes++});
  assert.equal(r.estado('texto.negrito').rotulo,'Bold'); assert.equal(r.comandos.size,1);
  assert.throws(()=>r.registrar({rotulo:'Sem ID'}),/ID/);
});
test('registro delega histórico ao núcleo: uma edição corresponde a um undo e redo', () => {
  const n=new Nucleo(); n.novo(false); const id=n.criar('texto',10,10);
  const original=n.elemento(id).texto, antes=n.historico().cursor;
  const r=new CommandRegistry(); r.registrar({id:'texto.aplicar',acao:()=>n.definir(id,{texto:'Alterado'},'Editar texto')});
  r.executar('texto.aplicar'); assert.equal(n.historico().cursor,antes+1);
  n.desfazer(); assert.equal(n.elemento(id).texto,original);
  n.refazer(); assert.equal(n.elemento(id).texto,'Alterado');
});
test('menu exportado inclui o mesmo motor e sidebar é modelo nativo editável', () => {
  const n=new Nucleo(); n.novo(false); n.inserirModelo(MODELOS.find(m=>m.id==='faixaAxiom'));
  const c=compilar(n.doc), d=dadosRuntime(c.elementos);
  assert.ok(d.menusAdaptativos.length>0); assert.ok(d.menusAdaptativos.some(m=>m.grupos.length>1));
  const html=gerarHTML(n.doc);
  for(const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Script(script);
  assert.ok(html.includes('function motorMenus()'));
  for(const texto of [gerarReact(n.doc),gerarVue(n.doc),gerarWebComponent(n.doc)]) assert.ok(texto.includes('const motorMenus = function motorMenus()'));
  const sidebar=MODELOS.find(m=>m.id==='sidebarAdaptativa'); assert.ok(sidebar);
  n.novo(false); n.inserirModelo(sidebar);
  const ds=dadosRuntime(compilar(n.doc).elementos);
  assert.equal(ds.sidebars.length,1); assert.equal(ds.sidebars[0].rotulos.length,4);
});
test('formato: migração não altera o original e recusa versões e valores inválidos', () => {
  const legado={sidebar:{modo:'auto',expandida:264},adaptativo:false};
  const atual=migrarMenu(legado);
  assert.equal(atual.versao,1); assert.equal(legado.versao,undefined);
  atual.sidebar.expandida=280; assert.equal(legado.sidebar.expandida,264);
  for(const invalido of [{versao:2},{prioridade:-1},{sidebar:{modo:'inventado'}},{sidebar:{expandida:NaN}},{adaptativo:'true'}]) assert.throws(()=>migrarMenu(invalido));
});
test('runtime: menu inválido não quebra o documento e emite diagnóstico', () => {
  const d=dadosRuntime([{id:'invalido',tipo:'container',menu:{versao:99}}]);
  assert.equal(d.avisosMenus.length,1); assert.equal(d.menusAdaptativos.length,0);
});

