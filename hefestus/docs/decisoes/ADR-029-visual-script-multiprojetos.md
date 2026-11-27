# ADR-029 — Visual Script compartilhado entre programas (pesquisa inicial)

Estado: proposta técnica; não implementada; não testada. Escopo: Hefestus, Fábrica de Som, Anima Studio, LAYLA, ANTARES e painéis NOC. Não substituir editores existentes sem auditoria.

## Referências localizadas no GitHub
- https://github.com/jagenjo/litegraph.js — referência para canvas, nós, portas e serialização de grafos.
- https://github.com/Comfy-Org/litegraph.js — referência para interfaces de fluxos de processamento e customização.
- https://github.com/retejs/retejs.org — documentação do ecossistema Rete; estudar arquitetura de plugins antes de adotar.
- https://github.com/namgk/dnr-editor — exemplo de editor de fluxos Node-RED, arquivado; somente referência histórica.

A localização de repositórios não valida licença, segurança, manutenção, compatibilidade ou desempenho. Antes de incorporar código: examinar licença, dependências, atividade e testes.

## Arquitetura proposta
1. Contrato comum de grafo versionado: id, schemaVersion, dominio, nodes, edges, ports, tipos, capacidades requeridas e metadados visuais. Identidades estáveis e migrações explícitas.
2. Catálogo de capacidades por programa: entradas/saídas tipadas, parâmetros, pré-condições, efeitos, erros, cancelamento, permissões, exemplos. Cada programa registra seus nós; nenhuma cópia do motor de execução.
3. Núcleo compartilhável de validação: portas compatíveis, links órfãos, IDs duplicados, ciclos proibidos, nós desconhecidos, recursos indisponíveis. Não corrigir silenciosamente; gerar diagnósticos.
4. Adaptadores separados: editor visual, serialização, executor por domínio, telemetria/progresso. GUI, CLI, API e MCP invocam a mesma operação.
5. Execução com estados aguardando/pronto/executando/concluído/erro/pausado/cancelado/ignorado; logs por nó e limites de recursos.
6. Importação legada somente por adaptadores, com round-trip, diff, rollback e preservação do original.

## Matriz por projeto
| Projeto | Nós de domínio | Prioridade específica |
|---|---|---|
| Hefestus 2.0 | eventos, interface, dados, ações | referências de objetos, tipagem de portas, reimportação sem perda |
| Fábrica de Som 2.0 | áudio, TTS, SVC, efeitos, mixer | buffers e arquivos por referência, execução assíncrona, cache e cancelamento |
| Anima Studio 2.0 | rig, poses, deformação, física, exportação | timeline e avaliação por quadro, cache incremental |
| LAYLA | memória, ferramentas, modelos, autorização | permissões explícitas, privacidade, logs e limites de autonomia |
| ANTARES | provedores, roteamento, modelos, ferramentas | fallback, custo, rate limit e isolamento de credenciais |
| NOC / Axiom | eventos, coleta, transformação, alarmes | tempo real, backpressure, rastreabilidade e conexões seguras |

## Critérios de decisão
- Reutilizar contratos, validação, diagnóstico e componentes visuais; **não** impor um executor único a áudio, animação, IA e monitoramento.
- Não executar scripts importados; nós de efeitos externos exigem autorização por capacidade.
- Suportar grafos grandes com renderização sob demanda, agrupamento, minimapa e zoom.
- O formato atual do Visual Script do Hefestus continua canônico até migração explícita, aprovada e reversível.

## Próximas entregas (sem executar testes agora)
1. Inventariar implementações reais em cada projeto e classificar: implementado, parcial, ausente.
2. Definir JSON Schema de capacidades/grafos e adaptador Hefestus sem alteração de persistência.
3. Criar diagnósticos não destrutivos para vínculos órfãos e portas incompatíveis.
4. Prototipar visualização compartilhada e medir memória/CPU no hardware alvo antes de adotar biblioteca.

## Inventário concreto — rodada 1 (08/11/2026)
Escopo verificado: árvore da branch `fix/hefestus-referencias-reimportacao-2026-11-08`, 986 entradas; arquivos inspecionados diretamente. Os demais projetos podem existir em outros repositórios, branches ou no computador, não verificados nesta rodada.

| Sistema / arquivo | Evidência observada | Estado | Melhoria sugerida |
|---|---|---|---|
| Hefestus `js/nucleo/visualScript.js` | catálogo de nós por categoria, portas tipadas, execução e validação exportada | Implementado no código; comportamento não testado | diagnóstico incremental de portas, referências e permissões por capacidade |
| Hefestus `js/ui/visualScript.js` | editor de nós, inspetor, depurador, prévia; arquivo com ~293 mil caracteres | Implementado no código; integração não testada | separar canvas, inspetor, depurador e persistência em módulos sem mudar contratos |
| Hefestus `js/nucleo/grafoModelos.js` | DAG versionado de modelos, dependências, slots e prevenção de ciclos declarada | Grafo de modelos existente, distinto do Visual Script | reutilizar conceitos de versionamento e diagnóstico; não confundir modelos com nós executáveis |
| BI Desktop `frontend/js/fluxo.js` | calcula fluxo entre nós pela hierarquia; desempate de níveis iguais usa paridade do índice | Fluxo de topologia, não editor de Visual Script confirmado | substituir desempate por orientação explícita de arestas; auditar dependência de `window.classificarHierarquia` |
| Nightreign `animation-flows.js` | máquina de estados de animação com prioridades, fases e transições | Fluxo procedural, não editor visual confirmado | adaptar representação declarativa de estados para visualização futura sem mudar runtime |
| Axiom / NOC | há código e painéis no repositório, mas nenhum editor de nós foi confirmado por esta inspeção | Não verificado | inspecionar módulos de automação, eventos e painéis antes de classificar |
| Fábrica de Som, Anima Studio, LAYLA, ANTARES | implementações próprias não localizadas na árvore desta branch; há apenas referências/documentação pontuais | Não localizado nesta branch; não significa ausente | localizar repositórios, branches ou arquivos originais e auditar separadamente |

### Melhorias priorizadas a partir de evidências
1. **P0 — BI Desktop:** eliminar direção arbitrária em conexões entre equipamentos do mesmo nível; preservar ordem declarada e sinalizar ambiguidades.
2. **P0 — Hefestus:** diagnósticos não destrutivos de referências e portas, preservando IDs, histórico e formato atual.
3. **P1 — Hefestus UI:** decompor o editor monolítico por responsabilidade, com contratos e revisão de impacto.
4. **P1 — Nightreign / Anima:** esquema de estados e transições versionado, sem acoplar animação ao executor de UI.
5. **P1 — Áudio / IA / NOC:** inventariar motores reais antes de propor um adaptador de grafo; execução, permissões e telemetria são específicas por domínio.

Nenhum teste executado. Este inventário é leitura de código e não comprovação de funcionamento em execução.

## Auditoria aprofundada — rodada 2: Hefestus (08/11/2026)
Fonte inspecionada: `hefestus/js/nucleo/visualScript.js` na branch desta ADR. Observações estáticas; não foram executados testes.

### Recursos já presentes
- `validarLigacoesScript`: detecta grafos, nós e fios duplicados, nós/portas ausentes, tipos incompatíveis e múltiplos fios na mesma entrada de dados.
- `validarScript`: verifica referências de elementos, variáveis, eventos personalizados e nós sem fluxo.
- `scriptParaRuntime`: impede a exportação de grafos ativos com ligações estruturalmente inválidas.
- `executarScript`: interrompe execução após mais de 400 passos síncronos e limita recursão de valores a 150 níveis; expõe eventos de depuração.
- `tipoPorta`: tenta inferir portas genéricas por conexões existentes.

### Lacunas e riscos identificados
1. **P0 — Canal de depuração:** `window.parent.postMessage({hefestusVS:d}, "*")` usa destino universal. Revisar modelo de origem/destino e o listener da UI; preferir canal autenticado/escopado e restringir dados sensíveis. Não substituir `"*"` cegamente: previews `srcdoc` com origem opaca exigem desenho específico de handshake.
2. **P0 — Integridade de entrada:** `validarLigacoesScript` pressupõe arrays e objetos bem formados (`g.nos`, `g.ligacoes`, `l.de` etc.). Introduzir pré-validação de formato com erros estruturados, antes de iterar, sem mutar grafos.
3. **P1 — Validação de variáveis:** `validarScript` usa `Set` para IDs e não informa duplicação de IDs de variáveis; adicionar diagnóstico de duplicados e referências inválidas.
4. **P1 — Escopo de grafos desativados:** `scriptParaRuntime` valida apenas grafos ativos; `validarScript` avalia todos. Tornar a diferença explícita na UI (erros de publicação versus avisos de edição).
5. **P1 — Conversões implícitas:** `compativel` aceita texto para elemento e conversões número/lógico; exigir regras declaradas por domínio e advertências de coerção potencialmente ambígua.
6. **P1 — Rastreio de dados:** `rastrearDado` serializa objetos e publica valores para depuração; aplicar tamanho máximo, máscara de segredos, retenção limitada e proteção contra ciclos antes de enviar.
7. **P2 — Desempenho:** validar o custo de `tipoPorta` em grafos grandes; considerar índice de nós/arestas por revisão e cache incremental.
8. **P2 — UX:** expor códigos estáveis de diagnóstico também nos alertas de `validarScript` para navegação, tradução, correção assistida e CLI.

### Proposta de sequência
- Primeiro: contrato `DiagnosticoVS` (codigo, severidade, grafo, no, ligacao, porta, mensagem, sugestao) e pré-validação pura.
- Segundo: inventário de segurança da ponte de depuração e testes escritos sem execução.
- Terceiro: diagnóstico incremental e políticas de conversão por domínio.
- Quarto: protótipos de adaptadores para os outros programas somente após localizar suas implementações.

Não alterar o runtime exportado sem plano de compatibilidade: `executarScript` é incorporado ao HTML compilado via `toString()`.

## Inventário concreto — rodada 3: Axiom e fluxos de animação (08/11/2026)
Arquivos inspecionados diretamente nesta branch. Classificação estática; não houve execução de testes.

| Projeto e arquivo | Evidência | Classificação | Sugestões específicas |
|---|---|---|---|
| Axiom `core-shell/registry.js` | `ToolRegistry` registra fábricas, inicializa ferramentas sob demanda, exige `execute/dispose`; `CommandBus` despacha comandos | **Contrato de capacidades existente**, não editor de nós | derivar nós de descritores de comandos; acrescentar esquemas tipados, permissões, eventos de progresso e cancelamento; manter registro atual |
| Axiom `core-shell/main.js` | registra ferramentas `web-editor`, `components`, `url-import`, `presentation` e comandos `workspace.*`, `web.*`, `url.*` | **Operações reutilizáveis parcialmente catalogadas** | manifest versionado para mapear ação → nó, sem duplicar implementação |
| Axiom `web-studio.js` | editor visual/código HTML com histórico e importação; `cleanWebHtml` remove scripts e atributos de evento | **Editor visual HTML**, não Visual Script confirmado | manter fluxo de importação separado de execução de nós; revisar isolamento de iframes, URLs e sanitização |
| Nightreign `animation-flows.js` | prioridades de estado, ataques por fases, transições, seleção de quadros e cache | **Máquina de estados executável**, não editor de nós | criar adaptador de inspeção de estados, fases e transições; não substituir lógica do jogo por grafo genérico |
| BI Desktop `frontend/js/fluxo.js` | direção de arestas por nível e desempate por índice | **Topologia de rede**, não Visual Script | preservar direção declarada; apontar arestas ambíguas em diagnóstico |

### Contrato adaptador mínimo proposto (não implementado)
Cada programa pode expor `listarCapacidades()`, `validarOperacao(id,entrada)`, `executarOperacao(id,entrada,contexto)` e `cancelarOperacao(execucaoId)` quando houver suporte. O Visual Script usa o catálogo, sem chamar diretamente funções internas da interface. Para operações síncronas, cancelamento pode ser declarado como não suportado; nunca simular cancelamento.

### Próximas auditorias
- Localizar repositórios e branches dos motores de áudio, animação, LAYLA e ANTARES; não marcar como ausentes sem examinar seus arquivos.
- Verificar se Axiom possui pontos de entrada de eventos e operações observáveis adequados para adaptação.
- Avaliar separadamente segurança do editor HTML e segurança do executor Visual Script; são problemas distintos.

## Inventário concreto — rodada 4: busca entre branches (08/11/2026)
**Correção importante do inventário:** a ausência de Fábrica de Som e LAYLA na árvore da branch de Hefestus não indica ausência no repositório. A busca por branches revelou implementações reais no mesmo repositório `rsampietro-code/programas`.

| Projeto | Branch e arquivo verificados | Estado confirmado pelo código | Sugestão específica |
|---|---|---|---|
| Fábrica de Som | `feat/fabrica-som-0.18-motores-2026-11-02`: `fabrica-de-som/grafo_motores.py`, `grafo_audio.py`, `web/grafo-editor.js` | **Grafo de áudio e editor de nós existentes**; motores reaproveitados, pré-verificação de vozes/motores e cache por nó | extrair catálogo tipado, limites de recursos e telemetria; auditar invalidação do cache e cancelamento |
| LAYLA | `claude/layla-celular-0.12`: `layla/layla/workflows.py` | **DAG tipado executável existente**; quatro tipos de nó (texto, nota, memória, voz), versão 1.0, até 32 nós, rejeita ciclos e verifica tipos | separar efeitos externos de validação, explicitar permissões para memória/voz, adicionar progresso e idempotência |
| ANTARES | `antares/remodelacao-2.0`: diretório `antares/Interface/programa/` e integrações | **Aplicação e integrações localizadas**; editor Visual Script ainda não confirmado | auditar catálogo de provedores e operações antes de propor nós de roteamento |
| Anima Studio | Nenhuma implementação localizada nesta rodada de branches | **Não verificado**, não concluir ausência | procurar por outros nomes, arquivos ou origem externa; pedir localização somente se necessário |

### Decisões de reaproveitamento
- A Fábrica de Som **não precisa de um novo editor genérico**: preservar `web/grafo-editor.js`, `grafo_audio.py` e `grafo_motores.py`. Adaptar contratos e diagnósticos.
- A LAYLA **não precisa de novo executor de DAG**: preservar `workflows.py`; estudar um adaptador de visualização opcional e políticas de autorização.
- Não tratar ANTARES como Visual Script implementado até localizar evidência de grafo/execução visual.
- Não misturar código entre branches nem efetuar merges como consequência desta auditoria.

### Próximas verificações de código
1. `grafo_audio.py`: formato de nós, ciclos, política de falhas, cache e cancelamento.
2. `layla/workflows.py`: validação de entrada malformada, efeitos colaterais, autorização e logs.
3. ANTARES: pontos de entrada e orquestração de provedores, sem inferir existência de editor visual.
4. Anima Studio: busca de fontes em branches e histórico.

## Auditoria de motores — rodada 5 (08/11/2026)
Leitura estática, sem execução de testes ou alteração de executores.

### Fábrica de Som — `feat/fabrica-som-0.18-motores-2026-11-02`
- `fabrica-de-som/grafo_audio.py` define `fabrica-audio-flow` schema 1, catálogo de 11 tipos de nós (`asset`, `gain`, `trim`, `delay`, `mix`, `output`, `fala`, `converter_voz`, `separar`, `limpar`, `normalizar`), portas tipadas e metadados `operation_id`, `execution`, `ui`, `version`.
- Validação limita documento a 256 KiB, 128 nós, 256 conexões; restringe IDs, coordenadas, parâmetros e referências de assets por hash. Preservar estes limites até medição de desempenho.
- `grafo_motores.py` verifica previamente motores/vozes, exige autorização de clonagem para nós relevantes e cria cache por nó considerando versões de motores.
- Melhorias: inventariar invalidação do cache por versão de dependências, políticas de cancelamento por motor, erros estruturados e tempo/consumo por nó. Não repetir o trabalho de validação já existente.

### LAYLA — `claude/layla-celular-0.12`
- `layla/layla/workflows.py`: catálogo de quatro nós, `schema_version:1.0`, DAG tipado, 1–32 nós, ordenação topológica e cancelamento verificado antes de cada operação.
- `execute` chama `store.note`, `store.remember` e `Voice.generate` e registra auditoria após sucesso de cada nó. A interrupção preserva efeitos já concluídos.
- **Risco concreto:** `validate(document)` chama `document.get` e `node.get` antes de verificar que são dicionários; entradas malformadas podem gerar exceções não padronizadas. Adicionar verificação estrutural pura e mensagens de erro estáveis.
- **Risco de efeito parcial:** falha após criação de nota/memória pode deixar operação concluída sem retorno completo; adicionar IDs de execução e marcadores de idempotência, sem apagar dados por padrão.
- **Segurança:** exigir autorização explícita por capacidade para `notes.create`, `memory.remember` e `voice.synthesize`; registrar resultado sem incluir conteúdo sensível em logs.
- Melhorias: eventos de progresso por nó, cancelamento cooperativo durante voz, diagnósticos de entrada e política de repetição por operação.

### Anima Studio — busca adicional
- A árvore da branch de Fábrica de Som contém `nightreign/example-rig.json`, com hierarquia de ossos e keyframes `idle`, `walk`, `attack`, `dodge`; **é um exemplo do Nightreign, não uma implementação comprovada do Anima Studio**.
- Não localizar o código do Anima Studio nesta busca não demonstra ausência do projeto; não atribuir a ele o exemplo do Nightreign.
- Próxima busca: histórico de branches e fontes do editor 2D, incluindo nomes legados, antes de propor adaptador de rig/timeline.

### Contratos compartilháveis — decisão proposta
`diagnosticar(documento)` deve ser puro e não destrutivo; `listarCapacidades()` deriva dos catálogos reais; `executar` permanece por domínio; `cancelar` anuncia suporte efetivo. Cada adaptador preserva limites, versões e permissões originais.
