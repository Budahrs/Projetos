import { h, avisar } from './dom.js';
import { CATALOGO } from '../nucleo/catalogo.js';
import { aplicarComportamentoLote } from '../nucleo/comportamentosLote.js';

const NOMES_EVENTO = {onClick:'Clicar',onContext:'Botão direito',onHover:'Entrar com o mouse',onLeave:'Sair com o mouse',onChange:'Alterar valor',onFocus:'Receber foco',onOpen:'Abrir',onClose:'Fechar',onSelect:'Selecionar'};

/** Editor do documento real: os blocos e o Designer usam os mesmos elementos e histórico. */
export function criarBlocosProjeto(app) {
  const raiz = h('section', {class:'editor-blocos-menu blocos-projeto','aria-label':'Construção do programa por blocos'});
  let busca = '', incluirFilhos = false;
  const executar = fn => {try { fn(); } catch(e) {avisar(e.message,'alerta');}};
  const botao = (nome, fn, extra = {}) => h('button',{type:'button',class:'bt',onclick:()=>executar(fn),...extra},nome);
  function render() {
    const focoBusca=raiz.contains(document.activeElement)&&document.activeElement.type==='search';
    const n=app.n, elementos=n.elementos(), ids=n.selecionados(), selecionados=ids.map(id=>n.elemento(id)).filter(Boolean);
    const paleta=h('aside',{class:'blocos-paleta'},h('h3',{},'1. Adicione uma peça'),h('p',{},'Peças reais do programa. A aparência pode ser alterada no Designer.'));
    for(const tipo of ['container','botao','texto','campo','toggle','forma','elipse','icone','menu','modal']) {
      if(CATALOGO[tipo])paleta.append(botao('+ '+CATALOGO[tipo].nome,()=>n.criar(tipo),{class:'bloco-cabecalho bloco-'+(tipo==='container'?'grupo':'comando')}));
    }
    paleta.append(h('h3',{},'2. Selecione e organize'),h('p',{},'Use Shift para selecionar várias peças. Agrupe para organizar e configurar comportamentos em conjunto.'),botao('Agrupar seleção',()=>app.agrupar('livre'),{disabled:ids.length<2}),botao('Editar aparência no Designer',()=>app.setModo('designer')));
    const arvore=h('section',{class:'blocos-arvore','aria-label':'Estrutura do programa'},h('h3',{},'Programa'),h('input',{type:'search',value:busca,placeholder:'Pesquisar peça…','aria-label':'Pesquisar peças do programa',oninput:e=>{busca=e.target.value;render();}}));
    const vistos=new Set(), q=busca.toLocaleLowerCase('pt-BR');
    function ramo(e) {
      if(vistos.has(e.id))return null;vistos.add(e.id);
      const filhos=elementos.filter(f=>f.pai===e.id), conteudo=filhos.map(ramo).filter(Boolean);
      if(q&&!`${e.nome} ${e.tipo}`.toLocaleLowerCase('pt-BR').includes(q)&&!conteudo.length)return null;
      return h('article',{class:'bloco-programa '+(filhos.length||e.tipo==='container'?'bloco-grupo':'bloco-comando')},botao((filhos.length?'▦ ':'◈ ')+(e.nome||e.id),()=>{}, {class:'bloco-cabecalho','aria-pressed':String(ids.includes(e.id)),onclick:ev=>n.selecionar(e.id,{somar:ev.shiftKey})}),h('small',{},CATALOGO[e.tipo]?.nome||e.tipo,' · ',(e.eventos||[]).length+' comportamento(s)'),...conteudo);
    }
    const bases=elementos.filter(e=>!e.pai||!n.elemento(e.pai));
    for(const e of bases){const no=ramo(e);if(no)arvore.append(no);}
    if(!elementos.length)arvore.append(h('p',{},'Comece adicionando uma peça à esquerda ou insira um modelo de menu.'));
    const props=h('aside',{class:'blocos-propriedades'},h('h3',{},'3. Defina o comportamento'));
    if(!ids.length)props.append(h('p',{},'Selecione uma peça ou um grupo na estrutura.'));
    else {
      props.append(h('strong',{},n.descreverGrupo(ids)),h('label',{},h('input',{type:'checkbox',checked:incluirFilhos,onchange:e=>{incluirFilhos=e.target.checked;render();}}),' Incluir peças internas do grupo'));
      const alvos=(incluirFilhos?n.comDescendentes(ids):ids).map(id=>n.elemento(id));
      const comuns=(CATALOGO[alvos[0]?.tipo]?.eventos||[]).filter(ev=>alvos.every(el=>CATALOGO[el.tipo]?.eventos?.includes(ev)));
      const quando=h('select',{'aria-label':'Quando acontecer'},comuns.map(ev=>h('option',{value:ev},NOMES_EVENTO[ev]||ev)));
      const acao=h('select',{'aria-label':'Ação do comportamento'},[['','Emitir sinal para o motor'],['abrir','Mostrar elemento'],['fechar','Ocultar elemento'],['alternar','Alternar visibilidade'],['mostrarSo','Mostrar somente este painel']].map(([value,nome])=>h('option',{value},nome)));
      const alvo=h('select',{'aria-label':'Elemento afetado'},elementos.map(e=>h('option',{value:e.id},e.nome||e.id)));
      const sinal=h('input',{type:'text',placeholder:'ex.: documento_salvar','aria-label':'Sinal para o motor'});
      props.append(h('div',{class:'bloco-comportamento'},h('label',{},'Quando',quando),h('label',{},'Fazer',acao),h('label',{},'Elemento afetado pela ação',alvo),h('label',{},'Sinal para o motor (opcional com ação visual)',sinal),botao('Adicionar aos selecionados',()=>aplicarComportamentoLote(n,ids,{tipo:quando.value,acao:acao.value,alvo:alvo.value,dispara:sinal.value},{incluirFilhos}),{disabled:!comuns.length})));
      if(!comuns.length)props.append(h('p',{},'Essas peças não têm um evento em comum. Selecione um conjunto menor.'));
      props.append(h('p',{},'Você pode adicionar várias regras. Desligue uma regra para preservá-la sem executar. Sinais precisam de um motor conectado.'));
      for(const el of selecionados)for(const [i,ev] of (el.eventos||[]).entries()){
        const atualizar=fn=>{const eventos=structuredClone(n.elemento(el.id).eventos);fn(eventos);n.definir(el.id,{eventos});};
        props.append(h('div',{class:'bloco-comportamento'},h('strong',{},el.nome||el.id),h('label',{},h('input',{type:'checkbox',checked:!ev.suspenso,'aria-label':`Ativar regra ${i+1} de ${el.nome||el.id}`,onchange:e=>executar(()=>atualizar(lista=>lista[i].suspenso=!e.target.checked))}),` ${NOMES_EVENTO[ev.tipo]||ev.tipo} → ${ev.acao||ev.dispara||'Sinal'}`),ev.alvo?h('small',{},'Alvo: '+n.rotulo(ev.alvo)):null,botao('Remover regra',()=>atualizar(lista=>lista.splice(i,1)))));
      }
    }
    raiz.replaceChildren(paleta,arvore,props);
    if(focoBusca)raiz.querySelector('input[type=search]')?.focus();
  }
  render();return {raiz,render};
}
