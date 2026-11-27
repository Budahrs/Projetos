import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGO_TEMAS, contrasteCores, resolverModoSistema, pacoteTemas, validarTemaCompartilhado } from '../js/nucleo/temasCompartilhados.js';

test('temas compartilhados preservam contraste e escolha do sistema', () => {
  assert.equal(contrasteCores('#000000','#FFFFFF'), 21);
  assert.equal(resolverModoSistema({ altoContraste: true }), 'highContrast');
  assert.deepEqual(validarTemaCompartilhado(CATALOGO_TEMAS.highContrast), []);
  const pacote = pacoteTemas([CATALOGO_TEMAS.highContrast]);
  assert.equal(pacote.formato, 'hefestus.temas');
  assert.notEqual(pacote.temas[0], CATALOGO_TEMAS.highContrast);
});
