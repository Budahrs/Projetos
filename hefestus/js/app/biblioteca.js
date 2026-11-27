// Biblioteca: modelos (prontos e do usuário, no formato de componente), fontes e ícones,
// mais a janela de atalhos. Métodos misturados na classe App (veja js/app.js).
import { avisar, h } from "../ui/dom.js";
import { FONTES_BIB } from "../nucleo/fontes.js";
import { paraComponente, deComponente } from "../nucleo/modelos.js";
import { adicionarIconeUsuario, rotuloIcone } from "../ui/icones.js";
import { normalizarTitulo } from "../nucleo/recuperacao.js";

const CHAVE_MODELOS = "hefestus.modelos.v1";

export class Biblioteca {
  // ---------------- biblioteca: modelos, fontes e ícones ----------------
  modelosUsuario() {
    if (this._modelosSessao) return this._modelosSessao;
    for (const chave of [CHAVE_MODELOS, `${CHAVE_MODELOS}.valido`]) {
      try {
        const lista = JSON.parse(localStorage.getItem(chave));
        if (Array.isArray(lista) && lista.every(m => m && Array.isArray(m.elementos))) return lista;
      } catch {}
    }
    return [];
  }
  guardarModelosUsuario(lista) {
    this._modelosSessao = lista;
    try {
      const anterior = localStorage.getItem(CHAVE_MODELOS);
      if (anterior) { try { if (Array.isArray(JSON.parse(anterior))) localStorage.setItem(`${CHAVE_MODELOS}.valido`, anterior); } catch {} }
      localStorage.setItem(CHAVE_MODELOS, JSON.stringify(lista)); return true;
    } catch { return false; }
  }
  inserirModelo(m, x, y) {
    if (this.ui.modo !== "designer") this.setModo("designer");
    this.ribbon.fecharMenus(); this.ribbon.removerSolto();
    this.ui.flyout = null; this.ui.grupoAberto = null;
    const ids = this.n.inserirModelo(m, x, y);
    if (ids.length) this.mensagem(`Modelo ${m.nome} inserido: ${ids.length} peças, selecionadas juntas. Um Ctrl+Z desfaz tudo.`, "ok");
    return ids;
  }
  salvarModelo() {
    const ids = this.n.selecionados();
    if (!ids.length) { avisar("Selecione os elementos que formam o modelo.", "alerta"); return; }
    const entrada = h("input", { type: "text", class: "cp-entrada", value: ids.length === 1 ? this.n.rotulo(ids[0]) : "Meu modelo", "aria-label": "Nome do modelo" });
    const tags = h("input", { type: "text", class: "cp-entrada", placeholder: "menu, escuro, barra", "aria-label": "Etiquetas (separadas por vírgula)" });
    this.dialogo({
      titulo: "Salvar como modelo", icone: "modelo",
      texto: `${this.n.descreverGrupo(ids)} vira um modelo em Biblioteca › Meus modelos, para usar em novos projetos.`,
      corpo: h("div", { class: "cp" }, h("span", { class: "cp-rotulo" }, "Nome"), entrada, h("span", { class: "cp-rotulo", style: "margin-top:6px" }, "Etiquetas para achar depois"), tags),
      opcoes: [
        { id: "salvar", rotulo: "Salvar modelo", primario: true, fazer: () => {
          const nome = this.ui.manterNomes ? entrada.value.trim() : normalizarTitulo(entrada.value);
          const m = this.n.modeloDaSelecao(ids, nome || "Meu modelo");
          const agora = new Date().toISOString();
          m.tags = tags.value.split(",").map(t => t.trim()).filter(Boolean);
          const anteriores = this.modelosUsuario().filter(a => a.nome === m.nome);
          m.meta = { versao: `1.0.${anteriores.length}`, origem: this.ui.hibrido ? "forja" : "designer", criadoEm: agora, atualizadoEm: agora, tags: m.tags };
          const ok = this.guardarModelosUsuario([...this.modelosUsuario(), m]);
          avisar(ok ? `Modelo "${m.nome}" salvo na biblioteca.` : "Este navegador não deixou guardar. Use Exportar meus modelos.", ok ? "ok" : "alerta");
          this.primeiros?.marcar("modelo");
          if (!ok) this.baixarJSON([m], "modelos-hefestus.json");
          this.render();
        } },
        { id: "cancelar", rotulo: "Cancelar", fazer: () => {} },
      ],
    });
    requestAnimationFrame(() => { entrada.focus(); entrada.select(); });
  }
  removerModelo(id) {
    const m = this.modelosUsuario().find(x => x.id === id);
    if (!m) return;
    this.dialogo({
      titulo: "Excluir modelo", icone: "excluir", texto: `Excluir "${m.nome}" da biblioteca? Os projetos que já usam as peças não mudam.`,
      opcoes: [
        { id: "excluir", rotulo: "Excluir", primario: true, fazer: () => { this.guardarModelosUsuario(this.modelosUsuario().filter(x => x.id !== id)); this.render(); } },
        { id: "cancelar", rotulo: "Cancelar", fazer: () => {} },
      ],
    });
  }
  async baixarJSON(dados, nome) {
    return this.n.baixar(nome, JSON.stringify(dados, null, 2), "application/json");
  }
  async exportarModelos() {
    const lista = this.modelosUsuario();
    if (!lista.length) return avisar("Ainda não há modelos seus para exportar.", "alerta");
    // formato de biblioteca de componentes: meta, tokens e árvore de camadas de cada modelo
    const r = await this.baixarJSON({ formato: "hefestus.biblioteca", versao: 2, exportadoEm: new Date().toISOString(), componentes: lista.map(paraComponente) }, "biblioteca-hefestus.json");
    if (r === "indisponivel") avisar("Não deu para baixar aqui.", "alerta");
  }
  importarModelos() { this.entradaModelos.click(); }
  async carregarModelos(arq) {
    if (!arq) return;
    try {
      const dados = JSON.parse(await arq.text());
      const brutos = dados?.formato === "hefestus.biblioteca" ? dados.componentes ?? []
        : dados?.formato === "hefestus.componente" ? [dados]
        : Array.isArray(dados) ? dados : dados?.modelos ?? [];
      const lista = brutos.map(c => { try { return deComponente(c); } catch { return null; } }).filter(m => m && Array.isArray(m.elementos) && m.largura && m.altura);
      if (!lista.length) throw new Error("nenhum modelo no arquivo");
      const atuais = this.modelosUsuario();
      const novos = lista.map(m => ({ ...m, id: atuais.some(a => a.id === m.id) ? `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}` : m.id, cat: "Meus modelos", usuario: true }));
      const salvo = this.guardarModelosUsuario([...atuais, ...novos]);
      avisar(`${novos.length} artefato(s) importado(s).${salvo ? "" : " Mantidos nesta sessão; exporte a biblioteca para preservá-los."}`, salvo ? "ok" : "alerta");
      if (this.ui.hibrido) { this.ui.dockAba = "modelos"; this.render(); } else this.abrirPainelEsq("biblioteca");
    } catch (e) {
      avisar(`Não importei: ${e.message}`, "alerta");
    }
    this.entradaModelos.value = "";
  }
  /** Aplica uma fonte da biblioteca nos selecionados (sem seleção, explica como usar). */
  aplicarFonte(k) {
    const ids = this.n.selecionados();
    if (!FONTES_BIB[k]) return;
    if (!ids.length) { avisar("Selecione um texto, botão ou outro elemento com texto para aplicar a fonte.", "alerta"); return; }
    this.n.definirNosSelecionados({ "estilo.fonte": k }, `Fonte ${FONTES_BIB[k].nome} em ${this.n.descreverGrupo(ids)}`);
  }
  /** Importa ícones SVG ou PNG (baixados de sites como Flaticon, Icons8, IconScout ou Icon-Icons). Ficam em "Meus ícones importados". */
  importarIcones() {
    if (!this.entradaIcones) {
      this.entradaIcones = h("input", { type: "file", accept: ".svg,.png,image/svg+xml,image/png", multiple: "multiple", style: "display:none", "aria-label": "Importar ícones SVG ou PNG" });
      this.entradaIcones.addEventListener("change", () => this.lerIcones([...this.entradaIcones.files]));
      document.body.append(this.entradaIcones);
    }
    this.entradaIcones.click();
  }
  async lerIcones(arquivos) {
    const feitos = [];
    const erros = [];
    for (const f of arquivos) {
      try {
        const nome = f.name.replace(/\.[^.]+$/, "");
        if (f.size > 200_000) throw new Error("maior que 200 KB");
        const svg = /\.svg$/i.test(f.name) || f.type === "image/svg+xml";
        const dados = svg ? await f.text() : await new Promise((ok, falha) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => falha(new Error("não consegui ler")); r.readAsDataURL(f); });
        feitos.push(adicionarIconeUsuario(nome, svg ? "svg" : "png", dados));
      } catch (e) {
        erros.push(`${f.name}: ${e.message}`);
      }
    }
    if (this.entradaIcones) this.entradaIcones.value = "";
    if (feitos.length) {
      this.mensagem(`${feitos.length} ícone${feitos.length > 1 ? "s" : ""} importado${feitos.length > 1 ? "s" : ""}: aparece${feitos.length > 1 ? "m" : ""} em Meus ícones importados. Eles usam a cor do elemento (uma cor só).`, "ok");
      this.abrirPainelEsq?.("biblioteca");
      this.render?.();
    }
    if (erros.length) avisar(`Não importei: ${erros.join("; ")}`, "alerta");
  }
  /** Insere um ícone da biblioteca (ou, se um ícone estiver selecionado, troca o símbolo dele). */
  inserirIcone(nome, x, y) {
    if (this.ui.modo !== "designer") this.setModo("designer");
    const id = this.n.criar("icone", x, y, { simbolo: nome, ...(this.ui.estiloIcones === "colorido" ? { estiloIcone: "colorido" } : {}) });
    this.n.definir(id, { nome: `Ícone ${rotuloIcone(nome)}` }, `Nomear ${id}`);
    return id;
  }
  trocarIcone(nome) {
    const icones = this.n.selecionados().filter(id => this.n.elemento(id)?.tipo === "icone");
    if (!icones.length) return this.inserirIcone(nome);
    this.n.definirVarios(Object.fromEntries(icones.map(id => [id, { simbolo: nome }])), `Ícone ${rotuloIcone(nome)} em ${this.n.descreverGrupo(icones)}`);
  }

  mostrarAtalhos() {
    const linhas = [
      ["Ctrl+Z / Ctrl+Y", "Desfazer / refazer"], ["Ctrl+S", "Salvar projeto"], ["Ctrl+P", "Buscar elemento ou comando"],
      ["V H Z", "Selecionar, mão, lupa"], ["R E L T B", "Caixa, elipse, linha, texto, botão"], ["I", "Conta-gotas"],
      ["Espaço", "Mão enquanto segura"], ["Ctrl+A / Esc", "Selecionar tudo / limpar"], ["Ctrl+D / Del", "Duplicar / excluir"], ["Ctrl+C / Ctrl+X / Ctrl+V", "Copiar / recortar / colar (Shift: no mesmo lugar)"],
      ["Ctrl+] / Ctrl+[", "Frente / trás"], ["Ctrl+G / Ctrl+Shift+G", "Agrupar em container / desagrupar"], ["Shift+H / Shift+V", "Espelhar"], ["Setas (Shift)", "Mover 1 px (8 px)"],
      ["Ctrl+0 / Ctrl+1", "Ajustar / 100%"], ["Tab", "Esconder/mostrar toda a interface"], ["F6", "Mostrar/ocultar barra de ferramentas"], ["F7 / Ctrl+Shift+O", "Oficina de menus e ferramentas"], ["F10", "Ir para a barra de menus"], ["Ctrl+F1", "Fixar ou recolher a faixa"],
    ];
    this.dialogo({
      titulo: "Atalhos de teclado", icone: "ajuda",
      corpo: h("div", { class: "lista atalhos" }, linhas.map(([k, d]) => h("div", { class: "item" }, h("kbd", { class: "mono" }, k), h("span", { class: "item-nome", style: "text-align:right" }, d)))),
      opcoes: [{ id: "ok", rotulo: "Fechar", primario: true, fazer: () => {} }],
    });
  }

}
