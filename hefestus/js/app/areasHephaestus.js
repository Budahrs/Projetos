// Áreas do Hephaestus sobre o App Shell (#43, fase S1): as abas e os padrões vêm do perfil;
// aqui fica só o que é do editor (apelidos da área de código, preferências do Visual Script).
// Comportamento idêntico ao anterior: testes/areas-shell.test.mjs compara com a versão original.
import {normalizarVisaoCodigo} from './representacoesCodigo.js';
import {criarAreas} from '../shell/areas.js';
import {PERFIL_HEFESTUS} from '../shell/perfilHefestus.js';

const SCRIPT = "visual-script";
const ABAS_DESIGNER = PERFIL_HEFESTUS.areas.find(a => a.id === "designer").abas;
const ABAS_SCRIPT = PERFIL_HEFESTUS.areas.find(a => a.id === SCRIPT).abas;

const areas = criarAreas(PERFIL_HEFESTUS, {
  marcador: "hephaestusLayout",
  apelidos: {codigo: SCRIPT, code: SCRIPT, visualscript: SCRIPT, forja: SCRIPT, web: SCRIPT},
  // Padrões que o editor já usava. "ambar" é decisão anterior de design e fica como está (cai no tema do sistema).
  iniciais: {hibrido: false, modo: "designer", qatAbaixo: false, temaUI: "ambar", ribbonRecolhido: false, estiloMenu: "faixa",
    inspetorFixo: true, vsPainelFechado: true, vsAba: "depurador", vsMobile: "nao", barraFerr: false},
  aoIniciar: ui => { ui.codigoVisao = normalizarVisaoCodigo(ui.codigoVisao); },
  aoTrocar: (ui, area) => {
    const script = area === SCRIPT;
    ui.hibrido = script; ui.modo = "designer";
    ui.flyout = null; ui.grupoAberto = null;
    if (script) { ui.vsGrafo ??= "designer-objetos"; ui.vsPainelFechado ??= true; }
  },
});

export function iniciarAreas(ui) { return areas.iniciarAreas(ui); }
export function trocarArea(ui, area) { return areas.trocarArea(ui, area); }
export { ABAS_DESIGNER, ABAS_SCRIPT };
