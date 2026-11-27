import { abrirContextual, fecharContextual } from "./menuContextual.js";
// Menu de botão direito do canvas. Não define comandos novos: escolhe, por contexto, entre os comandos
// que a faixa já tem (mesmo rótulo, atalho, ícone e regra de "desabilitado"), mais os que a pessoa mais usa.

const VETORIZAVEIS = new Set(["forma", "caixa", "container", "botao", "elipse", "campo"]);

const TEXTUAIS = new Set(["texto", "botao", "campo"]);

/**
 * Cenário do clique direito, como a mini-barra do PowerPoint: o que aparece na grade de ícones e na lista
 * depende do que está sob o cursor. Só escolhe comandos que a faixa já tem (por id).
 * @returns {{nome: string, rapidos: string[], secoes: [string, string[]][]}}
 */
function cenarioDoContexto(n, idAlvo) {
  if (!idAlvo) {
    return {
      nome: "tela",
      rapidos: ["colar", "colar-lugar", "sel-tudo", "desf", "refz", "grade", "reguas", "z-ajustar"],
      secoes: [
        ["Inserir rápido", ["ins-botao", "ins-texto", "ins-caixa"]],
        ["Biblioteca", ["ins-bib", "ins-radio"]],
        ["Exibir", ["z-mais", "z-menos", "z-ajustar"]],
      ],
    };
  }
  const el = n.elemento(idAlvo);
  const ids = n.selecionados();
  const tipos = ids.map(i => n.elemento(i)?.tipo);
  const vet = ids.length && ids.every(i => VETORIZAVEIS.has(n.elemento(i)?.tipo));
  if (ids.length >= 2) {
    return {
      nome: "varios",
      rapidos: ["agrupar", "al-esquerda", "al-centroH", "al-direita", "al-topo", "al-centroV", "dist-h", "dist-v"],
      secoes: [
        ["Edição", ["copiar-el", "cortar", "dup", "exc"]],
        ...(vet ? [["Combinar", ["bool-unir", "bool-subtrair", "bool-intersectar", "bool-excluir", "mascara-criar"]]] : []),
        ["Selecionar", ["sel-tipo", "sel-cor", "sel-painel", "sel-inv"]],
        ["Ordem", ["frente", "tras", "trav", "vis"]],
        ["Componente", ["f-reconhecer"]],
      ],
    };
  }
  if (tipos.length && tipos.every(t => TEXTUAIS.has(t)) && tipos[0] !== "botao") {
    return {
      nome: "texto",
      rapidos: ["t-negrito", "t-al-esquerda", "t-al-centro", "t-al-direita", "t-cor", "copiar-el", "cortar", "dup"],
      secoes: [
        ["Texto", ["f-fonte", "f-tam-fonte"]],
        ["Vetor", ["ins-vetorizar"]],
        ["Organizar", ["frente", "tras", "trav", "vis", "exc"]],
      ],
    };
  }
  const secoes = [
    ["Edição", ["colar-lugar", "exc"]],
    ["Organizar", ["agrupar", "desagrupar", "trav", "vis"]],
  ];
  if (vet) {
    const v = ["ins-nos", "ins-vetorizar", "gir-d", "esp-h", "esp-v"];
    if (el?.mascara || el?.eMascara) v.push("mascara-liberar");
    secoes.push(["Vetor", v]);
  }
  secoes.push(["Efeitos", ["ef-vidro", "ef-desf", "ef-nada"]]);
  secoes.push(["Variantes", ["var-tamanhos", "var-estilos", "var-refinar"]]);
  secoes.push(["Componente", ["f-reconhecer", "f-vincular"]]);
  return { nome: "vetor", rapidos: ["copiar-el", "cortar", "colar", "dup", "frente", "tras", "agrupar", "desagrupar"], secoes };
}

/** Compatível com o formato antigo: só as seções da lista. */
function secoesDoContexto(n, idAlvo) { return cenarioDoContexto(n, idAlvo).secoes; }

function abrirMenuCanvas(app,x,y,idAlvo){app.ribbon?.metricaInteracao?.("contexto-canvas");return abrirContextual(app,x,y,idAlvo,cenarioDoContexto(app.n,idAlvo));}
function fecharMenuCanvas(app){return fecharContextual(app);}
export { cenarioDoContexto, secoesDoContexto, abrirMenuCanvas, fecharMenuCanvas };
