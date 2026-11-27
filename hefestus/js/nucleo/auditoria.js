import { auditarMenus } from "./expertiseMenus.js";
// Auditoria da interface (o "analisar_interface" do projeto original): acha problemas de acessibilidade e
// consistência, e para os que têm conserto mecânico devolve a correção como patch (id → {caminho: valor}).
// Também explica elementos em palavras e gera a documentação do contrato de sinais (Markdown).
import { CATALOGO } from "./catalogo.js";
// ---------------------------------------------------------- cor
function lerCor(c) {
  if (typeof c !== "string") return null;
  c = c.trim().toLowerCase();
  if (!c || c === "transparent" || c === "inherit") return null;
  let m = c.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map(x => x + x).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  m = c.match(/^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?\s*\)$/);
  if (m) { let a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]); return { r: +m[1], g: +m[2], b: +m[3], a }; }
  const nomes = { white: "#ffffff", black: "#000000" };
  return nomes[c] ? lerCor(nomes[c]) : null;
}
const sobre = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hex = c => `#${[c.r, c.g, c.b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const escurecer = (c, k) => ({ r: c.r * (1 - k), g: c.g * (1 - k), b: c.b * (1 - k), a: 1 });
const clarear = (c, k) => ({ r: c.r + (255 - c.r) * k, g: c.g + (255 - c.g) * k, b: c.b + (255 - c.b) * k, a: 1 });

// ---------------------------------------------------------- auditoria
const TEXTUAIS = new Set(["texto", "botao", "campo", "toast", "menu", "modal"]);
const INTERATIVOS = new Set(["botao", "campo", "toggle", "menu"]);

/** Cor de fundo efetiva atrás do elemento: o container/caixa opaco mais alto que o contém, ou a tela. */
function fundoAtras(el, todos, fundoTela) {
  todos = todos.opacos ?? todos;
  const cx = el.x + el.largura / 2, cy = el.y + el.altura / 2;
  let melhor = null;
  for (const o of todos) {
    if (o.id === el.id || (o.z ?? 0) > (el.z ?? 0) + 1e-9 && o.id !== el.pai) continue;
    if (!(o.x <= cx && cx <= o.x + o.largura && o.y <= cy && cy <= o.y + o.altura)) continue;
    const f = lerCor(o.estilo?.fundo);
    if (f && f.a > 0.85 && (!melhor || (o.z ?? 0) >= (melhor.z ?? 0))) melhor = { z: o.z ?? 0, cor: f };
  }
  return melhor?.cor ?? lerCor(fundoTela) ?? { r: 255, g: 255, b: 255, a: 1 };
}

/** Itens: { regra, gravidade: erro|aviso|info, id, mensagem, correcao?: {caminho: valor}, resumo? } */
function auditar(elementos, tela = {}, somente = null) {
  const itens = [];
  const todos = elementos;
  // só os fundos opacos importam para achar "o que está atrás"; pré-filtrar evita um laço de N×N sobre tudo
  const fundosOpacos = elementos.filter(o => { const f = lerCor(o.estilo?.fundo); return f && f.a > 0.85; });
  const porId = new Map(todos.map(e => [e.id, e]));
  const add = (regra, gravidade, el, mensagem, correcao, resumo) => itens.push({ regra, gravidade, id: el?.id ?? null, nome: el?.nome ?? "", mensagem, ...(correcao ? { correcao, resumo } : {}) });
  const nomes = new Map();
  for (const el of todos) {
    if (somente && !somente.has(el.id)) { const k0 = (el.nome ?? "").toLowerCase(); if (!nomes.has(k0)) nomes.set(k0, el.nome); continue; }
    const e = el.estilo ?? {};
    // contraste do texto
    if (TEXTUAIS.has(el.tipo) && el.visivel !== false) {
      const temTexto = el.tipo === "texto" ? !!(el.texto ?? "").trim() : el.tipo === "botao" ? !!(el.rotulo ?? "").trim() : true;
      const cor = lerCor(e.cor);
      if (temTexto && cor) {
        const fundoEl = lerCor(e.fundo);
        const atras = fundoAtras(el, fundosOpacos, tela.fundo);
        const fundo = fundoEl && fundoEl.a > 0.05 ? sobre(fundoEl, atras) : atras;
        const texto = cor.a < 1 ? sobre(cor, fundo) : cor;
        const r = contraste(texto, fundo);
        const grande = (e.tamanhoFonte ?? 14) >= 24 || ((e.tamanhoFonte ?? 14) >= 18.66 && (e.peso ?? 400) >= 700);
        const minimo = grande ? 3 : 4.5;
        if (r < minimo) {
          const preto = { r: 17, g: 24, b: 39, a: 1 }, branco = { r: 255, g: 255, b: 255, a: 1 };
          const nova = contraste(preto, fundo) >= contraste(branco, fundo) ? preto : branco;
          add("contraste", r < 3 ? "erro" : "aviso", el, `Contraste ${r.toFixed(1)}:1 entre texto e fundo (mínimo ${minimo}:1, WCAG AA).`, { "estilo.cor": hex(nova) }, `Trocar a cor do texto para ${hex(nova)}`);
        }
      }
    }
    // Padronização mecânica de textos de controles; conteúdo editorial mantém quebras.
    for (const campo of ["rotulo", "placeholder"]) {
      const valor = el[campo];
      if (typeof valor !== "string" || !valor.trim()) continue;
      const limpo = valor.normalize("NFC").replace(/\s+/g, " ").trim();
      if (valor !== limpo) add("texto-espacamento", "info", el, `Espaçamento irregular em ${campo}.`, { [campo]: limpo }, "Normalizar espaços do controle");
    }
    if (TEXTUAIS.has(el.tipo) && el.visivel !== false && Number.isFinite(e.tamanhoFonte) && e.tamanhoFonte < 12)
      add("texto-tamanho", "aviso", el, `Fonte de ${e.tamanhoFonte} px pode dificultar a leitura.`, { "estilo.tamanhoFonte": 12 }, "Usar fonte de 12 px");
    // rótulo acessível
    const rotuloA = (el.acessibilidade?.ariaLabel ?? "").trim();
    const semNome =
      (el.tipo === "botao" && !(el.rotulo ?? "").trim() && !rotuloA) ||
      (el.tipo === "campo" && !(el.placeholder ?? "").trim() && !(el.rotulo ?? "").trim() && !rotuloA) ||
      (el.tipo === "toggle" && !rotuloA) ||
      (el.tipo === "icone" && (el.eventos ?? []).length && !rotuloA);
    if (semNome) add("rotulo", "erro", el, "Falta nome acessível: leitores de tela não sabem o que este controle faz.", { "acessibilidade.ariaLabel": el.nome }, `Usar "${el.nome}" como rótulo acessível`);
    // escopo: o Hefestus desenha interface; código/lógica de negócio fica fora
    const campos = [el.texto, el.rotulo, el.placeholder, el.nome, el.acessibilidade?.ariaLabel, ...(el.eventos ?? []).flatMap(v => [v.alvo, v.url, v.dispara])];
    const perigoso = campos.find(c => typeof c === "string" && /<\s*script|javascript\s*:|\bon[a-z]+\s*=|\bfetch\s*\(|\beval\s*\(/i.test(c));
    if (perigoso) add("escopo", "erro", el, "Há código dentro de um texto da interface. O Hefestus só descreve a interface e os sinais; a lógica fica no seu app.", undefined, undefined);
    // estado hover
    const interativo = INTERATIVOS.has(el.tipo) || (el.eventos ?? []).some(v => v.tipo === "onClick");
    if (interativo && el.tipo !== "campo" && el.tipo !== "menu" && !(el.estados?.hover?.fundo ?? "") && !el.desabilitado) {
      const f = lerCor(e.fundo);
      const atrasH = fundoAtras(el, fundosOpacos, tela.fundo);
      const escuro = lum(f && f.a > 0.5 ? f : atrasH) < 0.35;
      const corrige = f && f.a > 0.5 ? { "estados.hover.fundo": hex(escuro ? clarear(f, 0.16) : escurecer(f, f.r + f.g + f.b > 600 ? 0.08 : 0.15)) } : { "estados.hover.fundo": escuro ? "#ffffff1f" : "#0000000d" };
      add("hover", "aviso", el, "Sem estado ao passar o mouse: o usuário não percebe que dá para clicar.", corrige, corrige ? `Hover ${corrige["estados.hover.fundo"]}` : undefined);
    }
    // texto legível ao passar o mouse e ao pressionar (fundo do estado contra a cor do texto)
    if (TEXTUAIS.has(el.tipo) && el.visivel !== false && lerCor(e.cor)) {
      const atrasE = fundoAtras(el, fundosOpacos, tela.fundo);
      const base = lerCor(e.fundo) && lerCor(e.fundo).a > 0.5 ? sobre(lerCor(e.fundo), atrasE) : atrasE;
      const grandeE = (e.tamanhoFonte ?? 14) >= 24 || ((e.tamanhoFonte ?? 14) >= 18.66 && (e.peso ?? 400) >= 700);
      const minimoE = grandeE ? 3 : 4.5;
      for (const [estado, nomeEstado, forca] of [["hover", "ao passar o mouse", 0.08], ["active", "ao pressionar", 0.14]]) {
        const fe = lerCor(el.estados?.[estado]?.fundo);
        if (!fe || fe.a < 0.05) continue;
        const fundoE = sobre(fe, atrasE);
        const corE = lerCor(el.estados?.[estado]?.cor) ?? lerCor(e.cor);
        const texto = corE.a < 1 ? sobre(corE, fundoE) : corE;
        const r = contraste(texto, fundoE);
        if (r >= minimoE) continue;
        // mesma família de cor do botão, um tom acima/abaixo: o texto continua legível
        const escuroB = lum(base) < 0.35;
        let nova = escuroB ? clarear(base, forca * 2) : escurecer(base, base.r + base.g + base.b > 600 ? forca : forca * 1.8);
        if (contraste(texto, nova) < minimoE) nova = escuroB ? clarear(base, 0.06) : escurecer(base, 0.04);
        add("contraste-estado", r < 3 ? "erro" : "aviso", el, `Texto ilegível ${nomeEstado}: contraste ${r.toFixed(1)}:1 (mínimo ${minimoE}:1).`, { [`estados.${estado}.fundo`]: hex(nova) }, `Fundo ${nomeEstado} ${hex(nova)}`);
      }
    }
    // anel de foco: o padrão (#93c5fd) quase some em fundo claro
    if (interativo && !(el.estados?.focus?.contorno ?? "")) {
      const anel = { r: 147, g: 197, b: 253, a: 1 };
      const fb = lerCor(e.fundo), atrasFoco = fundoAtras(el, fundosOpacos, tela.fundo);
      const base = fb && fb.a > 0.05 ? sobre(fb, atrasFoco) : atrasFoco;
      if (contraste(anel, atrasFoco) < 3 && contraste(anel, base) < 3) {
        const nova = contraste({ r: 29, g: 78, b: 216, a: 1 }, atrasFoco) >= 3 ? "#1d4ed8" : contraste({ r: 255, g: 255, b: 255, a: 1 }, atrasFoco) >= 3 ? "#ffffff" : "#111827";
        add("foco", "aviso", el, "O anel de foco padrão tem pouco contraste com o fundo: quem navega pelo teclado perde a posição.", { "estados.focus.contorno": nova }, `Anel de foco ${nova}`);
      }
    }
    // transição
    if ((el.transicao?.duracao ?? 0) > 400) add("transicao", "aviso", el, `Transição de ${el.transicao.duracao} ms é lenta demais (ideal até 300 ms).`, { "transicao.duracao": 200 }, "Usar 200 ms");
    // alvo de toque
    if (INTERATIVOS.has(el.tipo) && (el.altura < 24 || el.largura < 24)) add("alvo", "aviso", el, `Área de clique de ${Math.round(el.largura)}×${Math.round(el.altura)} px é pequena (mínimo 24×24, WCAG 2.5.8).`, { largura: Math.max(24, Math.round(el.largura)), altura: Math.max(24, Math.round(el.altura)) }, "Aumentar para 24×24 px");
    // fora da tela
    if (tela.largura && el.visivel !== false && (el.x + el.largura < 0 || el.y + el.altura < 0 || el.x > tela.largura || el.y > tela.altura)) add("fora", "info", el, "Está fora da área da tela e não aparece.", { x: Math.round(Math.max(0, Math.min(el.x, tela.largura - el.largura))), y: Math.round(Math.max(0, Math.min(el.y, tela.altura - el.altura))) }, "Trazer para dentro da tela");
    // eventos: ação sem destino e evento vazio têm o mesmo conserto (limpar o evento)
    const limpos = (el.eventos ?? []).map(ev => (ev.acao && (!ev.alvo || !porId.has(ev.alvo)) ? { ...ev, acao: "", alvo: "" } : ev)).filter(ev => ev.dispara || ev.acao);
    const consertoEv = { eventos: limpos }, resumoEv = "Remover ações sem destino e eventos vazios";
    for (const ev of el.eventos ?? []) {
      if (ev.acao && (!ev.alvo || !porId.has(ev.alvo))) add("evento-alvo", "erro", el, `${ev.tipo}: a ação "${ev.acao}" aponta para um elemento que não existe${ev.alvo ? ` (${ev.alvo})` : ""}.`, consertoEv, resumoEv);
      else if (!ev.dispara && !ev.acao) add("evento-sinal", "info", el, `${ev.tipo} não emite sinal nem executa ação.`, consertoEv, resumoEv);
    }
    // nomes repetidos
    const k = (el.nome ?? "").toLowerCase();
    if (nomes.has(k)) {
      let c = 2; while (nomes.has(`${el.nome} ${c}`.toLowerCase())) c++;
      const novo = `${el.nome} ${c}`;
      add("nome", "aviso", el, `Mesmo nome de "${nomes.get(k)}": atrapalha referências e o agente.`, { nome: novo }, "Renomear com número");
      nomes.set(novo.toLowerCase(), novo);
    } else nomes.set(k, el.nome);
  }
  itens.push(...auditarMenus(todos,somente));
  const ordem = { erro: 0, aviso: 1, info: 2 };
  return itens.sort((a, b) => ordem[a.gravidade] - ordem[b.gravidade]);
}

/** Junta as correções dos itens num mapa id → {caminho: valor}. */
function correcoes(itens) {
  const mapa = {};
  for (const i of itens) if (i.correcao && i.id) Object.assign((mapa[i.id] ??= {}), i.correcao);
  return mapa;
}

function resumoAuditoria(itens) {
  const c = g => itens.filter(i => i.gravidade === g).length;
  return { erros: c("erro"), avisos: c("aviso"), infos: c("info"), corrigiveis: itens.filter(i => i.correcao).length };
}

// ---------------------------------------------------------- explicar
const NOME_EV = { onClick: "ao clicar", onHover: "ao passar o mouse", onLeave: "ao tirar o mouse", onContext: "ao clicar com o botão direito", onChange: "ao mudar o valor", onFocus: "ao ganhar foco", onOpen: "ao abrir", onClose: "ao fechar" };
const NOME_ACAO = { abrir: "abre", fechar: "fecha", alternar: "alterna", destacar: "destaca", mostrarSo: "mostra só", fixar: "fixa aberto (pino)" };

function explicar(el, todos = []) {
  const e = el.estilo ?? {}, tipo = CATALOGO[el.tipo]?.nome ?? el.tipo;
  const L = [];
  L.push(`${el.nome} é ${/^[aeiou]/i.test(tipo) ? "um" : "um(a)"} ${tipo.toLowerCase()} de ${Math.round(el.largura)}×${Math.round(el.altura)} px em (${Math.round(el.x)}, ${Math.round(el.y)}), na camada ${el.z ?? 0}${el.visivel === false ? ", atualmente oculto" : ""}${el.travado ? " e travado" : ""}.`);
  const aparencia = [];
  if (e.fundo) aparencia.push(`fundo ${e.fundo}`);
  if (e.cor && TEXTUAIS.has(el.tipo)) aparencia.push(`texto ${e.cor}`);
  if (e.larguraBorda) aparencia.push(`borda de ${e.larguraBorda} px ${e.borda}`);
  if (e.raio) aparencia.push(`cantos de ${e.raio} px`);
  if (e.sombra && e.sombra !== "nenhuma") aparencia.push(`sombra ${e.sombra}`);
  if (e.preenchimentos?.length) aparencia.push(`${e.preenchimentos.length} camada(s) de preenchimento (${e.preenchimentos.map(p => p.tipo).join(", ")})`);
  if (e.efeitos?.length) aparencia.push(`efeitos: ${e.efeitos.map(p => p.tipo).join(", ")}`);
  if (aparencia.length) L.push(`Aparência: ${aparencia.join("; ")}.`);
  const est = [];
  if (el.estados?.hover?.fundo) est.push(`ao passar o mouse o fundo vira ${el.estados.hover.fundo}`);
  if (el.estados?.active?.fundo) est.push(`ao pressionar vira ${el.estados.active.fundo}`);
  if (est.length) L.push(`Estados: ${est.join("; ")}, com transição de ${el.transicao?.duracao ?? 0} ms.`);
  const evs = (el.eventos ?? []).filter(v => v.dispara || v.acao).map(v => {
    const partes = [];
    if (v.acao) partes.push(`${NOME_ACAO[v.acao] ?? v.acao} ${todos.find(t => t.id === v.alvo)?.nome ?? v.alvo ?? "?"}`);
    if (v.dispara) partes.push(`emite o sinal "${v.dispara}"`);
    return `${NOME_EV[v.tipo] ?? v.tipo}, ${partes.join(" e ")}`;
  });
  if (evs.length) L.push(`Comportamento: ${evs.join("; ")}.`);
  if (el.abertura?.iniciaFechado) L.push(`Começa fechado${el.abertura.animacao ? ` e abre com animação ${el.abertura.animacao}` : ""}.`);
  const ac = el.acessibilidade ?? {};
  const acs = [];
  if (ac.ariaLabel) acs.push(`rótulo "${ac.ariaLabel}"`);
  if (ac.tecla) acs.push(`tecla de acesso Alt+${String(ac.tecla).toUpperCase()}`);
  if (ac.indisponivel) acs.push(`indisponível${ac.motivo ? ` (${ac.motivo})` : ""}`);
  if (ac.perfis) acs.push(`visível só para: ${ac.perfis}`);
  L.push(`Acessibilidade: ${acs.length ? acs.join("; ") : "sem rótulo, tecla ou restrição definidos"}.`);
  const filhos = todos.filter(t => t.pai === el.id);
  if (filhos.length) L.push(`Contém ${filhos.length} elemento(s): ${filhos.slice(0, 8).map(f => f.nome).join(", ")}${filhos.length > 8 ? "…" : ""}.`);
  return L.join("\n");
}

// ---------------------------------------------------------- documentação do contrato de sinais
function documentar(elementos, tela = {}, titulo = "Interface") {
  const sinais = [], regras = [];
  for (const el of elementos) for (const v of el.eventos ?? []) {
    if (v.dispara) sinais.push({ sinal: v.dispara, origem: el.nome, id: el.id, evento: v.tipo });
    if (v.acao) regras.push({ origem: el.nome, evento: v.tipo, acao: v.acao, alvo: elementos.find(t => t.id === v.alvo)?.nome ?? v.alvo ?? "?" });
  }
  const tab = (cab, linhas) => linhas.length ? `| ${cab.join(" | ")} |\n|${cab.map(() => "---").join("|")}|\n${linhas.map(l => `| ${l.map(c => String(c ?? "").replaceAll("|", "\\|")).join(" | ")} |`).join("\n")}\n` : "_Nenhum._\n";
  const porTipo = {};
  for (const el of elementos) porTipo[el.tipo] = (porTipo[el.tipo] ?? 0) + 1;
  const aud = auditar(elementos, tela), res = resumoAuditoria(aud);
  return `# ${titulo}

Tela de ${tela.largura ?? "?"}×${tela.altura ?? "?"} px com ${elementos.length} elementos (${Object.entries(porTipo).map(([t, n]) => `${n} ${CATALOGO[t]?.nome?.toLowerCase() ?? t}`).join(", ")}).

## Contrato de sinais
A interface só **emite sinais**; quem a usa decide o que fazem. Escute o evento DOM \`hefestus:sinal\` na raiz da interface: \`raiz.addEventListener("hefestus:sinal", e => e.detail)\`, onde \`detail\` traz \`{ sinal, origem, evento }\`.

${tab(["Sinal", "Emitido por", "Quando"], sinais.map(s => [`\`${s.sinal}\``, s.origem, NOME_EV[s.evento] ?? s.evento]))}
## Regras visuais (ações internas)
${tab(["Origem", "Quando", "Ação", "Alvo"], regras.map(r => [r.origem, NOME_EV[r.evento] ?? r.evento, NOME_ACAO[r.acao] ?? r.acao, r.alvo]))}
## Elementos
${elementos.map(el => `### ${el.nome} \`${el.id}\`\n${explicar(el, elementos)}\n`).join("\n")}
## Auditoria
${res.erros} erro(s), ${res.avisos} aviso(s), ${res.infos} informação(ões); ${res.corrigiveis} com correção automática.

${aud.length ? aud.map(i => `- **${i.gravidade}** ${i.nome ? `${i.nome}: ` : ""}${i.mensagem}`).join("\n") : "Nenhum problema encontrado."}
`;
}
export { contraste, auditar, correcoes, resumoAuditoria, explicar, documentar };
