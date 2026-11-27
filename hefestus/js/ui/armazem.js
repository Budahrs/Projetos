// Painel Armazém: o ciclo do Hefestus num lugar só, cada seção um fluxo linear (entrada → ação → saída).
//  ① Sincronizar: manifesto + arquivos de um programa → plano → copiar para o armazém
//  ④ Consolidar: equivalentes por contrato → fixtures nas duas → ranking → proposta → decisão humana
//  ③ Propagar: quem aceitou receber (opt-in) → pacote de atualização para o programa PUXAR
// O armazém fica no IndexedDB deste navegador; "Exportar armazém" leva para a outra máquina.
import { h, avisar } from "./dom.js";
import { icone } from "./icones.js";
import { TIPOS_ARMAZEM, Armazem, MeioMemoria } from "../nucleo/armazem.js";
import { validarManifesto, planoSincronizacao, sincronizar, pacoteParaPrograma, normalizarAssinatura, HOSTS, RUNTIMES } from "../nucleo/sincronizar.js";
import { candidatosEquivalencia, compararComportamento, ranquear, proporFusao, registrarDecisao, cadeiaDaDecisao, CRITERIOS, metricasDe } from "../nucleo/consolidacao.js";
import { PonteIA, transporteClaudeSample, transporteOllama, transporteAnthropic, MODELOS_PADRAO } from "../nucleo/ponteIA.js";
import { funcaoDaFerramenta, referenciasUsadas, validarVinculos } from "../nucleo/vinculos.js";
import { registrarHefestus, sementeCompleta, VERSAO } from "../nucleo/semente.js";

const ABREV = { cobertura: "cob.", uso: "uso", dependencias: "dep.", tamanho: "tam.", recencia: "rec." };
const kb = b => (b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`);
const ESTADO_SINC = { novo: ["+", "novo"], atualizado: ["↑", "versão nova"], igual: ["=", "igual"], conflito: ["!", "conflito"], antigo: ["·", "o armazém já tem uma maior"] };

/** Lê arquivos escolhidos: texto, ou base64 para binários (.wasm, fontes, imagens). */
async function lerArquivos(lista) {
  const out = new Map();
  for (const f of lista) {
    const binario = /\.(wasm|woff2?|ttf|otf|png|jpe?g|gif|webp|zip)$/i.test(f.name);
    if (!binario) { out.set(f.name, await f.text()); continue; }
    const bytes = new Uint8Array(await f.arrayBuffer());
    let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    out.set(f.name, `base64:${btoa(s)}`);
  }
  return out;
}

export class PainelArmazem {
  constructor(app) {
    this.app = app;
    this.abertas = new Set(["armazem"]);
    this.carregando = false;
    this.sinc = null; // { manifesto, erros, avisos, arquivos, plano, relatorio }
    this.cons = { pares: null, par: null, fixtures: '[\n  { "nome": "exemplo", "entrada": [1, 2, 3], "esperado": 3 }\n]', comparacao: null, ranking: null, proposta: null, notaIA: null };
    this.iaConfig = { tipo: "auto", teto: 5, ollamaUrl: "http://localhost:11434", ollamaModelo: "llama3.1", chave: "" };
    this.entrada = h("input", { type: "file", multiple: true, hidden: true, onchange: e => this.carregarArquivos(e.target.files) });
    this.entradaArmazem = h("input", { type: "file", accept: ".json,application/json", hidden: true, onchange: e => this.importarArmazem(e.target.files[0]) });
    document.body.append(this.entrada, this.entradaArmazem);
  }

  get armazem() { return this.app.armazem; }
  redesenhar() { if (this.app.ui.esq === "armazem") this.app.render(); }

  abrirSecao(id) { this.abertas.add(id); }

  /** Garante o armazém aberto (IndexedDB é assíncrono) e redesenha quando chega. */
  garantir() {
    if (this.armazem.aberto || this.carregando) return;
    this.carregando = true;
    this.armazem.abrir()
      .then(async () => { this.assinaturas = await this.armazem.config("assinaturas", []); this.decisoes = await this.armazem.config("decisoes", []); await this.marcarUsos(); })
      .catch(e => {
        // navegador sem IndexedDB (janela privada, bloqueio): segue em memória e avisa que não fica guardado
        avisar(`Armazém em memória (o navegador recusou o IndexedDB: ${e.message}). Exporte antes de fechar.`, "alerta");
        this.app.armazem = new Armazem(new MeioMemoria());
        return this.app.armazem.abrir();
      })
      .finally(() => { this.carregando = false; this.redesenhar(); });
  }

  /** Vínculos do projeto marcam "em uso" as versões que usam (versão em uso nunca é removida). */
  async marcarUsos() {
    const quem = `projeto:${this.app.n.nome}`;
    const usadas = referenciasUsadas(this.app.n.elementos(), this.armazem);
    for (const e of this.armazem.listar()) {
      const usa = usadas.has(e.chave);
      if (usa && !e.usadoPor.includes(quem)) await this.armazem.marcarUso(e.chave, quem);
      if (!usa && e.usadoPor.includes(quem)) await this.armazem.desmarcarUso(e.chave, quem);
    }
  }

  // ---------------------------------------------------------- IA
  ponte() {
    const c = this.iaConfig;
    const transportes = {};
    if ((c.tipo === "auto" && globalThis.claude?.use) || c.tipo === "claude") transportes.remoto = transporteClaudeSample(() => Promise.resolve(globalThis.claude?.use?.("sample") ?? null).catch(() => null));
    if (c.tipo === "anthropic" && c.chave) transportes.remoto = transporteAnthropic({ chave: c.chave });
    if (c.tipo === "ollama" || c.tipo === "auto") transportes.local = transporteOllama({ url: c.ollamaUrl, modeloLocal: c.ollamaModelo });
    const chave = JSON.stringify({ ...c, chave: !!c.chave });
    if (!this._ponte || this._chavePonte !== chave) { this._ponte = new PonteIA({ transportes, teto: Number(c.teto) || 5, modelos: MODELOS_PADRAO, cache: this._ponte?.cache }); this._chavePonte = chave; }
    return this._ponte;
  }

  // ---------------------------------------------------------- render
  render() {
    this.garantir();
    if (!this.armazem.aberto) return [h("p", { class: "painel-vazio" }, "Abrindo o armazém…")];
    const secao = (id, titulo, ic, corpo) => {
      const d = h("details", { class: "forja-secao arm-secao", open: this.abertas.has(id), "data-secao": id }, h("summary", { html: `${icone(ic, 14)} ${titulo}` }), h("div", { class: "forja-secao-corpo" }, corpo));
      d.addEventListener("toggle", () => { d.open ? this.abertas.add(id) : this.abertas.delete(id); });
      return d;
    };
    return [
      h("p", { class: "painel-vazio" }, "Cópias compactadas das ferramentas, artefatos e modelos dos seus programas. Funciona com eles fechados."),
      secao("armazem", "Armazém", "servidor", this.rArmazem()),
      secao("sincronizar", "① Sincronizar programa", "importar", this.rSincronizar()),
      secao("consolidar", "④ Consolidar ferramentas", "camadas", this.rConsolidar()),
      secao("propagar", "③ Propagar atualizações", "exportar", this.rPropagar()),
      secao("ia", "IA na consolidação", "chat", this.rIA()),
    ];
  }

  rArmazem() {
    const a = this.armazem;
    const est = a.estatisticas();
    const porPrograma = new Map();
    for (const e of a.listar()) (porPrograma.get(e.programa) ?? porPrograma.set(e.programa, []).get(e.programa)).push(e);
    const problemas = validarVinculos(this.app.n.elementos(), a);
    return [
      h("div", { class: "arm-numeros" },
        h("span", { class: "chip" }, `${est.itens} item(ns)`), h("span", { class: "chip" }, `${est.programas} programa(s)`),
        h("span", { class: "chip" }, `${kb(est.bytesGuardados)} guardados`), est.bytesOriginais ? h("span", { class: "chip" }, `${est.economia}% menor`) : null,
        est.deduplicados ? h("span", { class: "chip" }, `${est.deduplicados} deduplicado(s)`) : null),
      h("p", { class: "painel-vazio" }, `Guardado em: ${a.meio.nome} (este navegador). Resolução: id → índice → cópia; o programa de origem nunca é consultado.`),
      h("div", { class: "aud-acoes" },
        h("button", { type: "button", class: "bt-texto", onclick: () => this.registrarProprio() }, `Registrar ferramentas do Hefestus ${VERSAO}`),
        h("button", { type: "button", class: "bt-texto", onclick: () => this.exportarArmazem(), disabled: !est.itens }, "Exportar armazém (.json)"),
        h("button", { type: "button", class: "bt-texto", onclick: () => this.entradaArmazem.click() }, "Importar armazém"),
        h("button", { type: "button", class: "bt-texto", onclick: () => this.app.baixarJSON(sementeCompleta(), "meta.json") }, "Baixar semente (seed/meta.json)")),
      problemas.length ? h("div", { class: "lista" }, problemas.map(p => h("button", { type: "button", class: `item aud g-${p.gravidade}`, onclick: () => p.id && this.app.n.selecionar(p.id) }, h("span", { class: "item-nome" }, `${p.nome}: ${p.mensagem}`)))) : null,
      porPrograma.size ? [...porPrograma].map(([prog, itens]) => h("details", { class: "arm-programa" },
        h("summary", {}, `${prog} (${itens.length})`),
        h("div", { class: "lista" }, itens.map(e => h("div", { class: "item arm-item", title: `${e.hash}\nOrigem: ${JSON.stringify(e.origem)}` },
          h("span", { class: "item-nome" }, e.id), h("span", { class: "chip", title: TIPOS_ARMAZEM[e.tipo] }, e.tipo),
          h("span", { class: "chip" }, e.versao), e.runtime ? h("span", { class: "chip", title: RUNTIMES[e.runtime]?.nome }, e.runtime) : null,
          h("span", { class: "chip" }, kb(e.tamanhoCompactado)),
          e.usadoPor.length ? h("span", { class: "chip", title: e.usadoPor.join("\n") }, "em uso") : h("button", { type: "button", class: "bt-texto arm-rem", title: "Remover esta versão", onclick: () => this.remover(e.chave) }, "×")))))) : h("p", { class: "painel-vazio" }, "Vazio. Sincronize um programa ou registre as ferramentas do próprio Hefestus."),
    ];
  }

  rSincronizar() {
    const s = this.sinc;
    const corpo = [
      h("p", { class: "painel-vazio" }, "Entrada: o manifesto do programa (.json) e os arquivos que ele lista. Cada item declara o runtime em que roda (web, wasm, python…)."),
      h("div", { class: "aud-acoes" }, h("button", { type: "button", class: "bt-texto", onclick: () => this.entrada.click() }, "Escolher manifesto e arquivos…")),
    ];
    if (!s) return corpo;
    if (s.erros?.length) corpo.push(h("div", { class: "lista" }, s.erros.map(e => h("div", { class: "item aud g-erro" }, e))));
    if (s.avisos?.length) corpo.push(h("div", { class: "lista" }, s.avisos.map(e => h("div", { class: "item aud g-aviso" }, e))));
    if (s.plano) {
      const r = s.plano.resumo;
      corpo.push(h("div", { class: "sub" }, `${s.plano.programa} ${s.plano.versao}`),
        h("p", { class: "painel-vazio" }, `${r.novos} novo(s), ${r.atualizados} atualizado(s), ${r.iguais} igual(is), ${r.conflitos} conflito(s).`),
        h("div", { class: "lista" }, s.plano.itens.map(i => h("div", { class: `item arm-${i.estado}`, title: ESTADO_SINC[i.estado][1] },
          h("b", {}, ESTADO_SINC[i.estado][0]), h("span", { class: "item-nome" }, `${i.tipo} ${i.id}`), h("span", { class: "chip" }, i.versao), h("span", { class: "chip" }, i.runtime)))),
        h("div", { class: "aud-acoes" }, h("button", { type: "button", class: "bt-texto", disabled: !(r.novos + r.atualizados), onclick: () => this.executarSincronizacao() }, `Sincronizar ${r.novos + r.atualizados} item(ns)`)));
    }
    if (s.relatorio) corpo.push(h("pre", { class: "arm-log" }, [...s.relatorio.log, ...s.relatorio.erros.map(e => `✗ ${e}`)].join("\n") || "Nada a fazer."));
    return corpo;
  }

  rConsolidar() {
    const c = this.cons;
    const a = this.armazem;
    c.pares ??= candidatosEquivalencia(a.listar());
    const corpo = [
      h("p", { class: "painel-vazio" }, "Grau 1 compara contratos; grau 2 roda as mesmas fixtures nas duas; grau 3 é só proposta e precisa de decisão humana."),
      h("div", { class: "aud-acoes" }, h("button", { type: "button", class: "bt-texto", onclick: () => { c.pares = candidatosEquivalencia(a.listar()); c.par = null; this.redesenhar(); } }, "Procurar equivalentes de novo")),
    ];
    if (!c.pares.length) { corpo.push(h("p", { class: "painel-vazio" }, "Nenhum par de ferramentas com contrato parecido.")); return corpo; }
    corpo.push(h("div", { class: "lista" }, c.pares.map((p, i) => h("button", { type: "button", class: `item ${c.par === i ? "ativo" : ""}`, title: p.motivos.join(", "), onclick: () => { Object.assign(c, { par: i, comparacao: null, ranking: null, proposta: null, notaIA: null }); this.redesenhar(); } },
      h("span", { class: "item-nome" }, `${p.a.split("@")[0].split("/").slice(1).join("/")} ≈ ${p.b.split("@")[0].split("/").slice(1).join("/")}`), h("span", { class: "chip" }, `${Math.round(p.pontuacao * 100)}%`)))));
    if (c.par === null || !c.pares[c.par]) return corpo;
    const par = c.pares[c.par];
    const fixtures = h("textarea", { class: "cp-entrada mono", rows: 6, "aria-label": "Fixtures em JSON", onchange: e => { c.fixtures = e.target.value; } }, c.fixtures);
    corpo.push(h("div", { class: "sub" }, "Fixtures (JSON: nome, entrada, esperado opcional)"), fixtures,
      h("div", { class: "aud-acoes" },
        h("button", { type: "button", class: "bt-texto", onclick: () => this.compararPar(par) }, "Rodar nas duas (grau 2)"),
        h("button", { type: "button", class: "bt-texto", disabled: !this.ponte().disponivel(), onclick: () => this.pedirIA("gerarFixturesBorda", par) }, "IA: sugerir fixtures de borda")));
    if (c.comparacao) {
      const k = c.comparacao;
      corpo.push(h("p", { class: `painel-vazio arm-veredito ${k.veredito}` }, `Veredito: ${k.veredito}. ${k.mesmas}/${k.total} iguais${k.cobertura ? `; cobertura A ${Math.round(k.cobertura.a * 100)}%, B ${Math.round(k.cobertura.b * 100)}%` : ""}.`));
      if (k.divergencias.length) corpo.push(h("pre", { class: "arm-log" }, k.divergencias.map(d => `${d.fixture}: A=${JSON.stringify(d.saidaA)} · B=${JSON.stringify(d.saidaB)}${"esperado" in d ? ` · esperado=${JSON.stringify(d.esperado)}` : ""}`).join("\n")),
        h("div", { class: "aud-acoes" }, h("button", { type: "button", class: "bt-texto", disabled: !this.ponte().disponivel(), onclick: () => this.pedirIA("explicarDivergencia", par) }, "IA: explicar divergências")));
      if (k.erros.length) corpo.push(h("pre", { class: "arm-log" }, k.erros.map(e => `✗ ${e.fixture} (${e.qual}): ${e.erro}`).join("\n")));
    }
    if (c.ranking) {
      const r = c.ranking;
      corpo.push(h("div", { class: "sub" }, "Ranking (critérios medidos; empate não decide)"),
        h("div", { class: "arm-tabela" }, h("table", { class: "arm-ranking" }, h("tr", {}, h("th", {}, ""), ...r.criterios.map(k => h("th", { title: CRITERIOS[k] }, ABREV[k])), h("th", {}, "nota")),
          r.linhas.map(l => h("tr", {}, h("td", { title: l.chave }, l.chave.split("/").slice(1).join("/")), ...r.criterios.map(k => h("td", {}, l.notas[k].toFixed(2))), h("td", {}, h("b", {}, l.nota.toFixed(2))))))),
        h("p", { class: "painel-vazio" }, `${r.melhor ? `Melhor: ${r.melhor}` : "Sem escolha automática"} — ${r.porque}.${r.ignorados.length ? ` Sem dado: ${r.ignorados.join(", ")}.` : ""}`));
    }
    if (c.comparacao) corpo.push(h("div", { class: "aud-acoes" },
      h("button", { type: "button", class: "bt-texto", onclick: () => { c.proposta = proporFusao(par.a, par.b, c.comparacao, c.notaIA?.estrategia ?? null); this.redesenhar(); } }, "Montar proposta (grau 3)"),
      h("button", { type: "button", class: "bt-texto", disabled: !this.ponte().disponivel(), onclick: () => this.pedirIA("proporFusao", par) }, "IA: propor estratégia")));
    if (c.notaIA) corpo.push(h("pre", { class: "arm-log arm-ia" }, `IA (${c.notaIA.modelo}, proposta, não decide):\n${c.notaIA.texto ?? ""}`));
    if (c.proposta) {
      corpo.push(h("div", { class: "sub" }, "Proposta"), h("p", {}, c.proposta.texto),
        h("ol", { class: "arm-cadeia" }, cadeiaDaDecisao(c.proposta, c.comparacao).map(e => h("li", { class: e.feito ? "feito" : "" }, `${e.etapa}: ${e.detalhe}`))));
      if (c.proposta.estado === "proposta") {
        const quem = h("input", { type: "text", class: "cp-entrada", placeholder: "Quem revisou", "aria-label": "Quem revisou" });
        const decidir = aprovado => {
          try {
            c.proposta = registrarDecisao(c.proposta, { aprovado, por: quem.value });
            this.decisoes = [...(this.decisoes ?? []), { par, proposta: c.proposta }];
            this.armazem.definirConfig("decisoes", this.decisoes);
            avisar(aprovado ? "Fusão aprovada e registrada. Faça a fusão do código no programa; o Hefestus não aplica sozinho." : "Proposta rejeitada e registrada.", "ok");
            this.redesenhar();
          } catch (e) { avisar(e.message, "alerta"); }
        };
        corpo.push(quem, h("div", { class: "aud-acoes" },
          h("button", { type: "button", class: "bt-texto", onclick: () => decidir(true) }, "Aprovar"),
          h("button", { type: "button", class: "bt-texto", onclick: () => decidir(false) }, "Rejeitar")));
      }
    }
    return corpo;
  }

  rPropagar() {
    const lista = this.assinaturas ?? [];
    const progs = [...new Set([...Object.keys(HOSTS), ...this.armazem.listar().map(e => e.programa)])].filter(p => p !== "hefestus");
    const sel = h("select", { class: "cp-entrada", "aria-label": "Programa" }, progs.map(p => h("option", { value: p }, p)));
    const corpo = [
      h("p", { class: "painel-vazio" }, "Pull: o Hefestus não escreve no repositório de nenhum programa. Ele gera o pacote; o programa que aceitou (opt-in) puxa e decide quando aplicar."),
      h("div", { class: "lista" }, lista.length ? lista.map((a, i) => h("div", { class: "item arm-assinatura" },
        h("label", { class: "cp-linha" }, h("input", { type: "checkbox", class: "cp-check cp-interruptor", role: "switch", checked: a.optIn, onchange: e => this.salvarAssinatura(i, { ...a, optIn: e.target.checked }) }), h("span", {}, a.programa)),
        h("input", { type: "text", class: "cp-entrada", value: a.aceita.join(", "), title: "O que aceita: tipo/programa/id com *", "aria-label": `O que ${a.programa} aceita`, onchange: e => this.salvarAssinatura(i, { ...a, aceita: e.target.value.split(",").map(x => x.trim()).filter(Boolean) }) }),
        h("button", { type: "button", class: "bt-texto", disabled: !a.optIn, onclick: () => this.gerarPacote(a) }, "Gerar pacote"))) : h("p", { class: "painel-vazio" }, "Nenhum programa assinou ainda.")),
      h("div", { class: "aud-acoes" }, sel, h("button", { type: "button", class: "bt-texto", onclick: () => this.salvarAssinatura(-1, { programa: sel.value, optIn: false, aceita: ["ferramenta/*"] }) }, "Adicionar assinatura")),
    ];
    return corpo;
  }

  rIA() {
    const c = this.iaConfig;
    const ponte = this.ponte();
    const mudar = (k, v) => { c[k] = v; this.redesenhar(); };
    return [
      h("p", { class: "painel-vazio" }, "IA propõe; fixtures decidem; humano aprova. Usos: explicar divergências, sugerir fixtures de borda, propor fusão. Vão para a IA só contratos e saídas das fixtures, nunca o código; programa com \"privado\": true no manifesto só usa IA local."),
      h("label", { class: "cp" }, h("span", { class: "cp-rotulo" }, "Onde rodar"),
        h("select", { class: "cp-entrada", onchange: e => mudar("tipo", e.target.value) }, [["auto", "Automático (Claude no claude.ai, senão Ollama)"], ["claude", "Claude (página publicada)"], ["ollama", "Ollama local"], ["anthropic", "API da Anthropic (chave)"]].map(([v, r]) => h("option", { value: v, selected: c.tipo === v }, r)))),
      c.tipo === "anthropic" ? h("label", { class: "cp" }, h("span", { class: "cp-rotulo" }, "Chave da API (fica só nesta aba)"), h("input", { type: "password", class: "cp-entrada", value: c.chave, autocomplete: "off", onchange: e => mudar("chave", e.target.value.trim()) })) : null,
      c.tipo === "ollama" || c.tipo === "auto" ? h("label", { class: "cp" }, h("span", { class: "cp-rotulo" }, "Modelo do Ollama"), h("input", { type: "text", class: "cp-entrada", value: c.ollamaModelo, onchange: e => mudar("ollamaModelo", e.target.value.trim()) })) : null,
      h("label", { class: "cp" }, h("span", { class: "cp-rotulo" }, "Teto por ciclo (US$, estimado)"), h("input", { type: "number", class: "cp-entrada num", min: 0, step: 0.5, value: c.teto, onchange: e => mudar("teto", Number(e.target.value)) })),
      h("p", { class: "painel-vazio" }, `Gasto estimado no ciclo: US$ ${ponte.gasto.toFixed(3)} de ${ponte.teto.toFixed(2)}. Preços são estimativas editáveis no código (MODELOS_PADRAO).`),
      h("div", { class: "aud-acoes" }, h("button", { type: "button", class: "bt-texto", onclick: () => { ponte.novoCiclo(); this.redesenhar(); } }, "Novo ciclo")),
      ponte.registro.length ? h("pre", { class: "arm-log" }, ponte.registro.slice(-12).map(r => `${r.tarefa} · ${r.modelo} · ${r.doCache ? "cache" : r.recusado ? `recusado (${r.recusado})` : `US$ ${r.custo.toFixed(4)}`}`).join("\n")) : null,
    ];
  }

  // ---------------------------------------------------------- ações
  async carregarArquivos(fl) {
    const lista = [...(fl ?? [])]; // copia antes de limpar o campo (limpar esvazia a FileList)
    this.entrada.value = "";
    if (!lista.length) return;
    try {
      const arquivos = await lerArquivos(lista);
      let bruto = null;
      for (const [nome, texto] of arquivos) if (/\.json$/i.test(nome)) { try { const j = JSON.parse(texto); if (j.programa || j.program) { bruto = j; arquivos.delete(nome); break; } } catch { /* não é o manifesto */ } }
      if (!bruto) { this.sinc = { erros: ["Nenhum manifesto entre os arquivos (um .json com programa/versao ou program/version)."] }; this.redesenhar(); return; }
      const { manifesto, erros, avisos } = validarManifesto(bruto);
      this.sinc = { manifesto, erros, avisos, arquivos, plano: manifesto ? planoSincronizacao(manifesto, this.armazem) : null };
      this.abrirSecao("sincronizar");
    } catch (e) { this.sinc = { erros: [e.message] }; }
    this.redesenhar();
  }

  async executarSincronizacao() {
    const s = this.sinc;
    const obter = it => {
      const nome = it.arquivo ?? `${it.id}.js`;
      const base = nome.split(/[\\/]/).pop();
      return s.arquivos.get(nome) ?? s.arquivos.get(base);
    };
    s.relatorio = await sincronizar(this.armazem, s.manifesto, obter);
    s.plano = planoSincronizacao(s.manifesto, this.armazem);
    this.cons.pares = null;
    avisar(`${s.relatorio.contagem.novos} novo(s), ${s.relatorio.contagem.atualizados} atualizado(s)${s.relatorio.erros.length ? `, ${s.relatorio.erros.length} erro(s)` : ""}.`, s.relatorio.erros.length ? "alerta" : "ok");
    this.redesenhar();
  }

  async registrarProprio() {
    const r = await registrarHefestus(this.armazem);
    this.cons.pares = null;
    avisar(`Hefestus ${VERSAO}: ${r.contagem.novos} ferramenta(s) nova(s), ${r.contagem.iguais} já estavam no armazém.`, "ok");
    this.redesenhar();
  }

  async remover(chave) {
    try { await this.armazem.remover(chave); this.cons.pares = null; this.redesenhar(); }
    catch (e) { avisar(e.message, "alerta"); }
  }

  async exportarArmazem() {
    await this.app.baixarJSON(await this.armazem.exportar(), `armazem-hefestus-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async importarArmazem(arq) {
    if (!arq) return;
    try {
      const texto = await arq.text();
      this.entradaArmazem.value = "";
      const r = await this.armazem.importar(JSON.parse(texto));
      this.assinaturas = await this.armazem.config("assinaturas", []);
      this.cons.pares = null;
      avisar(`Armazém importado: ${r.novos} novo(s), ${r.iguais} igual(is)${r.conflitos.length ? `, ${r.conflitos.length} conflito(s) mantidos como estavam` : ""}${r.corrompidos.length ? `, ${r.corrompidos.length} corrompido(s) recusados` : ""}.`, r.corrompidos.length ? "alerta" : "ok");
    } catch (e) { avisar(`Não deu para importar: ${e.message}`, "alerta"); }
    this.redesenhar();
  }

  async compararPar(par) {
    const c = this.cons;
    let fixtures;
    try { fixtures = JSON.parse(c.fixtures); if (!Array.isArray(fixtures)) throw new Error("use uma lista [ … ]"); }
    catch (e) { avisar(`Fixtures inválidas: ${e.message}`, "alerta"); return; }
    const ea = this.armazem.entrada(par.a), eb = this.armazem.entrada(par.b);
    if (ea.runtime !== "web" || eb.runtime !== "web") { avisar(`O grau 2 roda aqui só ferramentas web (${ea.runtime} × ${eb.runtime}). Rode as fixtures no programa e sincronize as métricas.`, "alerta"); return; }
    try {
      const fa = funcaoDaFerramenta(await this.armazem.ler(par.a)), fb = funcaoDaFerramenta(await this.armazem.ler(par.b));
      c.comparacao = await compararComportamento(fixtures, (qual, f) => (qual === "a" ? fa : fb)(structuredClone(f.entrada)));
      if (c.comparacao.cobertura) {
        await this.armazem.atualizarMetricas(par.a, { cobertura: c.comparacao.cobertura.a });
        await this.armazem.atualizarMetricas(par.b, { cobertura: c.comparacao.cobertura.b });
      }
      c.ranking = ranquear([ea, eb].map(e => ({ chave: e.chave, metricas: metricasDe(this.armazem.entrada(e.chave)) })));
      c.proposta = null;
    } catch (e) { avisar(`Não deu para rodar: ${e.message}`, "alerta"); }
    this.redesenhar();
  }

  async pedirIA(tarefa, par) {
    const c = this.cons;
    const ea = this.armazem.entrada(par.a), eb = this.armazem.entrada(par.b);
    const entrada = { a: { id: ea.chave, contrato: ea.contrato, runtime: ea.runtime }, b: { id: eb.chave, contrato: eb.contrato, runtime: eb.runtime }, divergencias: c.comparacao?.divergencias?.slice(0, 12) ?? [], cobertura: c.comparacao?.cobertura ?? null };
    // só contratos e saídas das fixtures vão para a IA (o código não sai daqui); programa marcado como privado: só IA local
    const privado = [ea, eb].some(e => e.origem?.privado === true);
    this.app.mensagem("Consultando a IA…");
    try {
      const r = await this.ponte().pedir(tarefa, entrada, { privado });
      if (tarefa === "gerarFixturesBorda" && Array.isArray(r.fixtures)) {
        let atuais = []; try { atuais = JSON.parse(c.fixtures); } catch { /* texto inválido: substitui */ }
        c.fixtures = JSON.stringify([...atuais, ...r.fixtures], null, 2);
        avisar(`${r.fixtures.length} fixture(s) sugerida(s). Rode nas duas para ver o que elas dizem.`, "ok");
      } else {
        c.notaIA = { modelo: r.modelo, estrategia: r.estrategia ?? null, texto: r.estrategia ?? ((r.explicacoes ?? []).map(x => `${x.fixture}: ${x.causa}`).join("\n") || r.texto) };
      }
      this.app.mensagem(`IA (${r.modelo}${r.doCache ? ", do cache" : ""}): proposta pronta.`);
    } catch (e) { avisar(e.message, "alerta"); this.app.mensagem(""); }
    this.redesenhar();
  }

  async salvarAssinatura(i, a) {
    const lista = [...(this.assinaturas ?? [])];
    const nova = normalizarAssinatura(a);
    if (i < 0) { if (lista.some(x => x.programa === nova.programa)) { avisar(`${nova.programa} já tem assinatura.`, "alerta"); return; } lista.push(nova); }
    else lista[i] = nova;
    this.assinaturas = await this.armazem.definirConfig("assinaturas", lista);
    this.redesenhar();
  }

  async gerarPacote(a) {
    const p = await pacoteParaPrograma(this.armazem, a);
    if (!p.itens.length) { avisar(`Nada novo para ${a.programa}. ${p.recusados[0]?.motivo ?? ""}`, "info"); return; }
    await this.app.baixarJSON(p, `atualizacao-para-${a.programa}.json`);
    avisar(`Pacote com ${p.itens.length} item(ns) para ${a.programa} puxar.`, "ok");
  }
}
