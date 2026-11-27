# ADR-028 — Importador Universal Inteligente

Data: 2026-11-08
Status: direção de arquitetura aprovada; implementação pendente

## Decisão
Combinar reconhecimento, validação de URL e pré-visualização segura inspirados no Axiom com o núcleo de objetos, histórico, IDs e Visual Script do Hefestus. Não incorporar os programas integralmente nem duplicar motores. GUI, CLI, MCP e Visual Script devem consumir o mesmo serviço versionado.

## Fluxo
Entrada (URL/arquivo/texto) → classificação e segurança → prévia isolada → plano de conversão com avisos e fidelidade → escolha do usuário → conversão transacional ou preservação como recurso → comparação de três versões e resolução de conflitos → verificação de referências e persistência.

## Modos de fidelidade
1. Objetos nativos editáveis para subconjunto suportado.
2. Componente incorporado com isolamento e capacidades explicitadas.
3. Código/fonte original preservado sem alegar editabilidade completa.

## Invariantes
- Preservar formato .hefestus v1, IDs, hierarquia, ligações autorais, histórico e edições locais.
- Não executar código externo durante análise; isolar a prévia.
- Reimportação nunca apaga objeto referenciado silenciosamente.
- Hash de revisão e conflitos explícitos antes de gravar.
- Não alegar suporte pleno a CSS, JS, SVG, Flex/Grid ou recursos remotos sem testes específicos.

## Correções prévias
- Auditar a construção de RegExp em reimportacaoHTML.js, especialmente IDs com caracteres especiais; escrever testes de não exclusão.
- Resolver divergência entre teste e validação de loopback/LAN em axiom/web_import.py; manter política SSRF restritiva por padrão.
- Executar testes de contrato, regressão, segurança, importação/reimportação e build em cópia isolada.

## Critérios de aceite
- Entradas inválidas não modificam o projeto.
- Conversão e reimportação produzem transações reversíveis e persistem após reabrir.
- Vínculos autorais sobrevivem ou bloqueiam remoções com erro explícito.
- CLI/MCP/GUI compartilham resultados e regras.
- Cada formato informa nível real de fidelidade e perdas.

Esta ADR registra a direção aprovada, não a entrega funcional. Não mesclar automaticamente a branch de reconstrução.
