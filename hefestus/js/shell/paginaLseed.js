// App Shell (issue #43, fase S2): página do perfil L-SEED. Servida pela Central em
// /hefestus/shell/l-seed.html (mesma origem); o motor é a Central, o shell dá áreas, temas e comandos.
// Fase S2b: Memória e Projetos ligados à Central (só leitura) e conversas salvas no cofre.
import { CommandRegistry } from "../nucleo/comandos.js";
import { TEMAS_UI, ALIAS_TEMA_UI, aplicarTemaUI } from "../ui/temas.js";
import { validarPerfil } from "./perfil.js";
import { criarAreas } from "./areas.js";
import { criarMotorLseed } from "./motorLseed.js";
import { criarSessao, adicionarFala, exportarSessao, importarSessao, carregarConversa } from "./sessaoConversa.js";
import { registrarComandosLseed } from "./comandosLseed.js";

const CHAVE = "hefestus.shell.l-seed";
const $ = s => document.querySelector(s);
const el = (tag, props = {}, ...filhos) => { const e = Object.assign(document.createElement(tag), props); e.append(...filhos); return e; };
const lerPrefs = () => { try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; } };
const gravarPrefs = ui => { try { localStorage.setItem(CHAVE, JSON.stringify(ui)); } catch { /* sem armazenamento: segue em memória */ } };
const ler = async url => { const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); };

function avisar(texto, erro = false) { const a = $("#aviso"); a.textContent = texto; a.dataset.erro = String(erro); }

async function iniciar() {
  const [perfil, esquema] = await Promise.all([ler("../perfis/l-seed.perfil.json"), ler("../perfis/perfil.schema.json")]);
  const erros = validarPerfil(perfil, esquema, { temas: TEMAS_UI, apelidos: ALIAS_TEMA_UI });
  if (erros.length) throw new Error("Perfil inválido: " + erros.join("; "));
  document.title = perfil.nome;
  $("#titulo").textContent = perfil.nome;

  const ui = lerPrefs();
  const areas = criarAreas(perfil, { aoTrocar: () => gravarPrefs(ui) });
  areas.iniciarAreas(ui);
  aplicarTemaUI(ui.temaUI);

  const motor = criarMotorLseed();
  const personas = perfil.areas.find(a => a.id === "conversa").abas;
  let sessao = criarSessao(personas, personas.includes(ui.aba) ? ui.aba : personas[0]);
  let controle = null;
  const ocupado = () => controle !== null;
  const personaAtual = () => ui.areaAtiva === "conversa" ? ui.aba : sessao.personaAtiva;

  const registro = new CommandRegistry();
  const baixar = (nome, texto) => { const a = el("a", { href: URL.createObjectURL(new Blob([texto], { type: "application/json" })), download: nome }); a.click(); URL.revokeObjectURL(a.href); };
  registrarComandosLseed(registro, {
    ui, falas: () => sessao.conversas[personaAtual()],
    ocupado,
    aoMudar: () => { gravarPrefs(ui); desenhar(); },
    async salvar() {
      try { const r = await motor.salvar({ persona: personaAtual(), mensagens: sessao.conversas[personaAtual()] }); avisar(`Salvo no cofre: ${r.arquivo}`); listarSalvas(); }
      catch (e) { avisar(`Não salvou: ${e.message}`, true); }
    },
    abrir() { $("#arquivo").click(); },
    exportar() { baixar(`conversa-${personaAtual()}.json`, JSON.stringify(exportarSessao(sessao), null, 2)); avisar("Conversa exportada."); },
    parar() { controle?.abort(); },
    escolhida: () => $("#salvas").value,
    async abrirCofre() {
      try {
        const c = await motor.abrirConversa($("#salvas").value);
        const persona = personas.includes(c.persona) ? c.persona : personaAtual();
        carregarConversa(sessao, persona, c.mensagens);
        areas.trocarArea(ui, "conversa"); ui.aba = persona; gravarPrefs(ui);
        avisar(`Conversa aberta do cofre: ${c.titulo}` + (c.persona === persona ? "" : ` (era de "${c.persona}"; aberta na aba ${persona})`));
      } catch (e) { avisar(`Não abriu: ${e.message}`, true); }
      desenhar();
    },
  });

  async function listarSalvas() {
    const sel = $("#salvas"), antes = sel.value;
    try {
      const lista = await motor.conversas();
      sel.replaceChildren(el("option", { value: "", textContent: lista.length ? "Conversas salvas no cofre…" : "Nenhuma conversa salva no cofre" }),
        ...lista.map(c => el("option", { value: c.arquivo, textContent: c.nome })));
      sel.value = lista.some(c => c.arquivo === antes) ? antes : "";
    } catch (e) { sel.replaceChildren(el("option", { value: "", textContent: `Lista indisponível: ${e.message}` })); }
    desenhar();
  }
  $("#salvas").addEventListener("change", () => desenhar());

  // Áreas Memória e Projetos: a Central responde com texto, aviso, campo de consulta e itens (só leitura).
  let pedidoPainel = 0;
  const chavePainel = () => `${ui.areaAtiva}/${ui.aba}`;
  function desenharEvidencias(projetos, modulo = false) {
    const alvo = $("#evidencias");
    alvo.replaceChildren(); alvo.hidden = !Array.isArray(projetos);
    if (alvo.hidden) return;
    const colunas = [modulo ? "Módulo" : "Projeto", "Arquivos", "Capacidades", "Arquivos de teste", "Cap. HDB", "Refs. HDB", "Refs. correspondentes", "Refs. divergentes", "Progresso"];
    const cab = el("thead", {}, el("tr", {}, ...colunas.map(texto => el("th", { scope: "col", textContent: texto }))));
    const corpo = el("tbody", {}, ...projetos.map(p => el("tr", {}, ...[p.nome, p.arquivos, p.capacidades, p.arquivos_de_teste,
      p.hdb_capacidades, p.hdb_registradas, p.hdb_correspondentes, p.hdb_divergentes, "Não mensurado"].map(v => el("td", { textContent: String(v ?? "—") })))));
    alvo.append(el("table", { ariaLabel: "Evidências por projeto" }, cab, corpo));
  }
  async function carregarPainel() {
    const n = ++pedidoPainel, chave = chavePainel();
    ui.consultas ??= {}; ui.itens ??= {};
    const atual=()=>n===pedidoPainel&&chave===chavePainel();
    $("#atualizar-painel").disabled=true;
    $("#consulta").hidden=true; $("#itens").replaceChildren();
    $("#painel-aviso").textContent = "Carregando…"; $("#painel-texto").textContent = "";
    $("#painel-texto").hidden=true;
    desenharEvidencias(null);
    try {
      const r = await motor.painel({ area: ui.areaAtiva, aba: ui.aba, q: ui.consultas[chave] || "", item: ui.itens[chave] || "" });
      if (!atual()) return;
      const form = $("#consulta");
      form.hidden = !r.consulta;
      if (r.consulta) { $("#consulta-rotulo").textContent = r.consulta.rotulo; $("#consulta-q").value = r.consulta.valor || ""; }
      $("#itens").replaceChildren(...(r.itens || []).map(id => {
        const b = el("button", { type: "button", textContent: id });
        b.setAttribute("aria-pressed", String(id === r.item));
        b.addEventListener("click", () => { ui.itens[chave] = id; gravarPrefs(ui); carregarPainel(); });
        return b;
      }));
      $("#painel-aviso").textContent = r.aviso || "";
      $("#painel-texto").textContent = r.texto || "";
      $("#painel-texto").hidden = !r.texto;
      desenharEvidencias(r.evidencias, r.item && r.item !== "todos");
    } catch (e) { if (atual()) $("#painel-aviso").textContent = `A Central não respondeu: ${e.message}`; }
    finally { if (atual()) $("#atualizar-painel").disabled=false; }
  }
  $("#atualizar-painel").addEventListener("click", () => carregarPainel());
  $("#consulta").addEventListener("submit", ev => {
    ev.preventDefault(); ui.consultas[chavePainel()] = $("#consulta-q").value; gravarPrefs(ui); carregarPainel();
  });

  $("#arquivo").addEventListener("change", async ev => {
    const f = ev.target.files[0]; ev.target.value = "";
    if (!f) return;
    try { sessao = importarSessao(JSON.parse(await f.text()), personas); areas.trocarArea(ui, "conversa"); ui.aba = sessao.personaAtiva; avisar(`Conversa aberta: ${f.name}`); }
    catch (e) { avisar(`Não abriu: ${e.message}`, true); }
    desenhar();
  });

  const temas = $("#tema");
  for (const [id, t] of Object.entries(TEMAS_UI)) temas.append(el("option", { value: id, textContent: t.nome || id }));
  temas.value = TEMAS_UI[ui.temaUI] ? ui.temaUI : "automatico";
  temas.addEventListener("change", () => { ui.temaUI = temas.value; aplicarTemaUI(ui.temaUI); gravarPrefs(ui); });

  try {
    const est = await motor.estado();
    const modelos = $("#modelo");
    for (const m of est.modelos || []) modelos.append(el("option", { value: m, textContent: m }));
    const lista = est.modelos || [];
    modelos.value = [ui.modelo, est.padrao].find(m => m && lista.includes(m)) ?? lista[0] ?? "";
    modelos.addEventListener("change", () => { ui.modelo = modelos.value; gravarPrefs(ui); });
    avisar(est.ollama ? "Central do L-SEED conectada." : "Central conectada; o Ollama não respondeu (modelos na nuvem continuam disponíveis se ligados).", !est.ollama);
  } catch (e) { avisar(`A Central não respondeu: ${e.message}`, true); }

  $("#form").addEventListener("submit", async ev => {
    ev.preventDefault();
    const caixa = $("#mensagem"), texto = caixa.value.trim();
    if (!texto || ocupado()) return;
    const persona = personaAtual();
    adicionarFala(sessao, persona, "user", texto); caixa.value = "";
    const resposta = adicionarFala(sessao, persona, "assistant", "");
    controle = new AbortController(); desenhar();
    try {
      await motor.conversar({ persona, mensagens: sessao.conversas[persona].slice(0, -1), modelo: $("#modelo").value || undefined,
        memoria: ui.memoria !== false, busca: ui.busca === true, memoria_brs3: $("#memoria-brs3").checked, sinal: controle.signal },
      evento => {
        if (evento.tipo === "texto") { resposta.content += evento.t; desenharFalas(); }
        if (evento.tipo === "contexto" && evento.fontes?.length) avisar(`Fontes: ${evento.fontes.join(", ")}`);
        if (evento.tipo === "fim") avisar(`Pronto: ${evento.tokens ?? 0} tokens em ${evento.segundos ?? 0}s.`);
        if (evento.tipo === "erro") avisar(evento.msg, true);
      });
    } catch (e) { if (e.name !== "AbortError") avisar(`Erro: ${e.message}`, true); }
    if (!resposta.content) sessao.conversas[persona].pop();
    controle = null; desenhar();
  });

  function desenharFalas() {
    const lista = $("#falas"); lista.replaceChildren();
    for (const f of sessao.conversas[personaAtual()] || [])
      lista.append(el("li", { className: f.role, textContent: f.content || "…" }));
    lista.scrollTop = lista.scrollHeight;
  }

  function botaoComando(id) {
    const est = registro.estado(id);
    if (!est.visivel) return null;
    const b = el("button", { type: "button", textContent: est.rotulo, disabled: !est.habilitado });
    if (["lseed.buscar", "lseed.dados"].includes(id)) b.setAttribute("aria-pressed", String(est.marcado));
    b.addEventListener("click", () => { registro.executar(id); desenhar(); });
    return b;
  }

  function desenhar() {
    const nav = $("#areas"); nav.replaceChildren();
    for (const a of perfil.areas) {
      const b = el("button", { type: "button", textContent: a.nome, role: "tab" });
      b.setAttribute("aria-selected", String(ui.areaAtiva === a.id));
      b.addEventListener("click", () => { areas.trocarArea(ui, a.id); desenhar(); if (a.id !== "conversa") carregarPainel(); });
      nav.append(b);
    }
    const abas = $("#abas"); abas.replaceChildren();
    for (const id of areas.abasDe(ui.areaAtiva)) {
      const b = el("button", { type: "button", textContent: id === "smartqueue" ? "SMARTQUEUE" : id, role: "tab" });
      b.setAttribute("aria-selected", String(ui.aba === id));
      b.addEventListener("click", () => { ui.aba = id; if (ui.areaAtiva === "conversa") sessao.personaAtiva = id; gravarPrefs(ui); desenhar(); if (ui.areaAtiva !== "conversa") carregarPainel(); });
      abas.append(b);
    }
    const ids = [...new Set([...perfil.acessoRapido, "lseed.salvar", "lseed.abrir", "lseed.exportar", "lseed.parar"])].filter(id => id !== "lseed.abrirCofre");
    $("#acesso").replaceChildren(...ids.map(botaoComando).filter(Boolean));
    const conversa = ui.areaAtiva === "conversa";
    $("#conversa").hidden = !conversa;
    $("#painel").hidden = conversa;
    $("#painel").setAttribute("aria-label", perfil.areas.find(a => a.id === ui.areaAtiva).nome);
    const abrir = botaoComando("lseed.abrirCofre");
    $("#abrir-cofre").replaceChildren(...(abrir ? [abrir] : []));
    $("#enviar").disabled = ocupado();
    desenharFalas();
  }
  desenhar();
  listarSalvas();
  if (ui.areaAtiva !== "conversa") carregarPainel();
}

iniciar().catch(e => avisar(e.message, true));
