// Índice derivado da Bíblia/GDD e referências solicitadas; estados não equivalem a homologação.
export const ENGENHARIA={
  "id": "hefestus.engenharia-integrada",
  "aliases": [
    "Bíblia",
    "GDD",
    "Engenharia Integrada"
  ],
  "padrao": "2.0.0",
  "biblia": "2.4",
  "produto": "2.1.0",
  "commitBase": "b130843db46aa5a22831fbf19eaff5189ac5f263",
  "requisitos": [
    {
      "id": "HEF-001",
      "titulo": "Preservar projetos `.hefestus` e seus IDs",
      "etapa": "M0/M3",
      "aceite": "Corpus migrado e reaberto",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-002",
      "titulo": "Núcleo sem dependência do DOM",
      "etapa": "M2",
      "aceite": "Regra de importação e teste sem navegador",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-003",
      "titulo": "Mesma proteção por UI, CLI e MCP",
      "etapa": "M2",
      "aceite": "Contratos de edição equivalentes",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-004",
      "titulo": "Blocos e grafo compartilham lógica",
      "etapa": "M3/M5",
      "aceite": "Troca de visão sem alteração semântica",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-005",
      "titulo": "Tipos e erros explícitos",
      "etapa": "M3/M4",
      "aceite": "Casos válidos e inválidos",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-006",
      "titulo": "Cancelamento e saída tardia tratados",
      "etapa": "M4",
      "aceite": "ANC-04",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-007",
      "titulo": "Comportamento em lote transacional",
      "etapa": "M5",
      "aceite": "Falha parcial simulada sem edição parcial",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-008",
      "titulo": "Exportação executa motor real",
      "etapa": "M6",
      "aceite": "ANC-05",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-009",
      "titulo": "Recursos e dependências fixados",
      "etapa": "M6",
      "aceite": "Manifesto e verificação de pacote",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-010",
      "titulo": "Instalador e associação testados",
      "etapa": "M6/M7",
      "aceite": "Ensaio Windows limpo",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-011",
      "titulo": "Biblioteca com origem e versão",
      "etapa": "M1/M4",
      "aceite": "Manifesto e auditoria de referência",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-012",
      "titulo": "Bíblia distingue atual e proposto",
      "etapa": "M1",
      "aceite": "Verificação documental e revisão",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-013",
      "titulo": "Gerar estrutura padrão ao criar",
      "etapa": "M6/M8",
      "aceite": "Novo projeto completo e reaberto",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-014",
      "titulo": "Programa gerado com capacidade especializada independente",
      "etapa": "M7",
      "aceite": "Fluxos, integridade e distribuição homologados; cenário anterior PDF preservado como candidato",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-015",
      "titulo": "Segundo programa gerado com dependências seletivas",
      "etapa": "M8",
      "aceite": "Relatório de piloto e regressão dos consumidores",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-016",
      "titulo": "Otimização guiada por medição",
      "etapa": "M9",
      "aceite": "Benchmark reproduzido e comparação",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-017",
      "titulo": "Bíblia/GDD indexam o processo inteiro",
      "etapa": "M1/M5",
      "aceite": "As duas buscas chegam à mesma entrada, sem alterar IDs técnicos",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-018",
      "titulo": "Validar estrutura e destino durante a edição",
      "etapa": "M2/M3",
      "aceite": "Diagnóstico na revisão atual, ligado ao alvo",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-019",
      "titulo": "Preservar conteúdo autoral ao regenerar documentação",
      "etapa": "M1/M6",
      "aceite": "Regeneração conserva decisões e identifica revisão",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-020",
      "titulo": "Catálogo pesquisa sem carregar todos os motores",
      "etapa": "M4/M8",
      "aceite": "Instrumentação de importações e benchmark",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-021",
      "titulo": "Preferir núcleo mínimo à ferramenta completa",
      "etapa": "M1/M4/M8",
      "aceite": "Ficha comparativa, dependências e contrato",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-022",
      "titulo": "Resolver e fixar dependências transitivas e recursos",
      "etapa": "M4/M6",
      "aceite": "Instalação limpa sem dependências ocultas",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-023",
      "titulo": "Compartilhar semântica entre prévia e exportação",
      "etapa": "M4/M6",
      "aceite": "Mesmo corpus e diferenças explicitadas por destino",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-024",
      "titulo": "Desacoplar salvar de build/documentação pesada",
      "etapa": "M2/M6",
      "aceite": "Salvamento e reabertura sem disparar build integral",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-025",
      "titulo": "Invalidar evidências afetadas por mudanças",
      "etapa": "M1/M6",
      "aceite": "Mudança relevante marca ensaios antigos como históricos",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-026",
      "titulo": "Atualizar e reverter núcleo sem alterar consumidores silenciosamente",
      "etapa": "M4/M8",
      "aceite": "Lock, patches e retorno ensaiado",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-027",
      "titulo": "Separar instalador do editor e do programa gerado",
      "etapa": "M6",
      "aceite": "Manifestos e artefatos distintos",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-028",
      "titulo": "Medir leveza sem comprometer correção",
      "etapa": "M4/M8",
      "aceite": "Comparação repetível de bytes, carga, memória e corpus",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-029",
      "titulo": "Registrar divergências PC/GitHub/ZIP",
      "etapa": "M0",
      "aceite": "Inventário com revisão/hash e decisão de baseline",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-030",
      "titulo": "Conferir aquisição, ativação e remoção de pacotes",
      "etapa": "M4/M8",
      "aceite": "Falha/cancelamento sem pacote parcial ativo; referências preservadas",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-031",
      "titulo": "Reconciliar snapshots de PCs sem escolher por data/nome",
      "etapa": "M0/M8",
      "aceite": "Integridade, conflitos e retorno registrados",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-032",
      "titulo": "Plano declarativo distingue desenvolvimento e usuário final",
      "etapa": "M1/M6",
      "aceite": "Contratos separados e instalação sem SDK indevido",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-033",
      "titulo": "Instalação repetível e falha parcial tratada",
      "etapa": "M6",
      "aceite": "Ensaios de repetição, atualização e recuperação",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-034",
      "titulo": "Mudança possui rota entre requisito, manual, código e verificação",
      "etapa": "M1/M2",
      "aceite": "Amostra de mudanças com vínculos completos",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-035",
      "titulo": "Score distingue heurística, fonte externa e medição",
      "etapa": "M9",
      "aceite": "Política/corpus fixados e ausência de ganhos inventados",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-036",
      "titulo": "Autohospedagem preserva bootstrap estável",
      "etapa": "M9",
      "aceite": "Candidata isolada e recuperação ensaiada",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-037",
      "titulo": "Preservar paridade entre superfícies da Forja",
      "etapa": "M0/M5",
      "aceite": "Eventos, menus, peças, código/rascunhos, histórico, documentos, importação/exportação e proteção mapeados",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-038",
      "titulo": "Manual utilizável por IA sem editor instalado",
      "etapa": "M1/M8",
      "aceite": "Piloto arquitetural com artefato real e limites declarados",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-039",
      "titulo": "Perfis de construção Go/Rust/C++ sem impor todas as linguagens",
      "etapa": "M1/M8",
      "aceite": "Toolchain, contrato e evidência por perfil escolhido",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-040",
      "titulo": "Biblioteca de decisões consultável localmente",
      "etapa": "M1",
      "aceite": "Manual/política/versão acessíveis e instruções adaptadas ao ambiente",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-041",
      "titulo": "Score distingue seed heurístico de métricas reais",
      "etapa": "M1/M9",
      "aceite": "Origem, notas/justificativas e medições nulas até execução",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-042",
      "titulo": "Plano, checks e projeção de status têm revisão e cobertura",
      "etapa": "M1/M6",
      "aceite": "Pendência/obsolescência e aceite humano separados",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-043",
      "titulo": "Histórico de conversa alimenta decisões sem executar instruções",
      "etapa": "M1",
      "aceite": "Fonte, classificação e resolução das contradições",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-044",
      "titulo": "Perfis tecnológicos distinguem papel, toolchain, destino e verificação",
      "etapa": "M1/M8",
      "aceite": "17 perfis consultáveis; backend/SDK/homologação avaliados separadamente",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-045",
      "titulo": "Documento comum com autoridade por informação e projeções coerentes",
      "etapa": "M2/M3",
      "aceite": "Mesma edição e revisão por canvas/inspector e superfícies compatíveis",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-046",
      "titulo": "Importar subconjunto declarado de HTML/CSS/SVG como objetos nativos",
      "etapa": "M3/M5",
      "aceite": "Corpus com edição individual, desfazer, salvamento e reabertura",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-047",
      "titulo": "Diagnosticar fidelidade visual, estrutural e comportamental",
      "etapa": "M3/M5",
      "aceite": "Relatório por elemento, sem perda silenciosa",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-048",
      "titulo": "Reimportar com comparação de três versões e IDs persistentes",
      "etapa": "M3/M5",
      "aceite": "Conflitos de edição, remoção e referências resolvidos sem sobrescrita silenciosa",
      "estado": "parcial — ver matriz de evidências"
    },
    {
      "id": "HEF-049",
      "titulo": "Versionar componentes mestres, instâncias e variantes",
      "etapa": "M5/M8",
      "aceite": "Atualização com prévia, overrides preservados e retorno",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-050",
      "titulo": "Isolar prévia e código importado por capacidades",
      "etapa": "M4/M6",
      "aceite": "Negativas de acesso, cancelamento e limites de execução por destino",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-051",
      "titulo": "Rastrear diagnóstico da entrega até objeto/operação/fonte",
      "etapa": "M4/M6",
      "aceite": "Erro no programa gerado localiza origem no snapshot correspondente",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-052",
      "titulo": "Reconstruir incrementalmente com invalidação correta",
      "etapa": "M6/M9",
      "aceite": "Resultado equivalente ao build integral no corpus, com medições",
      "estado": "não avaliado nesta reconstrução"
    },
    {
      "id": "HEF-053",
      "titulo": "Abrir workspace portátil preservando .hefestus",
      "etapa": "M3/M6",
      "aceite": "Recursos e lock verificados em outro ambiente declarado",
      "estado": "não avaliado nesta reconstrução"
    }
  ],
  "referencias": [
    {
      "nome": "Construct 3",
      "url": "https://www.construct.net/en/make-games/manuals/construct-3/scripting/overview",
      "principio": "Combinar eventos e código JS/TS.",
      "direcao": "Código contextual no Visual Script, com portas e IDs estáveis.",
      "estado": "Direção de evolução; compilador TypeScript não incluído."
    },
    {
      "nome": "Node-RED",
      "url": "https://nodered.org/docs/user-guide/handling-errors",
      "principio": "Erros ligados ao nó e tratáveis pelo fluxo.",
      "direcao": "Localizar diagnóstico no objeto/nó; ampliar sucesso, erro e cancelamento.",
      "estado": "Navegação contextual e soma com saída de erro implementadas; propagação universal pendente."
    },
    {
      "nome": "FlutterFlow",
      "url": "https://docs.flutterflow.io/concepts/custom-code/custom-actions/",
      "principio": "Ações personalizadas com entradas e resultado assíncrono.",
      "direcao": "Ações reutilizáveis com contrato de conclusão, erro e cancelamento.",
      "estado": "Direção de evolução; não inclui motor Flutter/Dart."
    },
    {
      "nome": "GDevelop",
      "url": "https://wiki.gdevelop.io/gdevelop5/events/js-code/javascript-in-extensions/",
      "principio": "Integrar código por ações, condições e expressões.",
      "direcao": "Blocos/grafo/código compartilham semântica e dependências seletivas.",
      "estado": "Runtime HTML compartilhado existente; extensão completa pendente."
    }
  ]
};
