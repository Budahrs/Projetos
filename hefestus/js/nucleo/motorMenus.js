// Autocontido para ser incluído também nos artefatos exportados, sem eval ou dependências.
export function motorMenus() {
  const numero = (v, padrao) => Number.isFinite(Number(v)) ? Number(v) : padrao;
  const medicaoNecessaria=(anterior,atual,sujo=false)=>sujo||Math.abs(anterior-atual)>=.5;
  function posicionar(r, largura, altura, vw, vh, { lado='baixo', rtl=false, margem=8 }={}) {
    const w=Math.min(Math.max(0,largura),Math.max(0,vw-margem*2));
    const h=Math.min(Math.max(0,altura),Math.max(0,vh-margem*2));
    let x=rtl?r.right-w:r.left, y=r.bottom+4, destino=lado;
    if(lado==='direita') {
      const direita=vw-r.right-margem, esquerda=r.left-margem;
      const usarEsquerda=rtl?esquerda>=w||esquerda>direita:direita<w&&esquerda>direita;
      x=usarEsquerda?r.left-w-4:r.right+4; y=r.top; destino=usarEsquerda?'esquerda':'direita';
    } else if(vh-r.bottom-margem<h && r.top-margem>vh-r.bottom-margem) { y=r.top-h-4;destino='cima'; }
    return { x:Math.max(margem,Math.min(x,vw-margem-w)), y:Math.max(margem,Math.min(y,vh-margem-h)), largura:w, altura:h, lado:destino };
  }
  function corredor(p, origem, r, folga=8) {
    if(!p||!origem||!r)return false;
    if(p.x>=r.left-folga&&p.x<=r.right+folga&&p.y>=r.top-folga&&p.y<=r.bottom+folga)return true;
    const x=origem.x<=r.left?r.left-folga:r.right+folga;
    const a=origem,b={x,y:r.top-folga},c={x,y:r.bottom+folga};
    const cruz=(v,w,t)=>(w.x-v.x)*(t.y-v.y)-(w.y-v.y)*(t.x-v.x);
    if(Math.abs(cruz(a,b,c))<.01)return false;
    const valores=[cruz(a,b,p),cruz(b,c,p),cruz(c,a,p)];
    return valores.every(v=>v>=0)||valores.every(v=>v<=0);
  }
  /** Um único contrato de tamanho para popups, galerias e faixas suspensas. */
  function limitarPainel(el,ancora,opcoes={}) {
    const win=el.ownerDocument.defaultView,v=win.visualViewport;
    const vw=Math.max(0,v?.width??win.innerWidth),vh=Math.max(0,v?.height??win.innerHeight),ox=v?.offsetLeft??0,oy=v?.offsetTop??0;
    const margem=Math.min(8,vw/2,vh/2);
    el.style.boxSizing='border-box';el.style.minWidth='0';el.style.minHeight='0';
    el.style.maxWidth=Math.max(0,vw-2*margem)+'px';el.style.maxHeight=Math.max(0,vh-2*margem)+'px';el.style.overflow='auto';
    const r={left:ancora.left-ox,right:ancora.right-ox,top:ancora.top-oy,bottom:ancora.bottom-oy};
    const pos=posicionar(r,el.offsetWidth,el.offsetHeight,vw,vh,{...opcoes,margem});
    el.style.position='fixed';el.style.left=pos.x+ox+'px';el.style.top=pos.y+oy+'px';el.style.right='auto';el.style.bottom='auto';el.style.margin='0';return pos;
  }
  function animar(el,{tipo='aparecer',duracao=180}={}) {
    if(!el?.animate||el.ownerDocument.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return null;
    const quadros=tipo==='revelar'?[{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0 0)'}]:tipo==='pulsar'?[{opacity:1},{opacity:.35},{opacity:1}]:[{opacity:0},{opacity:1}];
    return el.animate(quadros,{duration:Math.max(80,Math.min(2000,numero(duracao,180))),easing:'ease-out'});
  }
  function protegerSubmenu(gatilho,painel,aoSair,{prazo=350}={}) {
    const doc=gatilho.ownerDocument,win=doc.defaultView;
    let origem=null,timer=0,inicio=0;
    const cancelar=()=>{win.clearTimeout(timer);timer=0;origem=null;};
    const sair=e=>{if(e.pointerType==='touch')return;cancelar();origem={x:e.clientX,y:e.clientY};inicio=Date.now();timer=win.setTimeout(()=>{cancelar();aoSair();},prazo);};
    const mover=e=>{if(!origem)return;if(gatilho.contains(e.target)||painel.contains(e.target)){cancelar();return;}if(Date.now()-inicio>prazo||!corredor({x:e.clientX,y:e.clientY},origem,painel.getBoundingClientRect())){cancelar();aoSair();}};
    gatilho.addEventListener('pointerleave',sair);painel.addEventListener('pointerenter',cancelar);painel.addEventListener('pointerleave',sair);doc.addEventListener('pointermove',mover);
    return { contem:p=>!!origem&&Date.now()-inicio<prazo&&corredor(p,origem,painel.getBoundingClientRect()),destruir(){cancelar();gatilho.removeEventListener('pointerleave',sair);painel.removeEventListener('pointerenter',cancelar);painel.removeEventListener('pointerleave',sair);doc.removeEventListener('pointermove',mover);} };
  }
  /** Um único ponto de Tab por barra; controles de edição mantêm suas teclas nativas. */
  function tecladoBarra(host,{vertical=false,seletor='button,[role="button"],[role="tab"],input,select',tabSai}={}) {
    const doc=host.ownerDocument,win=doc.defaultView,originais=new Map(); let atual=null;
    const itens=()=>[...host.querySelectorAll(seletor)].filter(el=>!el.hidden&&!el.disabled&&el.getClientRects().length&&win.getComputedStyle(el).visibility!=='hidden');
    function atualizar() {const lista=itens();if(!lista.includes(atual))atual=lista.find(e=>e===doc.activeElement)||lista.find(e=>e.getAttribute('aria-selected')==='true')||lista[0];for(const el of lista){if(!originais.has(el))originais.set(el,el.getAttribute('tabindex'));el.tabIndex=el===atual?0:-1;}for(const [el,valor]of originais)if(el.isConnected===false){valor===null?el.removeAttribute('tabindex'):el.setAttribute('tabindex',valor);originais.delete(el);}}
    const focar=el=>{atual=el;atualizar();el?.focus();};
    const foco=e=>{const el=itens().find(el=>el===e.target||el.contains(e.target));if(el){atual=el;atualizar();}};
    const tecla=e=>{
      if(e.defaultPrevented)return;
      const lista=itens();if(!lista.length)return;
      if(e.key==='Tab'){tabSai?.(e);return;}
      if(e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      const i=lista.indexOf(doc.activeElement),rtl=win.getComputedStyle(host).direction==='rtl';
      const delta=vertical?({ArrowDown:1,ArrowUp:-1}[e.key]):({ArrowRight:rtl?-1:1,ArrowLeft:rtl?1:-1}[e.key]);
      if(delta!==undefined){e.preventDefault();e.stopPropagation();focar(lista[(i+delta+lista.length)%lista.length]);}
      else if(e.key==='Home'||e.key==='End'){e.preventDefault();e.stopPropagation();focar(e.key==='Home'?lista[0]:lista.at(-1));}
    };
    host.addEventListener('keydown',tecla);host.addEventListener('focusin',foco);host.addEventListener('pointerdown',foco);atualizar();
    const tamanho=win.ResizeObserver?new win.ResizeObserver(atualizar):null;tamanho?.observe(host);
    const mutacoes=win.MutationObserver?new win.MutationObserver(atualizar):null;mutacoes?.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','disabled','aria-disabled','aria-selected']});
    return {atualizar,destruir(){tamanho?.disconnect();mutacoes?.disconnect();host.removeEventListener('keydown',tecla);host.removeEventListener('focusin',foco);host.removeEventListener('pointerdown',foco);for(const [el,valor]of originais)valor===null?el.removeAttribute('tabindex'):el.setAttribute('tabindex',valor);}};
  }
  function planejar(grupos, largura, { espaco = 0, reserva = 64, forcar } = {}) {
    const itens = grupos.map((g, i) => ({ ...g, indice: i, nivel: 0,
      prioridade: numero(g.prioridade, 100),
      larguras: (g.larguras?.length ? g.larguras : [0]).map(w => Math.max(0, numero(w, 0))) }));
    const limite = Math.max(0, numero(largura, 0));
    const total = () => {
      const visiveis = itens.filter(g => g.nivel < g.larguras.length);
      return visiveis.reduce((s, g) => s + g.larguras[g.nivel], 0)
        + Math.max(0, visiveis.length - 1) * Math.max(0, espaco)
        + (visiveis.length < itens.length ? Math.max(0, reserva) + (visiveis.length ? espaco : 0) : 0);
    };
    if (forcar !== undefined) {
      for (const g of itens) g.nivel = Math.min(g.larguras.length, Math.max(0, Math.floor(numero(forcar, 0))));
    } else {
      // Empates mantêm a ordem de leitura; prioridades menores cedem antes.
      const ordem = [...itens].sort((a, b) => a.prioridade - b.prioridade || b.indice - a.indice);
      while (total() > limite + 1) {
        const g = ordem.find(g => !g.protegido && g.nivel < g.larguras.length);
        if (!g) break;
        g.nivel++;
      }
    }
    return { grupos: itens, overflow: itens.filter(g => g.nivel === g.larguras.length),
      largura: total(), cabe: total() <= limite + 1 };
  }

  /** Adapta grupos REAIS: move os próprios controles para um painel, preservando eventos e IDs. */
  function instalar(host, grupos, opcoes = {}) {
    const doc = host.ownerDocument, win = doc.defaultView;
    let frame = 0, aberto = null, destruido = false, ultimaLargura = -1, sujo = true;
    const eventos = [], snapshots = new Map();
    const on = (e, tipo, f) => { e.addEventListener(tipo, f); eventos.push(() => e.removeEventListener(tipo, f)); };
    const salvar = el => { if (!snapshots.has(el)) snapshots.set(el, { style: el.getAttribute('style'), hidden: el.hidden }); };
    const restaurar = el => { const s = snapshots.get(el); if (!s) return; s.style === null ? el.removeAttribute('style') : el.setAttribute('style', s.style); el.hidden = s.hidden; };
    salvar(host);
    host.style.display = 'flex'; host.style.flexDirection = 'row';
    host.style.flexWrap = 'nowrap'; host.style.minWidth = '0';
    host.style.maxWidth = '100%'; host.style.width = '100%';
    const mais = doc.createElement('button'); mais.type = 'button'; mais.textContent = 'Mais ▾';
    mais.setAttribute('aria-label', 'Mais grupos de comandos'); mais.setAttribute('aria-haspopup', 'dialog');
    mais.style.cssText = 'flex:0 0 64px;min-height:36px;align-self:center;cursor:pointer';
    host.append(mais);
    const registros = grupos.map(g => {
      const el = g.el; salvar(el);
      const ancora = doc.createComment('grupo adaptativo'); el.before(ancora);
      const botao = doc.createElement('button'); botao.type = 'button';
      botao.textContent = (g.nome || 'Grupo') + ' ▾'; botao.title = g.nome || 'Grupo';
      botao.setAttribute('aria-haspopup', 'dialog'); botao.setAttribute('aria-expanded', 'false');
      botao.style.cssText = 'flex:0 0 72px;width:72px;min-height:48px;white-space:normal;overflow-wrap:anywhere;cursor:pointer';
      ancora.after(botao);
      const r = { ...g, el, ancora, botao };
      on(botao, 'click', () => abrir([r], botao));
      return r;
    });
    const barra = tecladoBarra(host);
    function fechar(foco = false) {
      if (!aberto) return;
      const a = aberto; aberto = null;
      a.teclado?.destruir();
      for (const r of a.grupos) { r.ancora.after(r.el); restaurar(r.el); }
      a.painel.remove(); a.gatilho.setAttribute('aria-expanded', 'false');
      a.gatilho.removeAttribute('aria-controls');
      if (foco && a.gatilho.isConnected) a.gatilho.focus();
      sujo = true; agendar();
    }
    function abrir(rs, gatilho) {
      if (aberto?.gatilho === gatilho) { fechar(true); return; }
      fechar();
      const painel = doc.createElement('div'); painel.setAttribute('role', 'dialog'); painel.setAttribute('aria-modal','false');
      painel.id=(host.id||'hf-faixa')+'-overflow-'+Date.now().toString(36);
      gatilho.setAttribute('aria-controls',painel.id);
      painel.setAttribute('aria-label', rs.length === 1 ? rs[0].nome || 'Comandos' : 'Mais grupos de comandos');
      painel.style.cssText = 'position:fixed;z-index:2147483000;box-sizing:border-box;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:auto;padding:12px;background:Canvas;color:CanvasText;border:1px solid GrayText;border-radius:8px;box-shadow:0 8px 32px #0004;display:flex;flex-direction:column;gap:12px';
      const fecharBt = doc.createElement('button'); fecharBt.type = 'button'; fecharBt.textContent = 'Fechar';
      fecharBt.onclick = () => fechar(true); painel.append(fecharBt);
      for (const r of rs) {
        const secao = doc.createElement('section'), titulo = doc.createElement('h3');
        titulo.textContent = r.nome || 'Grupo'; titulo.style.cssText = 'font:600 13px system-ui;margin:0 0 8px';
        secao.append(titulo, r.el); painel.append(secao);
        restaurar(r.el); r.el.hidden = false;
        // O grupo conserva sua estrutura e tem rolagem local se um controle for indivisível.
        r.el.style.position = 'relative'; r.el.style.left = 'auto'; r.el.style.top = 'auto';
        r.el.style.maxWidth = 'calc(100vw - 48px)'; r.el.style.overflow = 'auto';
        r.el.style.display = opcoes.editor ? 'flex' : r.el.style.display;
        if (opcoes.editor) r.el.dataset.nivel = '0';
      }
      (opcoes.camada || doc.body).append(painel);
      const reposicionar = () => {
        limitarPainel(painel,gatilho.getBoundingClientRect(),{rtl:win.getComputedStyle(host).direction==='rtl'});
      };
      reposicionar();
      aberto = { painel, gatilho, grupos: rs }; gatilho.setAttribute('aria-expanded', 'true');
      aberto.reposicionar = reposicionar;
      (painel.querySelector('button:not([disabled]),input:not([disabled])') || painel).focus();
      aberto.teclado = tecladoBarra(painel,{tabSai:()=>fechar(true)});
    }
    function aplicar() {
      frame = 0; if (destruido || aberto || !host.isConnected || host.clientWidth < 1) return;
      const medida=host.clientWidth;
      if(!medicaoNecessaria(ultimaLargura,medida,sujo))return;
      sujo=false;ultimaLargura=medida;
      mais.hidden = true;
      for (const r of registros) {
        restaurar(r.el); r.botao.hidden = true;
        if (opcoes.editor) r.el.dataset.nivel = '0';
        else { r.el.style.position = 'relative'; r.el.style.left = 'auto'; r.el.style.top = 'auto'; r.el.style.flex = '0 0 auto'; }
      }
      const ativos = registros.filter(r => !r.el.hidden && win.getComputedStyle(r.el).display !== 'none');
      const gap = parseFloat(win.getComputedStyle(host).columnGap) || 0;
      const padding = parseFloat(win.getComputedStyle(host).paddingLeft) + parseFloat(win.getComputedStyle(host).paddingRight) || 0;
      const medidos = ativos.map(r => {
        const larguras = [r.el.offsetWidth];
        if (opcoes.editor) {
          for (const n of [1, 2]) { r.el.dataset.nivel = String(n); larguras.push(r.el.offsetWidth); }
          r.el.dataset.nivel = '0';
        } else {
          // Níveis intermediários só são usados quando têm uma definição mensurável.
          larguras.push(r.el.offsetWidth, 72);
        }
        return { ...r, larguras: opcoes.editor ? [...larguras, 72] : larguras };
      });
      const plano = planejar(medidos, host.clientWidth - padding, { espaco: gap, reserva: 64, forcar: opcoes.forcar });
      for (const r of plano.grupos) {
        const ultimo = r.larguras.length - 1;
        if (r.nivel >= ultimo) { r.el.hidden = true; r.botao.hidden = r.nivel > ultimo; }
        else if (opcoes.editor) r.el.dataset.nivel = String(r.nivel);
      }
      mais.hidden = !plano.overflow.length;
      mais.onclick = () => abrir(plano.overflow, mais);
      host.dataset.menuCabe = String(plano.cabe);
      barra.atualizar();
    }
    function agendar() { if (!destruido && !frame) frame = win.requestAnimationFrame(aplicar); }
    on(doc, 'pointerdown', e => { if (aberto && !aberto.painel.contains(e.target) && !aberto.gatilho.contains(e.target)) fechar(); });
    on(doc, 'keydown', e => { if (e.key === 'Escape' && aberto) { e.preventDefault(); e.stopPropagation(); fechar(true); } });
    on(win, 'resize', () => { fechar(); agendar(); });
    const rolagem = ()=>aberto?.reposicionar();doc.addEventListener('scroll',rolagem,true);eventos.push(()=>doc.removeEventListener('scroll',rolagem,true));
    const obs = win.ResizeObserver ? new win.ResizeObserver(()=>{if(medicaoNecessaria(ultimaLargura,host.clientWidth))agendar();}) : null; obs?.observe(host);
    const invalidar=()=>{sujo=true;agendar();};
    doc.fonts?.ready.then(invalidar); if(doc.fonts?.addEventListener)on(doc.fonts,'loadingdone',invalidar); agendar();
    return { atualizar: invalidar, fechar,
      destruir() { destruido = true; fechar(); win.cancelAnimationFrame(frame); obs?.disconnect(); eventos.forEach(f => f());
        barra.destruir();
        for (const r of registros) { r.ancora.after(r.el); restaurar(r.el); r.botao.remove(); r.ancora.remove(); }
        mais.remove(); restaurar(host); delete host.dataset.menuCabe;
      } };
  }
  /** Sidebar tem máquina de estados própria; o modo automático nunca é persistido como preferência. */
  function sidebar(largura, { modo = 'auto', aberto = false, compactoAbaixo = 1024, minimalAbaixo = 640,
    expandida = 264, compacta = 56, recolhida = false } = {}) {
    const w = Math.max(0, numero(largura, 0));
    const min = Math.max(0, numero(minimalAbaixo, 640));
    const comp = Math.max(min, numero(compactoAbaixo, 1024));
    const atual = ['open', 'compact', 'minimal'].includes(modo) ? modo : w < min ? 'minimal' : w < comp ? 'compact' : 'open';
    const final = w<min ? 'minimal' : atual === 'open' && recolhida ? 'compact' : atual;
    const overlay = final === 'minimal';
    const pane = overlay ? !!aberto : true;
    const tamanho = pane ? Math.min(w, final === 'compact' ? Math.max(48, numero(compacta, 56)) : Math.max(160, numero(expandida, 264))) : 0;
    return { modo: final, overlay, aberto: pane, largura: tamanho, deslocamento: overlay ? 0 : tamanho };
  }
  function instalarSidebar(host, pane, conteudo, config = {}) {
    const doc = host.ownerDocument, win = doc.defaultView;
    const rotulos = (config.rotulos || []).map(id => host.querySelector('#' + win.CSS.escape(id))).filter(Boolean);
    const snapshots = [host, pane, conteudo, ...rotulos].map(el => [el, el.getAttribute('style'), el.hidden]);
    const chave = 'hefestus:sidebar:v1:' + (config.id || host.id || 'principal');
    let preferencia = { modo: config.modo || 'auto', recolhida: false }, aberta = false, expandirCompacta = false, frame = 0;
    try { const salvo = JSON.parse(win.sessionStorage.getItem(chave)); if (salvo && ['auto','open','compact','minimal'].includes(salvo.modo)) preferencia = { modo: salvo.modo, recolhida: !!salvo.recolhida }; } catch {}
    const toggle = doc.createElement('button'); toggle.type = 'button'; toggle.textContent = '☰';
    toggle.title = 'Abrir ou recolher navegação'; toggle.setAttribute('aria-label', toggle.title);
    toggle.style.cssText = 'position:absolute;top:4px;inset-inline-start:4px;width:40px;height:36px;z-index:2147480001';
    const backdrop = doc.createElement('button'); backdrop.type = 'button'; backdrop.hidden = true;
    backdrop.setAttribute('aria-label','Fechar navegação'); backdrop.style.cssText = 'position:absolute;inset:0;background:#0006;border:0;z-index:2147479999';
    host.append(backdrop, toggle);
    host.style.display = 'flex'; host.style.flexDirection = 'row'; host.style.width = '100%'; host.style.maxWidth = '100%';
    pane.style.boxSizing = 'border-box'; conteudo.style.boxSizing = 'border-box';
    const controles = [...pane.querySelectorAll('button,[role="button"],a')];
    const titulos = controles.map(el => [el, el.getAttribute('title')]);
    for (const e of controles) if (!e.title) e.title = e.getAttribute('aria-label') || e.textContent.trim();
    function aplicar() {
      frame = 0;
      let estado = sidebar(host.clientWidth, { ...config, ...preferencia, aberto: aberta });
      if (estado.modo === 'compact' && expandirCompacta) estado = sidebar(host.clientWidth, { ...config, modo:'open', aberto:true });
      else if (estado.modo !== 'compact') expandirCompacta = false;
      host.dataset.sidebarModo = estado.modo;
      pane.hidden = !estado.aberto;
      if(pane.hidden&&pane.contains(doc.activeElement))toggle.focus();
      pane.style.position = estado.overlay ? 'absolute' : 'relative';
      pane.style.insetInlineStart = '0'; pane.style.top = '0'; pane.style.left = '';
      pane.style.width = estado.largura + 'px'; pane.style.maxWidth = '100%';
      pane.style.flex = '0 0 ' + estado.largura + 'px'; pane.style.overflow = 'auto';
      pane.style.overflowX = 'hidden';
      for (const el of rotulos) el.hidden = estado.modo === 'compact';
      pane.style.zIndex = '2147480000';
      host.style.isolation='isolate';
      const vh=win.visualViewport?.height??win.innerHeight,topo=pane.getBoundingClientRect().top-(win.visualViewport?.offsetTop??0);
      pane.style.maxHeight=Math.max(0,Math.min(host.clientHeight||vh,vh-Math.max(0,topo)))+'px';
      const reduz=win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      pane.style.transition=reduz?'none':'width 180ms ease, flex-basis 180ms ease';
      pane.style.paddingTop = '44px';
      conteudo.style.position = 'relative'; conteudo.style.left = 'auto'; conteudo.style.top = 'auto';
      conteudo.style.zIndex='0';conteudo.style.isolation='isolate';
      conteudo.style.flex = '1 1 0'; conteudo.style.minWidth = '0'; conteudo.style.width = '0';
      conteudo.style.marginInlineStart = estado.overlay ? '44px' : '0';
      backdrop.hidden = !(estado.overlay && estado.aberto);
      toggle.setAttribute('aria-expanded', String(estado.aberto && estado.modo !== 'compact'));
      // Mudança de breakpoint é atômica; um drawer aberto não reaparece ao voltar ao celular.
      if (!estado.overlay) aberta = false;
    }
    const agendar = () => { if (!frame) frame = win.requestAnimationFrame(aplicar); };
    toggle.onclick = () => {
      const atual = sidebar(host.clientWidth, { ...config, ...preferencia });
      if (atual.overlay) aberta = !aberta;
      else if (atual.modo === 'compact') expandirCompacta = !expandirCompacta;
      else { preferencia.recolhida = !preferencia.recolhida; expandirCompacta = false; }
      try { win.sessionStorage.setItem(chave, JSON.stringify(preferencia)); } catch {}
      aplicar(); if (aberta) controles[0]?.focus();
    };
    const fechar = () => { if (!aberta) return; aberta = false; aplicar(); toggle.focus(); };
    backdrop.onclick = fechar;
    const tecla = e => {
      if (!aberta) return;
      if (e.key === 'Escape') { e.preventDefault(); fechar(); }
      if (e.key === 'Tab') {
        const itens = [toggle,...controles].filter(el => !el.disabled && el.getClientRects().length);
        if (itens.length) { e.preventDefault(); const i = itens.indexOf(doc.activeElement); itens[(i + (e.shiftKey ? -1 : 1) + itens.length) % itens.length].focus(); }
      }
    };
    doc.addEventListener('keydown', tecla);
    const fora = e => { if (aberta && !pane.contains(e.target) && !toggle.contains(e.target)) fechar(); };
    doc.addEventListener('pointerdown',fora);
    const navegar=e=>{const item=e.target.closest?.('a,button');if(aberta&&item&&!item.disabled&&!item.hasAttribute('aria-expanded')&&!item.hasAttribute('aria-haspopup'))fechar();};
    pane.addEventListener('click',navegar);
    const obs = win.ResizeObserver ? new win.ResizeObserver(agendar) : null; obs?.observe(host);
    win.addEventListener('resize', agendar); aplicar();
    return { destruir() { obs?.disconnect(); win.removeEventListener('resize', agendar); doc.removeEventListener('keydown', tecla); doc.removeEventListener('pointerdown',fora); win.cancelAnimationFrame(frame);
      pane.removeEventListener('click',navegar);toggle.remove(); backdrop.remove(); delete host.dataset.sidebarModo;
      for (const [el,style,hidden] of snapshots) { style === null ? el.removeAttribute('style') : el.setAttribute('style',style); el.hidden = hidden; }
      for (const [el,title] of titulos) title === null ? el.removeAttribute('title') : el.setAttribute('title',title);
    } };
  }
  function instalarKeyTips(raiz) {
    const doc = raiz.ownerDocument, win = doc.defaultView;
    let dicas = [], sequencia = '', fase = 0;
    const limpar = () => { dicas.forEach(d => d.badge.remove()); dicas = []; sequencia = ''; };
    const encerrar = () => { limpar(); fase = 0; };
    function mostrar(proxima = 1) {
      limpar(); fase = proxima;
      const seletor = fase === 1 ? '[role="tab"]' : 'button:not([disabled]),[role="button"]';
      const itens = [...raiz.querySelectorAll(seletor)].filter(el => el.getClientRects().length && !el.hidden && !el.disabled);
      const largura = itens.length > 9 ? 2 : 1;
      dicas = itens.map((el,i) => {
        const tecla = String(i+1).padStart(largura,'0'), badge = doc.createElement('span'), rect = el.getBoundingClientRect();
        badge.textContent = tecla; badge.setAttribute('aria-hidden','true');
        badge.style.cssText = 'position:fixed;z-index:2147483647;background:Canvas;color:CanvasText;border:1px solid CanvasText;border-radius:3px;padding:1px 4px;font:12px system-ui;pointer-events:none';
        badge.style.left = Math.max(0,Math.min(rect.left,win.innerWidth-24))+'px'; badge.style.top = Math.max(0,Math.min(rect.bottom-8,win.innerHeight-20))+'px';
        doc.body.append(badge); return { el, tecla, badge };
      });
    }
    const tecla = e => {
      if (e.target?.closest?.('input,textarea,select,[contenteditable="true"],[role="dialog"]') && !raiz.contains(e.target)) return;
      if (e.key === 'Alt' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.repeat) { e.preventDefault(); fase ? encerrar() : mostrar(); return; }
      if (!fase) return;
      if (e.key === 'Escape') { e.preventDefault(); encerrar(); return; }
      if (!/^\d$/.test(e.key)) { if (!['Shift','Control','Alt'].includes(e.key)) encerrar(); return; }
      e.preventDefault(); sequencia += e.key;
      const achou = dicas.find(d => d.tecla === sequencia);
      if (achou) {
        const prox = fase === 1; encerrar(); achou.el.focus(); achou.el.click();
        if (prox) win.requestAnimationFrame(() => mostrar(2));
      } else if (!dicas.some(d => d.tecla.startsWith(sequencia))) encerrar();
    };
    doc.addEventListener('keydown',tecla); win.addEventListener('blur',encerrar); win.addEventListener('resize',encerrar);
    return { destruir() { encerrar(); doc.removeEventListener('keydown',tecla); win.removeEventListener('blur',encerrar); win.removeEventListener('resize',encerrar); } };
  }
  return { planejar, instalar, sidebar, instalarSidebar, instalarKeyTips, posicionar, limitarPainel, animar, corredor, protegerSubmenu, tecladoBarra, medicaoNecessaria };
}
