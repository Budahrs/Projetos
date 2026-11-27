# Matriz de requisitos — reconstrução 2.1

28/10/2026. Bíblia Mestra 2.0.0; Bíblia/GDD 2.4. Nenhum requisito é declarado totalmente homologado por esta rodada. “Não avaliado” não significa ausente no código original.

| Requisito | Capacidade | Estado e evidência nesta rodada |
|---|---|---|
| HEF-001 | Preservar projetos `.hefestus` e seus IDs | Parcial — testes/reconstrucao.test.mjs: IDs, histórico, salvar/reabrir; corpus geral não homologado. |
| HEF-002 | Núcleo sem dependência do DOM | Não avaliado; aceite normativo: Regra de importação e teste sem navegador |
| HEF-003 | Mesma proteção por UI, CLI e MCP | Parcial — testes/mcp.test.mjs cobre motor/CLI/MCP; testes/engenharia-mcp.test.mjs cobre novos casos nativos no servidor stdio, revisão de arquivo, conflitos e histórico. testes/engenharia-cli.test.mjs cobre comparação/aplicação por processos CLI e persistência comum. Homologação em cliente externo pendente. |
| HEF-004 | Blocos e grafo compartilham lógica | Parcial — testes/representacoes-codigo.test.mjs cobre o mesmo documento/nós/portas, histórico e runtime nas três representações. |
| HEF-005 | Tipos e erros explícitos | Parcial — Validação de portas/tipos e ui.somarCampos; testes válidos, inválidos e recuperação. Não é sistema completo de tipos. |
| HEF-006 | Cancelamento e saída tardia tratados | Não avaliado; aceite normativo: ANC-04 |
| HEF-007 | Comportamento em lote transacional | Não avaliado; aceite normativo: Falha parcial simulada sem edição parcial |
| HEF-008 | Exportação executa motor real | Não avaliado; aceite normativo: ANC-05 |
| HEF-009 | Recursos e dependências fixados | Não avaliado; aceite normativo: Manifesto e verificação de pacote |
| HEF-010 | Instalador e associação testados | Não avaliado; aceite normativo: Ensaio Windows limpo |
| HEF-011 | Biblioteca com origem e versão | Não avaliado; aceite normativo: Manifesto e auditoria de referência |
| HEF-012 | Bíblia distingue atual e proposto | Parcial — Este documento e matriz separam comprovado, parcial e não avaliado. |
| HEF-013 | Gerar estrutura padrão ao criar | Não avaliado; aceite normativo: Novo projeto completo e reaberto |
| HEF-014 | Programa gerado com capacidade especializada independente | Não avaliado; aceite normativo: Fluxos, integridade e distribuição homologados; cenário anterior PDF preservado como candidato |
| HEF-015 | Segundo programa gerado com dependências seletivas | Não avaliado; aceite normativo: Relatório de piloto e regressão dos consumidores |
| HEF-016 | Otimização guiada por medição | Não avaliado; aceite normativo: Benchmark reproduzido e comparação |
| HEF-017 | Bíblia/GDD indexam o processo inteiro | Parcial — Painel Bíblia/GDD, 53 requisitos indexados; não substitui conteúdo integral da Bíblia. |
| HEF-018 | Validar estrutura e destino durante a edição | Não avaliado; aceite normativo: Diagnóstico na revisão atual, ligado ao alvo |
| HEF-019 | Preservar conteúdo autoral ao regenerar documentação | Não avaliado; aceite normativo: Regeneração conserva decisões e identifica revisão |
| HEF-020 | Catálogo pesquisa sem carregar todos os motores | Não avaliado; aceite normativo: Instrumentação de importações e benchmark |
| HEF-021 | Preferir núcleo mínimo à ferramenta completa | Não avaliado; aceite normativo: Ficha comparativa, dependências e contrato |
| HEF-022 | Resolver e fixar dependências transitivas e recursos | Não avaliado; aceite normativo: Instalação limpa sem dependências ocultas |
| HEF-023 | Compartilhar semântica entre prévia e exportação | Não avaliado; aceite normativo: Mesmo corpus e diferenças explicitadas por destino |
| HEF-024 | Desacoplar salvar de build/documentação pesada | Parcial — Importar e salvar não iniciam build. Documentação automática antiga permanece. |
| HEF-025 | Invalidar evidências afetadas por mudanças | Não avaliado; aceite normativo: Mudança relevante marca ensaios antigos como históricos |
| HEF-026 | Atualizar e reverter núcleo sem alterar consumidores silenciosamente | Não avaliado; aceite normativo: Lock, patches e retorno ensaiado |
| HEF-027 | Separar instalador do editor e do programa gerado | Não avaliado; aceite normativo: Manifestos e artefatos distintos |
| HEF-028 | Medir leveza sem comprometer correção | Não avaliado; aceite normativo: Comparação repetível de bytes, carga, memória e corpus |
| HEF-029 | Registrar divergências PC/GitHub/ZIP | Parcial — quality/baseline-github.json: 438 blobs oficiais conferidos antes das mudanças; snapshot Git preservado e cópias locais antigas removidas depois a pedido do dono. |
| HEF-030 | Conferir aquisição, ativação e remoção de pacotes | Não avaliado; aceite normativo: Falha/cancelamento sem pacote parcial ativo; referências preservadas |
| HEF-031 | Reconciliar snapshots de PCs sem escolher por data/nome | Não avaliado; aceite normativo: Integridade, conflitos e retorno registrados |
| HEF-032 | Plano declarativo distingue desenvolvimento e usuário final | Não avaliado; aceite normativo: Contratos separados e instalação sem SDK indevido |
| HEF-033 | Instalação repetível e falha parcial tratada | Não avaliado; aceite normativo: Ensaios de repetição, atualização e recuperação |
| HEF-034 | Mudança possui rota entre requisito, manual, código e verificação | Parcial — ADR-021, matriz e testes/reconstrucao.test.mjs rastreiam esta mudança; não todo histórico. |
| HEF-035 | Score distingue heurística, fonte externa e medição | Não avaliado; aceite normativo: Política/corpus fixados e ausência de ganhos inventados |
| HEF-036 | Autohospedagem preserva bootstrap estável | Não avaliado; aceite normativo: Candidata isolada e recuperação ensaiada |
| HEF-037 | Preservar paridade entre superfícies da Forja | Não avaliado; aceite normativo: Eventos, menus, peças, código/rascunhos, histórico, documentos, importação/exportação e proteção mapeados |
| HEF-038 | Manual utilizável por IA sem editor instalado | Não avaliado; aceite normativo: Piloto arquitetural com artefato real e limites declarados |
| HEF-039 | Perfis de construção Go/Rust/C++ sem impor todas as linguagens | Não avaliado; aceite normativo: Toolchain, contrato e evidência por perfil escolhido |
| HEF-040 | Biblioteca de decisões consultável localmente | Não avaliado; aceite normativo: Manual/política/versão acessíveis e instruções adaptadas ao ambiente |
| HEF-041 | Score distingue seed heurístico de métricas reais | Não avaliado; aceite normativo: Origem, notas/justificativas e medições nulas até execução |
| HEF-042 | Plano, checks e projeção de status têm revisão e cobertura | Parcial — Revisão esperada protege comandos/reimportação; invalidação total de evidências pendente. |
| HEF-043 | Histórico de conversa alimenta decisões sem executar instruções | Não avaliado; aceite normativo: Fonte, classificação e resolução das contradições |
| HEF-044 | Perfis tecnológicos distinguem papel, toolchain, destino e verificação | Não avaliado; aceite normativo: 17 perfis consultáveis; backend/SDK/homologação avaliados separadamente |
| HEF-045 | Documento comum com autoridade por informação e projeções coerentes | Parcial — DocumentoAtivo delega ao Nucleo; sem duplicar documento. Migração das demais superfícies pendente. |
| HEF-046 | Importar subconjunto declarado de HTML/CSS/SVG como objetos nativos | Parcial — HTML inline: containers, textos, botões/campos; sem CSS completo/SVG nativo neste parser. |
| HEF-047 | Diagnosticar fidelidade visual, estrutural e comportamental | Parcial — Avisos de estilos, layout e comportamento não convertidos; sem comparação visual por pixels. |
| HEF-048 | Reimportar com comparação de três versões e IDs persistentes | Parcial — Três versões e conflitos local/fonte em UI/CLI/MCP; IDs/tipos preservados, hashes de projeto/fonte na CLI e token de sessão no MCP. Adições/remoções explícitas testadas em testes/reimportacao-estrutural.test.mjs e integrações CLI/MCP; remoção exige escolha e recusa referências remanescentes. Tipo diferente continua recusado. |
| HEF-049 | Versionar componentes mestres, instâncias e variantes | Não avaliado; aceite normativo: Atualização com prévia, overrides preservados e retorno |
| HEF-050 | Isolar prévia e código importado por capacidades | Parcial — Parser não executa código; iframe estático mantém sandbox. Não homologa todas capacidades externas. |
| HEF-051 | Rastrear diagnóstico da entrega até objeto/operação/fonte | Parcial — Diagnósticos de fios incluem grafo/nó/fio. Rastreamento universal de origem pendente. |
| HEF-052 | Reconstruir incrementalmente com invalidação correta | Não avaliado; aceite normativo: Resultado equivalente ao build integral no corpus, com medições |
| HEF-053 | Abrir workspace portátil preservando .hefestus | Não avaliado; aceite normativo: Recursos e lock verificados em outro ambiente declarado |
