import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAreas } from '../js/shell/areas.js';

const perfil = { id: 'fixture', areas: [{ id: 'projetos', abas: ['catalogo','progresso'], abaInicial: 'catalogo' },
  { id: 'memoria', abas: ['fila'], abaInicial: 'fila' }], areaInicial: 'projetos',
  paineis: { esquerda: [], direita: [] }, acessoRapido: [], temaPadrao: 'automatico' };

test('áreas preservam a última aba e respeitam o perfil', () => {
  const a = criarAreas(perfil);
  const ui = a.iniciarAreas({});
  assert.equal(ui.aba, 'catalogo');
  ui.aba = 'progresso'; a.trocarArea(ui, 'memoria');
  assert.equal(ui.aba, 'fila'); a.trocarArea(ui, 'projetos');
  assert.equal(ui.aba, 'progresso');
});
