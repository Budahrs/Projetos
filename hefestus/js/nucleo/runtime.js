import { migrarMenu } from "./formatoMenus.js";
// Comportamento em tempo de execução: liga eventos a sinais e às ações visuais
// permitidas (abrir, fechar, alternar, destacar, mostrar só este). Dá aos elementos que
// abrem e fecham o comportamento de menus profissionais: animação, fechar ao clicar fora,
// Esc, setas do teclado, fechar ao escolher um item, abrir ao passar o mouse com tolerância
// para chegar no menu, e marca de "ativo" em abas.
//
// `ligarRuntime` é usada pela Prévia e embutida no HTML exportado via toString(), por isso
// precisa ser autocontida: não usa nada de fora dela.

import { motorMenus } from "./motorMenus.js";
import { controlesDaLista } from "./controlador.js";
import { FORMAS } from "./formas.js";
import { caminhoDaForma } from "./estiloAvancado.js";
const ACOES_ABRIR = ["abrir", "fechar", "alternar", "mostrarSo", "fixar"];

/** Regras de evento e elementos que abrem/fecham, extraídos do documento. */
function dadosRuntime(elementos, alvosExtras = []) {
  const avisosMenus = [];
  elementos = controlesDaLista(elementos).map(el => {
    if (!el.menu) return el;
    try { return { ...el, menu: migrarMenu(el.menu) }; }
    catch (erro) { avisosMenus.push({ id: el.id, mensagem: erro.message }); return { ...el, menu: { adaptativo:false, sidebar:false } }; }
  });
  const regras = elementos.flatMap(el =>
    (el.eventos ?? []).filter(ev => !ev.suspenso).map(ev => ({ id: el.id, tipo: el.tipo, evento: ev.tipo, dispara: ev.dispara, acao: ev.acao, alvo: ev.alvo, ...(ev.animacao ? {animacao:ev.animacao} : {}), ...(ev.estilo ? { estilo: ev.estilo } : {}), ...(ev.forma && FORMAS[ev.forma] ? { caminho: caminhoDaForma({ forma: ev.forma }, FORMAS).d, forma: ev.forma } : {}) }))
  );
  const alvos = new Set(regras.filter(r => ACOES_ABRIR.includes(r.acao) && r.alvo).map(r => r.alvo));
  for (const id of alvosExtras) alvos.add(id);
  const flutuantes = elementos
    .filter(el => el.tipo === "modal" || el.tipo === "toast" || el.abertura?.iniciaFechado || alvos.has(el.id))
    .map(el => {
      const a = el.abertura ?? {};
      const legado = el.tipo === "modal" || el.tipo === "toast";
      return {
        id: el.id,
        abre: legado ? el.iniciaAberto !== false && !a.iniciaFechado : !a.iniciaFechado,
        overlay: legado ? !!el.overlay || !!a.fundoEscuro : !!a.fundoEscuro,
        foraFecha: legado ? !!el.fechaAoClicarFora || !!a.fecharFora : !!a.fecharFora,
        auto: Number(el.autoFechar) || 0,
        esc: legado ? a.fecharEsc !== false : !!a.fecharEsc,
        escolher: !!a.fecharAoEscolher,
        ancorar: !!a.ancorar,
        animacao: a.animacao ?? "nenhuma",
        dur: Number(el.transicao?.duracao) || 160,
        menu: el.tipo === "menu" || el.acessibilidade?.role === "menu",
      };
    });
  // teclas de acesso: "&Arquivo" ou acessibilidade.tecla → Alt+letra aciona o elemento
  const teclas = elementos.map(el => {
    const a = el.acessibilidade ?? {};
    const t = String(el.rotulo ?? el.texto ?? "").replace(/&&/g, "");
    const m = /&([^&\s])/.exec(t);
    const k = String(a.tecla || (m ? m[1] : "")).slice(0, 1).toLowerCase();
    return k ? { id: el.id, tecla: k } : null;
  }).filter(Boolean);
  // atalhos de teclado reais: acessibilidade.atalho = "Ctrl+S", "Ctrl+Shift+N", "F5"…
  const atalhos = elementos.map(el => {
    const partes = String(el.acessibilidade?.atalho ?? "").split("+").map(x => x.trim().toLowerCase()).filter(Boolean);
    if (!partes.length) return null;
    const alias = { del: "delete", ins: "insert", return: "enter" };
    const tecla = alias[partes.at(-1)] ?? partes.at(-1), mods = partes.slice(0, -1);
    if (!(tecla.length === 1 || /^f([1-9]|1[0-2])$/.test(tecla) || ["enter", "delete", "insert", "home", "end"].includes(tecla))) return null;
    return { id: el.id, tecla, ctrl: mods.some(m => ["ctrl", "control", "cmd", "meta"].includes(m)), shift: mods.includes("shift"), alt: mods.includes("alt") };
  }).filter(Boolean);
  const animacoes = elementos.filter(el => ["pulso", "ondulacao"].includes(el.animacao?.clique)).map(el => ({ id: el.id, tipo: el.animacao.clique }));
  const ajustes = elementos.filter(el => el.autoAjuste).map(el => el.id);
  const menusAdaptativos = elementos.filter(e => e.menu?.adaptativo !== false && (e.menu?.adaptativo || (e.acessibilidade?.role === "tabpanel" && elementos.some(g => g.pai === e.id && /^Grupo /.test(g.nome || ""))))).map(e => ({ id: e.id, grupos: elementos.filter(g => g.pai === e.id && g.tipo === "container" && (e.menu?.adaptativo || /^Grupo /.test(g.nome || ""))).map(g => ({ id: g.id, nome: (g.nome || "Grupo").replace(/^Grupo /, ""), prioridade: g.menu?.prioridade ?? 100 })) }));
  const sidebars = elementos.filter(e => e.menu?.sidebar).map(e => {
    const filhos = elementos.filter(f => f.pai === e.id && f.tipo === 'container');
    return { id: e.id, pane: filhos[0]?.id, conteudo: filhos[1]?.id, rotulos: elementos.filter(r => r.menu?.rotuloSidebar).map(r => r.id), ...(e.menu.sidebar === true ? {} : e.menu.sidebar) };
  }).filter(e => e.pane && e.conteudo);
  return { regras, flutuantes, teclas, atalhos, animacoes, ajustes, menusAdaptativos, sidebars, avisosMenus };
}

function ligarRuntime(raiz, dados, aoSinal) {
  const { regras, flutuantes, teclas = [], atalhos = [], animacoes = [], ajustes = [] } = dados;
  const timers = [];
  const desligar = [];
  const on = (alvo, tipo, f, op) => { alvo.addEventListener(tipo, f, op); desligar.push(() => alvo.removeEventListener(tipo, f, op)); };
  const $ = id => (id ? raiz.querySelector("#" + CSS.escape(id)) : null);
  const info = id => flutuantes.find(x => x.id === id);
  const reduz = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const abertoPor = {};
  const pilha = [];
  const adiados = {};
  const corredores = new Map();
  const origensSo = new Set(regras.filter(r => r.acao === "mostrarSo").map(r => r.id));
  let inicial = true;
  let porTeclado = false;
  let ponto = null; // onde o botão direito foi clicado: o menu de contexto abre ali

  const sinal = (nome, origem, evento) => {
    if (!nome) return;
    const d = { sinal: nome, origem, evento };
    raiz.dispatchEvent(new CustomEvent("hefestus:sinal", { detail: d, bubbles: true }));
    if (aoSinal) aoSinal(d);
  };
  // fechar ao sair com o mouse espera um pouco: dá tempo de chegar no menu
  const adiar = (alvo, f) => {
    clearTimeout(adiados[alvo]);
    adiados[alvo] = setTimeout(() => { delete adiados[alvo]; f(); }, 220);
    timers.push(adiados[alvo]);
  };
  const cancelarAdiado = alvo => { clearTimeout(adiados[alvo]); delete adiados[alvo]; };
  const visivel = id => { const e = $(id); return !!e && !e.hidden && !e.classList.contains("hf-saindo"); };

  // o que abre vem para a frente: ele e os containers em volta (sem isso um vizinho desenhado
  // depois cobriria o menu); ao fechar, cada um volta para a sua camada
  let topo = 2147480000;
  const elevar = (e, sim) => {
    for (let n = e; n && n !== raiz; n = n.parentElement) {
      if (!n.classList || !n.classList.contains("hf-el")) continue;
      if (sim) { if (n.dataset.hfZ === undefined) n.dataset.hfZ = n.style.zIndex; n.style.zIndex = String(++topo); }
      else if (n.dataset.hfZ !== undefined) { n.style.zIndex = n.dataset.hfZ; delete n.dataset.hfZ; }
    }
  };
  const itensMenu = e => [...e.querySelectorAll('[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]')].filter(i => !i.hidden && i.getClientRects().length && i.closest('[role="menu"]') === e);

  const mostrar = (id, v, origem) => {
    const e = $(id);
    if (!e || visivel(id) === v) return;
    if (!v && e._hfFixo) return; // pino: fixado aberto não retrai (mouse, clique fora ou Esc)
    const f = info(id) || {};
    const anim = !reduz && !inicial && f.animacao && f.animacao !== "nenhuma" ? f.animacao : "";
    const o = $(id + "__overlay");
    if (v) {
      clearTimeout(e._hfSai);
      e.classList.remove("hf-saindo", "hf-sai-" + f.animacao);
      e.hidden = false;
      if(f.menu){e.style.boxSizing='border-box';e.style.minWidth='0';e.style.minHeight='0';e.style.maxWidth='calc(100vw - 16px)';e.style.maxHeight='calc(100dvh - 16px)';e.style.overflow='auto';}
      if (!inicial) elevar(e, true);
      if (o) { o.hidden = false; o.style.zIndex = String(Number(e.style.zIndex || 0) - 1); }
      if (anim) { e.classList.remove("hf-entra-" + anim); void e.offsetWidth; e.classList.add("hf-entra-" + anim); }
      if(f.menu&&!f.ancorar){const r=e.getBoundingClientRect();const p=motorMenus().limitarPainel(e,{left:r.left,right:r.right,top:r.top,bottom:r.top-4});colocar(e,p.x+(window.visualViewport?.offsetLeft??0),p.y+(window.visualViewport?.offsetTop??0));}
      if (origem && origem !== id) {
        abertoPor[id] = origem;
        const g = $(origem);
        if (g) { g.setAttribute("aria-expanded", "true"); if (f.menu) g.setAttribute("aria-haspopup", "menu"); }
      }
      pilha.push(id);
      if (f.auto) timers.push(setTimeout(() => mostrar(id, false), f.auto));
      if (f.menu && porTeclado) { const it = itensMenu(e)[0]; if (it) setTimeout(() => it.focus(), 0); }
    } else {
      const fim = () => { e.hidden = true; e.classList.remove("hf-saindo", "hf-sai-" + anim); if (o) o.hidden = true; elevar(e, false); };
      if (anim) {
        e.classList.remove("hf-entra-" + anim);
        e.classList.add("hf-saindo", "hf-sai-" + anim);
        e._hfSai = setTimeout(fim, f.dur || 160);
        timers.push(e._hfSai);
      } else fim();
      const org = abertoPor[id];
      if (org) { const g = $(org); if (g) g.setAttribute("aria-expanded", "false"); delete abertoPor[id]; }
      const i = pilha.lastIndexOf(id);
      if (i >= 0) pilha.splice(i, 1);
    }
    disparar(id, v ? "onOpen" : "onClose");
  };

  /** Marca a origem como ativa (abas): as outras origens do mesmo grupo deixam de estar. */
  const ativar = origem => {
    const g = $(origem);
    if (!g || !g.parentElement) return;
    for (const s of g.parentElement.children) {
      if (s === g || !origensSo.has(s.id)) continue;
      s.classList.remove("hf-ativo");
      s.classList.add("hf-inativo");
      s.setAttribute("aria-selected", "false");
    }
    g.classList.add("hf-ativo");
    g.classList.remove("hf-inativo");
    g.setAttribute("aria-selected", "true");
  };

  /** Mostra o alvo e esconde os irmãos que também abrem e fecham (painéis de abas, acordeão). */
  const mostrarSo = (alvo, origem) => {
    const e = $(alvo);
    if (!e) return;
    for (const irmao of e.parentElement ? [...e.parentElement.children] : []) {
      if (irmao !== e && irmao.id && info(irmao.id)) mostrar(irmao.id, false);
    }
    mostrar(alvo, true);
    if (origem) ativar(origem);
  };

  /** Põe o elemento (fixed) com o canto em (x, y) da janela, mesmo dentro de um ancestral com transform/zoom. */
  const colocar = (e, x, y) => {
    e.style.left = x + "px"; e.style.top = y + "px";
    for (let i = 0; i < 3; i++) {
      const r = e.getBoundingClientRect();
      const dx = x - r.left, dy = y - r.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) break;
      e.style.left = (parseFloat(e.style.left) + dx) + "px"; e.style.top = (parseFloat(e.style.top) + dy) + "px";
    }
  };

  /** Menu de contexto: abre na posição do clique, sem sair da janela. */
  const noPonto = alvo => {
    const e = $(alvo);
    if (!e || !ponto) return;
    e.style.maxWidth='calc(100vw - 16px)';e.style.maxHeight='calc(100dvh - 16px)';e.style.minWidth='0';e.style.minHeight='0';e.style.overflow='auto';
    e.style.position = "fixed"; e.style.right = "auto"; e.style.bottom = "auto"; e.style.margin = "0";
    const l = Math.max(4, Math.min(ponto.x, window.innerWidth - e.offsetWidth - 4));
    const t = Math.max(4, Math.min(ponto.y, window.innerHeight - e.offsetHeight - 4));
    colocar(e, l, t);
    ponto = null;
  };
  /** Abre colado ao gatilho (embaixo; sobe se não couber), mesmo dentro de container em fluxo. */
  const ancorar = (alvo, origem) => {
    const e = $(alvo), g = $(origem);
    if (!e || !g) return;
    const r = g.getBoundingClientRect();
    e.style.position = "fixed"; e.style.right = "auto"; e.style.bottom = "auto"; e.style.margin = "0";
    e.style.maxWidth='calc(100vw - 16px)';e.style.maxHeight='calc(100vh - 16px)';e.style.overflow='auto';
    const pos=motorMenus().limitarPainel(e,r,{lado:g.closest('[role="menu"]')?'direita':'baixo',rtl:getComputedStyle(g).direction==='rtl'});
    colocar(e,pos.x+(window.visualViewport?.offsetLeft??0),pos.y+(window.visualViewport?.offsetTop??0));
  };
  const animacoesEventos=new Map();
  desligar.push(()=>{for(const a of animacoesEventos.values())a?.cancel();animacoesEventos.clear();});
  const agir = (acao, alvo, origem, evento, estilo, caminho, animacao) => {
    if(acao==='animar'){const e=$(alvo);if(!e)return;animacoesEventos.get(alvo)?.cancel();animacoesEventos.set(alvo,motorMenus().animar(e,animacao));return;}
    if (acao === "abrir" && evento === "onContext") { mostrar(alvo, false); mostrar(alvo, true, origem); noPonto(alvo); }
    else if (acao === "abrir") { mostrar(alvo, true, origem); if (info(alvo)?.ancorar) ancorar(alvo, origem); }
    else if (acao === "fechar") mostrar(alvo, false);
    else if (acao === "alternar") { const abrir = !visivel(alvo); mostrar(alvo, abrir, origem); if (abrir && info(alvo)?.ancorar) ancorar(alvo, origem); }
    else if (acao === "mostrarSo") mostrarSo(alvo, origem);
    else if (acao === "fixar") {
      const e = $(alvo), o = $(origem);
      if (!e) return;
      e._hfFixo = !e._hfFixo;
      if (e._hfFixo) mostrar(alvo, true, origem);
      if (o) { o.setAttribute("aria-pressed", String(!!e._hfFixo)); o.classList.toggle("hf-fixo", !!e._hfFixo); }
    }
    else if (acao === "aplicarForma") {
      const e = $(alvo), p = e?.querySelector("svg > path");
      if (p && typeof caminho === "string") p.setAttribute("d", caminho);
    }
    else if (acao === "aplicarEstilo") {
      const e = $(alvo);
      if (!e || !estilo) return;
      const nomes = { fundo: "background", cor: "color", borda: "borderColor", larguraBorda: "borderWidth", raio: "borderRadius" };
      for (const [k, v] of Object.entries(estilo)) {
        if (!nomes[k]) continue;
        if (k === "larguraBorda" || k === "raio") {
          if (Number.isFinite(Number(v)) && Number(v) >= 0) e.style[nomes[k]] = `${Math.min(500, Number(v))}px`;
        } else if (typeof v === "string" && CSS.supports("color", v)) e.style[nomes[k]] = v;
      }
      if (Number(estilo.larguraBorda) > 0) e.style.borderStyle = "solid";
      const g = $(origem); if (g) { g.setAttribute("aria-pressed", "true"); }
    }
    else if (acao === "destacar") {
      const e = $(alvo);
      if (e) { e.classList.remove("hf-destaque"); void e.offsetWidth; e.classList.add("hf-destaque"); }
    }
  };

  function disparar(id, evento) {
    if (["onClick","onChange","onHover"].includes(evento) && $(id)?.matches("[disabled],[aria-disabled=\"true\"],[data-indisp]")) return;
    for (const r of regras) {
      if (r.id !== id || r.evento !== evento) continue;
      sinal(r.dispara, id, evento);
      if (!r.acao || !r.alvo) continue;
      if (evento === "onLeave" && corredores.has(r.alvo)) continue;
      if (evento === "onLeave") adiar(r.alvo, () => agir(r.acao, r.alvo, id, evento, r.estilo, r.caminho, r.animacao));
      else { cancelarAdiado(r.alvo); agir(r.acao, r.alvo, id, evento, r.estilo, r.caminho, r.animacao); }
    }
  }

  // preparar o que abre e fecha
  for (const f of flutuantes) {
    const e = $(f.id);
    if (!e) continue;
    e.style.setProperty("--hf-dur", (f.dur || 160) + "ms");
    if (f.overlay) {
      const o = document.createElement("div");
      o.className = "hf-overlay";
      o.id = f.id + "__overlay";
      o.style.zIndex = String((Number(getComputedStyle(e).zIndex) || 0) - 1);
      e.before(o);
      o.hidden = true;
    }
    if (f.menu) {
      e.setAttribute("role", "menu");
      const itens = e.tagName === "UL" ? [...e.querySelectorAll("li")] : [...e.children].filter(c => c.classList.contains("hf-el") && !c.classList.contains("hf-linha"));
      for (const it of itens) {
        it.setAttribute("role", "menuitem");
        if (!it.hasAttribute("tabindex")) it.tabIndex = -1;
        on(it, "keydown", k => { if ((k.key === "Enter" || k.key === " ") && it.tagName !== "BUTTON") { k.preventDefault(); it.click(); } });
      }
    }
    if (f.escolher) on(e, "click", ev => { if (ev.target !== e) setTimeout(() => mostrar(f.id, false), 0); });
    if(f.menu) for(const item of e.querySelectorAll('button[disabled]')) {
      const aria=item.getAttribute('aria-disabled'),indisp=item.getAttribute('data-indisp');
      item.disabled=false;item.setAttribute('aria-disabled','true');item.setAttribute('data-indisp','1');
      desligar.push(()=>{item.disabled=true;aria===null?item.removeAttribute('aria-disabled'):item.setAttribute('aria-disabled',aria);indisp===null?item.removeAttribute('data-indisp'):item.setAttribute('data-indisp',indisp);});
    }
    e.hidden = true;
  }
  raiz.querySelectorAll("[data-fechar]").forEach(b => on(b, "click", () => mostrar(b.dataset.fechar, false)));

  // eventos
  for (const r of regras) {
    const e = $(r.id);
    if (!e) continue;
    if (r.evento === "onClick") on(e, "click", ev => { porTeclado = ev.detail === 0; disparar(r.id, "onClick"); porTeclado = false; });
    if (r.evento === "onContext") on(e, "contextmenu", ev => { ev.preventDefault(); ponto = { x: ev.clientX, y: ev.clientY }; disparar(r.id, "onContext"); });
    if (r.evento === "onHover") on(e, "mouseenter", () => disparar(r.id, "onHover"));
    if (r.evento === "onLeave") on(e, "mouseleave", () => disparar(r.id, "onLeave"));
    if (r.evento === "onFocus") on(e, "focus", () => disparar(r.id, "onFocus"));
    if (r.evento === "onChange" && r.tipo === "campo") on(e, "change", () => disparar(r.id, "onChange"));
    if (r.evento === "onSelect") e.querySelectorAll("li").forEach(li => {
      const f = () => disparar(r.id, "onSelect");
      on(li, "click", f);
      on(li, "keydown", k => { if (k.key === "Enter") f(); });
    });
    // gatilho de clique sem ser botão: acessível pelo teclado
    if (r.evento === "onClick" && e.tagName !== "BUTTON" && e.tagName !== "INPUT") {
      if (!e.hasAttribute("tabindex")) e.tabIndex = 0;
      if (!e.hasAttribute("role")) e.setAttribute("role", "button");
      on(e, "keydown", k => { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); porTeclado = true; disparar(r.id, "onClick"); porTeclado = false; } });
    }
  }
  // menus que abrem ao passar o mouse continuam abertos enquanto o mouse estiver neles
  const porHover = new Set(regras.filter(r => r.evento === "onHover" && (r.acao === "abrir" || r.acao === "alternar")).map(r => r.alvo));
  for (const id of porHover) {
    const e = $(id);
    if (!e) continue;
    on(e, "mouseenter", () => cancelarAdiado(id));
    for(const regra of regras.filter(r=>r.alvo===id&&r.evento==='onHover')) {
      const origem=$(regra.id);if(!origem)continue;
      const seguro=motorMenus().protegerSubmenu(origem,e,()=>mostrar(id,false));corredores.set(id,seguro);desligar.push(()=>seguro.destruir());
    }
  }
  raiz.querySelectorAll(".hf-toggle").forEach(t => on(t, "click", () => {
    t.setAttribute("aria-checked", t.getAttribute("aria-checked") === "true" ? "false" : "true");
    disparar(t.id, "onChange");
  }));

  const reposicionarMenus=()=>{for(const id of pilha){const f=info(id),origem=abertoPor[id];if(!visivel(id))continue;if(f?.ancorar&&origem)ancorar(id,origem);else if(f?.menu){const e=$(id),r=e.getBoundingClientRect();motorMenus().limitarPainel(e,{left:r.left,right:r.right,top:r.top,bottom:r.top-4});}}};
  on(window,'resize',reposicionarMenus);on(document,'scroll',reposicionarMenus,true);
  if(window.visualViewport)on(window.visualViewport,'resize',reposicionarMenus);
  // clicar fora fecha (do mais recente para o mais antigo)
  on(document, "pointerdown", ev => {
    for (const id of [...pilha].reverse()) {
      const f = info(id);
      if (!f || !f.foraFecha) continue;
      const e = $(id);
      const org = $(abertoPor[id]);
      if ((e && e.contains(ev.target)) || (org && org.contains(ev.target))) continue;
      mostrar(id, false);
    }
  }, true);
  // Esc fecha o último aberto e devolve o foco; setas andam pelos itens de menu
  on(document, "keydown", ev => {
    const id = pilha[pilha.length - 1];
    if (!id) return;
    const f = info(id) || {};
    const e = $(id);
    if (ev.key === "Escape" && f.esc !== false) {
      const org = abertoPor[id];
      mostrar(id, false);
      const g = $(org);
      if (g) g.focus();
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    if(f.menu && e && !e.contains(ev.target)) return;
    if(f.menu && e && ev.key==='Tab') { const origem=$(abertoPor[id]);mostrar(id,false);origem?.focus();return; }
    if(f.menu && e && ev.key.length===1 && ev.key!==' ' && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !ev.target.closest('input,textarea,select,[contenteditable="true"]')) {
      const agora=Date.now();e._hfBusca=agora-(e._hfBuscaHora||0)>700?'':e._hfBusca||'';e._hfBusca+=ev.key.toLocaleLowerCase();e._hfBuscaHora=agora;
      const itens=itensMenu(e),i=itens.indexOf(document.activeElement);const ordem=[...itens.slice(i+1),...itens.slice(0,i+1)];const alvo=ordem.find(b=>(b.getAttribute('aria-label')||b.textContent).trim().toLocaleLowerCase().startsWith(e._hfBusca));if(alvo){ev.preventDefault();alvo.focus();}return;
    }
    if (f.menu && e && ["ArrowDown", "ArrowUp", "Home", "End"].includes(ev.key)) {
      const itens = itensMenu(e);
      if (!itens.length) return;
      const i = itens.indexOf(document.activeElement);
      ev.preventDefault();
      const n = ev.key === "Home" ? 0 : ev.key === "End" ? itens.length - 1
        : ev.key === "ArrowDown" ? (i + 1) % itens.length : (i - 1 + itens.length) % itens.length;
      itens[n].focus();
    }
  }, true);

  // itens indisponíveis: não reagem a clique nem a teclado; o motivo aparece ao passar o mouse (title)
  on(raiz, "click", ev => {
    const b = ev.target.closest && ev.target.closest("[data-indisp]");
    if (b && raiz.contains(b)) { ev.stopPropagation(); ev.preventDefault(); sinal("bloqueado", b.id, "onClick"); }
  }, true);

  // perfis: itens com data-perfis só aparecem para o perfil atual (?perfil=nome, data-perfil na arte
  // ou raiz.hefestusPerfil(nome)); sem perfil definido, tudo aparece
  const aplicarPerfil = p => {
    const atual = String(p || "").trim().toLowerCase();
    raiz.dataset.perfil = atual;
    raiz.querySelectorAll("[data-perfis]").forEach(e => {
      const lista = e.dataset.perfis.split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
      const ocultar = !!atual && !!lista.length && !lista.includes(atual);
      if (ocultar && e.dataset.hfPerfilAntes === undefined) { e.dataset.hfPerfilAntes = e.hidden ? "1" : "0"; e.hidden = true; }
      else if (!ocultar && e.dataset.hfPerfilAntes !== undefined) { e.hidden = e.dataset.hfPerfilAntes === "1"; delete e.dataset.hfPerfilAntes; }
    });
  };
  raiz.hefestusPerfil = aplicarPerfil;
  let perfil0 = raiz.dataset.perfil || "";
  try { perfil0 = new URLSearchParams(location.search).get("perfil") || perfil0; } catch (e) { /* sem URL */ }
  if (raiz.querySelector("[data-perfis]")) aplicarPerfil(perfil0);

  // Alt + letra aciona o elemento (não atrapalha quando o foco está num campo sem Alt)
  on(document, "keydown", ev => {
    if (!ev.altKey || ev.ctrlKey || ev.metaKey || ev.key.length !== 1) return;
    const r = teclas.find(t => t.tecla === ev.key.toLowerCase() && (() => { const e = $(t.id); return e && !e.hidden && e.offsetParent !== null; })());
    if (!r) return;
    ev.preventDefault();
    porTeclado = true;
    $(r.id).click();
    porTeclado = false;
  });

  // atalhos com Ctrl/Shift/F-teclas: aciona o elemento mesmo que ele (um item de menu fechado) esteja oculto
  on(document, "keydown", ev => {
    if (!atalhos.length) return;
    const k = ev.key.toLowerCase();
    const a = atalhos.find(t => t.tecla === k && t.ctrl === (ev.ctrlKey || ev.metaKey) && t.shift === ev.shiftKey && t.alt === ev.altKey);
    if (!a) return;
    const e = $(a.id);
    if (!e || e.disabled || e.dataset.indisp) return;
    ev.preventDefault();
    porTeclado = true; e.click(); porTeclado = false;
  });

  // menus largos demais para a tela (notebook, janela estreita): o conteúdo se reduz para caber, sem cortar nem rolar
  if (ajustes.length) {
    const encaixar = () => {
      for (const id of ajustes) {
        const e = $(id); if (!e || !e.clientWidth) continue;
        e.style.zoom = "";
        let z = 1;
        for (let i = 0; i < 3 && e.scrollWidth > e.clientWidth + 1; i++) { z = Math.max(0.6, Math.min(z, (e.clientWidth / e.scrollWidth) * z)); e.style.zoom = String(z); }
      }
    };
    encaixar();
    if (window.ResizeObserver) { const ro = new ResizeObserver(() => encaixar()); ro.observe(raiz); desligar.push(() => ro.disconnect()); }
    else on(window, "resize", encaixar);
  }

  // animação ao clicar: pulso (a caixa "pisca" de tamanho) e ondulação (onda a partir do ponto do clique)
  for (const a of animacoes) {
    const e = $(a.id); if (!e || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) continue;
    on(e, "pointerdown", ev => {
      if (e.disabled || e.dataset.indisp) return;
      if (a.tipo === "pulso") { e.classList.remove("hf-pulsa"); void e.offsetWidth; e.classList.add("hf-pulsa"); setTimeout(() => e.classList.remove("hf-pulsa"), 420); return; }
      const r = e.getBoundingClientRect(), k = r.width / (e.offsetWidth || 1) || 1, d = Math.max(e.offsetWidth, e.offsetHeight) * 2.2;
      const o = document.createElement("span"); o.className = "hf-onda";
      o.style.cssText = `width:${d}px;height:${d}px;left:${(ev.clientX - r.left) / k - d / 2}px;top:${(ev.clientY - r.top) / k - d / 2}px`;
      e.appendChild(o); setTimeout(() => o.remove(), 650);
    });
  }

  // painéis divididos: divisores arrastáveis (mouse e setas), recolher em trilho, duplo clique restaura
  const dock = host => {
    let cfg; try { cfg = JSON.parse(host.dataset.hfDock); } catch { return; }
    const id = host.id, D = cfg.d, TR = 36, CAB = 30, MIN = 80;
    const usa = { esq: cfg.r.includes("esq"), dir: cfg.r.includes("dir"), baixo: cfg.r.includes("baixo") };
    const tam = { ...cfg.t }, rec = {}, padrao = { ...cfg.t };
    const GL = { esq: ["‹", "›"], dir: ["›", "‹"], baixo: ["⌄", "⌃"] };
    const nomes = { esq: "esquerdo", dir: "direito", baixo: "inferior" };
    const pos = (e, r) => { if (!e) return; e.style.left = r.x + "px"; e.style.top = r.y + "px"; e.style.width = Math.max(0, r.w) + "px"; e.style.height = Math.max(0, r.h) + "px"; };
    const W = host.offsetWidth, H = host.offsetHeight;
    const L = k => (usa[k] ? (rec[k] ? TR : tam[k]) : 0);
    const aplicar = () => {
      const Le = L("esq"), Ld = L("dir"), Lb = L("baixo"), dE = usa.esq ? D : 0, dD = usa.dir ? D : 0, dB = usa.baixo ? D : 0;
      const cx = Le + dE, cw = Math.max(0, W - Le - dE - Ld - dD), ch = Math.max(0, H - Lb - dB);
      const g = { esq: { x: 0, y: 0, w: Le, h: H }, dir: { x: W - Ld, y: 0, w: Ld, h: H }, baixo: { x: cx, y: H - Lb, w: cw, h: Lb }, centro: { x: cx, y: 0, w: cw, h: ch } };
      const dv = { esq: { x: Le, y: 0, w: D, h: H }, dir: { x: W - Ld - D, y: 0, w: D, h: H }, baixo: { x: cx, y: H - Lb - D, w: cw, h: D } };
      for (const k of ["centro", "esq", "dir", "baixo"]) {
        if (k !== "centro" && !usa[k]) continue;
        const r = g[k], p = `${id}_${k}`, rt = !!rec[k], vert = k === "baixo";
        pos($(p), { x: r.x, y: r.y, w: r.w, h: r.h }); // filhos ficam dentro do painel: coordenadas relativas, descontando a borda de 1px
        const t = $(p + "_tit"), b = $(p + "_btn"), c = $(p + "_corpo");
        if (t) { pos(t, { x: 9, y: 6, w: Math.max(20, r.w - 50), h: 18 }); t.style.display = rt && !vert ? "none" : ""; }
        if (b) {
          const bx = rt && !vert ? (r.w - 24) / 2 - 1 : r.w - 29;
          pos(b, { x: bx, y: 3, w: 24, h: 24 });
          b.setAttribute("aria-expanded", rt ? "false" : "true"); b.setAttribute("aria-label", (rt ? "Expandir" : "Recolher") + " painel " + nomes[k]);
          const tx = $(p + "_btn_tx"); if (tx) tx.textContent = GL[k][rt ? 1 : 0];
        }
        if (c) { pos(c, { x: 5, y: CAB + 3, w: Math.max(10, r.w - 12), h: Math.max(10, r.h - CAB - 10) }); c.style.display = rt ? "none" : ""; }
      }
      for (const k of ["esq", "dir", "baixo"]) {
        if (!usa[k]) continue;
        const e = $(`${id}_div_${k}`); if (!e) continue;
        pos(e, dv[k]);
        e.style.display = rec[k] ? "none" : "";
        e.setAttribute("aria-valuenow", String(Math.round(tam[k])));
      }
    };
    const limite = k => {
      const total = k === "baixo" ? H : W, outros = k === "baixo" ? 0 : L(k === "esq" ? "dir" : "esq") + (usa.esq && usa.dir ? D : 0);
      return Math.max(MIN, total - outros - D - 120);
    };
    const mudar = (k, v) => { tam[k] = Math.max(MIN, Math.min(limite(k), Math.round(v))); aplicar(); };
    const alterna = k => { rec[k] = !rec[k]; aplicar(); sinal(`${id}_${k}_${rec[k] ? "recolhido" : "expandido"}`, `${id}_${k}_btn`, "painel"); };
    for (const k of ["esq", "dir", "baixo"]) {
      if (!usa[k]) continue;
      const b = $(`${id}_${k}_btn`), d = $(`${id}_div_${k}`);
      if (b) { b.tabIndex = 0; b.style.cursor = "pointer"; on(b, "click", () => alterna(k)); on(b, "keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); alterna(k); } }); }
      if (!d) continue;
      d.tabIndex = 0; d.setAttribute("role", "separator"); d.setAttribute("aria-orientation", k === "baixo" ? "horizontal" : "vertical");
      d.setAttribute("aria-label", "Redimensionar painel " + nomes[k]); d.setAttribute("aria-valuemin", String(MIN));
      d.style.cursor = k === "baixo" ? "row-resize" : "col-resize"; d.style.touchAction = "none";
      on(d, "pointerdown", ev => {
        ev.preventDefault(); d.setPointerCapture?.(ev.pointerId);
        const esc = host.getBoundingClientRect().width / (W || 1) || 1, ini = k === "baixo" ? ev.clientY : ev.clientX, t0 = tam[k];
        const sinalDir = k === "dir" || k === "baixo" ? -1 : 1;
        const mv = e2 => mudar(k, t0 + sinalDir * ((k === "baixo" ? e2.clientY : e2.clientX) - ini) / esc);
        const fim = () => { d.removeEventListener("pointermove", mv); d.removeEventListener("pointerup", fim); d.removeEventListener("pointercancel", fim); sinal(`${id}_${k}_redimensionado`, d.id, "painel"); };
        d.addEventListener("pointermove", mv); d.addEventListener("pointerup", fim); d.addEventListener("pointercancel", fim);
      });
      on(d, "dblclick", () => { mudar(k, padrao[k]); sinal(`${id}_${k}_restaurado`, d.id, "painel"); });
      on(d, "keydown", ev => {
        const passo = ev.shiftKey ? 48 : 16, sd = k === "dir" || k === "baixo" ? -1 : 1;
        const delta = k === "baixo" ? { ArrowUp: passo, ArrowDown: -passo }[ev.key] : { ArrowLeft: -passo * sd, ArrowRight: passo * sd }[ev.key];
        if (ev.key === "Home") { ev.preventDefault(); mudar(k, padrao[k]); }
        else if (ev.key === "Enter") { ev.preventDefault(); alterna(k); }
        else if (delta != null) { ev.preventDefault(); mudar(k, tam[k] + delta); }
      });
    }
    aplicar();
  };
  raiz.querySelectorAll("[data-hf-dock]").forEach(dock);

  for (const m of dados.menusAdaptativos || []) {
    const host = $(m.id); if (!host || !m.grupos.length) continue;
    const menu = motorMenus().instalar(host, m.grupos.map(g => ({ ...g, el: $(g.id) })).filter(g => g.el), { camada: raiz });
    desligar.push(() => menu.destruir());
  }

  for (const cfg of dados.sidebars || []) {
    const host = $(cfg.id), pane = $(cfg.pane), conteudo = $(cfg.conteudo);
    if (host && pane && conteudo) desligar.push(motorMenus().instalarSidebar(host, pane, conteudo, cfg).destruir);
  }
  for(const toolbar of raiz.querySelectorAll('[role="toolbar"],[role="tablist"]')) {
    const teclado=motorMenus().tecladoBarra(toolbar);desligar.push(()=>teclado.destruir());
  }
  // Mensagens só são aceitas do iframe daquela instância, nunca de outras janelas.
  for(const frame of raiz.querySelectorAll('iframe.hf-html-importado')){
    const id=frame.parentElement?.id;if(!id)continue;
    on(window,'message',ev=>{
      if(ev.source!==frame.contentWindow||!frame.isConnected||!ev.data||typeof ev.data!=='object')return;
      if(ev.data.tipo==='hefestus:html-evento'&&['onClick','onChange','onFocus'].includes(ev.data.evento))disparar(id,ev.data.evento);
      if(ev.data.tipo==='hefestus:html-sinal'&&typeof ev.data.sinal==='string'&&ev.data.sinal.length<=128)sinal(ev.data.sinal,id,'html');
    });
  }
  // estado inicial
  for (const f of flutuantes) if (f.abre) mostrar(f.id, true);
  // Abas sem escolha inicial: se mais de um painel do mesmo grupo começa visível, eles ficam empilhados
  // e o de cima cobre os outros. Fica só o da primeira aba.
  const gruposSo = new Map();
  for (const r of regras) {
    if (r.acao !== "mostrarSo" || !r.alvo) continue;
    const pai = $(r.alvo)?.parentElement;
    if (!pai) continue;
    if (!gruposSo.has(pai)) gruposSo.set(pai, []);
    gruposSo.get(pai).push(r);
  }
  for (const lista of gruposSo.values()) {
    const abertos = lista.filter(r => visivel(r.alvo));
    if (abertos.length > 1) mostrarSo(abertos[0].alvo, abertos[0].id);
  }
  for (const r of regras) if (r.acao === "mostrarSo" && r.alvo && visivel(r.alvo)) ativar(r.id);
  inicial = false;
  return () => { timers.forEach(clearTimeout); desligar.forEach(f => f()); };
}
export { dadosRuntime, ligarRuntime };
