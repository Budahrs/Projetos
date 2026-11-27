import { recomendarMenu, auditarMenus } from "./expertiseMenus.js";
// Semente do próprio Hefestus (seed/meta.json): o manifesto das ferramentas que o núcleo oferece a
// outros programas e o catálogo meta (o editor descrito como modelos). Outros programas (Anima Studio,
// 3D Sprite Studio…) consultam isto ANTES de criar algo novo: "o Hefestus já tem essa base?".
// Meta-circular: o Hefestus sincroniza a si mesmo pelo mesmo fluxo que usa para os outros.
import { HEFESTUS_MENU_SPEC } from "./hefestusMenuSpec.js";
import { sementeMeta } from "./grafoModelos.js";
import { validarManifesto, sincronizar } from "./sincronizar.js";
import { auditar, contraste } from "./auditoria.js";
import { gerarHTML } from "./compilador.js";
import { gerarArtefato } from "./artefatos.js";
import { lerSVG } from "./svgImport.js";
import { booleana } from "./vetor.js";
import { aplicarLayouts } from "./layout.js";
import { gerarTamanhos } from "./variantes.js";
import { planoComportamento } from "./comportamentos.js";
import { diferenca } from "./diferenca.js";
import { examinarDocumento } from "./recuperacao.js";
import { classificar } from "./classificador.js";
import { avaliarCondicao } from "./superficies.js";
import { candidatosEquivalencia, ranquear } from "./consolidacao.js";
import { satisfaz } from "./versoes.js";
import { motorMenus } from "./motorMenus.js";
import { migrarMenu } from "./formatoMenus.js";
import { CommandRegistry } from "./comandos.js";
const VERSAO = "2.1.0";

/** Ferramentas do núcleo (runtime web: rodam onde há navegador ou QtWebEngine). */
const FERRAMENTAS = [
  ['prepararHTMLImportado','nucleo/importarHTML.js','(entrada) => artefato','Preserva HTML/CSS/JS em componente isolado e editável, sem executar código durante a importação'],
  ['analisarHTMLImportado','nucleo/importarHTML.js','(html) => estrutura','Identifica título, controles, menus, SVG, eventos e referências externas sem executar o código'],
  ["recomendarMenu", "nucleo/expertiseMenus.js", "(descricao) => plano", "Escolhe o tipo de menu e orienta teclado, estados, overflow e navegação adaptativa"],
  ["auditarMenus", "nucleo/expertiseMenus.js", "(elementos) => problemas", "Audita a estrutura e os contratos dos menus; produz correções reversíveis"],
  ["motorMenus", "nucleo/motorMenus.js", "() => { planejar, instalar, sidebar, instalarSidebar, instalarKeyTips, tecladoBarra, posicionar, corredor }", "Escalonamento de grupos, overflow agrupado e máquina de estados independente para navegação lateral"],
  ["migrarMenu", "nucleo/formatoMenus.js", "(menu) => menuV1", "Valida e migra a definição declarativa de menus sem alterar o original"],
  ["CommandRegistry", "nucleo/comandos.js", "new (contexto) => registro", "IDs estáveis, estado contextual e notificações; histórico delegado ao modelo"],
  ["auditar", "nucleo/auditoria.js", "(elementos, tela) => itens", "Acessibilidade e consistência: contraste, rótulos, estados, eventos soltos, com correções"],
  ["contraste", "nucleo/auditoria.js", "(corA, corB) => razao", "Razão de contraste WCAG entre duas cores"],
  ["gerarHTML", "nucleo/compilador.js", "(doc) => html", "Página HTML responsiva a partir do documento"],
  ["gerarArtefato", "nucleo/artefatos.js", "(doc, tipo) => codigo", "Componente React, Vue, Web Component, tokens CSS, Storybook ou testes Playwright"],
  ["lerSVG", "nucleo/svgImport.js", "(svg) => elementos", "Importa SVG como elementos editáveis"],
  ["booleana", "nucleo/vetor.js", "(contornosA, contornosB, operacao) => contornos", "União, subtração, interseção e exclusão de formas"],
  ["aplicarLayouts", "nucleo/layout.js", "(doc) => doc", "Layout em linha/coluna dos containers"],
  ["gerarTamanhos", "nucleo/variantes.js", "(elemento) => variantes", "Variantes de tamanho de um componente"],
  ["planoComportamento", "nucleo/comportamentos.js", "(nucleo, chave, gatilho, alvo) => plano", "Comportamentos prontos: menu, dica, gaveta, acordeão, abas, modal"],
  ["diferenca", "nucleo/diferenca.js", "(docA, docB) => mudancas", "Diferença entre dois estados do documento"],
  ["examinarDocumento", "nucleo/recuperacao.js", "(doc) => problemas", "Confere a integridade do documento"],
  ["classificar", "nucleo/classificador.js", "(elementos, tela) => propostas", "Reconhece botão, campo, selo, interruptor, cartão, menu e navegação em formas soltas"],
  ["avaliarCondicao", "nucleo/superficies.js", "(expressao, estado) => booleano", "Condição declarativa de superfícies (abas e menus condicionais)"],
  ["candidatosEquivalencia", "nucleo/consolidacao.js", "(entradas, limiar) => pares", "Grau 1 da consolidação: contratos parecidos"],
  ["ranquear", "nucleo/consolidacao.js", "(candidatos, opcoes) => ranking", "Ranking por cobertura, uso, dependências, tamanho e recência"],
  ["satisfaz", "nucleo/versoes.js", "(versao, faixa) => booleano", "Versão semântica dentro da faixa"],
];

/** Manifesto do Hefestus no mesmo formato que ele lê dos outros programas. */
function manifestoDoHefestus(versao = VERSAO) {
  return {
    programa: "hefestus", versao,
    descricao: "Editor visual de interfaces; núcleo em JavaScript puro (ES modules), sem dependências.",
    ferramentas: FERRAMENTAS.map(([id, modulo, assinatura, descricao]) => ({ id, runtime: "web", kind: "js", assinatura, arquivo: `js/${modulo}`, descricao })),
  };
}

/** Catálogo meta: o menu real do editor como modelos (editor → abas → grupos → comandos). */
function catalogoMeta(versao = "1.0.0") {
  return sementeMeta(HEFESTUS_MENU_SPEC, versao);
}

const FUNCOES = { recomendarMenu, auditarMenus, motorMenus, migrarMenu, CommandRegistry, auditar, contraste, gerarHTML, gerarArtefato, lerSVG, booleana, aplicarLayouts, gerarTamanhos, planoComportamento, diferenca, examinarDocumento, classificar, avaliarCondicao, candidatosEquivalencia, ranquear, satisfaz };

/**
 * O Hefestus sincroniza a si mesmo pelo mesmo fluxo dos outros programas. A cópia guardada é o
 * código-fonte da função (cópia de referência: para comparar contratos e mostrar a outros programas).
 */
async function registrarHefestus(armazem, versao = VERSAO) {
  const { manifesto } = validarManifesto(manifestoDoHefestus(versao));
  return sincronizar(armazem, manifesto, it => FUNCOES[it.id]?.toString());
}

/** O conteúdo de seed/meta.json. */
function sementeCompleta() {
  const grafo = catalogoMeta();
  return { formato: "hefestus-semente", versao: VERSAO, manifesto: manifestoDoHefestus(), grafo: grafo.serializar() };
}
export { VERSAO, manifestoDoHefestus, catalogoMeta, registrarHefestus, sementeCompleta };
