# ADR-023 — Linguagens por função, com evidência

Estado: diretriz de arquitetura aceita; novos motores dependem de implementação e medição. Data: 28/10/2026. Origem: orientação do usuário para usar a linguagem adequada em cada módulo.

Preservar monólito modular e contratos comuns. Não converter todo o produto para outra linguagem nem introduzir serviços apenas para multiplicar tecnologias. JS atual e host Rust/Tauri permanecem; TypeScript é alvo de evolução, não migração já realizada.

A escolha parte do destino, correção, bibliotecas e carga. CPU/I/O é uma classificação inicial, não um ranking de linguagens. Medir fim a fim, incluindo serialização, IPC/FFI, cópias, inicialização, dependências e distribuição. Não prometer ganho sem benchmark comparável.

Código de domínio não conhece a UI ou o runtime de um fornecedor. Motores adaptados recebem entradas/saídas com versão e erros explícitos. Apenas dependências necessárias entram no pacote final. Contrato de operações assíncronas inclui cancelamento e revisão de origem.

Rastreabilidade: HEF-016/021/022/028/039/041/044. Plano e matriz em docs/arquitetura-poliglota.md; perfis declarativos em configuracao/perfis-linguagens.json. O manifesto dos perfis orienta seleção, não instala nem executa toolchains.

Retorno: decisão e perfis são aditivos; não alteram formato .hefestus, motores ou dependências do build atual. Qualquer substituição futura preservará o adaptador anterior até validar regressão e exportação.
