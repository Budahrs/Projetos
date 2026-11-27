import { h } from './dom.js';
import { icone } from './icones.js';
import { comandosDaInterface } from './ribbon.js';
import { motorMenus } from '../nucleo/motorMenus.js';
import { animarMenu } from './movimentoMenus.js';
import { abrirConfiguracaoFlutuante } from './configuracaoFlutuante.js';

export function fecharContextual(app){const m=app._menuCanvas;if(!m)return;m.limpar();app._menuCanvas=null;}
export function abrirContextual(app,x,y,idAlvo,cenario){
  fecharContextual(app);
  const registro=new Map(comandosDaInterface(app).map(c=>[c.id,c])),n=app.n,motor=motorMenus(),niveis=[],retornos=new Map();let espera=0;
  const menu=h('div',{class:'menu-ctx menu-canvas compacto',role:'dialog','aria-label':'Ações do projeto'}),busca=h('input',{type:'search',class:'mc-busca',placeholder:'Pesquisar função…','aria-label':'Pesquisar função'}),lista=h('div',{role:'menu',class:'mc-lista'});
  const executar=c=>{fecharContextual(app);app.usou(c.id);c.acao();app.render();};
  const fecharNiveis=(nivel=0)=>{clearTimeout(espera);while(niveis.length>nivel){const q=niveis.pop();q.limpar?.();q.gatilho.setAttribute('aria-expanded','false');q.el.remove();}};
  const pertence=alvo=>menu.contains(alvo)||niveis.some(q=>q.el.contains(alvo));
  const abrir=(bt,no,nivel,focar=false)=>{
    if(niveis[nivel]?.gatilho===bt){if(focar)niveis[nivel].el.querySelector('button:not(:disabled)')?.focus();return;}
    fecharNiveis(nivel);const painel=h('div',{class:'menu-ctx mc-submenu',role:'menu','aria-label':no.rotulo},no.filhos.map(c=>item(c,nivel+1)));
    document.body.append(painel);bt.setAttribute('aria-expanded','true');motor.limitarPainel(painel,bt.getBoundingClientRect(),{lado:'direita',rtl:getComputedStyle(menu).direction==='rtl'});animarMenu(painel,app.ui);
    const q={el:painel,gatilho:bt,limpar:motor.protegerSubmenu(bt,painel,()=>fecharNiveis(nivel))};niveis.push(q);if(focar)painel.querySelector('button:not(:disabled)')?.focus();
  };
  const item=(no,nivel=0)=>{
    const bt=h('button',{type:'button',class:'menu-ctx-item',role:'menuitem',disabled:!!no.desabilitado?.(),onclick:()=>no.filhos?abrir(bt,no,nivel,true):executar(no)},h('span',{class:'mc-ic',html:icone(no.icone??'caixa',16)}),h('span',{class:'mc-rot'},no.rotulo),no.filhos?h('span',{'aria-hidden':'true'},'›'):no.atalho?h('span',{class:'mc-at'},no.atalho):null);
    if(no.filhos){bt.setAttribute('aria-haspopup','menu');bt.setAttribute('aria-expanded','false');retornos.set(bt,()=>abrir(bt,no,nivel,true));bt.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;clearTimeout(espera);espera=setTimeout(()=>abrir(bt,no,nivel),160);});bt.addEventListener('pointerleave',()=>clearTimeout(espera));}
    else bt.addEventListener('pointerenter',()=>fecharNiveis(nivel));return bt;
  };
  const icones=(titulo,ids)=>h('div',{class:'mc-icones',role:'group','aria-label':titulo},h('span',{class:'mc-titulo'},titulo),h('div',{class:'mc-rapidos'},ids.map(id=>registro.get(id)).filter(Boolean).map(c=>h('button',{type:'button',title:c.rotulo,'aria-label':c.rotulo,disabled:!!c.desabilitado?.(),onclick:()=>executar(c),html:icone(c.icone??'caixa',18)}))));
  const rapidos=icones('Ações rápidas',cenario.rapidos),inserir=icones('Inserir rápido',['ins-botao','ins-texto','ins-caixa']),biblioteca=icones('Biblioteca',['ins-bib','ins-radio']);
  const arvores=cenario.secoes.filter(([t])=>!['Inserir rápido','Biblioteca'].includes(t)).map(([rotulo,ids])=>({rotulo,icone:'pasta',filhos:ids.map(id=>registro.get(id)).filter(Boolean)})).filter(c=>c.filhos.length);
  const usados=new Set(cenario.secoes.flatMap(([,ids])=>ids).concat(cenario.rapidos));
  const frequentes=app.maisUsados(12).map(id=>registro.get(id)).filter(c=>c&&!usados.has(c.id)&&!c.desabilitado?.()).slice(0,3);if(frequentes.length)arvores.push({rotulo:'Mais usados',icone:'relogio',filhos:frequentes});
  if(idAlvo)arvores.unshift({rotulo:'Configuração',icone:'propriedades',filhos:[['aparencia','Aparência'],['comportamento','Comportamento'],['eventos','Conectar evento']].map(([tipo,rotulo])=>({rotulo,icone:tipo==='aparencia'?'pincel':'raio',filhos:[{id:'ctx-config-'+tipo,rotulo:tipo==='eventos'?'Gatilhos, animações e ações…':'Configurar '+rotulo.toLowerCase()+'…',icone:'propriedades',acao:()=>abrirConfiguracaoFlutuante(app,idAlvo,tipo,x,y)},...(tipo==='eventos'?[{id:'ctx-ferramenta',rotulo:'Conectar ferramenta…',icone:'link',acao:()=>{n.selecionar(idAlvo);app.vincularSelecao();}}]:[])]}))});
  const preencher=()=>{fecharNiveis();const termo=busca.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();rapidos.hidden=inserir.hidden=biblioteca.hidden=!!termo;const encontrados=termo?[...registro.values()].filter(c=>c.acao&&String(c.rotulo).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(termo)).slice(0,30):arvores;lista.replaceChildren(...encontrados.map(c=>item(c)));if(!encontrados.length)lista.append(h('p',{},'Nenhuma função encontrada.'));};
  busca.addEventListener('input',preencher);preencher();menu.append(h('header',{class:'mc-cabecalho'},busca,h('button',{type:'button',class:'bt-ic','aria-label':'Fechar menu de ações',title:'Fechar menu de ações',html:icone('fechar',16),onclick:()=>fecharContextual(app)})),rapidos,inserir,biblioteca,lista);document.body.append(menu);
  const reposicionar=()=>{motor.limitarPainel(menu,{left:x,right:x,top:y,bottom:y});for(const q of niveis)motor.limitarPainel(q.el,q.gatilho.getBoundingClientRect(),{lado:'direita'});};
  const fora=e=>{if(!pertence(e.target))fecharContextual(app);};
  const tecla=e=>{
    if(!pertence(e.target))return;const nivel=niveis.findIndex(q=>q.el.contains(e.target)),host=nivel<0?menu:niveis[nivel].el,bs=[...host.querySelectorAll('button:not(:disabled)')].filter(b=>b.getClientRects().length),i=bs.indexOf(document.activeElement);
    if(e.key==='Escape'||e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();if(niveis.length){const bt=niveis.at(-1).gatilho;fecharNiveis(niveis.length-1);bt.focus();}else if(e.key==='Escape')fecharContextual(app);}
    else if(e.key==='ArrowRight'&&retornos.has(document.activeElement)){e.preventDefault();retornos.get(document.activeElement)();}
    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length]?.focus();}
    else if(e.target!==busca&&(e.key==='Home'||e.key==='End')){e.preventDefault();(e.key==='Home'?bs[0]:bs.at(-1))?.focus();}
    else if(e.key==='Tab')setTimeout(()=>{if(!pertence(document.activeElement))fecharContextual(app);},0);
  };
  document.addEventListener('pointerdown',fora,true);document.addEventListener('keydown',tecla,true);window.addEventListener('resize',reposicionar);window.visualViewport?.addEventListener('resize',reposicionar);
  const rolar=e=>{if(!pertence(e.target))reposicionar();};document.addEventListener('scroll',rolar,true);
  app._menuCanvas={menu,limpar:()=>{fecharNiveis();retornos.clear();menu.remove();document.removeEventListener('pointerdown',fora,true);document.removeEventListener('keydown',tecla,true);document.removeEventListener('scroll',rolar,true);window.removeEventListener('resize',reposicionar);window.visualViewport?.removeEventListener('resize',reposicionar);}};
  reposicionar();animarMenu(menu,app.ui);busca.focus();
}
