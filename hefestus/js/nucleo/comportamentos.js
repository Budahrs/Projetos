// Comportamentos prontos: ligam um gatilho a um alvo do jeito que sistemas profissionais
// fazem (menu suspenso, menu ao passar o mouse, dica, gaveta, acordeão, abas, modal).
// Cada um vira UM comando: eventos no gatilho + como o alvo abre e fecha.

export const CATEGORIAS_COMPORTAMENTOS = [
  {id:'navegacao',nome:'Navegação e menus',itens:['menuClique','menuHover','gaveta']},
  {id:'conteudo',nome:'Conteúdo e organização',itens:['acordeao','abas']},
  {id:'ajuda',nome:'Ajuda e dicas',itens:['dica']},
  {id:'janelas',nome:'Janelas e sobreposições',itens:['modal']},
];
export const COMPORTAMENTOS = {
  menuClique: {
    nome: "Menu suspenso", desc: "Clique abre e fecha; fecha ao clicar fora, com Esc ou ao escolher um item; setas navegam",
    eventos: [["onClick", "alternar", "abre_menu"]],
    abertura: { iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "deslizar", fundoEscuro: false },
    papel: "menu",
  },
  menuHover: {
    nome: "Menu ao passar o mouse", desc: "Abre ao passar o mouse, espera um instante para você chegar nele e fecha ao sair",
    eventos: [["onHover", "abrir", "passou_mouse"], ["onLeave", "fechar", "saiu_mouse"]],
    abertura: { iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "aparecer", fundoEscuro: false },
    papel: "menu",
  },
  dica: {
    nome: "Dica (tooltip)", desc: "Aparece ao passar o mouse e some ao sair",
    eventos: [["onHover", "abrir", "mostrou_dica"], ["onLeave", "fechar", "escondeu_dica"]],
    abertura: { iniciaFechado: true, fecharFora: false, fecharEsc: true, fecharAoEscolher: false, animacao: "aparecer", fundoEscuro: false },
    papel: "tooltip",
  },
  gaveta: {
    nome: "Gaveta lateral", desc: "Clique abre pela lateral com fundo escurecido; fecha ao clicar fora ou com Esc",
    eventos: [["onClick", "abrir", "abre_gaveta"]],
    abertura: { iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: true, animacao: "lateral", fundoEscuro: true },
    papel: "dialog",
  },
  acordeao: {
    nome: "Acordeão", desc: "Clique mostra e esconde o conteúdo logo abaixo",
    eventos: [["onClick", "alternar", "alternou_secao"]],
    abertura: { iniciaFechado: true, fecharFora: false, fecharEsc: false, fecharAoEscolher: false, animacao: "deslizar", fundoEscuro: false },
    papel: "region",
  },
  modal: {
    nome: "Abrir janela (modal)", desc: "Clique abre a janela com fundo escurecido",
    eventos: [["onClick", "abrir", "abre_janela"]],
    abertura: { iniciaFechado: true, fecharFora: true, fecharEsc: true, fecharAoEscolher: false, animacao: "crescer", fundoEscuro: true },
    papel: "dialog",
  },
  abas: {
    nome: "Abas", desc: "Gatilho: o container das abas. Alvo: o container dos painéis. Cada aba mostra o seu painel, em ordem",
    grupo: true,
  },
};

const limpo = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/**
 * Monta o mapa { id: { caminho: valor } } do comportamento (sem aplicar).
 * `n` é o núcleo (para ler elementos e filhos). Lança Error com mensagem clara.
 */
export function planoComportamento(n, chave, gatilho, alvo) {
  const c = COMPORTAMENTOS[chave];
  if (!c) throw new Error(`comportamento desconhecido: ${chave}`);
  const g = n.elemento(gatilho);
  const a = n.elemento(alvo);
  if (!g) throw new Error("escolha o gatilho (quem o usuário clica ou aponta)");
  if (!a) throw new Error("escolha o alvo (o que abre)");
  if (gatilho === alvo) throw new Error("gatilho e alvo precisam ser elementos diferentes");

  if (c.grupo) {
    const abas = n.filhos(gatilho);
    const paineis = n.filhos(alvo);
    if (!abas.length || !paineis.length) throw new Error("para abas, o gatilho e o alvo precisam ser containers com itens dentro");
    if (abas.length !== paineis.length) throw new Error(`há ${abas.length} abas e ${paineis.length} painéis; precisam ser iguais`);
    const mapa = {};
    abas.forEach((id, i) => {
      const el = n.elemento(id);
      const eventos = (el.eventos ?? []).filter(e => e.tipo !== "onClick");
      eventos.push({ tipo: "onClick", dispara: `aba_${limpo(el.nome)}`, acao: "mostrarSo", alvo: paineis[i] });
      mapa[id] = { eventos, "acessibilidade.role": "tab" };
      if (!el.estados?.ativo?.fundo) mapa[id]["estados.ativo.fundo"] = el.estados?.hover?.fundo || "#2563eb1f";
    });
    paineis.forEach((id, i) => {
      mapa[id] = { "abertura.iniciaFechado": i > 0, "abertura.animacao": "aparecer", "acessibilidade.role": "tabpanel" };
    });
    mapa[gatilho] = { ...(mapa[gatilho] ?? {}), "acessibilidade.role": "tablist" };
    return { mapa, texto: `Abas: ${n.rotulo(gatilho)} troca os painéis de ${n.rotulo(alvo)}` };
  }

  const tipos = new Set(c.eventos.map(([t]) => t));
  const eventos = (g.eventos ?? []).filter(e => !(tipos.has(e.tipo) && (e.alvo === alvo || !e.alvo)));
  for (const [tipo, acao, sufixo] of c.eventos) eventos.push({ tipo, dispara: `${limpo(g.nome)}_${sufixo}`, acao, alvo });
  const valores = Object.fromEntries(Object.entries(c.abertura).map(([k, v]) => [`abertura.${k}`, v]));
  if (a.tipo === "modal" || a.tipo === "toast") valores.iniciaAberto = false;
  if (c.papel && !(a.tipo === "menu" && c.papel === "menu")) valores["acessibilidade.role"] = c.papel;
  return { mapa: { [gatilho]: { eventos }, [alvo]: valores }, texto: `${c.nome}: ${n.rotulo(gatilho)} → ${n.rotulo(alvo)}` };
}
