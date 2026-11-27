// Efeitos de cada ferramenta do servidor MCP (PROC-MCP-001, padroes/PROCEDIMENTOS_IA.md §4).
// Fonte única: o servidor deriva daqui as indicações MCP (readOnlyHint, destructiveHint,
// idempotentHint, openWorldHint), e ferramentas/fichas-mcp.mjs gera docs/ia/mcp/FERRAMENTAS.md.
// Ferramenta nova sem linha aqui falha no teste testes/mcp.test.mjs.
//
// efeito: "leitura"  — não altera nada
//         "documento" — altera o .hefestus indicado (com histórico: Ctrl+Z desfaz no editor)
//         "arquivo"  — grava outro arquivo dentro da pasta de trabalho
//         "fora"     — grava fora da pasta de trabalho (na pasta do Hefestus)
// destrutiva: pode apagar ou sobrescrever o que existia
// idempotente: repetir com os mesmos argumentos não muda mais nada
// confirmar: o cliente deve pedir confirmação à pessoa antes de chamar

const L = { efeito: "leitura", destrutiva: false, idempotente: true, confirmar: false };
const D = { efeito: "documento", destrutiva: false, idempotente: false, confirmar: false };

export const EFEITOS = {
  hefestus_manual: { ...L },
  hefestus_verificar_projeto: { ...L, nota: "Diagnóstico compartilhado e revisão SHA-256; não regrava." },
  hefestus_importar_html_nativo: { ...D, nota: "Exige revisão SHA-256 atual; HTML vira objetos nativos com fonte preservada." },
  hefestus_preparar_reimportacao_html: { ...L, idempotente: false, nota: "Só lê o arquivo; cria token temporário de sessão, limitado a 10 minutos e 32 planos." },
  hefestus_aplicar_reimportacao_html: { ...D, nota: "Token vinculado a arquivo/revisão; conflitos exigem local/fonte. Falhas não salvam." },
  hefestus_listar_projetos: { ...L },
  hefestus_modelos: { ...L },
  hefestus_resumo: { ...L },
  hefestus_ligacoes: { ...L },
  hefestus_construtor_listar: { ...L },
  hefestus_explicar_elemento: { ...L },
  hefestus_planejar_menu: { ...L, nota: "Só recomenda; não altera o documento." },
  hefestus_contexto: { ...L, nota: "Só existe quando a pasta tem hefestus-contexto.json (compatibilidade 0.37)." },

  hefestus_novo_projeto: { efeito: "arquivo", destrutiva: true, idempotente: false, confirmar: false, nota: "Destrutiva só com substituir: true, que sobrescreve um projeto existente." },
  hefestus_exportar_html: { efeito: "arquivo", destrutiva: true, idempotente: true, confirmar: false, nota: "Sobrescreve o .html de saída, que é gerado." },
  hefestus_propor_layout: { efeito: "arquivo", destrutiva: false, idempotente: false, confirmar: false, nota: "Grava uma proposta em propostas/; não aplica no projeto." },
  hefestus_exportar_programa: { efeito: "fora", destrutiva: true, idempotente: true, confirmar: true, nota: "Grava em programas/<nome> dentro da pasta do Hefestus, fora da pasta de trabalho, e sobrescreve uma exportação anterior." },

  hefestus_lote: { ...D, nota: "Tudo ou nada: se um passo falhar, nada é gravado. Os efeitos são os dos passos." },
  hefestus_criar_elemento: { ...D },
  hefestus_alterar_elemento: { ...D, idempotente: true },
  hefestus_remover_elemento: { ...D, destrutiva: true, idempotente: true, nota: "Remove do documento; o histórico permite desfazer no editor." },
  hefestus_ligar_evento: { ...D },
  hefestus_aplicar_paleta: { ...D, idempotente: true },
  hefestus_ligar_comportamento: { ...D },
  hefestus_inserir_modelo: { ...D },
  hefestus_agrupar_em_container: { ...D },
  hefestus_criar_variantes: { ...D },
  hefestus_refinar_elemento: { ...D },
  hefestus_manter_opcao: { ...D, destrutiva: true, nota: "Descarta as variantes não escolhidas." },
  hefestus_construtor_tema: { ...D, idempotente: true },
  hefestus_construtor_criar: { ...D },
  hefestus_construtor_editar: { ...D, idempotente: true },
  hefestus_construtor_adicionar: { ...D },
  hefestus_construtor_remover: { ...D, destrutiva: true, idempotente: true },
  hefestus_importar_svg: { ...D },
  hefestus_combinar_formas: { ...D, destrutiva: true, nota: "Substitui as formas de origem pelo resultado." },
  hefestus_converter_em_vetor: { ...D, idempotente: true, nota: "Conserva o ID do elemento." },
  hefestus_criar_tema: { ...D },
  hefestus_preparar_aplicativo_windows: { ...D },
  hefestus_importar_html: { ...D, nota: "Recria o HTML como artefato isolado; não executa o JS no Designer nem busca nada na rede." },
  hefestus_auditar_interface: { ...D, idempotente: true, nota: "Só lê, a menos que corrigir: true aplique as correções automáticas." },
  hefestus_exportar_artefato: { ...D, nota: "Pode gravar arquivos gerados na pasta do projeto." },
  hefestus_gerar_documentacao: { ...D, nota: "Pode gravar arquivos gerados na pasta do projeto." },
  hefestus_colocar_no_container: { ...D },
  hefestus_organizar: { ...D },
};

/** Indicações MCP derivadas dos efeitos. Nenhuma ferramenta conversa com serviços externos. */
export function anotacoes(nome) {
  const e = EFEITOS[nome];
  if (!e) throw new Error(`Ferramenta sem efeitos declarados em ferramentas/efeitosMcp.mjs: ${nome}`);
  return { readOnlyHint: e.efeito === "leitura", destructiveHint: e.destrutiva, idempotentHint: e.idempotente, openWorldHint: false };
}
