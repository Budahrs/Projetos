import { h, botaoIcone, capturarFoco } from './dom.js';
import { motorMenus } from '../nucleo/motorMenus.js';
import { animarMenu } from './movimentoMenus.js';

export function abrirConfiguracaoFlutuante(app,id,tipo='aparencia',x=24,y=100) {
  app._fecharConfiguracao?.();if(!app.n.elemento(id))return;
  app.n.selecionar(id);
  const anterior=document.activeElement,editor=new app.dir.constructor(app),corpo=h('div',{class:'config-corpo'});
  let aba=tipo,parar=()=>{},fechada=false;
  const fechar=()=>{if(fechada)return;fechada=true;parar();document.removeEventListener('keydown',tecla,true);document.removeEventListener('pointerdown',fora,true);window.removeEventListener('resize',posicionar);window.visualViewport?.removeEventListener('resize',posicionar);painel.remove();app._fecharConfiguracao=null;if(anterior?.isConnected)anterior.focus();};
  const tabs=h('div',{class:'config-abas',role:'group','aria-label':'Categorias de configuração'});
  const painel=h('section',{class:'config-flutuante',role:'dialog','aria-label':'Configuração do elemento'},h('header',{},h('strong',{},'Configuração'),botaoIcone('fechar','Fechar configuração',fechar)),tabs,corpo);
  const posicionar=()=>motorMenus().limitarPainel(painel,{left:x,right:x,top:y,bottom:y});
  const render=()=>{
    if(!app.n.elemento(id)||app.n.selecionados().length!==1||app.n.selecionados()[0]!==id){fechar();return;}
    const restaurarFoco=capturarFoco();
    tabs.replaceChildren(...[['aparencia','Aparência'],['comportamento','Comportamento'],['eventos','Conectar evento']].map(([chave,rotulo])=>h('button',{type:'button','aria-pressed':String(aba===chave),onclick:()=>{aba=chave;render();}},rotulo)));
    corpo.replaceChildren(h('p',{class:'painel-vazio'},'Elemento: '+app.n.rotulo(id)),...(aba==='aparencia'?[...editor.p_estilo(),...editor.p_efeitos()]:aba==='comportamento'?editor.p_comportamento():[
      h('button',{type:'button',class:'bt-texto',onclick:()=>{fechar();app.vincularSelecao();}},'Conectar evento a ferramenta do armazém…'),
      h('p',{class:'painel-vazio'},'Para animar uma abertura, escolha o gatilho e o alvo em Comportamento; ajuste a animação do alvo. Eventos também podem emitir sinais e aplicar ações visuais.'),...editor.p_eventos()]));
    const ids=new Map();corpo.querySelectorAll('[id]').forEach(e=>{const antigo=e.id;e.id='config-flutuante-'+antigo;ids.set(antigo,e.id);});corpo.querySelectorAll('label[for]').forEach(e=>{const novo=ids.get(e.htmlFor);if(novo)e.htmlFor=novo;});
    posicionar();restaurarFoco();
  };
  editor.render=render;
  const tecla=e=>{if(e.key==='Escape'&&!document.querySelector('.veu:not([hidden])')){e.preventDefault();e.stopPropagation();fechar();}};
  const fora=e=>{if(!painel.contains(e.target)&&!e.target.closest?.('.veu'))fechar();};
  document.body.append(painel);render();animarMenu(painel,app.ui);tabs.querySelector('button')?.focus();
  parar=app.n.on(render);document.addEventListener('keydown',tecla,true);document.addEventListener('pointerdown',fora,true);window.addEventListener('resize',posicionar);window.visualViewport?.addEventListener('resize',posicionar);app._fecharConfiguracao=fechar;
}
