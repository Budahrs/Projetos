// Atualiza o modelo do menu a partir da mesma definição usada pelo editor (inclui ícones, tamanho, atalho e submenus).
// Uso: node tools/gerar-menu-hefestus.mjs
import { writeFileSync } from 'node:fs';
import { abasBase } from '../js/ui/ribbon.js';
import { Nucleo } from '../js/nucleo/nucleo.js';
const n = new Nucleo(); n.novo(false);
const id = n.criar('botao', 0, 0); n.selecionar(id); // com um botão selecionado a aba contextual "Formatar" também entra
const app = { n, ui: {}, modelosUsuario: () => [], area: {}, setFerramenta() {}, alternarUI() {} };
const sub = c => {
  if (!c.flyout) return undefined;
  try {
    const r = c.flyout();
    const itens = (Array.isArray(r) ? r : []).filter(x => x && x.rotulo && !x.sep).map(x => ({ nome: x.rotulo, icone: x.icone }));
    return itens.length ? itens.slice(0, 14) : undefined;
  } catch { return undefined; }
};
const spec = abasBase(app).map(a => ({
  id: a.id, nome: a.rotulo,
  grupos: (a.grupos ?? []).map(g => ({
    nome: g.nome,
    comandos: (g.cmds ?? []).filter(c => c.rotulo).map(c => {
      const s = sub(c);
      return { id: c.id, nome: c.rotulo, icone: c.icone || g.icone || 'estrela', tam: c.tam === 'grande' ? 'grande' : 'pequeno', ...(c.atalho ? { atalho: c.atalho } : {}), ...(c.flyout ? { menu: true } : {}), ...(s ? { sub: s } : {}) };
    }),
  })).filter(g => g.comandos.length),
}));
writeFileSync(new URL('../js/nucleo/hefestusMenuSpec.js', import.meta.url), '// Estrutura extraída de abasBase em ui/ribbon.js (node tools/gerar-menu-hefestus.mjs).\nexport const HEFESTUS_MENU_SPEC = ' + JSON.stringify(spec, null, 2) + ';\n');
console.log(`${spec.length} abas atualizadas, ${spec.reduce((t, a) => t + a.grupos.reduce((u, g) => u + g.comandos.length, 0), 0)} comandos.`);
