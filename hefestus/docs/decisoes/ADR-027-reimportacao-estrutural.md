# ADR-027 — Adições e remoções na reimportação HTML

28/10/2026. Estado: implementado e testado no escopo descrito.

Ampliar preparar/aplicar do mesmo caso de uso, sem novo menu, formato de projeto ou superfície. Identidades HTML comuns mantêm IDs internos e tipos; tipo diferente continua recusado. Mudança estrutural exige identidade explícita (id ou data-hefestus-id) em todos os elementos das fontes anterior/nova. Metadado aditivo registra essa origem; importações antigas são verificadas pela fonte preservada.

Adições recebem IDs novos reservados contra todos os IDs atuais, inclusive os candidatos a remoção. Cada remoção vira conflito obrigatório: local mantém o objeto e o desvincula da importação, fonte solicita apagar. A nova base/mapa acompanha apenas a nova fonte; um objeto mantido localmente não é recapturado silenciosamente se a chave reaparecer.

Aplicar confere revisão e recalcula o plano pelo domínio. Monta candidato em memória, aplica propriedades/adições/escolhas e verifica hierarquia e referências antes do comando. Referências autorais remanescentes a um ID removido impedem toda a atualização. Nós derivados e fios hierárquicos podem ser regenerados; conexões autorais não são apagadas automaticamente. Inspeção conservadora de strings de referência é declarada, sem prometer rastreamento universal de código.

Uma transação inclui fonte/base/mapa e grafo sincronizado; falha não altera documento/histórico. UI, CLI e MCP recebem adições/remoções e reutilizam conflitos local/fonte. Retorno por desfazer ou Git. Aceite inclui salvar/reabrir, hierarquia, IDs, colisões, escolhas locais, dependências, revisão e paridade dos adaptadores.

Resultado: 380 testes passaram, zero falhas; build HTML passou. Foram adicionados 12 testes do domínio e dois de integração CLI/MCP. QA no navegador verificou resumo estrutural, escolha local, invalidação por edição da fonte, aplicação e desfazer; dados de QA foram revertidos. Referências em valores, chaves e código literal são verificadas de modo conservador; código que constrói IDs dinamicamente não tem análise universal. Mudança de tipo e fonte sem elementos suportados continuam recusadas.
