// Executor de ligações dos programas exportados pelo Hefestus.
// Lê window.__HEFESTUS_LIGACOES__ (gerado por ferramentas/ligacoes-auto.mjs: TODOS os sinais ligados) e executa
// cada comando da interface:
//  - operacao   contrato JSON para um motor de linha de comando (ex.: Antares.PdfBridge do PDF Studio)
//  - pdf        motor de PDF embutido (hefestus/programa-pdf.js: pdf.js + pdf-lib), edição em memória
//  - abrir, fechar, salvar, desfazer, refazer, imprimir, zoom, pagina, telaCheia, sair
//  - paleta (todos os comandos), ajuda (o que está ligado e o que falta), tema, recolherFaixa, editar (copiar/colar)
//  - aviso, pendente (comando sem motor: diz isso com clareza)
// Os comandos nativos ficam em src-tauri/src/motor.rs.
(() => {
  const L = window.__HEFESTUS_LIGACOES__;
  if (!L || !window.hefestusPrograma) return;
  const T = window.__TAURI_INTERNALS__;
  const invoke = (c, a, o) => T ? T.invoke(c, a, o) : Promise.reject(new Error("Este comando só funciona na janela do programa."));
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const nomeDe = p => String(p ?? "").split(/[\\/]/).pop();
  const semExt = n => n.replace(/\.[^.]+$/, "");
  const filtrosDoc = L.documento?.filtros ?? [];
  const temDocumento = !!L.documento;
  const ehPdf = L.documento?.tipo === "pdf";
  const temMotor = !!L.motor?.executavel;
  const sinais = L.sinais ?? {};
  const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
  const ler = k => { try { return localStorage.getItem(k); } catch { return null; } };

  // ------------------------------------------------------------ estado
  const estado = {
    caminho: null, bytes: null, modificado: false, desfazer: [], refazer: [],
    ocupado: false, motorOk: null, pdf: null, visor: null,
  };
  const LIMITE_HISTORICO = 30;

  // ------------------------------------------------------------ estilo
  const estilo = document.createElement("style");
  estilo.textContent = `
    :root{--hp-fundo:#e5e7eb;--hp-barra:#f9fafb;--hp-borda:#cbd5e1;--hp-texto:#111827;--hp-fraco:#4b5563;--hp-papel:#fff;--hp-acento:#1d4ed8}
    html.hp-escuro{--hp-fundo:#1f2937;--hp-barra:#111827;--hp-borda:#374151;--hp-texto:#f3f4f6;--hp-fraco:#9ca3af;--hp-papel:#fff;--hp-acento:#60a5fa}
    html.hp-escuro .hf-arte{filter:invert(.9) hue-rotate(180deg)}
    html.hp-escuro .hf-arte img{filter:invert(1) hue-rotate(180deg)}
    #hp-visor{position:fixed;left:0;right:0;bottom:0;display:flex;flex-direction:column;background:var(--hp-fundo);border-top:1px solid var(--hp-borda);z-index:2147483000;font:13px system-ui,"Segoe UI",sans-serif;color:var(--hp-texto)}
    #hp-visor-barra{display:flex;align-items:center;gap:12px;padding:6px 12px;background:var(--hp-barra);border-bottom:1px solid var(--hp-borda);min-height:30px}
    #hp-doc{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:32%}
    #hp-doc.mod::after{content:" •";color:#d97706}
    #hp-pagina,#hp-zoom{white-space:nowrap;color:var(--hp-fraco);font-variant-numeric:tabular-nums}
    #hp-status{flex:1;color:var(--hp-texto);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #hp-status.erro{color:#dc2626}
    #hp-motor{font-size:12px;color:var(--hp-fraco)}
    #hp-motor.ok::before{content:"● ";color:#16a34a}#hp-motor.falta::before{content:"● ";color:#dc2626}
    #hp-visor button,.hp-modal button{font:inherit;padding:4px 10px;border:1px solid #9ca3af;border-radius:6px;background:#fff;color:#111827;cursor:pointer}
    #hp-visor button:hover,.hp-modal button:hover{background:#f3f4f6}
    #hp-visor button:focus-visible,.hp-modal :focus-visible{outline:2px solid var(--hp-acento);outline-offset:2px}
    #hp-corpo{position:relative;flex:1;min-height:0}
    #hp-vazio{position:absolute;inset:0;display:grid;place-items:center;color:var(--hp-fraco);font-size:15px}
    #hp-quadro,#hp-folhas{position:absolute;inset:0;width:100%;height:100%;border:0}
    #hp-quadro{background:#fff}
    #hp-texto{position:absolute;inset:0;margin:0;padding:16px 20px;overflow:auto;background:#fff;color:#111827;font:13px/1.5 Consolas,monospace;white-space:pre-wrap}
    #hp-visor.ocupado #hp-status::after{content:" …";animation:hp-pisca 1s steps(2) infinite}
    @keyframes hp-pisca{50%{opacity:.2}}
    .hp-paginas{position:absolute;inset:0;overflow:auto;padding:16px 0 40px;display:flex;flex-direction:column;align-items:center;gap:14px;outline:none}
    .hp-pag{position:relative;background:var(--hp-papel);box-shadow:0 1px 4px #0003;flex:none;--scale-round-x:1px;--scale-round-y:1px;--user-unit:1}
    .hp-pag canvas{display:block}
    .hp-selecionando .hp-pag{cursor:crosshair}
    .hp-selecionando .textLayer{pointer-events:none}
    .hp-caixa-sel{position:absolute;border:2px dashed var(--hp-acento);background:#1d4ed822;pointer-events:none;z-index:3}
    .textLayer{position:absolute;text-align:initial;inset:0;overflow:clip;opacity:1;line-height:1;letter-spacing:normal;word-spacing:normal;text-size-adjust:none;forced-color-adjust:none;transform-origin:0 0;z-index:0;
      --min-font-size:1;--text-scale-factor:calc(var(--total-scale-factor) * var(--min-font-size));--min-font-size-inv:calc(1 / var(--min-font-size))}
    .textLayer :is(span,br){color:transparent;position:absolute;white-space:pre;cursor:text;transform-origin:0% 0%;user-select:text}
    .textLayer > :not(.markedContent),.textLayer .markedContent span:not(.markedContent){z-index:1;--font-height:0;font-size:calc(var(--text-scale-factor) * var(--font-height));--scale-x:1;--rotate:0deg;transform:rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv))}
    .textLayer .markedContent{display:contents}
    .textLayer ::selection{background:#2563eb44;color:transparent}
    .textLayer br::selection{background:transparent}
    .textLayer .endOfContent{display:block;position:absolute;inset:100% 0 0;z-index:0;cursor:default;user-select:none}
    [data-main-rotation="90"]{transform:rotate(90deg) translateY(-100%)}
    [data-main-rotation="180"]{transform:rotate(180deg) translate(-100%,-100%)}
    [data-main-rotation="270"]{transform:rotate(270deg) translateX(-100%)}
    .hp-impressao{display:none}
    @media print{
      html.hp-imprimindo body>*:not(#hp-visor){display:none!important}
      html.hp-imprimindo #hp-visor{position:static;display:block;border:0;background:#fff}
      html.hp-imprimindo #hp-visor>*:not(#hp-corpo),html.hp-imprimindo #hp-corpo>*:not(#hp-folhas){display:none!important}
      html.hp-imprimindo #hp-corpo,html.hp-imprimindo #hp-folhas{position:static}
      html.hp-imprimindo .hp-paginas{display:none!important}
      html.hp-imprimindo .hp-impressao{display:block}
      html.hp-imprimindo .hp-impressao img{display:block;width:100%;page-break-after:always;break-after:page}
      @page{margin:0}
    }
    .hp-modal{position:fixed;inset:0;display:grid;place-items:center;background:#0006;z-index:2147483600;font:14px system-ui,"Segoe UI",sans-serif;color:#111827}
    .hp-modal form{box-sizing:border-box;background:#fff;padding:12px 16px;border-radius:10px;min-width:min(340px,calc(100vw - 24px));max-width:min(720px,calc(100vw - 24px));max-height:calc(100dvh - 32px);overflow:auto;box-shadow:0 10px 40px #0005;display:grid;gap:10px}
    .hp-modal-cabecalho{position:sticky;top:-12px;display:flex;align-items:center;gap:12px;background:#fff;z-index:2;padding:8px 0;border-bottom:1px solid #d1d5db}.hp-modal-cabecalho h2{flex:1}.hp-modal-cabecalho button{width:32px;height:32px;padding:0;font-size:22px}
    .hp-modal h2{font-size:15px;margin:0}
    .hp-modal p{margin:0;line-height:1.45}
    .hp-modal input:not([type=checkbox]),.hp-modal select{font:inherit;padding:6px 8px;border:1px solid #9ca3af;border-radius:6px;min-width:0}
    .hp-modal label.campo{display:grid;gap:4px}
    .hp-modal label.marca{display:flex;gap:8px;align-items:center}
    .hp-modal .acoes{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
    .hp-modal button[type=submit],.hp-modal button.principal{background:#1d4ed8;border-color:#1d4ed8;color:#fff}
    .hp-modal button[type=submit]:hover{background:#1e40af}
    .hp-modal .lista{list-style:none;margin:0;padding:0;display:grid;gap:2px;max-height:56vh;overflow:auto}
    .hp-modal .lista button{width:100%;text-align:left;border:0;border-radius:6px;padding:7px 10px;display:flex;gap:10px;justify-content:space-between}
    .hp-modal .lista button[aria-selected=true]{background:#dbeafe}
    .hp-modal .lista .sem{color:#6b7280}
    .hp-modal .lista small{color:#6b7280;white-space:nowrap}
    .hp-modal .ajuda{font-size:13px;line-height:1.5}
    .hp-modal .ajuda h3{font-size:13px;margin:12px 0 4px}
    .hp-modal .ajuda ul{margin:0;padding-left:18px}
    .hp-modal canvas{border:1px solid #9ca3af;border-radius:6px;touch-action:none;background:#fff;cursor:crosshair;max-width:100%}
    ${(L.paineis ?? []).map(id => `html.hp-recolhida #${CSS.escape(id)}`).join(",") || "#hp-nada"}{display:none!important}`;
  document.head.append(estilo);
  if (ler("hefestus.tema") === "escuro") document.documentElement.classList.add("hp-escuro");

  // ------------------------------------------------------------ visualizador (só programas com documento)
  const $ = id => document.getElementById(id);
  let visor = null;
  if (temDocumento) {
    visor = document.createElement("section");
    visor.id = "hp-visor";
    visor.setAttribute("aria-label", "Documento");
    visor.innerHTML = `
      <header id="hp-visor-barra">
        <button type="button" id="hp-abrir" title="Abrir documento (Ctrl+O)">Abrir</button>
        <button type="button" id="hp-salvar" title="Salvar uma cópia (Ctrl+S)" disabled>Salvar cópia</button>
        <button type="button" id="hp-desfazer" title="Desfazer (Ctrl+Z)" disabled>↶</button>
        <button type="button" id="hp-refazer" title="Refazer (Ctrl+Y)" disabled>↷</button>
        <span id="hp-doc" title="">Nenhum documento aberto</span>
        <span id="hp-pagina"></span><span id="hp-zoom"></span>
        <span id="hp-status" role="status" aria-live="polite"></span>
        <span id="hp-motor"></span>
        <button type="button" id="hp-localizar" hidden>Localizar motor…</button>
        <button type="button" id="hp-fechar-texto" hidden>Voltar ao documento</button>
      </header>
      <div id="hp-corpo">
        <div id="hp-vazio"><p>Use <b>Abrir</b> para começar (Ctrl+O). Todos os comandos: Ctrl+K.</p></div>
        <div id="hp-folhas" hidden></div>
        <iframe id="hp-quadro" title="Documento" hidden></iframe>
        <pre id="hp-texto" tabindex="0" hidden></pre>
      </div>`;
    document.body.append(visor);
    for(const [id,acao,nome] of [['hp-abrir','abrir','Abrir'],['hp-salvar','salvar','Salvar cópia'],['hp-desfazer','desfazer','Desfazer'],['hp-refazer','refazer','Refazer']]){
      $(id).setAttribute('aria-label',nome);$(id).onclick=()=>executar({acao},nome).catch(e=>status(String(e),true));
    }
    const posicionar = () => {
      let fundo = 0;
      for (const e of document.querySelectorAll(".hf-arte .hf-el")) {
        if (!e.offsetParent && getComputedStyle(e).position !== "fixed") continue;
        const r = e.getBoundingClientRect();
        if (r.height > 0 && r.width > 0 && r.top < window.innerHeight * 0.7) fundo = Math.max(fundo, r.bottom);
      }
      visor.style.top = Math.round(Math.min(Math.max(fundo + 8, 60), window.innerHeight - 160)) + "px";
    };
    window.addEventListener("resize", posicionar);
    new MutationObserver(() => requestAnimationFrame(posicionar)).observe(document.querySelector(".hf-arte") ?? document.body, { attributes: true, subtree: true, attributeFilter: ["hidden", "style", "class"] });
    new MutationObserver(() => requestAnimationFrame(posicionar)).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    requestAnimationFrame(posicionar);
    $("hp-fechar-texto").onclick = () => mostrarDocumento();
  }

  // status: na barra do visualizador ou, sem ele, no aviso flutuante do programa
  let tAviso;
  const status = (texto, erro = false) => {
    if (visor) { const s = $("hp-status"); s.textContent = texto; s.classList.toggle("erro", erro); s.title = texto; return; }
    const a = $("hp-aviso");
    if (!a || !texto) return;
    a.textContent = texto; a.style.background = erro ? "#991b1b" : "";
    a.classList.add("on"); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove("on"), 3200);
  };
  const ocupado = v => { estado.ocupado = v; visor?.classList.toggle("ocupado", v); };
  const mostrarTexto = texto => {
    if (!visor) { janelaTexto("Resultado", texto); return; }
    $("hp-texto").textContent = texto; $("hp-texto").hidden = false; $("hp-fechar-texto").hidden = !estado.bytes;
    $("hp-quadro").hidden = true; $("hp-folhas").hidden = true; $("hp-vazio").hidden = true;
  };
  function mostrarDocumento() {
    if (!visor) return;
    const tem = !!estado.bytes;
    $("hp-texto").hidden = true; $("hp-fechar-texto").hidden = true;
    $("hp-folhas").hidden = !(tem && estado.visor);
    $("hp-quadro").hidden = !(tem && !estado.visor);
    $("hp-vazio").hidden = tem;
  }
  const tituloBase = document.title.split(" – ").pop();
  function atualizarBarra() {
    if (!visor) return;
    $('hp-salvar').disabled=!estado.bytes;$('hp-desfazer').disabled=!estado.desfazer.length;$('hp-refazer').disabled=!estado.refazer.length;
    const d = $("hp-doc");
    d.textContent = estado.caminho ? nomeDe(estado.caminho) : estado.bytes ? "Documento novo" : "Nenhum documento aberto";
    d.title = estado.caminho ?? ""; d.classList.toggle("mod", estado.modificado);
    document.title = estado.bytes ? `${estado.modificado ? "• " : ""}${nomeDe(estado.caminho ?? "Documento")} – ${tituloBase}` : tituloBase;
    const v = estado.visor;
    $("hp-pagina").textContent = v && estado.bytes && v.total ? `Página ${v.atual} de ${v.total}` : "";
    $("hp-zoom").textContent = v && estado.bytes ? `${Math.round(v.escala * 100)}%` : "";
  }

  // motor de PDF embutido (carrega em paralelo; se falhar, usa o leitor do Windows num quadro)
  const pdfPronto = ehPdf && window.__HEFESTUS_PDF__
    ? window.__HEFESTUS_PDF__.then(m => {
      estado.pdf = m;
      estado.visor = m.criarVisor($("hp-folhas"), { aoMudar: atualizarBarra });
      return m;
    }).catch(e => { console.warn("[programa] motor de PDF embutido indisponível", e); return null; })
    : Promise.resolve(null);

  async function exibir({ manterPosicao = false } = {}) {
    await pdfPronto;
    if (estado.visor) await estado.visor.mostrar(estado.bytes, { manterPosicao });
    else if (visor) {
      const q = $("hp-quadro");
      if (q.dataset.url) URL.revokeObjectURL(q.dataset.url);
      q.dataset.url = URL.createObjectURL(new Blob([estado.bytes], { type: "application/pdf" }));
      q.src = q.dataset.url;
    }
    mostrarDocumento(); atualizarBarra();
  }
  async function abrirCaminho(caminho) {
    const bytes = new Uint8Array(await invoke("ler_documento", { caminho }));
    Object.assign(estado, { caminho, bytes, modificado: false, desfazer: [], refazer: [] });
    await exibir();
  }
  /** Nova versão do documento (edição em memória): entra no desfazer. */
  async function novaVersao(bytes, irPara) {
    estado.desfazer.push(estado.bytes);
    if (estado.desfazer.length > LIMITE_HISTORICO) estado.desfazer.shift();
    estado.refazer = [];
    estado.bytes = bytes; estado.modificado = true;
    await exibir({ manterPosicao: true });
    if (irPara && estado.visor) estado.visor.irPara(irPara, false);
  }
  async function fecharDocumento() {
    if (!await podeDescartar("Fechar")) return false;
    estado.visor?.limpar();
    const q = visor && $("hp-quadro");
    if (q?.dataset.url) { URL.revokeObjectURL(q.dataset.url); q.removeAttribute("src"); delete q.dataset.url; }
    Object.assign(estado, { caminho: null, bytes: null, modificado: false, desfazer: [], refazer: [] });
    mostrarDocumento(); atualizarBarra(); status("");
    return true;
  }
  /** Caminho de um arquivo com o conteúdo ATUAL (para o motor externo, que lê do disco). */
  async function caminhoParaMotor() {
    if (!estado.modificado && estado.caminho) return estado.caminho;
    return invoke("gravar_temporario", estado.bytes, { headers: { extensao: "pdf" } });
  }
  async function salvarBytes(caminho, bytes) {
    await invoke("salvar_bytes", bytes, { headers: { caminho: encodeURIComponent(caminho) } });
  }
  async function salvarDocumento() {
    if (!estado.bytes) { status("Nada para salvar: abra um documento.", true); return false; }
    const sugestao = estado.caminho ? (estado.modificado ? `${semExt(nomeDe(estado.caminho))}-editado.pdf` : nomeDe(estado.caminho)) : "documento.pdf";
    const destino = await invoke("escolher_destino", { titulo: "Salvar cópia", nomeSugerido: sugestao, filtros: filtrosDoc });
    if (!destino) return false;
    await salvarBytes(destino, estado.bytes);
    Object.assign(estado, { caminho: destino, modificado: false });
    atualizarBarra(); status(`Salvo em ${nomeDe(destino)}.`);
    return true;
  }
  async function podeDescartar(acao) {
    if (!estado.modificado) return true;
    const r = await escolher(`${acao}: o documento tem alterações não salvas.`, ["Salvar cópia", "Descartar alterações"], true);
    if (r === 0) return salvarDocumento();
    return r === 1;
  }

  // ------------------------------------------------------------ motor externo
  async function verificarMotor() {
    if (!temMotor || !visor) return;
    try {
      const r = await invoke("motor_executar", { contrato: L.motor?.saude ?? { operation: "health" } });
      estado.motorOk = !!r?.ok;
    } catch (e) {
      estado.motorOk = false;
      console.warn("[programa] motor indisponível", e);
    }
    const m = $("hp-motor");
    m.textContent = estado.motorOk ? (L.motor?.nome ?? "motor") : "motor não encontrado";
    m.className = estado.motorOk ? "ok" : "falta";
    $("hp-localizar").hidden = estado.motorOk;
  }
  if (visor) $("hp-localizar").onclick = async () => {
    const r = await invoke("escolher_arquivos", { titulo: "Localizar o motor (programa .exe)", filtros: [{ nome: "Programa", extensoes: ["exe"] }], varios: false });
    if (!r?.length) return;
    await invoke("motor_definir", { executavel: r[0] });
    await verificarMotor();
  };

  // ------------------------------------------------------------ janelas (modais)
  function modal(html, aoMontar) {
    return new Promise(resolver => {
      const v = document.createElement("div");
      v.className = "hp-modal";
      v.innerHTML = `<form role="dialog" aria-modal="true">${html}</form>`;
      const antes = document.activeElement;
      let fechado=false;
      const fim = valor => { if(fechado)return;fechado=true;v.remove(); antes?.focus?.(); resolver(valor); };
      const form=v.querySelector('form'),cabecalho=document.createElement('header'),titulo=form.querySelector(':scope > h2')||document.createElement('h2');
      if(!titulo.textContent)titulo.textContent='Opções';
      const fechar=document.createElement('button');fechar.type='button';fechar.textContent='×';fechar.setAttribute('aria-label','Fechar janela');fechar.onclick=()=>fim(null);
      cabecalho.className='hp-modal-cabecalho';cabecalho.append(titulo,fechar);form.prepend(cabecalho);
      form.querySelectorAll('[data-cancelar]').forEach(b=>b.remove());
      v.addEventListener("keydown", e => {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fim(null); }
        if(e.key==='Tab'){
          const lista=[...form.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(el=>!el.disabled&&!el.hidden&&el.getClientRects().length);
          if(lista.length&&((e.shiftKey&&document.activeElement===lista[0])||(!e.shiftKey&&document.activeElement===lista.at(-1)))){e.preventDefault();(e.shiftKey?lista.at(-1):lista[0]).focus();}
        }
      });
      v.addEventListener("pointerdown", e => { if (e.target === v) fim(null); });
      document.body.append(v);
      aoMontar(v.querySelector("form"), fim);
    });
  }
  const pedirTexto = (titulo, exemplo, valor = "") => modal(
    `<label class="campo"><b>${esc(titulo)}</b><input name="v" placeholder="${esc(exemplo ?? "")}" value="${esc(valor)}" autocomplete="off"></label>
     <div class="acoes"><button type="button" data-cancelar>Cancelar</button><button type="submit">OK</button></div>`,
    (f, fim) => { f.onsubmit = e => { e.preventDefault(); fim(f.v.value.trim() || null); }; f.v.focus(); f.v.select(); });
  /** Devolve a lista de páginas; vazio permitido → [] */
  async function pedirPaginas(titulo, padrao = "", vazioOk = false) {
    const v = await modal(
      `<label class="campo"><b>${esc(titulo)}</b><input name="v" placeholder="ex.: 1, 3-5 ou todas" value="${esc(padrao)}" autocomplete="off"></label>
       <div class="acoes"><button type="button" data-cancelar>Cancelar</button><button type="submit">OK</button></div>`,
      (f, fim) => { f.onsubmit = e => { e.preventDefault(); fim(f.v.value.trim()); }; f.v.focus(); f.v.select(); });
    if (v === null) return null;
    if (!v) return vazioOk ? [] : null;
    if (/^tod[ao]s?$/i.test(v)) return Array.from({ length: estado.visor?.total ?? 0 }, (_, i) => String(i + 1));
    return expandirPaginas(v);
  }
  const escolher = (titulo, opcoes, comCancelar = true) => modal(
    `<p><b>${esc(titulo)}</b></p><div class="acoes">${comCancelar ? `<button type="button" data-cancelar>Cancelar</button>` : ""}${opcoes.map((o, i) => `<button type="button" data-i="${i}"${i === 0 ? ' class="principal"' : ""}>${esc(o)}</button>`).join("")}</div>`,
    (f, fim) => { f.querySelectorAll("[data-i]").forEach(b => b.onclick = () => fim(Number(b.dataset.i))); f.querySelector("[data-i]")?.focus(); });
  const confirmar = async texto => (await escolher(texto, ["Continuar"])) === 0;
  const pedirFormulario = (titulo, campos) => modal(
    `<h2>${esc(titulo)}</h2>${campos.map((c, i) => c.tipo === "caixa"
      ? `<label class="marca"><input type="checkbox" name="c${i}"${c.valor ? " checked" : ""}> ${esc(c.nome)}</label>`
      : c.tipo === "lista"
        ? `<label class="campo">${esc(c.nome)}<select name="c${i}"><option value=""></option>${c.opcoes.map(o => `<option${o === c.valor ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`
        : `<label class="campo">${esc(c.nome)}<input name="c${i}" value="${esc(c.valor)}" autocomplete="off"></label>`).join("")}
     <div class="acoes"><button type="button" data-cancelar>Cancelar</button><button type="submit">Aplicar</button></div>`,
    (f, fim) => {
      f.onsubmit = e => {
        e.preventDefault();
        fim(Object.fromEntries(campos.map((c, i) => [c.nome, c.tipo === "caixa" ? f[`c${i}`].checked : f[`c${i}`].value])));
      };
      f.querySelector("input,select")?.focus();
    });
  const desenharAssinatura = () => modal(
    `<h2>Assinatura desenhada</h2><p>Desenhe com o mouse, a caneta ou o dedo.</p><canvas width="560" height="200" aria-label="Área para desenhar a assinatura"></canvas>
     <div class="acoes"><button type="button" data-limpar>Limpar</button><button type="button" data-cancelar>Cancelar</button><button type="submit">Usar assinatura</button></div>`,
    (f, fim) => {
      const c = f.querySelector("canvas"), g = c.getContext("2d");
      g.lineWidth = 2.6; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#0b1f5c";
      let desenhando = false, riscou = false;
      const ponto = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
      c.onpointerdown = e => { desenhando = true; c.setPointerCapture(e.pointerId); g.beginPath(); g.moveTo(...ponto(e)); };
      c.onpointermove = e => { if (!desenhando) return; g.lineTo(...ponto(e)); g.stroke(); riscou = true; };
      c.onpointerup = () => { desenhando = false; };
      f.querySelector("[data-limpar]").onclick = () => { g.clearRect(0, 0, c.width, c.height); riscou = false; };
      f.onsubmit = e => {
        e.preventDefault();
        if (!riscou) { f.querySelector("p").textContent = "Desenhe a assinatura antes de usar."; return; }
        c.toBlob(async b => fim(new Uint8Array(await b.arrayBuffer())), "image/png");
      };
    });
  const janelaTexto = (titulo, corpoHtmlOuTexto, html = false) => modal(
    `<h2>${esc(titulo)}</h2><div class="ajuda">${html ? corpoHtmlOuTexto : `<pre style="white-space:pre-wrap;margin:0">${esc(corpoHtmlOuTexto)}</pre>`}</div>`,
    (f, fim) => { f.onsubmit = e => { e.preventDefault(); fim(true); }; f.querySelector("button").focus(); });

  /** "1, 3-5" → ["1","3","4","5"] */
  function expandirPaginas(texto) {
    const out = [];
    for (const parte of String(texto).split(/[,;\s]+/).filter(Boolean)) {
      const m = parte.match(/^(\d+)(?:-(\d+))?$/);
      if (!m) throw new Error(`Página inválida: "${parte}". Use números e intervalos, ex.: 1, 3-5.`);
      const a = Number(m[1]), b = Number(m[2] ?? m[1]);
      if (a < 1 || b < a || b - a > 5000) throw new Error(`Intervalo inválido: "${parte}".`);
      for (let i = a; i <= b; i++) out.push(String(i));
    }
    if (!out.length) throw new Error("Nenhuma página informada.");
    return out;
  }
  const sugestao = (modelo, extra = {}) => String(modelo ?? "resultado")
    .replaceAll("{nome}", semExt(nomeDe(estado.caminho ?? "documento")))
    .replaceAll("{arquivo}", semExt(nomeDe(extra.arquivo ?? estado.caminho ?? "documento")));

  // ------------------------------------------------------------ paleta e ajuda
  const ORIGEM = { operacao: "motor", pdf: "PDF", pendente: "sem motor" };
  const comandos = () => Object.entries(sinais).map(([sinal, lig]) => ({ sinal, lig, rotulo: lig.rotulo ?? sinal }))
    .filter((c, i, a) => a.findIndex(o => o.rotulo === c.rotulo) === i && !["paleta"].includes(c.lig.acao))
    .sort((a, b) => (a.lig.acao === "pendente") - (b.lig.acao === "pendente") || a.rotulo.localeCompare(b.rotulo, "pt-BR"));
  async function paleta() {
    const todos = comandos();
    const escolhido = await modal(
      `<label class="campo"><b>Todos os comandos</b><input name="busca" placeholder="Digite para procurar…" autocomplete="off" role="combobox" aria-controls="hp-lista" aria-expanded="true"></label>
       <ul class="lista" id="hp-lista" role="listbox"></ul>`,
      (f, fim) => {
        const ul = f.querySelector("ul");
        let vis = [], sel = 0;
        const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        const desenhar = () => {
          const q = norm(f.busca.value);
          vis = todos.filter(c => !q || norm(c.rotulo).includes(q) || norm(c.sinal).includes(q));
          sel = Math.min(sel, Math.max(0, vis.length - 1));
          ul.innerHTML = vis.map((c, i) => `<li><button type="button" role="option" data-i="${i}" aria-selected="${i === sel}" class="${c.lig.acao === "pendente" ? "sem" : ""}">${esc(c.rotulo)}<small>${esc(ORIGEM[c.lig.acao] ?? "")}</small></button></li>`).join("") || `<li class="sem" style="padding:8px">Nada encontrado.</li>`;
          ul.querySelectorAll("button").forEach(b => b.onclick = () => fim(vis[Number(b.dataset.i)]));
          ul.querySelector("[aria-selected=true]")?.scrollIntoView({ block: "nearest" });
        };
        f.busca.oninput = () => { sel = 0; desenhar(); };
        f.busca.onkeydown = e => {
          if (e.key === "ArrowDown") { sel = Math.min(vis.length - 1, sel + 1); desenhar(); e.preventDefault(); }
          if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); desenhar(); e.preventDefault(); }
        };
        f.onsubmit = e => { e.preventDefault(); if (vis[sel]) fim(vis[sel]); };
        desenhar(); f.busca.focus();
      });
    if (escolhido) executar(escolhido.lig, escolhido.rotulo).catch(e => status(String(e), true));
  }
  function ajuda() {
    const todos = comandos();
    const ligados = todos.filter(c => c.lig.acao !== "pendente"), faltam = todos.filter(c => c.lig.acao === "pendente");
    const grupo = (titulo, lista, comMotivo) => lista.length ? `<h3>${esc(titulo)} (${lista.length})</h3><ul>${lista.map(c => `<li>${esc(c.rotulo)}${comMotivo && c.lig.motivo ? `: <span style="color:#6b7280">${esc(c.lig.motivo)}</span>` : ""}</li>`).join("")}</ul>` : "";
    return janelaTexto("Recursos e limitações",
      `<p>${ligados.length} de ${todos.length} comandos com ligações definidas. Operações externas dependem dos motores e recursos instalados. Atalhos: Ctrl+K todos os comandos, Ctrl+O abrir, Ctrl+S salvar cópia, Ctrl+Z / Ctrl+Y desfazer e refazer, Ctrl + roda do mouse para zoom.</p>
       ${grupo("Pelo motor externo", ligados.filter(c => c.lig.acao === "operacao"), false)}
       ${grupo("Pelo motor de PDF embutido", ligados.filter(c => c.lig.acao === "pdf"), false)}
       ${grupo("Da janela", ligados.filter(c => !["operacao", "pdf"].includes(c.lig.acao)), false)}
       ${grupo("Ainda sem motor", faltam, true)}`, true);
  }

  // ------------------------------------------------------------ copiar, recortar, colar
  let ultimoCampo = null, ultimaSelecao = "";
  const editavel = e => e && (e.tagName === "TEXTAREA" || (e.tagName === "INPUT" && /^(text|search|email|url|tel|number|password|)$/i.test(e.type)) || e.isContentEditable) && !e.closest(".hp-modal");
  document.addEventListener("focusin", e => { if (editavel(e.target)) ultimoCampo = e.target; });
  document.addEventListener("selectionchange", () => {
    const t = String(window.getSelection() ?? "");
    if (t) ultimaSelecao = t;
  });
  async function editar(comando) {
    const campo = editavel(document.activeElement) ? document.activeElement : ultimoCampo;
    if (comando === "selecionarTudo") {
      if (campo) { campo.focus(); campo.select?.(); return; }
      const camadas = document.querySelectorAll(".textLayer");
      if (camadas.length) { const r = document.createRange(); r.setStartBefore(camadas[0]); r.setEndAfter(camadas[camadas.length - 1]); getSelection().removeAllRanges(); getSelection().addRange(r); }
      return;
    }
    if (comando === "colar") {
      if (!campo) { status("Clique num campo de texto antes de colar.", true); return; }
      let t;
      try { t = await navigator.clipboard.readText(); } catch { status("A janela não deu acesso à área de transferência. Use Ctrl+V no campo.", true); return; }
      campo.focus();
      if (!document.execCommand("insertText", false, t)) campo.setRangeText?.(t, campo.selectionStart ?? 0, campo.selectionEnd ?? 0, "end");
      return;
    }
    const doCampo = campo && campo.selectionStart !== campo.selectionEnd ? campo.value.slice(campo.selectionStart, campo.selectionEnd) : "";
    const texto = doCampo || String(getSelection() ?? "") || ultimaSelecao;
    if (!texto) { status("Selecione um texto primeiro (no documento ou num campo).", true); return; }
    try { await navigator.clipboard.writeText(texto); } catch { campo?.focus(); document.execCommand("copy"); }
    if (comando === "recortar") {
      if (doCampo) { campo.focus(); document.execCommand("delete") || campo.setRangeText("", campo.selectionStart, campo.selectionEnd, "end"); status("Recortado."); }
      else status("O texto do documento não pode ser apagado daqui; ele foi copiado.");
    } else status(`Copiado: ${texto.length} caractere${texto.length > 1 ? "s" : ""}.`);
  }

  // ------------------------------------------------------------ recolher a faixa
  function recolherFaixa(forcar) {
    const raiz = document.documentElement;
    const v = forcar ?? !raiz.classList.contains("hp-recolhida");
    raiz.classList.toggle("hp-recolhida", v);
    status(v ? "Faixa recolhida (clique numa aba para abrir de novo)." : "");
  }
  // com a faixa recolhida, clicar numa aba abre de novo
  if (L.paineis?.length) document.addEventListener("click", e => {
    if (!document.documentElement.classList.contains("hp-recolhida")) return;
    const el = e.target.closest?.(".hf-el");
    if (el && (L.abas ?? []).includes(el.id)) recolherFaixa(false);
  }, true);

  // ------------------------------------------------------------ executar um comando
  async function executar(lig, rotulo) {
    if (estado.ocupado) { status("Termine o comando em andamento (Esc cancela)."); return; }
    const nome = lig.rotulo ?? rotulo;
    const precisaDoc = () => { if (estado.bytes) return false; status(`Abra um documento antes de usar "${nome}".`, true); return true; };
    switch (lig.acao) {
      case "aviso": status(lig.texto ?? nome); return;
      case "pendente": status(`"${nome}" ainda não tem motor${lig.motivo ? `: ${lig.motivo}` : ""}. Veja Ajuda › Recursos e limitações.`, true); return;
      case "telaCheia": (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())?.catch?.(() => {}); return;
      case "paleta": return paleta();
      case "ajuda": return ajuda();
      case "tema": {
        const escuro = document.documentElement.classList.toggle("hp-escuro");
        guardar("hefestus.tema", escuro ? "escuro" : "claro");
        status(escuro ? "Tema escuro." : "Tema claro.");
        return;
      }
      case "recolherFaixa": recolherFaixa(); return;
      case "editar": return editar(lig.comando);
      case "sair": if (await podeDescartar("Sair")) await invoke("sair").catch(() => window.close()); return;
      case "fechar": await fecharDocumento(); return;
      case "salvar": try { await salvarDocumento(); } catch (e) { status(`Não salvei: ${e}`, true); } return;
      case "imprimir":
        if (!temDocumento) { window.print(); return; }
        if (precisaDoc()) return;
        if (!estado.visor) { status("Clique no documento e use Ctrl+P.", false); return; }
        ocupado(true); status("Preparando a impressão");
        try { await estado.visor.imprimir(); status(""); } catch (e) { status(`Não imprimi: ${e}`, true); } finally { ocupado(false); }
        return;
      case "zoom":
        if (estado.visor && estado.bytes) { lig.ajustar ? estado.visor.ajustar() : estado.visor.zoom(lig.passo); }
        else if (!temDocumento) { const z = lig.ajustar ? 1 : Math.min(2, Math.max(0.5, (Number(document.body.style.zoom) || 1) + 0.1 * lig.passo)); document.body.style.zoom = z; status(`Zoom ${Math.round(z * 100)}%.`); }
        else precisaDoc();
        return;
      case "pagina":
        if (precisaDoc() || !estado.visor) return;
        if (lig.ir === "primeira") estado.visor.irPara(1); else if (lig.ir === "ultima") estado.visor.irPara(estado.visor.total); else estado.visor.pagina(lig.passo);
        return;
      case "desfazer": case "refazer": {
        const de = lig.acao === "desfazer" ? estado.desfazer : estado.refazer, para = lig.acao === "desfazer" ? estado.refazer : estado.desfazer;
        if (!de.length) { status(lig.acao === "desfazer" ? "Nada para desfazer." : "Nada para refazer."); return; }
        para.push(estado.bytes); estado.bytes = de.pop(); estado.modificado = true;
        await exibir({ manterPosicao: true });
        status(lig.acao === "desfazer" ? "Desfeito." : "Refeito.");
        return;
      }
      case "abrir": {
        if (!await podeDescartar("Abrir outro")) return;
        const r = await invoke("escolher_arquivos", { titulo: "Abrir", filtros: filtrosDoc, varios: false });
        if (!r?.length) return;
        ocupado(true); status(`Abrindo ${nomeDe(r[0])}`);
        try {
          await abrirCaminho(r[0]);
          const n = estado.visor?.total;
          status(n ? `${n} página${n > 1 ? "s" : ""}.` : "Aberto.");
        } catch (e) { status(`Não abri: ${String(e).replace(/^Error:\s*/, "")}`, true); } finally { ocupado(false); }
        return;
      }
      case "pdf": {
        if (precisaDoc()) return;
        const m = await pdfPronto;
        if (!m) { status("O motor de PDF embutido não carregou nesta janela.", true); return; }
        const op = m.operacoes[lig.op];
        if (!op) { status(`${nome}: operação "${lig.op}" não existe no motor de PDF.`, true); return; }
        const ctx = {
          bytes: estado.bytes, nome: semExt(nomeDe(estado.caminho ?? "documento")), visor: estado.visor,
          pedirTexto, pedirPaginas, escolher, confirmar, pedirFormulario, desenharAssinatura, expandirPaginas,
          escolherArquivos: (titulo, filtros, varios) => invoke("escolher_arquivos", { titulo, filtros, varios }),
          escolherDestino: (titulo, nomeSugerido, filtros) => invoke("escolher_destino", { titulo, nomeSugerido, filtros }),
          lerArquivo: async caminho => new Uint8Array(await invoke("ler_documento", { caminho })),
          salvarBytes, status,
        };
        const inicio = performance.now();
        estado.ocupado = true; // um comando por vez (o atual pode estar esperando um clique ou uma resposta)
        try {
          const r = await op(ctx, lig);
          if (!r) { status(""); return; }
          ocupado(true);
          if (r.bytes) await novaVersao(r.bytes, r.irPara);
          if (r.texto) mostrarTexto(r.texto);
          const seg = (performance.now() - inicio) / 1000;
          status(`${r.mensagem ?? `${nome}: concluído.`}${r.bytes ? " Salve uma cópia para manter (Ctrl+S)." : ""}${seg > 3 ? ` (${seg.toFixed(1)} s)` : ""}`);
        } catch (e) {
          status(`${nome}: ${String(e?.message ?? e).replace(/^Error:\s*/, "")}`, true);
        } finally { ocupado(false); }
        return;
      }
      case "operacao": break;
      default: status(`${nome}: ação "${lig.acao}" desconhecida.`, true); return;
    }

    // ---- operação no motor externo
    if (!lig.semDocumento && precisaDoc()) return;
    if (estado.motorOk === false) { status("O motor não foi encontrado. Use \"Localizar motor…\".", true); return; }
    const contrato = { ...(lig.contrato ?? {}) };
    const extra = {};
    for (const [campo, p] of Object.entries(lig.pedir ?? {})) {
      if (p.tipo === "arquivos" || p.tipo === "arquivo") {
        const r = await invoke("escolher_arquivos", { titulo: p.titulo ?? nome, filtros: p.filtros ?? [], varios: p.tipo === "arquivos" });
        if (!r?.length) return;
        contrato[campo] = p.tipo === "arquivos" ? r : r[0];
        extra.arquivo ??= r[0];
      } else if (p.tipo === "paginas" || p.tipo === "texto") {
        const v = await pedirTexto(p.titulo ?? nome, p.exemplo);
        if (v == null) return;
        try { contrato[campo] = p.tipo === "paginas" ? expandirPaginas(v) : v; } catch (e) { status(e.message, true); return; }
      }
    }
    if (lig.saida) {
      const destino = await invoke("escolher_destino", { titulo: `${nome}: salvar como`, nomeSugerido: sugestao(lig.saida.sugestao, extra), filtros: lig.saida.filtros ?? filtrosDoc });
      if (!destino) return;
      contrato.output = destino;
      contrato.overwrite = true; // o diálogo do Windows já confirmou a substituição
    }
    let destinoTexto = null;
    if (lig.salvarTexto) {
      destinoTexto = await invoke("escolher_destino", { titulo: `${nome}: salvar como`, nomeSugerido: sugestao(lig.salvarTexto.sugestao, extra), filtros: lig.salvarTexto.filtros ?? [] });
      if (!destinoTexto) return;
    }

    ocupado(true); status(`${nome}: processando`);
    const inicio = performance.now();
    try {
      if (!lig.semDocumento) contrato.input = await caminhoParaMotor();
      const r = await invoke("motor_executar", { contrato });
      const seg = ((performance.now() - inicio) / 1000).toFixed(1);
      const res = r?.result ?? {};
      if (lig.salvarTexto) {
        const corpo = String(res?.[lig.salvarTexto.campo] ?? res?.detail?.[lig.salvarTexto.campo] ?? "");
        const titulo = lig.salvarTexto.titulo ? sugestao(lig.salvarTexto.titulo, extra) : "";
        await invoke("salvar_texto", { caminho: destinoTexto, conteudo: titulo + corpo });
        status(`${nome}: salvo em ${nomeDe(destinoTexto)} (${seg} s).`);
      } else if (lig.mostrar) {
        const vazio = res == null || (Array.isArray(res) && !res.length) || (lig.mostrar !== "tudo" && !String(res?.[lig.mostrar] ?? "").trim());
        const texto = vazio ? (lig.vazio ?? "(sem conteúdo)") : lig.mostrar === "tudo" ? JSON.stringify(res, null, 2) : String(res[lig.mostrar]);
        mostrarTexto(texto);
        status(`${nome} (${seg} s).`);
      } else if (res.output) {
        status(`${nome}: salvo em ${nomeDe(res.output)} (${seg} s).`);
        if (lig.abrirResultado && await podeDescartar("Abrir o resultado")) await abrirCaminho(res.output);
      } else status(`${nome}: concluído (${seg} s).`);
    } catch (e) {
      status(`${nome}: ${String(e).replace(/^Error:\s*/, "")}`, true);
    } finally { ocupado(false); }
  }

  window.hefestusPrograma.aoSinal(({ sinal, elemento }) => {
    const lig = sinais[sinal];
    if (!lig) return false;
    const rotulo = elemento?.getAttribute("aria-label") || elemento?.textContent?.trim() || sinal;
    executar(lig, rotulo).catch(e => status(String(e), true));
    return true;
  });

  // atalhos de teclado (só os que têm comando ligado, mais a paleta e a ajuda)
  const porAcao = acao => Object.values(sinais).find(l => l.acao === acao);
  const ATALHOS = { k: { acao: "paleta" }, o: porAcao("abrir"), s: porAcao("salvar"), z: porAcao("desfazer") ?? (temDocumento ? { acao: "desfazer" } : null), y: porAcao("refazer") ?? (temDocumento ? { acao: "refazer" } : null), p: temDocumento ? { acao: "imprimir" } : null };
  window.addEventListener("keydown", e => {
    if (document.querySelector(".hp-modal")) return;
    if (e.key === "F1") { e.preventDefault(); ajuda(); return; }
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    if (editavel(document.activeElement) && ["z", "y"].includes(k)) return; // desfazer do campo de texto
    if ((k === "+" || k === "=" || k === "-") && estado.visor && estado.bytes) { e.preventDefault(); estado.visor.zoom(k === "-" ? -1 : 1); return; }
    const lig = ATALHOS[k];
    if (!lig) return;
    e.preventDefault();
    executar(lig, lig.rotulo ?? k).catch(err => status(String(err), true));
  });
  // soltar um arquivo na janela não troca a página do programa
  window.addEventListener("dragover", e => e.preventDefault());
  window.addEventListener("drop", e => e.preventDefault());
  verificarMotor();
})();
