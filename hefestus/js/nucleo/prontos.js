// Faixas prontas (Word, PowerPoint, Office completo) como faixas REAIS do formulário: as abas trocam, os comandos emitem sinais
// e tudo continua editável. Substituem os modelos que eram só desenho.
import { novaFaixa, grupoPadrao, aplicarEstiloFaixa } from "./construtor.js";

const G = (nome, itens, tam) => ({ nome, itens, tam });
const WORD = {
  "Arquivo": [G("Arquivo", ["Novo", "Abrir", "Salvar", "Salvar como", "Imprimir", "Exportar", "Compartilhar", "Fechar"])],
  "Página Inicial": [G("Área de Transferência", ["Colar", "Recortar", "Copiar", "Pincel de formatação"]), G("Fonte", ["Negrito", "Itálico", "Sublinhado", "Cor do texto", "Realçar"], "p"), G("Parágrafo", ["Lista", "Alinhar", "Ordenar", "Recuo"], "p"),
    G("Estilos", ["Normal", "Título 1", "Título 2"]), G("Edição", ["Localizar", "Substituir", "Selecionar"], "p"), G("Voz", ["Ditar", "Suplementos"])],
  "Inserir": [G("Páginas", ["Folha de rosto", "Página em branco", "Quebra de página"]), G("Tabelas", ["Tabela"]), G("Ilustrações", ["Imagens", "Formas", "Ícones", "Gráfico", "Captura de tela"]), G("Links", ["Link", "Indicador"]), G("Comentários", ["Comentário"]), G("Texto", ["Caixa de texto", "Cabeçalho", "Rodapé", "Data e hora"]), G("Símbolos", ["Equação", "Símbolo"])],
  "Desenhar": [G("Ferramentas", ["Selecionar", "Caneta", "Marca-texto", "Borracha"]), G("Converter", ["Tinta em forma", "Tinta em matemática"]), G("Inserir", ["Forma", "Régua"])],
  "Design": [G("Formatação do documento", ["Temas", "Cores", "Fontes", "Efeitos"]), G("Plano de fundo", ["Marca d'água", "Cor da página", "Bordas da página"])],
  "Layout": [G("Configurar página", ["Margens", "Orientação", "Tamanho", "Colunas"]), G("Parágrafo", ["Recuo", "Espaçamento"], "p"), G("Organizar", ["Posição", "Quebra de texto", "Trazer para frente", "Enviar para trás", "Alinhar"])],
  "Revisão": [G("Revisão de texto", ["Ortografia", "Sinônimos", "Contar palavras"]), G("Comentários", ["Novo comentário", "Excluir", "Anterior", "Próximo"]), G("Controle", ["Controlar alterações", "Aceitar", "Rejeitar"]), G("Proteger", ["Restringir edição"])],
  "Exibir": [G("Modos de exibição", ["Layout de impressão", "Modo de leitura", "Layout da web"]), G("Mostrar", ["Régua", "Linhas de grade", "Painel de navegação"]), G("Zoom", ["Zoom", "100%", "Uma página"]), G("Janela", ["Nova janela", "Organizar tudo", "Dividir"])],
  "Ajuda": [G("Ajuda", ["Ajuda", "Suporte", "Comentários", "Mostrar treinamento"])],
};
const PPT = {
  "Arquivo": WORD["Arquivo"],
  "Página Inicial": [G("Área de Transferência", ["Colar", "Recortar", "Copiar", "Pincel"]), G("Slides", ["Novo slide", "Layout", "Redefinir", "Seção"]), G("Fonte", ["Negrito", "Itálico", "Sublinhado", "Cor do texto"], "p"), G("Parágrafo", ["Lista", "Alinhar", "Direção"], "p"),
    G("Desenho", ["Formas", "Organizar", "Estilos rápidos", "Preenchimento", "Contorno", "Efeitos"]), G("Edição", ["Localizar", "Substituir", "Selecionar"], "p")],
  "Inserir": [G("Slides", ["Novo slide"]), G("Tabelas", ["Tabela"]), G("Imagens", ["Imagens", "Captura de tela", "Álbum"]), G("Ilustrações", ["Formas", "Ícones", "Gráfico", "SmartArt"]), G("Links", ["Link", "Ação"]), G("Texto", ["Caixa de texto", "Cabeçalho e rodapé", "WordArt"]), G("Mídia", ["Vídeo", "Áudio", "Gravação de tela"])],
  "Design": [G("Temas", ["Temas", "Variantes"]), G("Personalizar", ["Tamanho do slide", "Formatar plano de fundo"])],
  "Transições": [G("Visualização", ["Visualizar"]), G("Transição para este slide", ["Nenhuma", "Esmaecer", "Empurrar", "Revelar", "Cortar"]), G("Intervalo", ["Som", "Duração", "Avançar slide"])],
  "Animações": [G("Visualização", ["Visualizar"]), G("Animação", ["Entrada", "Ênfase", "Saída", "Trajetória"]), G("Animação avançada", ["Adicionar animação", "Painel de animação", "Disparar"]), G("Intervalo", ["Iniciar", "Duração", "Atraso"])],
  "Apresentação": [G("Iniciar apresentação", ["Do começo", "Do slide atual", "Apresentar online", "Personalizada"]), G("Configurar", ["Configurar", "Ocultar slide", "Ensaiar"]), G("Monitores", ["Monitor", "Modo de exibição do apresentador"])],
  "Revisão": WORD["Revisão"], "Exibir": [G("Modos de exibição", ["Normal", "Classificação de slides", "Anotações", "Leitura"]), G("Mostrar", ["Régua", "Linhas de grade", "Guias"]), G("Zoom", ["Zoom", "Ajustar à janela"]), G("Cor", ["Cor", "Escala de cinza"])], "Ajuda": WORD["Ajuda"],
};
const COMPLETO = { ...WORD, "Inserir": WORD["Inserir"], "Revisão": WORD["Revisão"] };

export const FAIXAS_PRONTAS = {
  faixaWord: { nome: "Faixa estilo Word", tabs: WORD, ativa: "Página Inicial", banda: "#2b579a", estilo: "office" },
  faixaPowerPoint: { nome: "Faixa estilo PowerPoint", tabs: PPT, ativa: "Página Inicial", banda: "#b7472a", estilo: "office" },
  officeCompleto: { nome: "Office completo", tabs: COMPLETO, ativa: "Página Inicial", banda: "#2b579a", estilo: "office" },
};

/** Faixa do formulário pronta para inserir (o chamador define o id e a posição). */
export function faixaPronta(chave, seq) {
  const def = FAIXAS_PRONTAS[chave]; if (!def) return null;
  const f = novaFaixa(seq);
  f.nome = def.nome; f.busca = true; f.comportamento = "fixa"; f.pino = false;
  const sem = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
  f.abas = Object.entries(def.tabs).map(([nome, grupos], i) => ({
    id: `a${i + 1}`, nome, quando: [], corAba: "", grupoAtivo: 0,
    grupos: grupos.map((g, k) => ({ ...grupoPadrao(`g${k + 1}`, g.nome, g.itens.map((r, j) => ({ id: `i${j + 1}`, rotulo: r, icone: "estrela", sinal: `${sem(nome)}_${sem(r)}` }))),
      ...(g.tam === "p" || g.itens.length > 5 ? { tamanho: "pequeno", organizacao: "grade" } : {}) })),
  }));
  f.abaAtiva = Math.max(0, f.abas.findIndex(a => a.nome === def.ativa));
  aplicarEstiloFaixa(f, def.estilo); f.banda = def.banda;
  return f;
}
