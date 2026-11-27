import { ICONES_HEPHAESTUS } from './iconesHephaestusCatalogo.js';
const ALIASES = {"bigorna": "logo", "novo": "novo-arquivo", "telaCheia": "tela-cheia", "contaGotas": "conta-gotas", "nos": "selecao-direta", "caixa": "retangulo", "boolUnir": "unir", "boolSubtrair": "subtrair", "boolIntersecao": "intersecao", "boolExcluir": "excluir-sobreposicao", "frente": "trazer-frente", "tras": "enviar-tras", "distH": "distribuir-h", "distV": "distribuir-v", "preencher": "preenchimento", "raio": "ao-clicar", "play": "executar", "etiqueta": "variavel", "topologia": "se-entao", "biblioteca": "componente", "olho": "visivel", "olhoFechado": "oculto", "travar": "bloqueado", "regua": "reguas", "ima": "ajustar-grade", "relogio": "historico", "link": "vincular", "pincel": "copiar-estilo", "mais": "inserir-no", "documento": "anotacao", "codigo": "codigo", "setaBaixo": "seta-baixo", "setaCima": "seta-cima", "check": "sucesso", "modelo": "componente"};
const ITENS = new Map(ICONES_HEPHAESTUS.GROUPS.flatMap(g=>g.items.map(i=>[i[0],i])));
export function iconeHephaestus(nome,tam=20,tema='dark') {
 const item=ITENS.get(ALIASES[nome]||nome);if(!item)return null;
 return ICONES_HEPHAESTUS.toSVG(item[2],{size:tam,currentColor:true,theme:tema}).replace('<svg ','<svg class="ic hp-icon" aria-hidden="true" focusable="false" ');
}
export { ITENS as ICONES_HP };
