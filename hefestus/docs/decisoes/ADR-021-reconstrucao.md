# ADR-021 — Reconstrução compatível da Engenharia Integrada

Estado: aceito para esta execução. Data: 28/10/2026.

Fontes: Bíblia Mestra 2.0.0; Bíblia/GDD Hefestus 2.4; commit b130843.

Arquitetura afetada: preservar js/nucleo e os leitores .hefestus; adicionar casos de uso em js/aplicacao, parsers/validadores puros no núcleo e adaptadores de apresentação na UI existente. O objeto autoral continua no mesmo documento. Designer e Visual Script seguem exclusivos, sem novas abas globais.

Contratos: preservar IDs e versão de formato 1; estender comando com revisão esperada opcional; expor importação HTML nativa de subconjunto declarado, preservando fonte e diagnóstico; validar portas e tipos antes da execução. Os comandos antigos continuam disponíveis.

Etapas: reconstruir e medir baseline; corrigir preferências/portas; separar importação e diagnóstico em módulos; integrar aos comandos existentes; testar corpus, UI e exportação; registrar requisitos implementados e pendências da Bíblia.

Retorno: versões locais originais intactas; commit local 5e3b5f6 conserva o snapshot oficial; projeto importado e edições são transações desfazíveis. Não converter formato nem sobrescrever instalação anterior.

Instalador Windows e motores Rust dependem de toolchain real. Documento, código e testes não serão chamados de instalação homologada.

Nota posterior, 28/10/2026: por pedido explícito do dono, cópias antigas foram removidas. A menção acima a versões originais intactas descreve a etapa inicial; o retorno atual usa o snapshot Git 5e3b5f6. Projetos autorais foram preservados, e PDF Studio foi migrado para a instalação atual.
