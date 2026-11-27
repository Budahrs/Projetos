# Arquitetura e contratos da reconstrução

## Organização

- js/nucleo: documento, transações, memória autoral, vetores, sincronização e runtime. htmlNativo.js e preferenciasUI.js são funções puras, sem DOM.
- js/aplicacao/documentoAtivo.js: fachada fina sobre o mesmo Nucleo. Não mantém cópia paralela do documento nem do histórico.
- js/ui: apresentação e adaptadores. Importação, seleção, diagnóstico e Ribbon delegam ao núcleo/fachada.
- ferramentas/engenharia.mjs: CLI dos casos de uso nativos. O MCP em ferramentas/hefestus-mcp.mjs inclui ferramentas/engenhariaMcp.mjs para diagnóstico, importação e reimportação nativos.
- src-tauri: host nativo original, dependente da toolchain; não compilado nesta entrega.
- exemplos/engenharia: fonte HTML, projeto autoral e HTML independente da calculadora.
- quality: baseline fixa e evidências; docs: normas, decisão, limites e rastreabilidade.

## Revisão e transação

Nucleo.revisao avança em emissão de documento/novo/histórico/recuperação. comando aceita revisaoEsperada opcional e rejeita REVISAO_OBSOLETA antes da mutação. Os chamadores antigos sem esse campo continuam válidos. Falha no comando restaura documento, memória e histórico. Planos de reimportação são dados internos de sessão; não são uma API remota confiável.

## HTML nativo v1

analisarHTMLNativo recebe HTML (até 2 MB), nome, largura/altura (80–4000). Reconhece containers, textos, botão, input e textarea parcial, estilos inline e coordenadas fixas. Identidade: data-hefestus-id, id ou índice estável somente enquanto estrutura não muda. Use IDs explícitos para reimportar. A fonte fica em importacaoNativa.fonte da raiz, com base e mapa; filhos recebem origemHTML. Não executa scripts, não busca recursos externos nem inventa lógica a partir de handlers. Limites/estilos descartados viram avisos. Layout de fluxo é aproximado e declarado.

Importação é um comando desfazível e a sincronização existente cria os nós do Designer. A reimportação compara base anterior, nova fonte e valor atual por propriedade. Mudança só local é mantida; mudança só da fonte é aplicada; conflito exige local/fonte. IDs comuns são preservados; tipos comuns diferentes continuam recusados. Adições/remoções usam o contrato estrutural abaixo. A resolução atualiza fonte/base e permanece desfazível.

## Grafo e execução

validarLigacoesScript detecta IDs presentes duplicados, nós ausentes, portas inexistentes/configurações, tipos incompatíveis e múltiplos fios em entrada de dados. Fios legados sem ID continuam aceitos. Apenas grafos ativos passam ao runtime; fios de nós desativados são excluídos. SCRIPT_INVALIDO impede gerar runtime inválido, sem impedir salvar para corrigir depois.

ui.somarCampos usa o mesmo interpretador na prévia e no HTML exportado. Saídas: exec, erroExec, resultado e erro. Aceita decimal com vírgula ou ponto; rejeita vazio, texto parcial, infinito e overflow. Não substitui regras de outras ferramentas matemáticas. HTML funcional inclui o runtime; exportações React/Vue/C# não ganham paridade completa por esta mudança.

## Compatibilidade e retorno

Formato .hefestus v1 conservado. DocumentoAtivo rejeita formato futuro antes de abrir; os leitores antigos permanecem para compatibilidade. Sem migração automática para ZIP. As instalações antigas foram removidas posteriormente a pedido do dono. Para retornar ao editor anterior, use o snapshot do commit local 5e3b5f6; preserve seus projetos novos antes de trocar revisões.

## Representações de Código

js/app/representacoesCodigo.js normaliza preferências e projeta os nós e ligações existentes sem criar uma segunda árvore autoral. aplicarValoresBloco valida os campos e aplica uma transação com revisaoEsperada. Referências derivadas do Designer permanecem administradas por ele. js/ui/representacoesCodigo.js oferece Blocos/Grafo/Código-fonte no mesmo EstudioVisualScript; não altera o formato v1. Rascunhos são Maps de sessão; campos capturam a revisão de origem e exigem Aplicar campos. Código-fonte reutiliza AmbienteForja.painelCodigo e seus rascunhos HTML/CSS/JS por objeto. A geração completa continua em Nucleo.html(), incluindo validação do grafo. A troca de área não emite transação nem duplica documento/histórico.

## Engenharia em arquivo via MCP

O adaptador de ferramentas/engenhariaMcp.mjs mantém apenas tokens de comparação em sessão: 10 minutos, até 32 entradas, no máximo 2 MB UTF-8 por fonte. O cliente fornece arquivo/fonte ou token/resoluções; deltas autorais não são aceitos. A aplicação relê e recalcula o plano pelo domínio. revisaoArquivo é SHA-256 dos bytes, diferente da revisão em memória de Nucleo. Escrita usa temporário exclusivo e rename na mesma pasta após conferir o hash novamente. É concorrência otimista, sem bloqueio geral de processos externos. Caminhos reais ficam dentro da pasta; projetos acima de 64 MB e fontes acima de 2 MB são recusados.

Metadados desconhecidos do envelope são combinados com a serialização atual; memoria e historico conservam extensões, e textoDoProjeto regenera documentação/pacote. O documento é o do Nucleo, sem reaplicar objetos removidos. Recuperação automática detectada na leitura é informada; mutações exigem revisão humana no editor para evitar salvar reparos silenciosos. A sincronização de objetos de importação/reimportação ocorre dentro da mesma transação do domínio, compartilhada com Designer e CLI.

## Persistência comum e atualização pela CLI

ferramentas/engenhariaArquivos.mjs concentra leitura limitada, SHA-256, conferência de revisão, validação das escolhas e serialização com metadados. CLI e MCP usam esse módulo; tokens e restrições da pasta de trabalho continuam no adaptador MCP. A CLI aceita caminhos explícitos, recebe revisaoArquivo/revisaoFonte da comparação e não aceita deltas autorais do cliente. Ela recalcula prepararReimportacao no domínio e aplica pelo mesmo comando. Nenhum plano temporário é gravado. O JSON de resoluções é entrada declarada, limitado a 1 MB.

Importação inicial pela CLI agora usa o gravador oficial textoDoProjeto, gerando documentação/pacote. Continua exigindo --substituir para uma saída existente; a aplicação de reimportação exige as duas revisões. O controle é otimista: não constitui bloqueio de arquivos entre processos externos.

## Comparação estrutural de HTML

js/aplicacao/reimportacaoHTML.js concentra preparar/aplicar, sem manter documento paralelo. js/aplicacao/elementosHTML.js usa a mesma fábrica de propriedades na importação inicial e nas adições. O parser registra identidadeExplicita como metadado aditivo, preservando formato v1. Para bases antigas, a fonte anterior é reanalisada apenas para conferir a origem dos IDs. Identidades reservadas de objeto JavaScript são recusadas.

O mapa candidato contém somente a fonte nova; novos IDs são reservados contra todos os objetos atuais. Remoções são conflitos chave|@remover. Local conserva o objeto com origemHTMLAnterior e remove origemHTML; a reaparição da chave gera outro ID, sem recapturar a decisão local. Fonte remove do candidato apenas após escolha explícita. Referências remanescentes em propriedades/chaves, código literal, nós/fios autorais e hierarquia impedem a aplicação inteira. Nós derivados removidos e fios hierárquicos não contam como dependências autorais; a sincronização ocorre dentro da transação.

Antes de aplicar, revisão e plano são novamente verificados/recalculados, hierarquia é validada e um único comando grava elementos e metadados. Comparação CLI/MCP expõe adicoes/remocoes sem aceitar deltas do cliente. UI verifica também se o HTML foi editado depois de apresentar conflitos e mostra erro no próprio diálogo. Não há análise semântica universal de código ou transformação de tipos.
