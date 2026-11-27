# ADR-026 — Reimportação HTML pela CLI e persistência compartilhada

28/10/2026. Estado: implementado e testado no escopo descrito.

Adicionar comparar-html e atualizar-html à CLI de Engenharia existente, preservando verificar/resumo/importar-html. Comparar só lê e retorna revisaoArquivo e revisaoFonte (SHA-256), alterações e conflitos. Atualizar exige os dois hashes, relê fonte/projeto e recalcula o plano com DocumentoAtivo; resoluções local/fonte são um arquivo JSON opcional, obrigatório apenas quando há conflitos. Não salvar planos autorais/deltas confiados ao cliente nem criar backups automáticos.

Extrair a leitura limitada, conferência de hash, serialização com metadados e escrita atômica de engenhariaMcp.mjs para engenhariaArquivos.mjs, compartilhado com a CLI. O transporte MCP conserva seus tokens, limite de sessão, caminhos reais e contrato. O novo arquivo não substitui motor-projetos para operações antigas. Reutilizar o caso de uso do domínio para comparar/aplicar, sem duplicar parser ou histórico.

Aceite: processos CLI reais, equivalência com o domínio e servidor MCP, comparar sem escrita, hashes obsoletos de projeto/fonte, conflitos sem edição parcial, resoluções inválidas, limites, metadados e um passo de desfazer após reabertura. Regressão integral e fichas MCP continuam válidas. Formato .hefestus v1 e instalação atual permanecem.

Resultado: sete testes CLI novos passaram, e regressão integral de 366 testes passou com --test-concurrency=4. A primeira execução sem limitar concorrência teve timeout de resposta do MCP sob carga; comando padrão npm test passou a limitar quatro arquivos simultâneos. O módulo compartilhado preserva o contrato MCP, confirmado na regressão. A atualização exige hashes de projeto/fonte e reaplica apenas plano recalculado pelo domínio. Instalador/TS e alteração estrutural da reimportação continuam pendentes.
