import { h } from './dom.js';
import { icone } from './icones.js';
import { MODELOS } from '../nucleo/modelos.js';
export function componentesHephaestus(app) {
 const usuario=app.modelosUsuario(),modelos=[...usuario,...MODELOS];
 const lista=h('div',{class:'hp-component-list',role:'list','aria-label':'Componentes reutilizáveis'});
 const render=q=>{const f=q.trim().toLocaleLowerCase('pt-BR'),ms=modelos.filter(m=>(m.nome+' '+m.cat).toLocaleLowerCase('pt-BR').includes(f));
  lista.replaceChildren(...ms.map(m=>h('button',{type:'button',class:'hp-component-item',role:'listitem',title:`Inserir ${m.nome} como modelo reutilizável. Uma cópia independente é adicionada ao documento.`,onclick:()=>app.inserirModelo(m)},h('span',{html:icone('componente',16)}),m.nome)),...(!ms.length?[h('p',{},'Nenhum componente encontrado.')]:[]));};render('');
 return h('section',{class:'hp-components','aria-label':'Componentes reutilizáveis'},
  h('header',{},'Componentes reutilizáveis',h('button',{type:'button',title:'Salvar seleção como componente','aria-label':'Salvar seleção como componente',disabled:!app.n.selecionados().length,html:icone('mais',15),onclick:()=>app.salvarModelo()})),
  h('input',{type:'search',placeholder:'Buscar componente…','aria-label':'Buscar componente reutilizável',oninput:e=>render(e.target.value)}),lista);
}
