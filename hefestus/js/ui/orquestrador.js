// Política central da faixa. Funções puras: nunca alteram o catálogo original.
const PERFIS_FAIXA = {
 completo: { nome: "Completo", abas: [] },
 criacao: { nome: "Criação", abas: ["inicio", "inserir", "design", "organizar"] },
 revisao: { nome: "Revisão", abas: ["inicio", "exibir", "comportamento", "historico", "ajuda"] },
};
function normalizarRotulo(texto) {
 return typeof texto === "string" ? texto.normalize("NFC").replace(/\s+/g, " ").trim() : "";
}
function auditarFaixa(abas, limite = 6) {
 const itens = [];
 for (const aba of abas) {
  if (aba.grupos.length > 7) itens.push({ caminho: aba.rotulo, mensagem: "Muitos grupos; considere separar por tarefa." });
  for (const g of aba.grupos) {
   const caminho = `${aba.rotulo} › ${g.nome}`;
   if ((g.cmds?.length ?? 0) > limite) itens.push({ caminho, mensagem: `${g.cmds.length} comandos; revise a distribuição por tarefa.` });
   const visitar = cmds => { for (const c of cmds ?? []) {
    if (c.rotulo && normalizarRotulo(c.rotulo) !== c.rotulo) itens.push({ caminho, mensagem: `Espaçamento irregular: ${c.rotulo}` });
    if ((c.rotulo?.length ?? 0) > 32) itens.push({ caminho, mensagem: `Rótulo longo: ${c.rotulo}` });
    if (!c.rotulo && !c.titulo) itens.push({ caminho, mensagem: `Comando sem nome: ${c.id}` });
    if (Array.isArray(c.flyout)) visitar(c.flyout);
   }};
   visitar(g.cmds);
  }
 }
 return itens;
}
function organizarFaixa(abas, opcoes = {}) {
 opcoes ??= {};
 const perfil = PERFIS_FAIXA[opcoes.perfil] ?? PERFIS_FAIXA.completo;
 const limite = Number.isFinite(opcoes.limite) ? Math.max(3, Math.min(12, Math.round(opcoes.limite))) : 6;
 const cmd = c => ({ ...c, ...(c.rotulo ? { rotulo: normalizarRotulo(c.rotulo) } : {}),
  ...(Array.isArray(c.flyout) ? { flyout: c.flyout.map(cmd) } : {}) });
 const lista = abas.map(a => ({ ...a, grupos: a.grupos.map((g, i) => {
  const local=opcoes.grupos?.[a.id+"::"+g.nome]??opcoes.abas?.[a.id]??{};
  const limiteGrupo=Math.max(3,Math.min(12,local.limite??limite));
  let cmds = g.cmds?.map(cmd);
  if (opcoes.autoformatar && cmds) cmds = formatarComandos(cmds);
  // Galerias e campos especializados conservam sua própria interação.
  if (opcoes.organizar !== false && cmds?.length > limiteGrupo && cmds.every(c => !c.tipo && !c.flyout && c.cor === undefined)) {
   cmds = [...cmds.slice(0, limiteGrupo - 1), { id: `mais-${a.id}-${i}`, rotulo: `Mais (${cmds.length-limiteGrupo+1})`, titulo: `${cmds.length-limiteGrupo+1} comandos adicionais de ${g.nome}`, icone: g.icone ?? "ferramentas", tam: "pequeno", flyout: cmds.slice(limiteGrupo - 1) }];
  }
  return { ...g, cmds };
 }) }));
 // Perfis priorizam abas sem retirar comandos nem alterar a ordem dentro dos grupos.
 const rank = a => a.id === "arquivo" ? -2 : a.contexto ? -1 : perfil.abas.includes(a.id) ? perfil.abas.indexOf(a.id) : 100;
 return lista.sort((a,b) => rank(a)-rank(b));
}

// Preset explícito: medidas de ícones e pilhas acompanham a classe CSS da faixa.
function padraoRecomendado(opcoes = {}) {
 return { ...opcoes, organizar: true, limite: 6, autoformatar: true };
}
const ROTULOS_CURTOS = {
 "sel-painel": "Painel de seleção", "sel-form": "Mesmo item", "sel-pai": "Selecionar container",
 "arq-salvar-modelo": "Salvar modelo", "arq-exp-modelos": "Exportar modelos",
 "exp-docs": "Documentação", "exp-separado": "Projeto e histórico", "abrir-hist": "Abrir histórico…",
 "ins-imp-icones": "Importar ícones", "agrupar": "Agrupar", "desagrupar": "Desagrupar",
 "var-estilos": "Variar estilos", "var-tamanhos": "Variar tamanhos", "var-refinar": "Refinar",
};
function formatarComandos(cmds = []) {
 let destaque = false;
 return cmds.map(c => {
  // Controles ricos não podem ser convertidos em botões comuns.
  if (c.tipo || c.cor !== undefined) return { ...c };
  const rotulo = ROTULOS_CURTOS[c.id] ?? normalizarRotulo(c.rotulo);
  const grande = c.tam === "grande" && !destaque;
  if (grande) destaque = true;
  return { ...c, rotulo, titulo: c.titulo ?? c.rotulo, tam: grande ? "grande" : "pequeno" };
 });
}
export { PERFIS_FAIXA, normalizarRotulo, auditarFaixa, organizarFaixa, padraoRecomendado, formatarComandos };
