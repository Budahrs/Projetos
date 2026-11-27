# Arquitetura poliglota do Hephaestus

Cada parte usa uma tecnologia apropriada ao seu contrato e carga. Essa adequação deve ser demonstrada; não presumir que toda função em C++/Rust supera JS ou que Python implica processamento escalar lento. Algoritmo, biblioteca, GPU, plataforma e custo de integração fazem parte da decisão.

## Mapa de responsabilidades

| Módulo | Implementação desta reconstrução | Evolução candidata | Critério para mudar |
|---|---|---|---|
| Designer, Ribbon, painéis e eventos | HTML/CSS/JavaScript | TypeScript na UI e contratos | Ferramentas de build, tipos e regressão completos |
| Documento, comandos, histórico e sincronização | Núcleo JS sem DOM nos casos puros | TS mantendo semântica comum | Equivalência UI/CLI/MCP e serialização v1 |
| Lógica do Visual Script e HTML exportado | Interpretador JavaScript compartilhado | IR tipada e ações de código contextual | Paridade prévia/exportação e rastreabilidade |
| Janela nativa, arquivos e integrações do SO | Host Rust/Tauri presente na fonte | Expandir adaptadores Rust | Compilar e testar em Windows real; capacidades explícitas |
| Geometria pesada, booleanas e rasterização | Motores JS existentes; adaptadores Craft/Rust na fonte | Worker JS primeiro; Rust/WASM ou biblioteca C/C++ quando justificado | Benchmark fim a fim e resultados equivalentes; não compilar tudo só por convenção |
| Conectores de dados e serviços opcionais | Nenhum novo backend incorporado nesta rodada | Node/TS, Go ou C# conforme SDK/destino | Contrato estável, carga I/O/concor­rência, operação e instalação |
| Automação, análise e modelos de IA | Não há novo runtime Python embarcado | Python como ferramenta/serviço isolado | Dependências seletivas, dados e execução reproduzível |
| Android/iOS específicos | Perfis e fontes anteriores preservados, sem nova homologação | Kotlin/Swift quando API nativa exigir | SDK, destino e testes de integração |

A arquitetura Tauri separa processos de WebView e núcleo Rust, conforme [documentação oficial](https://v2.tauri.app/concept/process-model/). [WebAssembly](https://webassembly.org/docs/use-cases/) é uma opção para reutilizar código em aplicação web maior; não foi adicionado um módulo WASM nesta rodada.

## Como decidir

1. Definir entrada, saída, erro, precisão, tamanho dos dados, destino e orçamento.
2. Verificar limites obrigatórios: suporte à plataforma, licenças, disponibilidade offline, toolchain, capacidade e distribuição. Eliminar opções incompatíveis.
3. Medir implementação atual antes de substituí-la. Separar computação, espera I/O, renderização e transporte.
4. Comparar candidatos com mesmos dados, algoritmo, resultados esperados, hardware e versões. Medir aquecimento e execução fria. Registrar p50/p95, CPU, memória máxima, tamanho da entrega, latência IPC e correção.
5. Avaliar manutenção e produtividade com evidência, sem transformar linguagem em nota fixa. Escolher o menor conjunto que satisfaça os limites.

Pesos heurísticos iniciais, ajustáveis por módulo: correção/confiabilidade 30%; plataforma/ecossistema 20%; latência medida 20%; memória/tamanho 10%; desenvolvimento 10%; manutenção/integração 10%. Nota 0–5 por candidato só depois dos limites obrigatórios. Pesos não constituem benchmark nem comprovam velocidade. Nenhuma nota de desempenho foi atribuída nesta rodada.

## Contrato entre módulos

Envelope proposto: versão do contrato, operação, ID de correlação, revisão do documento, entradas tipadas, resultado ou erro estruturado, capacidades, timeout e cancelamento. Respostas antigas não alteram documento novo. Processamento em lote reduz chamadas por ponto; transferência de buffers só quando medir benefício. Domínio é independente do transporte: API JS local, IPC Tauri, WASM ou processo externo são adaptadores.

Contrato novo só estará disponível após testes de operação válida, erro, cancelamento, saída tardia, salvar/reabrir, dependências ausentes e exportação independente. Evitar avaliar texto de código recebido no núcleo e não executar automaticamente arquivos importados.

## Plano de medição — ainda não executado

- Designer com 100, 1.000 e 10.000 objetos: seleção, arraste, zoom, reconstrução e memória.
- Vetores: casos fixos de booleana/curva/simplificação, precisão idêntica e custo de transferência incluído.
- Visual Script: grafos de diferentes tamanhos, rajadas de evento, limite de ciclos e cancelamento.
- Importação/reimportação: número de elementos, diagnósticos, tempo e preservação de IDs/overrides.
- Aplicativo gerado: início frio, tamanho, memória e comportamento sem editor.

Os perfis em configuracao/perfis-linguagens.json registram medicao:null e estado explícito. Não há recomendador automático de linguagem nem ganho percentual inventado. O build de hoje continua o build JS existente; host Rust não foi compilado nesta entrega.
