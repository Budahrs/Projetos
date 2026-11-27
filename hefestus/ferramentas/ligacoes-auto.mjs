// Ligações automáticas: o Hefestus liga TODOS os sinais de um programa por padrão.
//
// Para cada sinal que a interface emite, a primeira regra que servir vence:
//   1. arquivo    o que está escrito em ligacoes/<programa>.json (escolha explícita, sempre vale)
//   2. motor      o motor declara uma operação com o mesmo nome (motor.operacoes)
//   3. pdf        o motor de PDF embutido no programa (quando documento.tipo = "pdf")
//   4. interface  ações que todo programa sabe fazer (desfazer, tela cheia, ajuda, paleta de comandos…)
//   5. pendente   nada sabe fazer ainda: o botão diz isso com clareza e o relatório lista o que falta
//
// O resultado é um arquivo de ligações completo (formato hefestus.ligacoes) e um relatório.

/** "pdf|cut-native" → "cut_native"; "Girar Página" → "girar_pagina" */
export const chaveDoSinal = sinal => String(sinal ?? "")
  .split(/[|:.]/).pop()
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** "Botão Girar 90° 2" → "Girar 90°" */
export const rotuloDoElemento = nome => String(nome ?? "")
  .replace(/^(bot[aã]o|item|op[cç][aã]o|[ií]cone)\s+/i, "")
  .replace(/\s+\d+$/, "")
  .trim();

const sinonimos = (lista, lig) => Object.fromEntries(lista.map(k => [k, lig]));

/** Ações que qualquer programa exportado faz sozinho. */
const INTERFACE = {
  ...sinonimos(["undo", "desfazer"], { acao: "desfazer" }),
  ...sinonimos(["redo", "refazer"], { acao: "refazer" }),
  ...sinonimos(["fullscreen", "tela_cheia", "telacheia"], { acao: "telaCheia" }),
  ...sinonimos(["help", "ajuda", "sobre", "about", "recursos", "limitacoes"], { acao: "ajuda" }),
  ...sinonimos(["center", "todas_ferramentas", "ferramentas", "comandos", "paleta", "command_palette", "quickcustom", "acesso_rapido"], { acao: "paleta" }),
  ...sinonimos(["themes", "theme", "tema", "temas", "modo_escuro", "dark"], { acao: "tema" }),
  ...sinonimos(["ribbon", "recolher_faixa", "faixa", "recolher"], { acao: "recolherFaixa" }),
  ...sinonimos(["copy", "copiar", "copy_native"], { acao: "editar", comando: "copiar" }),
  ...sinonimos(["cut", "recortar_texto", "cut_native"], { acao: "editar", comando: "recortar" }),
  ...sinonimos(["paste", "colar", "paste_native"], { acao: "editar", comando: "colar" }),
  ...sinonimos(["select_all", "selecionar_tudo"], { acao: "editar", comando: "selecionarTudo" }),
  ...sinonimos(["exit", "quit", "sair", "encerrar"], { acao: "sair" }),
  ...sinonimos(["print", "imprimir"], { acao: "imprimir" }),
  ...sinonimos(["zoomin", "zoom_in", "ampliar", "aumentar_zoom"], { acao: "zoom", passo: 1 }),
  ...sinonimos(["zoomout", "zoom_out", "reduzir", "diminuir_zoom"], { acao: "zoom", passo: -1 }),
  ...sinonimos(["fit", "ajustar", "ajustar_pagina", "zoom_ajustar"], { acao: "zoom", ajustar: true }),
  ...sinonimos(["prev", "anterior", "pagina_anterior", "previous"], { acao: "pagina", passo: -1 }),
  ...sinonimos(["next", "proxima", "proxima_pagina"], { acao: "pagina", passo: 1 }),
  ...sinonimos(["first", "primeira", "primeira_pagina"], { acao: "pagina", ir: "primeira" }),
  ...sinonimos(["last", "ultima", "ultima_pagina"], { acao: "pagina", ir: "ultima" }),
};
/** Só fazem sentido quando o programa trabalha com um documento. */
const DOCUMENTO = {
  ...sinonimos(["open", "abrir"], { acao: "abrir" }),
  ...sinonimos(["close", "fechar"], { acao: "fechar" }),
  ...sinonimos(["save", "salvar", "salvar_copia", "save_as", "salvar_como"], { acao: "salvar" }),
};

/** Motor de PDF embutido (pdf-lib + pdf.js, dentro do próprio programa). */
const PDF = {
  ...sinonimos(["rotate", "girar"], { op: "girar" }),
  ...sinonimos(["left", "mover_antes"], { op: "moverAntes" }),
  ...sinonimos(["right", "mover_depois"], { op: "moverDepois" }),
  ...sinonimos(["duplicate", "duplicar"], { op: "duplicar" }),
  ...sinonimos(["blank", "pagina_branca", "pagina_em_branco"], { op: "paginaBranca" }),
  ...sinonimos(["delete", "excluir", "excluir_pagina"], { op: "excluir" }),
  ...sinonimos(["numbers", "numerar", "numerar_paginas"], { op: "numerar" }),
  ...sinonimos(["watermark", "marca_dagua", "marca_d_agua"], { op: "marcaDagua" }),
  ...sinonimos(["mix", "intercalar"], { op: "intercalar" }),
  ...sinonimos(["split", "dividir"], { op: "dividirPaginas" }),
  ...sinonimos(["splitgroups", "dividir_grupos"], { op: "dividirGrupos" }),
  ...sinonimos(["splitsize", "dividir_tamanho"], { op: "dividirTamanho" }),
  ...sinonimos(["splitranges", "dividir_intervalos"], { op: "dividirIntervalos" }),
  ...sinonimos(["splitbookmarks", "dividir_marcadores"], { op: "dividirMarcadores" }),
  ...sinonimos(["capture", "capturar", "capturar_tela"], { op: "capturarTela" }),
  ...sinonimos(["crop", "recortar", "recortar_pagina"], { op: "recortar" }),
  ...sinonimos(["uncrop", "remover_recorte"], { op: "removerRecorte" }),
  ...sinonimos(["image", "inserir_imagem"], { op: "inserirImagem" }),
  ...sinonimos(["clipboard", "colar_imagem"], { op: "colarImagem" }),
  ...sinonimos(["comment", "comentario", "nota"], { op: "comentario" }),
  ...sinonimos(["highlight", "realcar"], { op: "realcar" }),
  ...sinonimos(["rectangle", "retangulo"], { op: "retangulo" }),
  ...sinonimos(["drawsignature", "assinatura_desenhada", "rubrica"], { op: "assinaturaDesenhada" }),
  ...sinonimos(["forms", "preencher_formulario", "formulario"], { op: "preencherFormulario" }),
  fieldtext: { op: "criarCampo", tipo: "texto" },
  fieldcheck: { op: "criarCampo", tipo: "caixa" },
  fieldcombo: { op: "criarCampo", tipo: "lista" },
  fieldradio: { op: "criarCampo", tipo: "escolha" },
  ...sinonimos(["png", "pagina_png"], { op: "exportarImagens", formato: "png", paginas: "atual" }),
  ...sinonimos(["allpng", "todas_png"], { op: "exportarImagens", formato: "png", paginas: "todas" }),
  ...sinonimos(["jpg", "jpeg", "paginas_jpg"], { op: "exportarImagens", formato: "jpg", paginas: "pedir" }),
  ...sinonimos(["compare", "comparar"], { op: "comparar" }),
  ...sinonimos(["extractimages", "extrair_imagens"], { op: "extrairImagens" }),
  ...sinonimos(["redact", "censurar", "tarjar"], { op: "censurar" }),
  ...sinonimos(["metadata_edit", "editar_propriedades"], { op: "propriedades" }),
};

/** Por que alguns comandos ainda não têm motor (aparece no botão e na Ajuda). */
const MOTIVOS = {
  protect: "proteger com senha precisa de criptografia de PDF; falta expor no motor (PdfSharp)",
  unlock: "remover senha precisa de criptografia de PDF; falta expor no motor (PdfSharp)",
  sign: "assinatura digital A1/PFX precisa de certificado; falta expor no motor",
  pdfx: "PDF/X CMYK precisa do motor de cores (CMS); falta expor no motor",
  summary: "resumir precisa de um modelo de IA local (Qwen); falta expor no motor",
  translate: "traduzir precisa de um modelo de IA local (Qwen); falta expor no motor",
  objects: "editar o texto original exige reescrever o conteúdo da página; falta um motor",
  scan: "digitalizar precisa do driver do scanner (WIA/TWAIN)",
  batch: "lotes e fluxos ainda não têm motor",
  reconstructimage: "reconstruir imagem precisa do motor de imagens",
  reconstructpage: "reconstruir página precisa do motor de imagens/OCR",
};

/**
 * Liga todos os sinais.
 * @param {object} descricao  programa.json (descricaoDoPrograma): { sinais: [{ sinal, nomeElemento, acao, alvo }] }
 * @param {object|null} arquivo ligações escritas à mão (ou null)
 * @returns {{ ligacoes: object, relatorio: object }}
 */
export function ligarTudo(descricao, arquivo = null) {
  const base = arquivo ? structuredClone(arquivo) : {};
  const explicitas = base.sinais ?? {};
  const temDocumento = !!base.documento;
  const ehPdf = base.documento?.tipo === "pdf";
  const opsMotor = new Set((base.motor?.operacoes ?? []).map(String));

  // sinais emitidos, com o nome do elemento que emite (o primeiro que aparecer)
  const emitidos = new Map();
  const paineis = new Set(), abas = new Set();
  for (const s of descricao?.sinais ?? []) {
    if (s.acao === "mostrarSo" && s.alvo) { paineis.add(s.alvo); abas.add(s.elemento); }
    if (s.sinal && !emitidos.has(s.sinal)) emitidos.set(s.sinal, (s.texto && s.texto.length <= 60 ? s.texto : "") || rotuloDoElemento(s.nomeElemento) || s.sinal);
  }
  for (const k of Object.keys(explicitas)) if (!emitidos.has(k)) emitidos.set(k, explicitas[k].rotulo ?? k);

  const sinais = {};
  const itens = [];
  for (const [sinal, rotulo] of emitidos) {
    const chave = chaveDoSinal(sinal);
    let lig, origem;
    if (explicitas[sinal]) { lig = explicitas[sinal]; origem = "arquivo"; }
    else if (opsMotor.has(chave) || opsMotor.has(sinal.split(/[|:.]/).pop())) {
      const op = opsMotor.has(chave) ? chave : sinal.split(/[|:.]/).pop();
      lig = { acao: "operacao", contrato: { operation: op }, saida: { sugestao: `{nome}-${op}${ehPdf ? ".pdf" : ""}` }, abrirResultado: ehPdf };
      origem = "motor";
    } else if (ehPdf && PDF[chave]) { lig = { acao: "pdf", ...PDF[chave] }; origem = "pdf"; }
    else if (temDocumento && DOCUMENTO[chave]) { lig = { ...DOCUMENTO[chave] }; origem = "interface"; }
    else if (INTERFACE[chave]) { lig = { ...INTERFACE[chave] }; origem = "interface"; }
    else { lig = { acao: "pendente", ...(MOTIVOS[chave] ? { motivo: MOTIVOS[chave] } : {}) }; origem = "pendente"; }
    lig = { rotulo, ...lig };
    sinais[sinal] = lig;
    itens.push({ sinal, rotulo: lig.rotulo, origem, acao: lig.acao === "pdf" ? `pdf:${lig.op}` : lig.acao, ...(lig.motivo ? { motivo: lig.motivo } : {}) });
  }

  const porOrigem = { arquivo: 0, motor: 0, pdf: 0, interface: 0, pendente: 0 };
  for (const i of itens) porOrigem[i.origem]++;
  const { formato: _f, versao: _v, ...resto } = base;
  return {
    ligacoes: {
      formato: "hefestus.ligacoes", versao: 1,
      ...resto,
      sinais,
      paineis: [...paineis],
      abas: [...abas],
      automatico: { geradoEm: new Date().toISOString(), ...porOrigem },
    },
    relatorio: { total: itens.length, ligados: itens.length - porOrigem.pendente, porOrigem, itens },
  };
}

const NOMES_ORIGEM = { arquivo: "arquivo de ligações", motor: "motor externo", pdf: "motor de PDF embutido", interface: "interface", pendente: "pendente" };

/** Relatório legível (LIGACOES.md no programa exportado). */
export function relatorioMarkdown(nome, relatorio) {
  const linhas = [
    `# Ligações de ${nome}`, "",
    `${relatorio.ligados} de ${relatorio.total} comandos ligados.`, "",
    "| Origem | Comandos |", "| --- | --- |",
    ...Object.entries(relatorio.porOrigem).map(([k, v]) => `| ${NOMES_ORIGEM[k]} | ${v} |`), "",
    "| Comando | Sinal | Ligado a |", "| --- | --- | --- |",
    ...relatorio.itens.map(i => `| ${i.rotulo.replace(/\|/g, "\\|")} | \`${i.sinal}\` | ${i.origem === "pendente" ? `**pendente**${i.motivo ? `: ${i.motivo}` : ""}` : `${NOMES_ORIGEM[i.origem]} (${i.acao})`} |`),
    "",
  ];
  return linhas.join("\n");
}
