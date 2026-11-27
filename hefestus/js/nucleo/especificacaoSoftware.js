import { documentosGuiaConstrucao } from './guiaConstrucao.js';
/** Especificações derivadas do projeto. Ausência de informação permanece explícita. */
export function especificacaoSoftware(doc, declaracoes = doc?.elementos?.__canvas?.especificacaoSoftware ?? doc?.especificacaoSoftware ?? {}) {
  const elementos = Object.entries(doc?.elementos || {}).filter(([id,e]) => e && !id.startsWith('__')).map(([id,e])=>({...e,id}));
  const comandos = elementos.flatMap(e => (e.eventos || []).map((evento, i) => ({
    id: `${e.id || 'elemento'}:${i}`, elemento: e.id, nome: e.nome || e.rotulo || e.id,
    evento,
  })));
  return {
    formato: 'hefestus.especificacao-software', versao: 1,
    produto: { nome: doc?.elementos?.__canvas?.nome || doc?.nome || 'Programa', objetivo: 'A definir pelo autor.', publico: 'A definir pelo autor.', ...declaracoes.produto },
    requisitos: declaracoes.requisitos || [],
    restricoes: declaracoes.restricoes || [],
    comandos,
    dados: { persistencia: 'A confirmar conforme o motor do programa.', ...declaracoes.dados },
    verificacao: { estado: 'Não executada por este gerador.', ...declaracoes.verificacao },
  };
}

/** Arquivos legíveis e inventário rastreável, sem tratar sinais como funções implementadas. */
export function documentosSoftware(doc, declaracoes = doc?.elementos?.__canvas?.especificacaoSoftware ?? doc?.especificacaoSoftware ?? {}) {
  const s = especificacaoSoftware(doc, declaracoes);
  const titulo = String(s.produto.nome).replace(/[\r\n]/g, ' ');
  const json = v => JSON.stringify(v, null, 2) + '\n';
  const lista = itens => itens.length ? itens.map(v => '- ' + (typeof v === 'string' ? v : JSON.stringify(v))).join('\n') : 'A definir pelo autor.';
  return {
    ...documentosGuiaConstrucao(doc),
    'documentos/README.md': `# ${titulo} — documentação\n\nPRD: objetivos e público. SRS: requisitos e critérios de aceite. SAD: arquitetura. Dados: persistência. API: contratos dos eventos. QA: verificações. Manual: uso. Decisões: justificativas técnicas.\n\nOs inventários são extraídos do projeto atual. Campos não declarados permanecem pendentes. Gerar estes arquivos não executa testes nem implementa integrações.\n`,
    'documentos/01-produto-PRD.md': `# ${titulo} — PRD\n\n## Objetivo\n\n${s.produto.objetivo}\n\n## Público\n\n${s.produto.publico}\n\n## Escopo e critérios de sucesso\n\n${lista(s.requisitos)}\n`,
    'documentos/02-requisitos-SRS.md': `# Requisitos\n\n## Funcionais declarados\n\n${lista(s.requisitos)}\n\n## Restrições e requisitos não funcionais\n\n${lista(s.restricoes)}\n\n## Rastreabilidade\n\nConsulte inventario-comandos.json para os eventos existentes. Um evento visual não comprova que seu motor esteja implementado.\n`,
    'documentos/03-arquitetura-SAD.md': '# Arquitetura\n\nInterface declarativa → compilador HTML/CSS → runtime de eventos → ferramentas e motores conectados.\n\nO arquivo de projeto conserva a interface editável e seu histórico. A exportação de programa acrescenta a aplicação Tauri e os contratos das ligações. Dependências externas devem ser distribuídas ou declaradas separadamente.\n\nConsulte arquitetura.txt, ferramentas/ e LIGACOES.md quando presentes.\n',
    'documentos/04-modelo-dados.md': `# Dados\n\n${s.dados.persistencia}\n\nA interface usa elementos identificados, relações de grupo e eventos. Tabelas de negócio, relacionamentos e políticas de retenção precisam ser declarados pelo autor; não são inferidos dos controles visuais.\n`,
    'documentos/05-contratos-API.md': '# Contratos\n\nOs eventos visuais estão em inventario-comandos.json. O runtime pode emitir hefestus:sinal. O consumidor deve declarar entrada, saída, erros e efeitos de cada operação.\n\nNão há endpoints HTTP inferidos automaticamente. OpenAPI só se aplica quando houver uma API HTTP declarada.\n',
    'documentos/06-plano-testes-QA.md': `# Verificação\n\nEstado: ${s.verificacao.estado}\n\n## Casos a executar\n\n- Criar, salvar e reabrir sem perder interface ou comportamentos.\n- Acionar cada comando e conferir resultado, erros e cancelamento.\n- Testar redimensionamento, teclado e acessibilidade.\n- Validar instalação e execução no ambiente suportado.\n\nRegistre versão, ambiente, resultado e evidência. Esta lista é um plano, não um relatório de aprovação.\n`,
    'documentos/07-manual-usuario.md': '# Manual do usuário\n\nAbra o projeto no Hefestus para editar aparência no Designer e construção/comportamentos na Forja. Salve o arquivo .hefestus para continuar o trabalho.\n\nO fluxo específico do programa e as instruções de suas ferramentas precisam ser descritos pelo autor.\n',
    'documentos/08-decisoes-ADR.md': '# Decisões de arquitetura\n\nPara cada decisão, registre: contexto, alternativas, escolha, consequências e validação. Preserve decisões anteriores e indique quais foram substituídas.\n',
    'documentos/especificacao.json': json(s),
    'documentos/inventario-comandos.json': json(s.comandos),
  };
}
