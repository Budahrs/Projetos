// Primeiros passos: o roteiro da primeira sessão e o "teste dos 5 minutos".
// Metas (seção 10.1): abrir e ver a tela pronta 0 s · arrastar um botão < 10 s · editar texto e cor < 30 s ·
// ver funcionando < 60 s · salvar como modelo < 2 min · exportar código < 3 min. Total < 5 min sem ajuda.
// O roteiro só observa: marca o passo quando a pessoa faz a ação, nunca faz por ela.

export const PASSOS = [
  { id: "abrir", nome: "Abrir e ver a tela pronta", meta: 0, dica: "A tela já abre pronta para usar." },
  { id: "botao", nome: "Colocar um botão", meta: 10, dica: "Página Inicial › Botão, ou Inserir › Controles." },
  { id: "editar", nome: "Editar o texto e a cor", meta: 30, dica: "Clique duas vezes no texto; a cor fica em Design › Cor." },
  { id: "previa", nome: "Ver funcionando (Prévia)", meta: 60, dica: "Ícone do olho (Prévia) na barra do topo, ou Comportamento › Prévia interativa." },
  { id: "modelo", nome: "Salvar como modelo", meta: 120, dica: "Inserir › Biblioteca › Salvar como modelo (com o elemento selecionado)." },
  { id: "exportar", nome: "Exportar o código", meta: 180, dica: "Arquivo › Baixar HTML ou Componente…" },
];
export const META_TOTAL = 300;

/** Qual passo um texto do histórico (ou uma ação da interface) cumpre. */
export function passoDoEvento(texto) {
  const t = String(texto ?? "").toLowerCase();
  if (/^inserir bot[aã]o|bot[aã]o \d+ inserido|^inserir .*bot[aã]o/.test(t)) return "botao";
  if (/(r[oó]tulo|texto|cor|fundo)/.test(t) && !/^inserir/.test(t)) return "editar";
  if (/^(pr[eé]via|previa)/.test(t)) return "previa";
  if (/(salvar|guardar).*(modelo|biblioteca)|modelo salvo/.test(t)) return "modelo";
  if (/^(baixar|exportar)|export/.test(t)) return "exportar";
  return null;
}

export class RoteiroPrimeirosPassos {
  /** `guardado`: estado anterior (localStorage); `agora`: relógio em ms (testes passam um falso). */
  constructor(guardado = null, agora = () => Date.now()) {
    this.agora = agora;
    this.inicio = guardado?.inicio ?? null;
    this.feitos = { ...(guardado?.feitos ?? {}) };
  }

  comecar() {
    this.inicio = this.agora();
    this.feitos = { abrir: 0 };
    return this;
  }

  get ativo() { return this.inicio !== null && !this.concluido; }
  get concluido() { return PASSOS.every(p => p.id in this.feitos); }

  /** Marca o passo (uma vez só). Devolve true se marcou agora. */
  marcar(id) {
    if (this.inicio === null || id in this.feitos || !PASSOS.some(p => p.id === id)) return false;
    this.feitos[id] = Math.round((this.agora() - this.inicio) / 1000);
    return true;
  }

  /** Observa um texto do histórico/ação e marca o passo correspondente. */
  observar(texto) { const id = passoDoEvento(texto); return id ? this.marcar(id) : false; }

  proximo() { return PASSOS.find(p => !(p.id in this.feitos)) ?? null; }

  relatorio() {
    const passos = PASSOS.map(p => {
      const t = this.feitos[p.id];
      return { ...p, tempo: t ?? null, feito: t !== undefined, dentroDaMeta: t !== undefined && t <= Math.max(p.meta, 1) };
    });
    const total = this.concluido ? Math.max(...Object.values(this.feitos)) : this.inicio === null ? null : Math.round((this.agora() - this.inicio) / 1000);
    return { passos, total, meta: META_TOTAL, aprovado: this.concluido && total <= META_TOTAL };
  }

  guardar() { return { inicio: this.inicio, feitos: this.feitos }; }
}
