// Faixa de opções do Axiom Studio recriada com as peças do Hefestus, gerada da estrutura real
// (axiomSpec.js). Cada comando emite o sinal "ax|painel|grupo|controle[|item]"; o Axiom r38 usa
// esse sinal para acionar o controle original. Abas trocam o painel (mostrarSo) e os dropdowns
// abrem colados ao botão (abertura.ancorar).
import { AXIOM_SPEC, AXIOM_EASY, AXIOM_PERFIS } from "./axiomSpec.js";

const COR = { barra: "#444444", barraTx: "#f7f7f7", acento: "#0078d4", painel: "#f3f3f3", tx: "#242424", sec: "#616161", linha: "#d1d1d1", hover: "#0078d41f", ativo: "#0078d42e" };
const larguraTexto = (t, px = 12) => Math.round(String(t).length * px * 0.56 + 22);
const slug = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** Constrói o modelo. Recebe as peças do modelos.js para não depender de importação circular. */
export function criarFaixaAxiom({ cont, texto, botao, linha, comAbertura, ev }) {
  const abas = AXIOM_SPEC;
  const sinal = (...p) => `ax|${p.join("|")}`;

  const comando = (rotulo, w, eventos, extra = {}) => botao(0, 0, w, 26, rotulo, "transparent", COR.tx, "transparent", {
    "estilo.tamanhoFonte": 12, "estilo.raio": 3, "estados.hover.fundo": COR.hover, "estados.active.fundo": COR.ativo, eventos, ...extra,
  });

  const construirItem = (p, g, it) => {
    const chave = `${p}_${g.gi}_${it.ci}`;
    if (it.k === "btn") {
      const r = it.t || it.title.split(" (")[0] || "Comando";
      return { el: comando(r, larguraTexto(r), [ev("onClick", "", "", sinal(p, g.gi, it.ci))], it.dis ? { desabilitado: true } : {}), w: larguraTexto(r) };
    }
    const base = String(it.t).replace(/\s*▾\s*$/, "");
    const rot = `${base} ▾`;
    const w = larguraTexto(rot);
    if (it.k === "dyn") return { el: comando(rot, w, [ev("onClick", "", "", sinal(p, g.gi, it.ci, "dyn"))]), w };
    const refMenu = `menu_${chave}`;
    const maior = Math.max(160, ...it.items.map(i => larguraTexto(i.t, 12.5)));
    const itens = it.items.map(i => {
      const cab = /▾\s*$/.test(i.t);
      return botao(0, 0, maior, 26, i.t, "transparent", cab ? COR.sec : COR.tx, "transparent", {
        "estilo.tamanhoFonte": 12.5, "estilo.alinhamento": "esquerda", "estilo.raio": 3, "estilo.peso": cab ? 600 : 400,
        "estados.hover.fundo": COR.hover, "acessibilidade.role": "menuitem",
        eventos: cab ? [] : [ev("onClick", "", "", sinal(p, g.gi, it.ci, i.di))], ...(i.dis || cab ? { desabilitado: true } : {}),
      });
    });
    const menu = cont(0, 0, maior + 12, Math.min(it.items.length, 14) * 28 + 12, { modo: "coluna", espaco: 2, margem: 6, abracar: true }, {
      ref: refMenu, "estilo.fundo": "#ffffff", "estilo.borda": COR.linha, "estilo.larguraBorda": 1, "estilo.raio": 6, "estilo.sombra": "media", "acessibilidade.role": "menu",
      ...comAbertura({ iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "aparecer", fundoEscuro: false, ancorar: true }),
    }, `Menu ${base}`, itens);
    const gatilho = comando(rot, w, [ev("onClick", "abrir", refMenu, `abriu_${slug(base)}`)], { ref: `gat_${chave}`, "acessibilidade.ariaLabel": base });
    return { el: cont(0, 0, w, 26, {}, {}, `Dropdown ${base}`, [gatilho, menu]), w };
  };

  const construirGrupo = (p, g, tabNome) => {
    let controles, largura;
    if (g.pop) {
      const r = `⚙ ${g.n}`;
      largura = larguraTexto(r);
      controles = [comando(r, largura, [ev("onClick", "", "", sinal(p, g.gi, "pop"))], { "estilo.peso": 500 })];
    } else {
      const itens = g.items.map(it => construirItem(p, g, it));
      const colunas = [];
      for (let i = 0; i < itens.length; i += 3) colunas.push(itens.slice(i, i + 3));
      controles = colunas.map((col, i) => cont(0, 0, Math.max(...col.map(c => c.w)), col.length * 28, { modo: "coluna", espaco: 2, alinhar: "esticar" }, {}, `Coluna ${i + 1}`, col.map(c => c.el)));
      largura = colunas.reduce((a, col) => a + Math.max(...col.map(c => c.w)) + 4, 0);
    }
    largura = Math.max(largura, larguraTexto(g.n, 11) - 10);
    const tabela = AXIOM_PERFIS.grupos[tabNome];
    const perfisGrupo = tabela ? (tabela[g.n] ?? "avancado") : (AXIOM_PERFIS.abas[tabNome] ?? "avancado, codigo");
    return cont(0, 0, largura + 12, 100, { modo: "coluna", espaco: 2, margem: 4, alinhar: "centro" }, { "estilo.borda": COR.linha, "acessibilidade.perfis": perfisGrupo }, `Grupo ${g.n}`, [
      cont(0, 0, largura, 86, { modo: "linha", espaco: 4, justificar: "centro" }, {}, `Comandos ${g.n}`, controles),
      texto(0, 0, largura + 4, 14, g.n, COR.sec, 11, { "estilo.alinhamento": "centro" }, `Nome ${g.n}`),
    ]);
  };

  const comPainel = abas.filter(a => !a.file);
  const paineis = comPainel.map((a, i) => cont(0, 0, 960, 100, { modo: "linha", espaco: 6, margem: 4, quebrar: true }, {
    ref: `painel${i}`, "estilo.fundo": COR.painel, "acessibilidade.role": "tabpanel", "acessibilidade.ariaLabel": a.tab, "acessibilidade.perfis": AXIOM_PERFIS.abas[a.tab] ?? "avancado, codigo",
    ...comAbertura({ iniciaFechado: i > 0, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "aparecer", fundoEscuro: false }),
  }, `Painel ${a.tab}`, a.groups.map(g => construirGrupo(a.panel, g, a.tab))));

  let k = -1;
  const botoesAba = abas.map(a => {
    const ehArquivo = !!a.file;
    if (!ehArquivo) k++;
    return botao(0, 0, larguraTexto(a.tab, 13) + 6, 32, a.tab, ehArquivo ? COR.acento : "transparent", COR.barraTx, "transparent", {
      "estilo.raio": 0, "estilo.tamanhoFonte": 13, "estados.hover.fundo": "#ffffff26", "estados.ativo.fundo": COR.painel, "estados.ativo.cor": COR.tx, "acessibilidade.role": "tab",
      "acessibilidade.perfis": ehArquivo ? "avancado, codigo" : (AXIOM_PERFIS.abas[a.tab] ?? "avancado, codigo"),
      eventos: ehArquivo ? [ev("onClick", "", "", sinal("arquivo"))] : [ev("onClick", "mostrarSo", `painel${k}`, sinal("aba", a.panel))],
    });
  });


  // ---- Barra do Modo Simples (perfil "simples") ----
  const exSinal = (...p) => `ex|${p.join("|")}`;
  const wBtn = t => Math.round(String(t).length * 6.9) + 22;
  const grupoSimples = g => {
    const itens = g.items.map(it => {
      if (it.k === "btn" || /▾\s*$/.test(it.t) && !it.items.length) {
        const dyn = /▾\s*$/.test(it.t);
        const w = wBtn(it.t);
        return { w, el: botao(0, 0, w, 34, it.t, it.pri ? COR.acento : "transparent", it.pri ? "#ffffff" : COR.tx, "transparent", {
          "estilo.tamanhoFonte": 12.5, "estilo.raio": 8, "estilo.peso": it.pri ? 600 : 500, "estados.hover.fundo": it.pri ? "#106ebe" : COR.hover,
          "acessibilidade.ariaLabel": it.hint || it.t, eventos: [ev("onClick", "", "", exSinal(g.gi, it.ci, ...(dyn ? ["dyn"] : [])))],
        }) };
      }
      const refMenu = `menu_ex_${g.gi}_${it.ci}`;
      const maior = Math.max(150, ...it.items.map(i => larguraTexto(i.t, 12.5)));
      const menu = cont(0, 0, maior + 12, it.items.length * 28 + 12, { modo: "coluna", espaco: 2, margem: 6, abracar: true }, {
        ref: refMenu, "estilo.fundo": "#ffffff", "estilo.borda": COR.linha, "estilo.larguraBorda": 1, "estilo.raio": 8, "estilo.sombra": "media", "acessibilidade.role": "menu",
        ...comAbertura({ iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "aparecer", fundoEscuro: false, ancorar: true }),
      }, `Menu ${it.t}`, it.items.map(i => botao(0, 0, maior, 26, i.t, "transparent", COR.tx, "transparent", {
        "estilo.tamanhoFonte": 12.5, "estilo.alinhamento": "esquerda", "estilo.raio": 4, "estados.hover.fundo": COR.hover, "acessibilidade.role": "menuitem",
        eventos: [ev("onClick", "", "", exSinal(g.gi, it.ci, i.di))] })));
      const w = wBtn(it.t + " ▾");
      const gat = botao(0, 0, w, 34, `${it.t} ▾`, "transparent", COR.tx, "transparent", { "estilo.tamanhoFonte": 12.5, "estilo.raio": 8, "estilo.peso": 500, "estados.hover.fundo": COR.hover,
        eventos: [ev("onClick", "abrir", refMenu, `abriu_${slug(it.t)}`)] });
      return { w, el: cont(0, 0, w, 34, {}, {}, `Dropdown ${it.t}`, [gat, menu]) };
    });
    return cont(0, 0, itens.reduce((a, i) => a + i.w + 2, 0), 38, { modo: "linha", espaco: 2, alinhar: "centro", margem: 2 }, { "estilo.borda": COR.linha }, `Grupo simples ${g.gi}`, itens.map(i => i.el));
  };
  const barraSimples = cont(0, 0, 960, 52, { modo: "linha", espaco: 8, margem: 8, alinhar: "centro", quebrar: true }, {
    "estilo.fundo": "#ffffff", "estilo.borda": COR.linha, "estilo.larguraBorda": 1, "acessibilidade.role": "toolbar", "acessibilidade.ariaLabel": "Barra do modo simples", "acessibilidade.perfis": "simples",
  }, "Barra do Modo Simples", [
    ...AXIOM_EASY.filter(g => g.k === "g").map(grupoSimples),
    botao(0, 0, 150, 34, "Modo avançado ▸", "transparent", COR.acento, COR.acento, { "estilo.tamanhoFonte": 12.5, "estilo.raio": 17, "estilo.peso": 600, "estados.hover.fundo": COR.hover, "acessibilidade.ariaLabel": "Mostra todas as abas e ferramentas", eventos: [ev("onClick", "", "", exSinal("modo", "adv"))] }),
  ]);

  return {
    id: "faixaAxiom", nome: "Faixa do Axiom Studio", cat: "Menus",
    desc: "Recriação dos menus do Axiom com as peças do Hefestus, condicionais por modo (perfis simples, avancado, codigo): barra do Modo Simples e faixa com 11 abas e 77 grupos; use \"Ver como\" na Prévia",
    tags: ["axiom", "ribbon", "faixa", "noc", "office"],
    raiz: cont(0, 0, 960, 140, { modo: "coluna", espaco: 0, margem: 0, abracar: true }, { "estilo.fundo": COR.painel, "estilo.borda": COR.linha, "estilo.larguraBorda": 1 }, "Faixa do Axiom", [
      barraSimples,
      cont(0, 0, 960, 32, { modo: "linha", espaco: 0, alinhar: "fim", quebrar: true }, { "estilo.fundo": COR.barra, "acessibilidade.role": "tablist", "acessibilidade.perfis": "avancado, codigo" }, "Abas", [
        ...botoesAba,
        botao(0, 0, 110, 32, "Modo simples", "transparent", COR.barraTx, "transparent", { "estilo.tamanhoFonte": 12, "estilo.raio": 0, "estados.hover.fundo": "#ffffff26", "acessibilidade.ariaLabel": "Voltar ao modo simples", eventos: [ev("onClick", "", "", sinal("modo", "easy"))] }),
      ]),
      ...paineis,
    ]),
  };
}
