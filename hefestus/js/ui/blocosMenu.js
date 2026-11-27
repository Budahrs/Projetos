import {h,botaoIcone} from './dom.js';
import {editarBlocosMenu,localizarBloco} from '../nucleo/blocosMenu.js';
import {comportamentosComando} from '../nucleo/menuComportamentos.js';

export function criarEditorBlocosMenu({ler,alterar,selecionar,status}) {
  const raiz=h('section',{class:'editor-blocos-menu','aria-label':'Construção de menus por blocos'});
  let escolhido=ler().designer.abas[0].id,arraste=null,passados=[],futuros=[],busca='',desfazerBlocos=()=>{},refazerBlocos=()=>{};
  raiz.addEventListener('keydown',e=>{
    if(e.target.matches('input,textarea,select,[contenteditable]'))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.stopPropagation();(e.shiftKey?refazerBlocos:desfazerBlocos)();}
    else if(e.key==='Delete'){e.preventDefault();e.stopPropagation();mudar({acao:'remover',id:escolhido});}
  });
  const mudar=op=>{try{const antes=structuredClone(ler()),r=editarBlocosMenu(ler(),op);passados.push(antes);if(passados.length>60)passados.shift();futuros=[];escolhido=r.selecionado;alterar(r.pacote);render();status('Blocos atualizados. A prévia e o código acompanham a estrutura.');}catch(e){status(e.message);}};
  const contexto=()=>{const p=ler(),n=localizarBloco(p,escolhido);if(!n)return {};if(n.tipo==='aba')return {aba:n.bloco.id,grupo:n.bloco.grupos[0]?.id};if(n.tipo==='grupo')return {aba:n.pai.id,grupo:n.bloco.id};const g=localizarBloco(p,n.pai.id);return {aba:g.pai.id,grupo:n.pai.id};};
  const adicionar=tipo=>{const ctx=contexto();mudar({acao:'adicionar',tipo,pai:tipo==='aba'?null:tipo==='grupo'?ctx.aba:ctx.grupo});};
  const iniciar=(e,dados)=>{arraste=dados;raiz.dataset.arrastando=dados.tipo;e.dataTransfer.setData('application/x-hefestus-bloco',JSON.stringify(dados));e.dataTransfer.effectAllowed=dados.id?'move':'copy';};
  raiz.addEventListener('dragend',()=>{arraste=null;delete raiz.dataset.arrastando;});
  function zona(tipo,pai,antesDe) {
    return h('div',{class:'bloco-encaixe','data-aceita':tipo,ondragover:e=>{if(arraste?.tipo===tipo){e.preventDefault();e.stopPropagation();e.currentTarget.classList.add('aceita');}},ondragleave:e=>e.currentTarget.classList.remove('aceita'),ondrop:e=>{
      e.preventDefault();e.stopPropagation();e.currentTarget.classList.remove('aceita');if(!arraste||arraste.tipo!==tipo){status('Este encaixe aceita apenas '+tipo+'.');return;}
      if(arraste.id===antesDe)return;
      mudar(arraste.id?{acao:'mover',id:arraste.id,pai,antesDe}:{acao:'adicionar',tipo,pai});arraste=null;
    }},'Encaixar '+tipo);
  }
  function bloco(b,tipo,pai) {
    const ativo=b.id===escolhido;
    const no=h('article',{class:'bloco-menu bloco-'+tipo+(ativo?' escolhido':''),'data-bloco':b.id});
    const cab=h('button',{type:'button',class:'bloco-cabecalho',draggable:true,'aria-pressed':String(ativo),'aria-label':'Selecionar '+tipo+' '+(b.nome||b.rotulo),ondragstart:e=>iniciar(e,{id:b.id,tipo}),ondragend:()=>{arraste=null;},onclick:()=>{escolhido=b.id;selecionar?.(b.id);render();}},h('span',{class:'bloco-tipo'},tipo),h('strong',{},b.nome||b.rotulo));
    no.append(cab);
    if(tipo==='comando') {
      const f=ler().bancoFerramentas?.find(t=>t.id===b.ferramentaId);
      no.append(h('div',{class:'bloco-conexao'},h('span',{class:'bloco-porta','aria-hidden':'true'}),'Ao clicar',h('span',{'aria-hidden':'true'},' → '),h('span',{class:'bloco-ferramenta'},f?.nome||'Escolher ferramenta')));
    } else {
      const filhos=tipo==='aba'?b.grupos:b.comandos,filhoTipo=tipo==='aba'?'grupo':'comando';
      const abrir=ativo||localizarBloco(ler(),escolhido)?.pai?.id===b.id||contexto().aba===b.id;
      const detalhes=h('details',{open:abrir},h('summary',{},filhos.length+' '+(tipo==='aba'?'grupo(s)':'comando(s)')));
      filhos.forEach(f=>detalhes.append(zona(filhoTipo,b.id,f.id),bloco(f,filhoTipo,b.id)));
      detalhes.append(zona(filhoTipo,b.id));no.append(detalhes);
    }
    return no;
  }
  function propriedades() {
    const n=localizarBloco(ler(),escolhido),p=h('aside',{class:'blocos-propriedades','aria-label':'Propriedades do bloco'});
    if(!n)return p;
    p.append(h('h3',{},'Propriedades'),h('p',{class:'bloco-tipo'},n.tipo+' · '+n.bloco.id));
    const editar=(rotulo,chave)=>p.append(h('label',{},rotulo,h('input',{value:n.bloco[chave]||'','aria-label':'Bloco: '+rotulo,onchange:e=>mudar({acao:'editar',id:escolhido,valores:{[chave]:e.target.value}})})));
    editar('Nome',n.tipo==='comando'?'rotulo':'nome');
    if(n.tipo==='comando') {
      editar('Descrição','descricao');editar('Atalho','atalho');
      p.append(h('label',{},'Ferramenta do banco',h('select',{'aria-label':'Bloco: ferramenta',onchange:e=>mudar({acao:'editar',id:escolhido,valores:{ferramentaId:e.target.value}})},(ler().bancoFerramentas||[]).map(t=>h('option',{value:t.id,selected:t.id===n.bloco.ferramentaId},t.nome)))));
      p.append(h('label',{class:'cp-linha'},h('input',{type:'checkbox',checked:!!n.bloco.destaque,onchange:e=>mudar({acao:'editar',id:escolhido,valores:{destaque:e.target.checked}})}),'Comando em destaque'));
      const f=ler().bancoFerramentas?.find(t=>t.id===n.bloco.ferramentaId);
      if(f)p.append(h('details',{},h('summary',{},'Ver contrato da ferramenta'),h('pre',{},JSON.stringify({entrada:f.entrada,saida:f.saida,execucao:f.execucao,limitacoes:f.limitacoes},null,2))));
      p.append(h('h3',{},'Comportamentos'));
      const comportamentos=comportamentosComando(n.bloco);
      const guardar=lista=>mudar({acao:'editar',id:escolhido,valores:{comportamentos:lista}});
      const trocar=(i,k,v)=>{const lista=structuredClone(comportamentos);lista[i][k]=v;guardar(lista);};
      const alvos=ler().designer.abas.flatMap(a=>[{id:a.id,nome:'Aba: '+a.nome},...a.grupos.flatMap(g=>[{id:g.id,nome:'Grupo: '+g.nome},...g.comandos.map(c=>({id:c.id,nome:c.rotulo}))])]);
      comportamentos.forEach((b,i)=>{
        const card=h('section',{class:'bloco-regra'},h('label',{class:'cp-linha'},h('input',{type:'checkbox',checked:b.ativo!==false,'aria-label':'Ativar comportamento '+(i+1),onchange:e=>trocar(i,'ativo',e.target.checked)}),'Comportamento '+(i+1)));
        const selecionar=(rotulo,valor,opcoes,fn)=>h('label',{},rotulo,h('select',{'aria-label':rotulo+' '+(i+1),onchange:e=>fn(e.target.value)},opcoes.map(([v,t])=>h('option',{value:v,selected:v===valor},t))));
        card.append(selecionar('Quando',b.evento,[['onClick','Ao clicar'],['onContext','Botão direito'],['onHover','Ao passar o mouse'],['onLeave','Ao sair com o mouse'],['onFocus','Ao receber foco'],['onChange','Ao mudar']],v=>trocar(i,'evento',v)),selecionar('Fazer',b.acao,[['ferramenta','Executar ferramenta'],['abrir','Abrir'],['fechar','Fechar'],['alternar','Alternar aberto/fechado'],['mostrarSo','Mostrar somente este'],['destacar','Realçar']],v=>trocar(i,'acao',v)));
        if(b.acao==='ferramenta')card.append(selecionar('Ferramenta',b.ferramentaId||n.bloco.ferramentaId,(ler().bancoFerramentas||[]).map(t=>[t.id,t.nome]),v=>trocar(i,'ferramentaId',v)));
        else card.append(selecionar('Alvo',b.alvo||n.bloco.id,alvos.map(t=>[t.id,t.nome]),v=>trocar(i,'alvo',v)));
        card.append(h('button',{type:'button',class:'bt-texto',onclick:()=>guardar(comportamentos.filter((_,j)=>j!==i))},'Remover comportamento '+(i+1)));p.append(card);
      });
      p.append(h('button',{type:'button',class:'bt',onclick:()=>guardar([...comportamentos,{evento:'onHover',acao:'destacar',alvo:n.bloco.id,ativo:true}])},'+ Comportamento'));
    }
    const indice=n.lista.indexOf(n.bloco);
    p.append(h('div',{class:'blocos-mover'},botaoIcone('cima','Mover bloco acima',()=>mudar({acao:'mover',id:escolhido,pai:n.pai?.id,indice:indice-1}),{attrs:{disabled:indice===0}}),botaoIcone('baixo','Mover bloco abaixo',()=>mudar({acao:'mover',id:escolhido,pai:n.pai?.id,indice:indice+1}),{attrs:{disabled:indice===n.lista.length-1}})),h('button',{type:'button',class:'bt',onclick:()=>mudar({acao:'remover',id:escolhido})},'Remover bloco'));
    return p;
  }
  function render() {
    if(!localizarBloco(ler(),escolhido))escolhido=ler().designer.abas[0].id;
    const biblioteca=h('aside',{class:'blocos-biblioteca'},h('h3',{},'Blocos'),h('p',{},'Arraste até um encaixe ou selecione o destino e use +.'));
    for(const [tipo,nome] of [['aba','Aba'],['grupo','Grupo'],['comando','Comando']])biblioteca.append(h('button',{type:'button',class:'bloco-paleta bloco-'+tipo,draggable:true,ondragstart:e=>iniciar(e,{tipo}),onclick:()=>adicionar(tipo)},'+ '+nome));
    const pesquisa=h('input',{type:'search',value:busca,placeholder:'Buscar ferramenta…','aria-label':'Buscar bloco de ferramenta',oninput:e=>{busca=e.target.value;preencher();}}),lista=h('div',{class:'blocos-ferramentas'});
    function preencher(){lista.replaceChildren(...(ler().bancoFerramentas||[]).filter(t=>t.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).map(t=>h('button',{type:'button',class:'bloco-ferramenta',title:'Vincular ao comando selecionado',onclick:()=>{if(localizarBloco(ler(),escolhido)?.tipo!=='comando'){status('Selecione um bloco Comando para conectar esta ferramenta.');return;}mudar({acao:'editar',id:escolhido,valores:{ferramentaId:t.id}});}},t.nome)));}preencher();biblioteca.append(h('h3',{},'Ferramentas'),pesquisa,lista);
    const tela=h('div',{class:'blocos-tela','aria-label':'Sequência de blocos do menu'},h('p',{class:'blocos-caminho'},'Menu → Aba → Grupo → Comando → Ferramenta'));
    for(const a of ler().designer.abas)tela.append(zona('aba',null,a.id),bloco(a,'aba',null));tela.append(zona('aba'));
    const desfazer=()=>{if(!passados.length)return;futuros.push(structuredClone(ler()));alterar(passados.pop());render();},refazer=()=>{if(!futuros.length)return;passados.push(structuredClone(ler()));alterar(futuros.pop());render();};
    desfazerBlocos=desfazer;refazerBlocos=refazer;
    const tipo=h('select',{'aria-label':'Tipo de interface em blocos',onchange:e=>mudar({acao:'apresentacao',tipoInterface:e.target.value})},[['ribbon','Ribbon'],['lateral','Menu lateral'],['contextual','Botão direito'],['janela','Janela']].map(([id,nome])=>h('option',{value:id,selected:(ler().designer.tipoInterface||'ribbon')===id},nome)));
    raiz.replaceChildren(h('div',{class:'blocos-barra'},h('strong',{},'Construir com blocos'),tipo,h('button',{type:'button',class:'bt',disabled:!passados.length,onclick:desfazer},'Desfazer blocos'),h('button',{type:'button',class:'bt',disabled:!futuros.length,onclick:refazer},'Refazer blocos')),h('div',{class:'blocos-layout'},biblioteca,tela,propriedades()));
  }
  render();return {raiz,render};
}
