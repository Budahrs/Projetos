export const TIPOS_INTERFACE_MENU = ['ribbon','lateral','contextual','janela'];
export const EVENTOS_BLOCOS_MENU = ['onClick','onContext','onHover','onLeave','onFocus','onChange'];
export const ACOES_BLOCOS_MENU = ['ferramenta','abrir','fechar','alternar','mostrarSo','destacar'];
export function comportamentosComando(c) {
  return c.comportamentos ?? [{evento:'onClick',acao:'ferramenta',ferramentaId:c.ferramentaId||c.id,ativo:true}];
}
export function validarComportamentosMenu(p) {
  const erros=[],tipos=p?.designer?.tipoInterface;
  if(tipos&&!TIPOS_INTERFACE_MENU.includes(tipos))erros.push('Tipo de interface inválido.');
  const abas=Array.isArray(p?.designer?.abas)?p.designer.abas:[];
  const comandos=abas.flatMap(a=>Array.isArray(a.grupos)?a.grupos.flatMap(g=>g.comandos||[]):[]);
  const alvos=new Set(abas.flatMap(a=>[a.id,...(a.grupos||[]).flatMap(g=>[g.id,...(g.comandos||[]).map(c=>c.id)])]));
  const banco=new Set((p?.bancoFerramentas||[]).map(t=>t.id));
  for(const c of comandos){
    if(c.comportamentos!==undefined&&!Array.isArray(c.comportamentos)){erros.push('Lista de comportamentos inválida.');continue;}
    const lista=comportamentosComando(c);if(lista.length>32)erros.push('Use até 32 comportamentos por comando.');
    for(const b of lista){if(!EVENTOS_BLOCOS_MENU.includes(b.evento)||!ACOES_BLOCOS_MENU.includes(b.acao))erros.push('Comportamento inválido em '+c.rotulo);
      if(b.ativo===false)continue;
      if(b.acao==='ferramenta'&&banco.size&&!banco.has(b.ferramentaId||c.ferramentaId||c.id))erros.push('Ferramenta do comportamento não encontrada.');
      if(b.acao!=='ferramenta'&&!alvos.has(b.alvo||c.id))erros.push('Alvo do comportamento não encontrado.');
    }
  }
  return erros;
}
export function refBlocoMenu(p,id) {
  for(const a of p.designer.abas){if(a.id===id)return 'painel_'+id;for(const g of a.grupos){if(g.id===id)return 'grupo_'+id;if(g.comandos.some(c=>c.id===id))return 'cmd_'+id;}}
  return 'cmd_'+id;
}
export function eventosComandoMenu(c,p,evento) {
  return comportamentosComando(c).filter(b=>b.ativo!==false).map(b=>evento(b.evento,b.acao==='ferramenta'?'':b.acao,b.acao==='ferramenta'?'':refBlocoMenu(p,b.alvo||c.id),b.acao==='ferramenta'?`${p.designer.prefixoSinal||'app'}|${b.ferramentaId||c.ferramentaId||c.id}`:''));
}

// Autocontido: também executa no HTML exportado, sem dependência do editor.
function runtimeBlocosMenu(config) {
  const abas=document.querySelector('nav.abas'),paineis=[...document.querySelectorAll('[role=tabpanel]')],estado=document.getElementById('estado');
  const superficie=document.createElement('section');superficie.id='menu-superficie';superficie.dataset.tipo=config.tipo;
  abas.before(superficie);superficie.append(abas,...paineis);
  const estilo=document.createElement('style');estilo.textContent=`#menu-superficie[hidden],#menu-abrir[hidden]{display:none!important}.menu-blocos-topo{display:flex;align-items:center;gap:12px;padding:8px 12px;background:var(--cabecalho);position:sticky;top:0;z-index:5}.menu-blocos-topo strong{flex:1}.menu-blocos-topo button{padding:4px 10px}#menu-superficie[data-tipo=lateral]{width:min(340px,100%);max-height:100dvh;overflow:auto;background:var(--painel)}[data-tipo=lateral]>.abas{flex-direction:column;align-items:stretch}[data-tipo=lateral]>.painel{flex-direction:column}[data-tipo=lateral] .grupo{border-right:0;border-bottom:1px solid var(--borda)}#menu-superficie[data-tipo=contextual]{position:fixed;left:8px;top:48px;width:min(380px,calc(100vw - 16px));max-height:calc(100dvh - 16px);overflow:auto;background:var(--painel);box-shadow:0 12px 40px #0005;z-index:10}[data-tipo=contextual]>.abas,[data-tipo=contextual]>.painel{flex-direction:column}[data-tipo=contextual] .acoes{flex-direction:column}#menu-superficie[data-tipo=janela]{box-sizing:border-box;width:min(960px,calc(100% - 24px));max-height:calc(100dvh - 32px);margin:16px auto;overflow:auto;background:var(--painel);border-radius:10px;box-shadow:0 12px 40px #0005}.bloco-realce{outline:3px solid var(--acento)!important}`;document.head.append(estilo);
  const abridor=document.createElement('button');abridor.id='menu-abrir';abridor.textContent=config.tipo==='contextual'?'Abrir opções (ou botão direito)':'Abrir '+config.nome;abridor.hidden=config.tipo==='ribbon';superficie.before(abridor);
  const fechar=()=>{superficie.hidden=true;abridor.focus();};
  function abrir(e){superficie.hidden=false;if(config.tipo==='contextual'){const r=superficie.getBoundingClientRect();superficie.style.left=Math.max(8,Math.min(e?.clientX||8,innerWidth-r.width-8))+'px';superficie.style.top=Math.max(8,Math.min(e?.clientY||48,innerHeight-r.height-8))+'px';}}
  abridor.addEventListener('click',abrir);
  if(config.tipo!=='ribbon'){
    const cab=document.createElement('header');cab.className='menu-blocos-topo';const nome=document.createElement('strong');nome.textContent=config.nome;
    const x=document.createElement('button');x.type='button';x.textContent='×';x.setAttribute('aria-label','Fechar '+config.nome);x.addEventListener('click',fechar);cab.append(nome,x);superficie.prepend(cab);
    if(['contextual','janela'].includes(config.tipo)){superficie.setAttribute('role','dialog');superficie.setAttribute('aria-label',config.nome);}
  }
  if(config.tipo==='contextual')document.addEventListener('contextmenu',e=>{e.preventDefault();abrir(e);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&['contextual','janela'].includes(config.tipo))fechar();});
  const localizar=id=>document.getElementById(id)||[...document.querySelectorAll('[data-grupo],[data-controle]')].find(n=>n.dataset.grupo===id||n.dataset.controle===id);
  for(const [evento,dom]of Object.entries({onClick:'click',onContext:'contextmenu',onHover:'mouseenter',onLeave:'mouseleave',onFocus:'focus',onChange:'change'}))document.addEventListener(dom,e=>{
    const no=e.target.closest?.('[data-controle]');if(!no)return;const c=config.comandos.find(c=>c.id===no.dataset.controle);if(!c)return;
    for(const b of c.comportamentos){if(b.ativo===false||b.evento!==evento)continue;if(evento==='onContext')e.preventDefault();
      if(b.acao==='ferramenta'){const id=b.ferramentaId||c.ferramentaId||c.id;estado.textContent='Comando enviado ao host: '+id;document.dispatchEvent(new CustomEvent('hefestus:comando',{detail:{id}}));document.dispatchEvent(new CustomEvent('hefestus:sinal',{detail:{sinal:config.prefixo+'|'+id}}));}
      else{const n=localizar(b.alvo||c.id);if(!n)continue;if(b.acao==='abrir')n.hidden=false;if(b.acao==='fechar')n.hidden=true;if(b.acao==='alternar')n.hidden=!n.hidden;if(b.acao==='mostrarSo')for(const irmao of n.parentElement.children)if(irmao.matches('[role=tabpanel],[data-grupo]'))irmao.hidden=irmao!==n;if(b.acao==='destacar'){n.classList.add('bloco-realce');setTimeout(()=>n.classList.remove('bloco-realce'),700);}}
    }
  },true);
}
export function adaptarMenuWeb(html,p) {
  const config={nome:p.nome,tipo:p.designer.tipoInterface||'ribbon',prefixo:p.designer.prefixoSinal||'app',comandos:p.designer.abas.flatMap(a=>a.grupos.flatMap(g=>g.comandos.map(c=>({...c,comportamentos:comportamentosComando(c)}))))};
  return html.replace('</html>',`<script>(${runtimeBlocosMenu.toString()})(${JSON.stringify(config).replace(/</g,'\\u003c')});<\/script></html>`);
}

/** Peças nativas: o Designer mantém cada comando, texto e grupo selecionável. */
export function criarModeloMenuAlternativo(p,{cont,texto,botao,achatar,assentar,evento}) {
  const tipo=p.designer.tipoInterface,w=tipo==='contextual'?380:960,h=640,nav=tipo==='lateral'?230:0;
  const bt=(x,y,l,a,t,extra={})=>botao(x,y,l,a,t,'#e8eaed','#182b36','#87989f',extra);
  const grupos=a=>a.grupos.map(g=>cont(0,0,tipo==='contextual'?344:660,100,{modo:'coluna',margem:8,espaco:5,abracar:true},{ref:'grupo_'+g.id,'estilo.fundo':'#f5f6f8'},g.nome,[texto(0,0,300,24,g.nome,'#4b6068',13),...g.comandos.map(c=>bt(0,0,tipo==='contextual'?320:630,36,c.rotulo,{ref:'cmd_'+c.id,eventos:eventosComandoMenu(c,p,evento),'acessibilidade.atalho':c.atalho||''}))]));
  const paineis=p.designer.abas.map((a,i)=>cont(0,0,tipo==='contextual'?360:700,540,{modo:'coluna',margem:8,espaco:8,abracar:true},{ref:'painel_'+a.id,visivel:i===0,'estilo.fundo':'#e8eaed','acessibilidade.role':'tabpanel'},a.nome,grupos(a)));
  const abas=p.designer.abas.map((a,i)=>bt(tipo==='lateral'?0:i*150,0,tipo==='lateral'?210:146,36,a.nome,{eventos:[evento('onClick','mostrarSo','painel_'+a.id,'')]}));
  const cab=cont(0,0,w,44,{modo:'livre'},{'estilo.fundo':'#d3d8de'},'Cabeçalho',[texto(12,8,w-70,30,p.nome,'#182b36',16),bt(w-48,6,36,30,'×',{eventos:[evento('onClick','fechar','menu_root','')],'acessibilidade.ariaLabel':'Fechar '+p.nome})]);
  let filhos;
  if(tipo==='lateral')filhos=[cont(0,44,nav,h-44,{modo:'coluna',margem:8,espaco:5},{'estilo.fundo':'#d3d8de'},'Navegação',abas),cont(nav,44,w-nav,h-44,{modo:'livre'},{'estilo.fundo':'#e8eaed'},'Conteúdo',paineis)];
  else filhos=[cont(0,44,w,42,{modo:'linha',espaco:4,margem:4,abracar:true},{},'Abas',abas),cont(0,90,w,h-90,{modo:'livre'},{},'Conteúdo',paineis)];
  const janela=cont(0,54,w,h,{modo:'livre'},{ref:'menu_root','estilo.fundo':'#e8eaed','estilo.raio':tipo==='janela'?10:4,abertura:{iniciaFechado:tipo==='contextual',fecharEsc:true,fecharFora:tipo==='contextual',ancorar:tipo==='contextual'},codigo:{js:"raiz.style.maxHeight='calc(100vh - 24px)';raiz.style.maxWidth='calc(100vw - 16px)';raiz.style.overflow='auto';"}},p.nome,[cab,...filhos]);
  const abrir=bt(0,0,280,42,tipo==='contextual'?'Opções (clique ou botão direito)':'Abrir '+p.nome,{eventos:[evento('onClick','abrir','menu_root',''),...(tipo==='contextual'?[evento('onContext','abrir','menu_root','')]:[])]});
  const elementos=achatar([abrir,janela]),tamanho=assentar(elementos);
  return {id:p.id+'-'+tipo,nome:p.nome+' · '+tipo,cat:'Meus modelos',desc:'Interface por blocos; peças nativas editáveis',usuario:true,tags:['menu',tipo,'blocos'],comportamento:{pacote:structuredClone(p),bancoFerramentas:p.bancoFerramentas||[]},...tamanho,elementos};
}

export function criarModeloRibbonBlocos(p,{cont,texto,botao,achatar,assentar,evento}) {
  const limite=Math.max(2,Math.min(6,Number(p.designer.limiteVisivel)||3));
  const w=1360,abas=p.designer.abas;
  const cmd=(c,x,y,l,a)=>botao(x,y,l,a,c.rotulo,c.destaque?'#c8d9e6':'#e8eaed','#182b36','#87989f',{ref:'cmd_'+c.id,eventos:eventosComandoMenu(c,p,evento),'acessibilidade.ariaLabel':c.rotulo,'acessibilidade.atalho':c.atalho||''});
  let x=0;
  const cab=abas.map(a=>{const l=Math.max(115,a.nome.length*7+24),b=botao(x,0,l,38,a.nome,'#d3d8de','#182b36','#87989f',{eventos:[evento('onClick','mostrarSo','painel_'+a.id,'')]});x+=l+3;return b;});
  const panels=abas.map((a,i)=>cont(0,42,w,160,{modo:'linha',margem:6,espaco:10},{ref:'painel_'+a.id,visivel:i===0,'estilo.fundo':'#e8eaed','acessibilidade.role':'tabpanel',menu:{adaptativo:true}},a.nome,a.grupos.map(g=>{
    const visiveis=g.comandos.slice(0,limite),extras=g.comandos.slice(limite),principal=visiveis.find(c=>c.destaque),filhos=[];
    if(principal)filhos.push(cmd(principal,4,4,88,84));
    const pequenos=visiveis.filter(c=>c!==principal);
    pequenos.forEach((c,j)=>filhos.push(cmd(c,principal?98:4,4+j*30,principal?154:248,28)));
    if(extras.length){
      filhos.push(botao(4,94,248,28,'Mais ('+extras.length+')','#e8eaed','#182b36','#87989f',{eventos:[evento('onClick','alternar','mais_'+g.id,'')]}));
      filhos.push(cont(4,124,280,Math.min(400,extras.length*34+48),{modo:'livre'},{ref:'mais_'+g.id,visivel:false,'estilo.fundo':'#f5f6f8','estilo.borda':'#87989f','estilo.larguraBorda':1,abertura:{iniciaFechado:true,fecharEsc:true,fecharFora:true,ancorar:true},codigo:{js:"raiz.style.maxHeight='calc(100vh - 16px)';raiz.style.overflow='auto';"}},'Mais de '+g.nome,[texto(8,6,226,28,g.nome,'#182b36',13),botao(242,4,30,28,'×','#e8eaed','#182b36','#87989f',{eventos:[evento('onClick','fechar','mais_'+g.id,'')],'acessibilidade.ariaLabel':'Fechar '+g.nome}),...extras.map((c,j)=>cmd(c,6,40+j*34,266,32))]));
    }
    filhos.push(texto(4,126,248,22,g.nome,'#4d5965',12));
    return cont(0,0,260,150,{modo:'livre'},{ref:'grupo_'+g.id,'estilo.fundo':'#e8eaed'},'Grupo '+g.nome,filhos);
  })));
  const elementos=achatar([cont(0,0,w,38,{modo:'livre'},{},'Abas',cab),cont(0,42,w,160,{modo:'livre'},{},'Painéis',panels)]);
  return {id:p.id,nome:p.nome,cat:'Meus modelos',desc:'Ribbon padronizado por blocos: grupos, destaque e Mais',usuario:true,tags:['menu','ribbon','blocos'],comportamento:{prefixoSinal:p.designer.prefixoSinal,pacote:structuredClone(p),bancoFerramentas:p.bancoFerramentas||[]},...assentar(elementos),elementos};
}
