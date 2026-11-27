# Auditoria de integração do Hefestus — 2026-11-08

Estado: diagnóstico técnico; nenhuma implementação portada ou homologada.
Base: `main`. Fonte comparada: `reconstrucao/hephaestus-biblia-mestra`.
Não mesclar a branch inteira: a comparação registra divergência de 7 commits à frente e 6 atrás.

## Componentes adicionais confirmados na branch de reconstrução
- `ferramentas/engenharia.mjs`: CLI para verificar, resumir, importar, comparar e atualizar HTML.
- `ferramentas/engenhariaArquivos.mjs`: leitura limitada, SHA-256, verificação de revisão, gravação temporária.
- `ferramentas/engenhariaMcp.mjs`: adaptadores MCP com plano de reimportação temporário.
- `js/aplicacao/documentoAtivo.js`: casos de uso e diagnóstico sobre o Núcleo.
- `js/aplicacao/elementosHTML.js`, `js/aplicacao/reimportacaoHTML.js`, `js/nucleo/htmlNativo.js`: importação/reimportação.
- Testes adicionais: `engenharia-cli.test.mjs`, `engenharia-mcp.test.mjs`, `reconstrucao.test.mjs`, `reimportacao-estrutural.test.mjs`, `representacoes-codigo.test.mjs`.

## Contratos e proteções a preservar
- Formato autoral `.hefestus` v1 e IDs/histórico existentes.
- Limites: projeto 64 MiB; HTML 2 MiB; resoluções 1 MiB.
- Comparação de revisão SHA-256 antes de salvar e reimportar.
- Reimportação: preparar -> apresentar conflitos -> aplicar; escolha local/fonte explícita.
- MCP: planos em memória com expiração de 10 minutos e limite de 32 planos.
- Não confundir diagnóstico estático com execução de programa.
- Escrita em branch de trabalho; nenhuma substituição de `main` ou de arquivos do usuário.

## Sequência de evolução verificável
1. Obter cópia isolada da branch de reconstrução; rodar os testes originais sem alterar a base.
2. Criar testes de contrato para equivalência CLI/MCP/DocumentoAtivo, incluindo entradas inválidas.
3. Portar apenas domínio e adaptadores necessários; comparar o formato serializado antes/depois.
4. Rodar `npm ci`, `npm test`, `npm run build`, `npm run test:interface` e `node orquestrador/orq.mjs checar` em ambiente de execução apropriado.
5. Ensaiar projetos legados: criar, importar, alterar, salvar, reabrir, desfazer e exportar.
6. Abrir PR apenas depois de evidência de testes; nenhuma mesclagem automática.

## Limites da auditoria
O pacote independente 0.47 descrito em `EVOLUCAO_047.md` não foi recuperado; não afirmar equivalência com a branch de reconstrução. Os resultados de 347 testes/49 arquivos são históricos e não foram repetidos nesta sessão. Nenhum teste foi executado nesta sessão.
