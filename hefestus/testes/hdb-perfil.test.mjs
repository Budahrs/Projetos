import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validarPerfil, preferenciasDoPerfil } from '../js/shell/perfil.js';

const ler = rel => JSON.parse(readFileSync(new URL('../' + rel, import.meta.url), 'utf8'));
test('perfil preservado é válido e inicializa a área declarada', () => {
  const perfil = ler('perfis/l-seed.perfil.json');
  assert.deepEqual(validarPerfil(perfil, ler('perfis/perfil.schema.json')), []);
  assert.equal(preferenciasDoPerfil(perfil).areaAtiva, perfil.areaInicial);
});
