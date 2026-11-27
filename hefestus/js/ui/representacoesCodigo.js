import {h} from './dom.js';
import {NOS} from '../nucleo/visualScript.js';
import {projetarBlocos,normalizarVisaoCodigo,aplicarValoresBloco} from '../app/representacoesCodigo.js';
const ROTULOS=[['blocos','Blocos'],['grafo','Grafo'],['fonte','Código-fonte']];
export function renderRepresentacoesCodigo(estudio){
 const visao=normalizarVisaoCodigo(estudio.ui.codigoVisao),n=estudio.n;
 if(!estudio.visoesNav.childElementCount){estudio.visoesNav.append(...ROTULOS.map(([id,rot])=>h('button',{type:'button','data-visao':id,'aria-pressed':'false',onclick:()=>estudio.mudarRepresentacao(id),onkeydown:e=>{const i=ROTULOS.findIndex(x=>x[0]===id);let next;if(e.key==='ArrowRight')next=(i+1)%3;else if(e.key==='ArrowLeft')next=(i+2)%3;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;else return;e.preventDefault();estudio.mudarRepresentacao(ROTULOS[next][0]);estudio.visoesNav.querySelector('[data-visao="'+ROTULOS[next][0]+'"]').focus();}},rot)));}
 for(const bt of estudio.visoesNav.querySelectorAll('button'))bt.setAttribute('aria-pressed',String(bt.dataset.visao===visao));
 estudio.raiz.dataset.representacao=visao;
 estudio.palcoEl.hidden=visao!=='grafo';estudio.representacao.hidden=visao==='grafo';
 if(visao==='grafo')return;
 const chave=[visao,estudio.g.id,n.revisao,n.selecao,[...estudio.sel].join(',')].join('|');
 if(estudio._representacaoChave===chave)return;
 if(visao==='fonte'&&estudio._codigoObjeto===n.selecao&&estudio.representacao.contains(document.activeElement)&&document.activeElement.matches('textarea'))return;
 estudio._representacaoChave=chave;estudio._codigoObjeto=n.selecao;
 if(visao==='fonte'){
  let html,erro;try{html=n.html();}catch(e){erro=e.message;}
  estudio.representacao.replaceChildren(h('h2',{},'Código-fonte'),h('p',{},'Edite HTML, CSS e JavaScript do objeto selecionado. Aplicar código grava uma transação desfazível; rascunhos ficam preservados nesta sessão. O grafo mantém sua lógica e gera o runtime da entrega.'),h('div',{class:'codigo-fonte-objeto'},estudio.app.ambiente.painelCodigo()),h('details',{class:'codigo-fonte-entrega'},h('summary',{},'HTML funcional completo — gerado, somente leitura'),erro?h('p',{role:'alert'},erro):h('textarea',{readonly:true,spellcheck:false,'aria-label':'HTML funcional gerado'},html)));
  return;
 }
 estudio._blocoRascunhos??=new Map();
 const blocos=projetarBlocos(estudio.g),cards=h('div',{class:'codigo-blocos-lista'});
 for(const {no,entradas,saidas} of blocos){const def=NOS[no.tipo],selecionado=estudio.sel.has('n:'+no.id);
  const editar=()=>{estudio.sel=new Set(['n:'+no.id]);estudio.fioSel=null;estudio.varSel=null;estudio.renderInspetor();estudio.renderRepresentacoes();};
  const chaveDraft=estudio.g.id+'|'+no.id,rascunho=estudio._blocoRascunhos.get(chaveDraft),controles=[],derivado=no.origem==='designer';
  const lerControle=(p,c)=>{if(p.tipo==='bool')return c.checked;if(p.tipo==='num'){if(c.value.trim()===''||!Number.isFinite(Number(c.value)))throw Error('Informe um número válido em '+(p.nome||p.id)+'.');return Number(c.value);}if(p.tipo==='any'&&c.value.trim()!==''&&Number.isFinite(Number(c.value)))return Number(c.value);return c.value;};
  const guardar=(p,valor)=>{let r=estudio._blocoRascunhos.get(chaveDraft);if(!r){r={valores:{},revisao:n.revisao};estudio._blocoRascunhos.set(chaveDraft,r);}r.valores[p.id]=valor;};
  const campos=(def?.ent??[]).filter(p=>p.tipo!=='exec').map(p=>{const ligacao=entradas.find(l=>l.ep===p.id);let controle;
   if(ligacao)controle=h('small',{},'Ligado a '+ligacao.de+' · '+ligacao.sp);
   else if(derivado)controle=h('small',{},'Vinculado no Designer');
   else{controle=estudio.controle(p,rascunho&&p.id in rascunho.valores?rascunho.valores[p.id]:no.v?.[p.id],x=>guardar(p,x),'bloco.'+no.id+'.'+p.id,(p.nome||p.id)+' de '+estudio.titulo(no),false);controle.querySelector?.('option[value="__nova"]')?.remove();controles.push([p,controle]);controle.addEventListener('input',()=>{try{guardar(p,lerControle(p,controle));}catch{guardar(p,controle.value);}});}
   return h('label',{class:'codigo-bloco-campo'},h('span',{},p.nome||p.id),controle);
  });
  const aplicar=()=>{try{const valores=Object.fromEntries(controles.map(([p,c])=>[p.id,lerControle(p,c)])),r=estudio._blocoRascunhos.get(chaveDraft);const result=aplicarValoresBloco(n,estudio.g.id,no.id,valores,r?.revisao??n.revisao);if(result.acao==='aplicado'){estudio._blocoRascunhos.delete(chaveDraft);estudio._representacaoChave=null;estudio.render();estudio.app.mensagem('Campos do bloco aplicados. Desfazer reverte a edição.');}else estudio.app.mensagem('A edição mantém a proteção do projeto; confira a pergunta pendente.');}catch(e){estudio.app.mensagem(e.message);}};

  cards.append(h('article',{class:'codigo-bloco'+(selecionado?' selecionado':''),'data-no':no.id},h('header',{},h('button',{type:'button','aria-pressed':String(selecionado),onclick:editar},no.titulo||def?.nome||no.tipo),h('code',{},no.id)),h('small',{},(def?.evento?'Evento':def?.puro?'Expressão':'Ação')+' · '+no.tipo+(no.desativado?' · desativado':'')),...campos,controles.length?h('div',{class:'botoes-linha'},h('button',{type:'button',class:'bt',onclick:aplicar},'Aplicar campos'),h('button',{type:'button',class:'bt-texto',onclick:()=>{estudio._blocoRascunhos.delete(chaveDraft);estudio._representacaoChave=null;estudio.renderRepresentacoes();}},'Descartar campos')):null,h('p',{class:'codigo-bloco-fios'},entradas.length+' entrada(s) · '+saidas.length+' saída(s)'),h('button',{type:'button',class:'bt-texto',onclick:()=>{estudio.mudarRepresentacao('grafo');estudio.irPara(estudio.g.id,no.id);}},'Localizar no grafo')));
 }
 estudio.representacao.replaceChildren(h('h2',{},'Blocos de '+estudio.g.nome),h('p',{},'Os mesmos nós, valores e conexões do grafo. Edite e aplique os campos aqui; os rascunhos ficam nesta sessão. Use Grafo para ligar portas. Novos blocos são adicionados pelo Ribbon. Nós avançados são preservados.'),cards);
 if(!blocos.length)cards.append(h('p',{},'Este grafo está vazio. Escolha um evento ou ação no Ribbon para começar.'));
}
