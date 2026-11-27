import { h } from './dom.js';
import { icone } from './icones.js';
export class FerramentasHephaestus {
 constructor(app){this.app=app;this.raiz=h('nav',{class:'hp-tools','aria-label':'Ferramentas da área de trabalho'});}
 render(){
  const app=this.app,u=app.ui,script=u.hibrido;
  const ferramenta=(id,nome,ic,fn,desab=false)=>h('button',{type:'button',title:nome,'aria-label':nome,'aria-pressed':String((script?u.hpFerrScript:u.ferramenta)===id),disabled:desab,onclick:()=>{if(script){u.hpFerrScript=id;if(id!=="props"&&u.codigoVisao!=="grafo")app.estudio.mudarRepresentacao("grafo");}fn();},html:icone(ic,22)});
  const designer=[
   ferramenta('selecao','Seleção (V)','selecao',()=>app.setFerramenta('selecao')),
   ferramenta('direta','Seleção direta de nós (A)','nos',()=>app.editarSelecaoDireta()),
   ferramenta('caneta','Caneta Bézier (P)','caneta',()=>app.setFerramenta('caneta')),
   ferramenta('texto','Texto (T)','texto',()=>app.setFerramenta('texto')),
   ferramenta('caixa','Retângulo (M / R)','caixa',()=>app.setFerramenta('caixa')),
   ferramenta('elipse','Elipse (O)','elipse',()=>app.setFerramenta('elipse')),
   ferramenta('linha','Linha (L)','linha',()=>app.setFerramenta('linha')),
   ferramenta('builder','Construtor de Formas (Shift+M) — motor por arraste ainda não integrado','construtor-formas',()=>{},true),
   ferramenta('conta','Conta-gotas (I)','contaGotas',()=>app.setFerramenta('conta')),
   ferramenta('mao','Mão (H / Espaço)','mao',()=>app.setFerramenta('mao')),
   ferramenta('zoom','Zoom (Z)','zoom',()=>app.setFerramenta('zoom'))
  ];
  const e=app.estudio;
  const logica=script?[
   ferramenta('selecao','Seleção de nós','selecao',()=>{e.modoSelecao=true;e.tela.focus();}),
   ferramenta('fio','Fio dinâmico (W)','fio-dinamico',()=>{e.modoSelecao=true;app.mensagem('Arraste uma porta de saída até uma entrada compatível.');e.tela.focus();}),
   ferramenta('adicionar','Inserir nó rápido (+ / Tab)','inserir-no',()=>{const r=e.tela.getBoundingClientRect();e.abrirBuscaNos(r.left+r.width/2,r.top+r.height/2,{});}),
   ferramenta('grupo','Agrupar nós (Ctrl+G)','camadas',()=>e.agrupar(),!e.sel.size),
   ferramenta('nota','Anotação (C)','anotacao',()=>e.novaNota(...e.centroVisivel())),
   ferramenta('mao','Mover o canvas','mao',()=>{e.modoSelecao=false;e.tela.focus();}),
   ferramenta('zoom','Enquadrar nós (F)','telaCheia',()=>e.enquadrar()),
   ferramenta('props','Mostrar ou recolher inspetor','propriedades',()=>{u.vsDirFechada=!u.vsDirFechada;e.aplicarLayout();app.salvarUI();})
  ]:[];
  this.raiz.replaceChildren(...(script?logica:designer),h('div',{class:'hp-tools-spacer'}),...(!script?[
   ferramenta('camadas','Camadas','camadas',()=>app.mostrarFerramentaProjeto('camadas')),
   ferramenta('modelos','Biblioteca de modelos','biblioteca',()=>app.mostrarFerramentaProjeto('biblioteca')),
   h('button',{type:'button',class:'hp-fill','aria-label':'Alterar preenchimento',title:'Preenchimento',style:`--hp-fill:${app.n.selecionado()?.estilo?.fundo||'#c79246'}`,onclick:()=>app.editarCorHP('estilo.fundo','Preenchimento')})
  ]:[]));
 }
}
