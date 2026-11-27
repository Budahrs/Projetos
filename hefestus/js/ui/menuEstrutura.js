// Organização da faixa copiada do PowerPoint: Arquivo · Página Inicial · Inserir · Desenhar · Design ·
// Comportamento (as "Animações") · Revisão · Exibir · Ajuda, mais a aba contextual Formatar ("Ferramentas
// de Desenho") que só aparece com algo selecionado. Nenhum comando é criado ou removido: só se movem os
// grupos já definidos em abasBase, na ordem de trabalho do PowerPoint.

export function reorganizarAbas(lista, n) {
  const porId = Object.fromEntries(lista.map(a => [a.id, a]));
  const tirar = (id, nomes, renomear = {}) => {
    const a = porId[id];
    if (!a) return [];
    const saem = [], ficam = [];
    for (const g of a.grupos) (!nomes || nomes.includes(g.nome) ? saem : ficam).push(g);
    a.grupos = ficam;
    return saem.map(g => (renomear[g.nome] ? { ...g, nome: renomear[g.nome] } : g));
  };

  // Página Inicial: o que se usa o tempo todo (colar, desfazer, editar, inserir rápido, selecionar, ordem)
  const inicio = [
    ...tirar("inicio", ["Área de transferência", "Histórico", "Edição", "Inserir rápido"]),
    ...tirar("inicio", ["Seleção"]), // "Editando" do PowerPoint, no fim
  ];
  // Inserir: tudo o que se acrescenta ao documento
  const inserir = [...tirar("inserir", ["Biblioteca", "Formas", "Básicas", "Texto", "Controles", "Navegação", "Flutuantes", "Componentes", "Formulário", "Sistemas"])];
  // Desenhar: vetor e geometria
  const desenhar = [
    ...tirar("inserir", ["Vetor"]),
    ...tirar("organizar", ["Combinar formas", "Máscara"]),
  ];
  // Design: aparência global e variantes
  const design = [
    ...tirar("design", ["Tema da interface"]),
    ...tirar("organizar", ["Variantes"]),
    ...tirar("design", ["Elementos", "Cor", "Efeitos"]),
  ];
  // Layout (como no Word): tela, espaçamento do container selecionado e organização dos objetos
  const cont = (() => { const e = n.selecionado?.(); return e && e.tipo === "container" ? e : null; })();
  const espaco = (id, rotulo, caminho, icone) => ({ id, tipo: "spinner", rotulo, icone, unidade: "px", valor: () => (cont ? cont.layout?.[caminho] ?? 0 : null), aoMudar: v => n.definir(cont.id, { [`layout.${caminho}`]: Math.max(0, v) }, `${rotulo} ${v} em ${cont.nome}`) });
  const layout = [
    ...tirar("design", ["Tela"]).map(g => ({ ...g, nome: "Configurar tela", cmds: g.cmds.map(c => (c.id === "telas" ? { ...c, rotulo: "Tamanho" } : c)) })),
    { nome: "Espaçamento", icone: "grade", cmds: [espaco("lay-margem", "Margem interna", "margem", "largura"), espaco("lay-espaco", "Espaço entre itens", "espaco", "altura")] },
    ...tirar("organizar", ["Alinhar", "Distribuir", "Girar e espelhar", "Grupos", "Camadas"]),
  ];
  // Revisão: histórico, proteção, agente e auditoria
  const revisao = [
    ...tirar("historico", null, { Navegar: "Linha do tempo" }),
    ...tirar("ajuda", ["Projeto"], { Projeto: "Auditoria e documentação" }),
  ];
  const formatar = tirar("formatar");

  const nova = [
    porId.arquivo,
    { id: "inicio", rotulo: "Página Inicial", rotuloMenu: "Página Inicial", grupos: inicio },
    { id: "inserir", rotulo: "Inserir", grupos: inserir },
    { id: "desenhar", rotulo: "Desenhar", grupos: desenhar },
    { id: "design", rotulo: "Design", grupos: design },
    { id: "layout", rotulo: "Layout", grupos: layout },
    porId.comportamento,
    { id: "revisao", rotulo: "Revisão", grupos: revisao },
    porId.exibir,
    porId.ajuda,
    ...(porId.formatar ? [{ ...porId.formatar, grupos: formatar }] : []),
  ].filter(Boolean);
  for (const a of lista) if (a.grupos?.length && !nova.includes(a)) inicio.push(...a.grupos); // nada se perde
  return compactarAbas(nova);
}


/**
 * Padrão de tamanhos (como Word/Excel): 1 comando = grande; 3 empilhados = pequenos;
 * 2 empilhados = médios, sempre em colunas de 2 (4 ferramentas = 2 colunas).
 */
/** Abas que devem empilhar (só quando não cabem em tamanho grande). */
let EMPILHAR = new Set();
export const definirEmpilhar = s => { EMPILHAR = s; };
function compactarAbas(abas) {
  const simples = c => c.tam === "grande" && !c.tipo && c.cor === undefined && !c.html;
  const partes = n => (n <= 1 ? [] : n === 2 || n === 4 ? [n === 2 ? ["m", 2] : ["m", 4]] : n === 3 ? [["p", 3]] : n === 5 ? [["p", 3], ["m", 2]] : n === 6 ? [["p", 3], ["p", 3]] : n === 7 ? [["p", 3], ["m", 4]] : [["m", 4], ["m", 4], ...partes(n - 8)]);
  for (const aba of abas) if (EMPILHAR.has(aba.id)) for (const g of aba.grupos ?? []) {
    const cmds = g.cmds ?? [];
    for (let i = 0; i < cmds.length;) {
      if (!simples(cmds[i])) { i++; continue; }
      let j = i; while (j < cmds.length && simples(cmds[j])) j++;
      let k = i;
      for (const [t, q] of partes(j - i)) { for (let m = 0; m < q; m++) cmds[k + m].tam = t === "m" ? "medio" : "pequeno"; k += q; }
      i = j;
    }
  }
  return abas;
}
