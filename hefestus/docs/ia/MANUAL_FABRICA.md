# Manual de Produção para IAs — Engenharia Integrada do Hefestus

Versão do manual: 1.1.0 · 23/10/2026 · Responsável: Ricardo Sampietro.
Estado: manual operacional/documental. Não instala o Hefestus, compiladores ou executor de políticas.
Norma principal: [Bíblia/GDD do Hefestus](../../BIBLIA_ARQUITETURA_GDD.md).

**Perfis:** Go, Rust e C++ nas seções 9–12; [14 perfis complementares](PERFIS_TECNOLOGICOS.md): C#, TypeScript, JavaScript, Java, SQL, ActionScript, HTML, CSS, PHP, Objective-C, Swift, Kotlin, Shell Script e PowerShell.

## 1. Finalidade e acionamento

Quando o usuário pedir “construir um programa usando o Hefestus”, “seguir a Bíblia”, “seguir o GDD” ou expressão equivalente no contexto do Hefestus, aplicar o processo completo: entender, consultar, definir contratos, reutilizar, construir, testar, salvar/reabrir, gerar, empacotar e verificar a entrega aplicável.

Bíblia e GDD são aliases do conjunto inteiro. Este manual é a interface de operação desse conjunto para IAs e pessoas, não um segundo padrão concorrente. Instruções atuais do usuário e restrições reais do ambiente continuam prevalecendo.

O objetivo é uma linha de produção de programas pequenos ou grandes com qualidade rastreável, sem repetir decisões básicas nem carregar ferramentas desnecessárias. Escalar a documentação e as camadas ao risco e ao tamanho. Usar uma linguagem inicial; acrescentar outras apenas por necessidade verificável.

## 2. Três modos de uso

| Modo | Condição | Conduta |
| --- | --- | --- |
| Integrado | Hefestus e suas ferramentas estão disponíveis e compatíveis | Usar CLI/MCP/casos de uso reais, transações, proteções, formato e exportadores suportados |
| Arquitetural | Hefestus não está instalado, mas manual, política e Bíblia estão acessíveis | Construir com ferramentas disponíveis segundo os mesmos princípios, contratos e portões |
| Recuperação parcial | Só parte da documentação/referências está acessível | Registrar fontes ausentes, preservar decisões conhecidas e avançar no que não depender da lacuna |

No modo arquitetural, declarar “construído segundo a Engenharia Integrada do Hefestus; sem executar o editor”. Não afirmar que usou CLI/MCP, criou um arquivo nativo validado, passou em auditoria do Hefestus ou produziu instalador quando isso não aconteceu.

A ausência do editor não bloqueia produção convencional nos perfis deste manual e no complemento tecnológico. Também não dispensa o compilador e as dependências da linguagem escolhida. Se o toolchain faltar, produzir código/documentação possíveis, registrar o bloqueio e não declarar compilação/testes executados.

## 3. Biblioteca local de decisões

Pacote documental mínimo para consultar sem o editor:
- Este manual.
- Cópia fixada da Bíblia/GDD.
- [Política de decisões](politica-decisoes.json).
- [Modelo de instruções do projeto](AGENTS_MODELO.md).
- Decisões específicas, contratos e evidências do programa em construção.

Esses arquivos podem ser versionados dentro do projeto ou mantidos em caminho local referenciado explicitamente. Não presumir diretório fixo, download automático ou acesso ao GitHub. Para uso offline, os arquivos precisam ter sido obtidos antes, com revisão/origem registradas.

O pacote também inclui PERFIS_TECNOLOGICOS.md para os perfis complementares. A política JSON é dado declarativo para consulta. Não é executor, plugin instalado, memória automática do chat ou capacidade de invocar shell. Sem agente que a leia, ela não dispara ações.

Para ativar em um futuro projeto: copiar/adaptar AGENTS_MODELO.md ao arquivo de instruções que o ambiente efetivamente consulta e preencher os caminhos reais. Preservar instruções existentes; não sobrescrever AGENTS.md de outro projeto. Em ambientes que não carregam esse arquivo, anexar ou citar explicitamente o manual e a Bíblia.

Registrar a versão documental aplicada e a revisão da Bíblia; uma cópia offline pode ficar antiga. Atualização exige comparação de mudanças e compatibilidade.

## 4. Ordem de autoridade e estado

1. Pedido atual, requisitos explícitos, decisões protegidas e limites do ambiente.
2. Requisitos/contratos do programa.
3. Bíblia/GDD fixada e este manual, naquilo que se aplica.
4. Código observado, testes e evidências para descrever funcionamento atual.
5. Referências externas e sugestões ainda não validadas.

Uma intenção não vira funcionamento apenas por estar em nível superior. Contrato descreve o esperado; código/teste descrevem o observado. Divergência é registrada e corrigida, sem inventar evidência.

Estados: proposto, especificado, implementado, testado, homologado, depreciado e arquivado. Bloqueado/pendente descrevem andamento. Homologação exige plataforma, corpus e aceite identificados.

## 5. Entrada da ordem de produção

Extrair do pedido e das fontes disponíveis:
- Problema, usuário e primeira tarefa útil completa.
- Entradas, saídas, unidades, formatos e persistência.
- Plataforma/arquitetura e perfil CLI, serviço, web ou desktop.
- Regras de falha, proteção de dados e necessidade de instalação/offline.
- Escopo do pedido, recursos existentes e critérios de aceite.

Inspecionar repositório e instruções antes de criar arquivos. Consultar implementações já disponíveis no Hefestus quando acessíveis. Sem acesso, registrar “reuso interno não avaliado”, sem inventar peças existentes e sem bloquear trabalho independente.

Escolhas rotineiras podem ser inferidas e registradas. Perguntar só por regra essencial ausente que altere a solução; continuar partes independentes. Não pedir autorização ou confirmação para executar.

Saída: ordem de produção curta com objetivo, destino, modo Hefestus, primeiro fluxo-âncora, critérios, fontes e suposições relevantes.

## 6. Estações da fábrica

| Estação | Trabalho | Saída observável |
| --- | --- | --- |
| E0 — Triagem | Ler fontes, ambiente e estado atual | Ordem e baseline |
| E1 — Especificação | Requisitos e primeiro caso completo | Contratos, exemplos válidos/inválidos |
| E2 — Composição | Reuso, linguagem, núcleo e dependências | Decisão e versões fixadas |
| E3 — Construção | Implementar fatia vertical | Entrada → operação real → saída → falha |
| E4 — Integridade | Persistência, reabertura, migração e recuperação | Evidências do corpus |
| E5 — Experiência | Fluxo de uso, estados, teclado quando aplicável | Jornada verificada |
| E6 — Entrega | Build, recursos, manifesto, pacote/instalador | Artefato identificado |
| E7 — Aceite | Executar fora do ambiente de desenvolvimento | Resultado e limitações |
| E8 — Evolução | Registrar mudança e próxima revisão | Histórico, delta e retorno |

Uma estação pode ser pequena em programa simples. Não exigir GUI para CLI, banco para cálculo sem estado ou instalador para biblioteca. “Não se aplica” deve ter motivo.

## 7. Arquitetura mínima e fronteiras

Separar conceitualmente domínio, aplicação, portas, adaptadores, apresentação e composição. Não exigir seis pacotes em um script pequeno.

- Domínio: regras, entidades, unidades, invariantes e erros independentes da UI.
- Aplicação: casos de uso e transações.
- Portas: fronteiras necessárias, não interfaces vazias por padrão.
- Adaptadores: arquivos, banco, rede, processos e bibliotecas.
- Apresentação: CLI, web ou janela que aciona casos de uso.
- Composição: inicialização, configuração e ciclo de vida.

Evitar framework antes do primeiro contrato. Preferir monólito modular. Processos, serviços, plugins e linguagens adicionais precisam de motivação e verificação. O programa gerado não depende do editor ou do catálogo completo.

## 8. Reuso por núcleo e decisão tecnológica

Antes de incorporar ferramenta: procurar biblioteca/API pública ou módulo oficial; considerar build seletivo; extrair núcleo apenas com fronteira viável e manutenção rastreável. Não baixar/executar todos os candidatos.

Ficha: capacidade, contrato, origem/commit, dependências transitivas, recursos dinâmicos, destino, efeitos, timeout, custo de manutenção, testes, tamanho e retorno.

| Escolha | Quando avaliar | O que confirmar |
| --- | --- | --- |
| Go | CLI, serviços, ferramentas e concorrência de I/O | Ecossistema, recursos, cancelamento e perfil de distribuição |
| Rust | Núcleos, runtime e operações com controle de recursos | Integração, bibliotecas, ownership e custo de build |
| C++ | Biblioteca nativa existente ou capacidade que o justifique | ABI, memória, compilador, recursos e redistribuição |
| Mais de uma | Benefício/necessidade que uma só não atende bem | Custos de fronteira, depuração e pacote final |

Essa tabela orienta avaliação; não é ranking de velocidade. Não instalar as três linguagens no usuário final. Framework do frontend e plataforma de janela são decisões separadas.

Medir a operação completa, incluindo inicialização, cópia, serialização e FFI/IPC. Sem dados, escolher caminho simples e registrar hipótese. Score ordena candidatos válidos; não compensa falha, incompatibilidade ou perda de dados.

## 9. Perfil Go

### Organização

Começar com um módulo Go. Um programa pequeno pode manter package main na raiz. Para vários comandos/apoio, usar cmd/<programa>/ e internal/ com limites de pacote coerentes. Testes acompanham os pacotes em arquivos _test.go; exemplos e fixtures ficam identificados.

go.mod e go.sum, quando existente, fazem parte da resolução; go.sum contém checksums e não é um lock universal. Registrar versão do toolchain e verificar a resolução efetiva. Não editar dependências sem necessidade.

### Regras de implementação

- Regras retornam resultados/erros; processo decide saída e código de retorno.
- Usar erros identificáveis quando consumidores precisarem distingui-los, preservando contexto.
- Propagar context.Context em operações canceláveis; timeout nas fronteiras.
- Definir dono e término de goroutines; evitar compartilhamento mutável sem sincronização.
- Validar tamanho, formato e unidade antes de alocar/processar dados externos.
- Testar gravação, retorno de erro e reabertura quando houver persistência.
- Usar biblioteca padrão quando atender ao contrato; dependência adicional exige motivo.
- Declarar uso de cgo, bibliotecas nativas e necessidade de compilador C. Binário Go não é automaticamente estático em todo perfil.

### Comandos de referência

Executar na raiz real do módulo, adaptando caminhos. São instruções, não comandos executados por este manual:

```text
go version
go test ./...
go vet ./...
go build -o dist/programa.exe ./cmd/programa
```

Criar dist antes do build e usar nome/extensão do destino; se package main estiver na raiz, usar "." como entrada. go test -race ./... só quando plataforma/toolchain suportarem, com os requisitos de cgo/compilador atendidos. Cross-compilation com cgo pode exigir toolchain específico; compilar não comprova execução no destino.

Aceite: comando instala/abre no destino declarado, entrada inválida retorna erro compreensível, cancelamento termina tarefas e artefato não exige pastas do desenvolvedor.

## 10. Perfil Rust

### Organização

Começar com um package Cargo; src/lib.rs pode conter regras e src/main.rs a entrada. Usar crates/workspace quando houver fronteiras/consumidores reais. Não criar uma crate por classe/camada sem benefício.

Registrar Cargo.toml, Cargo.lock para aplicações/entregas e toolchain escolhido. O primeiro lock precisa ser resolvido e revisado antes de exigir --locked. Flags/features fazem parte do perfil testado; não anunciar all-features como representação de todo destino.

### Regras de implementação

- Erros de entrada/ambiente retornam Result; panic não é tratamento normal de falha do usuário.
- Tipos expressam unidades e invariantes quando isso evita ambiguidade.
- unsafe é localizado, justificado por invariantes e acompanhado de testes; não vira otimização padrão.
- Trabalhos longos têm estratégia de cancelamento real. async não torna cálculo pesado automaticamente paralelo.
- Evitar acoplar domínio ao host Tauri ou à UI.
- Recursos de runtime e dependências por feature são declarados, inclusive binários/arquivos externos.
- Validar persistência e migração com corpus. Compilar com sucesso não comprova segurança do protocolo externo.

### Comandos de referência

Após lock existente e com features/alvos selecionados:

```text
rustc --version
cargo --version
cargo test --locked
cargo build --release --locked
```

Em workspace, selecionar membros e perfis relevantes; usar --workspace somente se todos fizerem parte da verificação. cargo fmt --check e Clippy podem ser usados quando disponíveis/exigidos pela política; não instalar ferramentas ou ampliar lint sem necessidade da tarefa.

Aceite: binário e recursos fora do checkout, erros e cancelamento observados e dependências nativas/runtime declaradas. Build para outro target exige suporte e execução de aceite própria.

## 11. Perfil C++

### Organização

Começar com CMakeLists.txt, fontes src/, headers públicos include/ quando houver API pública e tests/ quando necessário. Pode haver executável e biblioteca do núcleo em um único projeto CMake. Usar opções/targets, não flags globais que vazem para terceiros.

Fixar compilador, arquitetura, padrão C++ suportado e configuração de build. Escolher um gerenciador de dependências quando necessário, com baseline/lock efetivamente disponível; CMake sozinho não fixa todas as dependências.

### Regras de implementação

- RAII para recursos e propriedade explícita; evitar new/delete manuais no domínio.
- Contrato define erros/exceções. Não deixar exceções C++ atravessarem ABI C.
- Buffers possuem comprimento, limites e dono; strings especificam encoding.
- Isolar código de SO e bibliotecas na adaptação.
- Declarar compatibilidade ABI e runtime quando distribuir bibliotecas/binários.
- Análise dinâmica/sanitizers usam compilador e configuração compatíveis; resultados não substituem testes do pacote final.
- Padrão C++ mais novo só quando suportado pelo destino/toolchain, sem promessa universal.

### Comandos de referência

Com CMakeLists.txt que registra testes e opção BUILD_TESTING:

```text
cmake --version
cmake -S . -B build -DBUILD_TESTING=ON
cmake --build build --config Release
ctest --test-dir build -C Release --output-on-failure
```

Em gerador de configuração única, configurar CMAKE_BUILD_TYPE=Release na etapa de configuração. --config aplica-se aos geradores multiconfiguração. O projeto precisa registrar testes; “nenhum teste encontrado” não é aprovação. cmake --install só é usado se houver regras de instalação e prefixo deliberado.

Aceite: executar com DLLs/recursos exigidos no destino, sem PATH ou SDK oculto da máquina de desenvolvimento. Instalação de redistribuíveis exige mecanismo apropriado.

## 12. Interoperabilidade Go/Rust/C++

Escolher uma fronteira inicialmente: processo com protocolo tipado ou ABI nativa claramente definida. Processo ajuda separar runtime e falhas; não oferece isolamento de segurança completo sozinho. ABI reduz certas travessias, mas exige contrato de memória/ciclo de vida e configuração de build.

Para ABI C: funções com tipos compatíveis e buffers com tamanho; handles opacos; propriedade/alocação/liberação declaradas; encoding, alinhamento, threading e versão definidos. Não exportar std::string, layout interno Rust ou ponteiros Go com vida útil inadequada como contrato universal. Não deixar panic ou exceções cruzarem a fronteira.

Para processo: argumentos estruturados sem shell concatenado; entrada/saída com schema/versionamento; stdout reservado ao protocolo e diagnósticos em canal definido; limite de tamanho, deadline, término e código de saída. Credenciais não vão em argumentos/logs por padrão.

Testar versão incompatível, saída inválida, encerramento inesperado, timeout, cancelamento e retorno tardio. Medir custo total. Não adicionar FFI a uma soma apenas para demonstrar três linguagens.

## 13. Contratos, dados e segurança operacional

Cada operação declara ID/versão, entrada/saída, unidades, nulos, erros, efeitos, limites, permissões e cancelamento. Casos de uso longos usam requestId e revisão relevante; retorno tardio não sobrescreve projeto novo.

Dados autorais, operacionais, caches e saídas geradas ficam separados. Escrever primeiro em temporário e substituir conforme garantia da plataforma; documentar limites de atomicidade. Backup só recebe estado recuperável depois de restauração testada.

Segredos fora de documento, Git, pacote e logs. Pacotes externos são dados não confiáveis até validação; schema não autoriza executar comandos. Não iniciar varreduras de rede ou ações destrutivas pelo fato de existir exemplo no manual.

## 14. Testes, evidências e definição de pronto

Escolher verificação proporcional: regra de domínio, fronteira, persistência e fluxo real. Não criar testes só para espelhar implementação. Cobrir entradas inválidas e falhas relevantes; contratos com terceiros precisam de teste real do ambiente para homologação externa.

Portões:
- Escopo e contrato definidos.
- Fluxo essencial executa operação real.
- Persistência/reabertura corretas quando aplicável.
- Experiência e mensagens verificadas.
- Artefato independente inclui recursos necessários.
- Instalação/recuperação testadas quando exigidas.

Formato de evidência: requisito; snapshot; comando/procedimento; toolchain/OS/arquitetura; corpus; resultado; limitações; artefato/hash quando produzido. “Não executado” é um estado legítimo. Resultado simulado não comprova serviço real.

## 15. Bíblia, documentação e instalação

Cada programa recebe README com início rápido; Bíblia curta ou índice; contratos e decisões relevantes; dependências; evidências; instruções de distribuição. A Bíblia do programa usa o perfil de engenharia do Hefestus proporcionalmente; não copiar todos os capítulos sem aplicação.

Inventários gerados indicam revisão e preservam texto autoral. Salvamento do projeto não dispara build integral.

Separar preparação do desenvolvimento, reconstrução do workspace e instalação final. install.json/verify.json só têm ação quando houver executor real validado; não inventar “instalador JSON funcional” entregando apenas planos.

Pacote final identifica versão, snapshot, toolchain, dependências, destino, hashes, pré-requisitos, limitações e política dos dados. Compilado não significa instalado; ZIP não significa instalador. Nunca declarar “qualquer PC”.

## 16. Registro mínimo de decisão

Para cada escolha relevante:
- ID, requisito e problema.
- Alternativas acessíveis, inclusive manter a implementação atual.
- Escolha e justificativa.
- Evidência medida ou hipótese explícita.
- Dependências, manutenção e destino.
- Critério de revisão e retorno.
- Estado e versão.

Decisões triviais não exigem um ADR separado. Biblioteca local conserva decisões úteis, sem virar catálogo infinito de preferências ou números de desempenho inventados.

## 17. Roteiro de execução para uma IA

1. Identificar modo integrado/arquitetural e ler instruções reais do projeto.
2. Consultar Bíblia/manual/política fixados; registrar ausências.
3. Ler código atual e contratos; extrair ordem de produção.
4. Escolher o primeiro fluxo útil e a linguagem mínima suficiente.
5. Consultar peças internas acessíveis e núcleo externo viável; fixar dependências.
6. Implementar entrada, regra, resultado e erro antes de ampliar telas.
7. Verificar integridade e tarefa do usuário; corrigir falhas.
8. Gerar artefato do destino e verificar fora do checkout quando possível.
9. Produzir/testar instalador somente quando parte do escopo.
10. Atualizar documentação, decisões, evidências e entregar limites concretos.

Não parar no planejamento quando há meios para implementar. Não esconder bloqueios. Não afirmar que todo este roteiro já está automatizado pelo Hefestus.

## 18. Ficha de passagem de trabalho

Registrar ao retomar ou passar para outra IA: objetivo; modo; revisão da Bíblia/manual; baseline do código; decisões; arquivos tocados; contrato atual; testes executados; bloqueios; próxima etapa; comando real de execução. Não incluir credenciais nem raciocínio interno.

O estado do trabalho está nos arquivos e evidências, não na memória implícita de um modelo. Com isso, outra IA consegue continuar sem reiniciar o projeto.

## 19. Critérios de aceite deste manual

Documentação: links locais válidos, política JSON parseável, IDs sem duplicação e alinhamento com a Bíblia. Esses checks não comprovam aplicação automática em qualquer IA.

Validação funcional futura: construir um programa simples em modo arquitetural com uma linguagem; executar falha e fluxo correto; salvar/reabrir se aplicável; gerar pacote; retomar com outro agente/IA a partir da ficha. Usar Go/Rust/C++ em pilotos separados quando seus toolchains estiverem disponíveis. Não anunciar três pilotos concluídos nesta publicação.

## 20. Referências oficiais

Fontes de comandos e convenções, sem eleger versões ou instalar ferramentas:
- [Go: organização de módulo](https://go.dev/doc/modules/layout).
- [Go: referência de módulos](https://go.dev/ref/mod).
- [Cargo: workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html).
- [Cargo: testes](https://doc.rust-lang.org/cargo/commands/cargo-test.html).
- [CMake: tutorial](https://cmake.org/cmake/help/latest/guide/tutorial/).
- [CMake: CTest](https://cmake.org/cmake/help/latest/manual/ctest.1.html).

Verificar a documentação da versão efetivamente escolhida ao implementar detalhes sensíveis ao toolchain.

## 21. Alimentação inicial do score

[score-inicial.json](score-inicial.json) contém 12 avaliações heurísticas de adequação: Go, Rust e C++ em quatro contextos. Não é benchmark e não é ranking geral de linguagens.

Dimensões iniciais: adequação à capacidade (35%), simplicidade de integração (25%), distribuição (20%) e manutenção (20%). Notas de 0 a 5 são hipóteses documentadas. Fórmula: 100 × soma(nota/5 × peso). Pesos e notas são proposta inicial revisável, não decisão medida do usuário.

Todos os candidatos começam em pending_eval e elegibilidade unknown. Campos de latência, memória, tamanho, toolchain e corpus são nulos, com zero execuções. O score apenas sugere ordem de avaliação. Não subtrair “penalidade desconhecida” nem preencher medições com números de referências de outras máquinas.

Para alimentar com evidência: fixar requisito/contexto/corpus; verificar portões; executar operação equivalente; registrar ambiente/resultados; separar medição de hipótese; versionar o dataset. Só comparar execução sob condições comparáveis. Ausência de requisito real mantém o candidato pendente.

Candidatos externos do histórico permanecem referências sem pontuação de fornecedor enquanto faltarem versão, contrato e teste. O anexo não comprova ganho, segurança, tamanho de Tauri ou custo universal de FFI.

## 22. Plano, verificação, status e continuidade

Usar quatro responsabilidades distintas, com arquivos somente quando houver conteúdo:
- plan.json: etapas, objetivo, dependências, entregáveis e critérios referenciados.
- verify.json: casos/procedimentos e resultado esperado ligados aos requisitos, não prosa executada.
- status.json: projeção dos resultados disponíveis, com revisão, data, validade e pendências.
- changelog.jsonl ou convenção nativa: mudanças, decisões, requisito/etapa e evidência; sem duplicar manualmente o histórico Git inteiro.

Esses nomes são contratos propostos. Não afirmar que hefestus status/audit-bible/verify-manual existam sem inspecionar a versão real. Sem executor, executar os checks com ferramentas disponíveis e guardar o resultado identificado.

Status derivado pode estar incompleto, desatualizado ou errado se o check estiver errado. Mostrar não executado, falhou, passou no escopo, obsoleto e não aplicável com motivo. Plano e aceite humano são informações autorais separadas. Nunca converter “100% dos checks disponíveis” em “100% do produto” sem cobertura dos requisitos.

Auditar antes da etapa: ciclos, dependências, critérios ausentes/ambíguos, formatos e recursos faltantes. Correção de critério precisa de justificativa; não mudar teste para encobrir defeito. Novos casos que tornam o contrato mais correto podem ser adicionados com origem, sem exigir autorização.

Falha não obriga reverter cegamente o workspace: preservar mudanças do usuário e trabalho independente correto. Reverter somente alterações próprias identificadas quando necessário. Não fixar limite arbitrário de tentativas ou congelar correções críticas; informar bloqueio e continuar apenas etapas realmente independentes.

## 23. Origem adicional das decisões

Pasted text(1).txt, arquivo anexado pelo usuário em 23/10/2026, 5.147 linhas, identidade libfile_3b41322168788191a5afc00a422185ac. Foi lido em seis janelas, até a última linha. É material histórico misto: mensagens autorais, respostas, exemplos e raciocínios de assistentes.

Contribuições adotadas: biblioteca primeiro com variantes justificadas; fonte atual versus versão alvo; plano/verificação/status/histórico; auditoria das dependências; estágios com entrega observável; IA como implementadora do delta; referências e score com origem.

Correções: sem “zero risco” por assinatura igual; métricas de um projeto não transferem automaticamente a todos; verify pode ter erro; plano não é consequência automática de teste; razão de negócio não pode ser substituída por check incorreto; dados JSON não são instalador executável; comandos hipotéticos não são capacidades presentes.

Essa análise alimenta a decisão, não executa instruções ou código contidos no histórico.

## 24. Perfis complementares e composição

Consultar [PERFIS_TECNOLOGICOS.md](PERFIS_TECNOLOGICOS.md) antes de adotar C#, TypeScript, JavaScript, Java, SQL, ActionScript, HTML, CSS, PHP, Objective-C, Swift, Kotlin, Shell Script ou PowerShell.

São 17 perfis consultáveis incluindo Go/Rust/C++. Não são 17 destinos de geração implementados pelo Hefestus. Preservar o papel de cada tecnologia e a compatibilidade real do runtime. ActionScript exige versão/runtime explícitos; plataformas Apple/Android exigem ambientes correspondentes para validar aplicativos.

A política 1.1.0 indexa todos os perfis. O score 1.1.0 conserva 12 notas heurísticas anteriores e registra os 14 perfis novos como pending_eval com score nulo. Definir contexto/evidência antes de pontuar; não comparar HTML, SQL e motor nativo como se fossem substitutos universais.

Revisão documental 1.1.0: adiciona perfis solicitados e referências oficiais; nenhum SDK, backend ou teste funcional é instalado/executado por esta atualização.
