# ADR-025 — Engenharia nativa pelo MCP

28/10/2026. Estado: implementado e testado no escopo descrito.

Expor diagnóstico, importação HTML nativa e reimportação no servidor stdio existente. Os adaptadores usam DocumentoAtivo/Nucleo, sem copiar parser, histórico ou regras de conflito. O formato .hefestus v1 permanece. Importação isolada legada não muda.

A revisão em memória não identifica um arquivo entre chamadas MCP. Usar SHA-256 dos bytes do projeto como revisaoArquivo. Diagnóstico fornece essa revisão; importação exige a revisão esperada. Preparar reimportação só lê e guarda um token opaco de sessão vinculado ao caminho real, hash e fonte. Aplicar aceita token e resoluções local/fonte, relê o arquivo, confere hash e recalcula o plano pelo mesmo caso de uso. Não aceitar planos ou deltas fornecidos pelo cliente.

Planos limitados a 32, com validade de 10 minutos, sem persistir rascunhos em disco. Escrita com temporário exclusivo na mesma pasta, conferência de revisão e rename; falhas não salvam o projeto. Controle otimista entre chamadas, sem alegar bloqueio de editores externos. Caminhos reais devem permanecer na pasta de trabalho, inclusive quando há links. Limites de leitura e fonte são explícitos.

Aceite: servidor MCP real por stdio, equivalência com DocumentoAtivo, preservação de IDs/fonte/campos desconhecidos e histórico, diagnóstico sem escrita, conflitos, revisão obsoleta, token inválido/expirado e caminhos proibidos. Atualizar efeitos e fichas geradas. Retorno: remover os quatro adaptadores e suas fichas, sem migração autoral.

Resultado: 359 testes passaram, zero falhas; build HTML passou. Nove testes novos usam servidor stdio e/ou adaptador de sessão. Fichas geradas e indicações de efeito conferidas. Metadados desconhecidos do envelope são combinados com serialização atual; o gravador oficial regenera pacote/documentação. Projetos em recuperação não são sobrescritos. Sincronização de objetos passou para dentro das transações nativas para que reabrir e desfazer não criem um passo artificial. Limite: concorrência otimista; cliente externo e instalador não homologados.
