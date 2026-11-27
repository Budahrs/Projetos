import { CATALOGO } from './catalogo.js';

export const ACOES_BLOCOS = ['', 'abrir', 'fechar', 'alternar', 'mostrarSo'];

/** Valida todo o lote antes de alterá-lo. O núcleo conserva proteção e desfazer. */
export function aplicarComportamentoLote(n, ids, regra, { incluirFilhos = false } = {}) {
  const alvos = [...new Set(incluirFilhos ? n.comDescendentes(ids) : ids)];
  if (!alvos.length) throw Error('Selecione um ou mais elementos.');
  if (!ACOES_BLOCOS.includes(regra.acao || '')) throw Error('Ação visual desconhecida.');
  if (regra.acao && !n.elemento(regra.alvo)) throw Error('Selecione o elemento que receberá a ação.');
  if (!regra.acao && !String(regra.dispara || '').trim()) throw Error('Dê um nome ao sinal ou escolha uma ação visual.');
  const mapa = {};
  for (const id of alvos) {
    const el = n.elemento(id);
    if (!el) throw Error('Elemento não encontrado: ' + id);
    if (!CATALOGO[el.tipo]?.eventos?.includes(regra.tipo)) throw Error(`${el.nome || id} não aceita esse evento. Nenhum comportamento foi adicionado.`);
    mapa[id] = { eventos: [...(el.eventos || []), { tipo: regra.tipo, dispara: String(regra.dispara || '').trim(), acao: regra.acao || '', alvo: regra.acao ? regra.alvo : '', suspenso: regra.suspenso === true }] };
  }
  return n.definirVarios(mapa, `Adicionar comportamento a ${alvos.length} elemento(s)`);
}
