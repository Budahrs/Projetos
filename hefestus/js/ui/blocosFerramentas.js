// Blocos da barra de ferramentas (como no Illustrator): cada bloco mostra uma ferramenta e guarda as irmãs
// atrás do clique (◢). As irmãs podem ser ferramentas de verdade (V, H, Z, R, E, L, P, T, B, I) ou comandos
// que já existem na faixa (Editar nós, Combinar formas, Máscara), que passam a ter um botão aqui também.
import { FERRAMENTAS } from "./canvas.js";

export function gruposFerramentas(app) {
  const f = id => FERRAMENTAS.find(x => x?.id === id);
  const cmd = (id, nome, icone, acao, tecla = "") => ({ id, nome, icone, tecla, acao });
  const sel = () => app.n.selecionados();
  return [
    ["Seleção e navegação", [f("selecao"), f("mao"), f("zoom"),
      cmd("c-nos", "Editar nós do vetor", "nos", () => { if (sel().length === 1) app.editarNos(sel()[0]); else app.mensagem?.("Selecione um objeto para editar os nós."); })]],
    ["Formas e desenho", [f("caixa"), f("elipse"), f("linha"), f("caneta"),
      cmd("c-vetorizar", "Converter em vetor", "estrela", () => app.n.converterEmVetor(sel())),
      cmd("c-svg", "Importar SVG", "abrir", () => app.entradaSVG.click())]],
    ["Texto", [f("texto")]],
    ["Controles", [f("botao"),
      cmd("c-campo", "Campo de texto", "campo", () => app.inserir("campo")),
      cmd("c-toggle", "Toggle", "toggle", () => app.inserir("toggle")),
      cmd("c-menu", "Menu", "menu", () => app.inserir("menu"))]],
    ["Combinar e mascarar", [
      cmd("c-unir", "Unir formas", "boolUnir", () => app.combinar("unir")),
      cmd("c-subtrair", "Subtrair formas", "boolSubtrair", () => app.combinar("subtrair")),
      cmd("c-intersectar", "Interseção", "boolInterseccao", () => app.combinar("intersectar")),
      cmd("c-excluir", "Excluir sobreposição", "boolExcluir", () => app.combinar("excluir")),
      cmd("c-mascara", "Criar máscara", "boolInterseccao", () => app.mascara()),
      cmd("c-liberar", "Liberar máscara", "boolExcluir", () => app.liberarMascara())]],
    ["Cores", [f("conta")]],
  ].map(([nome, lista]) => [nome, lista.filter(Boolean)]);
}
