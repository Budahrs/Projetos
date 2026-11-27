# Hefestus — Bíblia/GDD da Engenharia Integrada

Versão documental: 2.4 · Data: 28/10/2026 · Responsável pelo produto: Ricardo Sampietro

**Orientação, não bloqueio (revisão 2.4).** Requisitos, portões, estados e fichas desta Bíblia orientam e registram. Não exigem permissão, confirmação ou aprovação, nem impedem o responsável ou a automação de executar o que foi pedido. Exigências de licença, copyright e direitos autorais foram retiradas desta documentação. Autoria não é critério: analisar, modificar e reutilizar qualquer código do projeto faz parte do trabalho, sem questionar quem o escreveu. Código de estudo portado ou refatorado passa a ser código do projeto.

Versão declarada do produto na baseline histórica: 0.46.0. A versão 2.4 pertence a esta documentação; não identifica um novo executável nem uma migração de formato.

**Natureza:** especificação consolidada do processo completo do Hefestus e plano de evolução incremental. Incorpora as decisões autorais desta conversa, a arquitetura existente documentada e as melhorias aqui especificadas. Decisão de produto, especificação e implementação são estados diferentes. A publicação desta revisão modifica documentação; não implementa código, biblioteca de núcleos ou instalador.

**Perfis tecnológicos:** [Go/Rust/C++ e 14 perfis complementares](docs/ia/PERFIS_TECNOLOGICOS.md), indexados na política local; consultar manual para os três perfis iniciais.

**Guia operacional para IAs:** [Manual da fábrica, inclusive sem instalação do Hefestus](docs/ia/MANUAL_FABRICA.md), [política local de decisões](docs/ia/politica-decisoes.json), [instruções adaptáveis](docs/ia/AGENTS_MODELO.md) e [score inicial heurístico](docs/ia/score-inicial.json).

**Escopo desta revisão:** somente Hefestus, seus componentes, ferramentas e programas gerados como casos de aceite. Arquiteturas e capacidades de outros projetos não são usadas como prova do funcionamento do Hefestus.

## 1. Mandato do produto

O Hefestus deve permitir construir programas completos: interface, comportamentos, operações reais, dados, documentação, testes e distribuição. A criação pode começar por manipulação visual, código, modelos ou pedido em linguagem natural. Esses caminhos devem convergir para o mesmo projeto autoral versionado.

O resultado esperado é um programa independente, editável e verificável. Uma tela exportada, um botão com sinal ou um projeto Tauri gerado são entregas intermediárias. Só o ciclo completo de operação, persistência e distribuição comprova o programa final para a plataforma declarada.

O padrão deste documento deve ser aplicado ao próprio Hefestus e, de forma proporcional, aos projetos construídos ou mantidos com ele. Compartilhar padrões não significa compartilhar todos os motores, dependências, fluxos de publicação ou interfaces.

### 1.1 Experiência pretendida

1. Criar ou abrir um projeto e reconhecer suas telas, dados, comportamentos, motores e pendências.
2. Montar a interface com peças existentes, mantendo liberdade de ajuste visual profissional.
3. Construir comportamentos por blocos simples e expandi-los para dados e grafos quando necessário.
4. Conectar operações com entradas, saídas e falhas conhecidas.
5. Testar o programa com diagnóstico compreensível e resultados observáveis.
6. Salvar e reabrir sem perder IDs, recursos, lógica, histórico suportado e referências.
7. Gerar e verificar o pacote independente para uma plataforma explicitamente suportada.

### 1.2 Escopo desta edição

Inclui o processo completo, organização documental, documento ativo, domínio, aplicação, portas/adaptadores, IR, runtime, biblioteca de núcleos, UX, IA, validação em tempo de edição, geração, instalador, recuperação e migração. A revisão documental não altera a base operacional.

### 1.3 Nome técnico e apelidos do processo inteiro

**Nome técnico interno:** Engenharia Integrada do Hefestus. **Apelidos indexadores equivalentes:** Bíblia e GDD. Ambos apontam para o processo inteiro: intenção, requisitos, arquitetura, montagem, operações, persistência, documentação, testes, entrega, instalação, operação e evolução.

“Seguir a Bíblia”, “consultar o GDD” e “refazer a Bíblia/GDD” devem localizar esse conjunto completo. Não criar aliases isolados para cada fase nem reduzir “GDD” apenas a um documento de jogo neste contexto autoral. Em referências externas, GDD pode significar Game Design Document; o namespace do Hefestus torna o uso local inequívoco.

Identificador conceitual estável: `hefestus.engenharia-integrada`. Os aliases não mudam IDs, extensões, nomes de APIs ou contratos. Este identificador e sua indexação ainda precisam ser implementados no catálogo/busca.

O enquadramento é engenharia orientada a modelos, com documentação viva, validação em tempo de edição e pipeline de entrega. “Documento ativo” descreve o modelo autoral transacional. “Active Document-Driven Architecture” pode ser expressão descritiva interna; não é apresentado como nome de padrão externo nem como certificação MDA.

### 1.4 Índice de direção

| Consulta do usuário ou da IA | Percurso nesta Bíblia/GDD |
| --- | --- |
| Entender o processo completo | 1, 3, 5 e 22 |
| Montar e executar um programa | 6–8, 10–12 e 22 |
| Pegar só o kernel/núcleo de uma ferramenta | 9, 20.3 e 23 |
| Validar durante a montagem | 13 e 22.2 |
| Salvar e recuperar | 6 e 22.4 |
| Gerar e instalar | 12 e 22.5 |
| Organizar os arquivos | 3 e 14 |
| Implementar a evolução | 16, 18, 19 e 21 |
| Entender evidências e limites | 2, 13 e 24 |
| Importar HTML/CSS/SVG e editar objetos nativos | 31.1–31.4 |
| Reimportar preservando alterações e componentes | 31.5–31.6 |
| Implementar o ciclo editar/executar/atualizar/distribuir | 31.7–31.10 |

Este índice descreve destinos documentais. Não comprova que uma busca ou navegação automática já exista no aplicativo.

## 2. Fontes, evidências e limites

| Fonte | Uso nesta edição | Limite |
| --- | --- | --- |
| Hefestus_Forja_Visual_Candidata.zip, revisão 5 | Base real inspecionada e testada nesta conversa | Não equivale a homologação em máquinas de destino |
| package.json e AGENTS.md | Versão, comandos e contrato de uso das ferramentas | Comentários e manuais não provam funcionamento |
| ARQUITETURA_REFATORACAO.md e REFATORACAO_ETAPA1–7.json | Separações já realizadas e restrições registradas | Relatos antigos são diferenciados de testes novos |
| LEIA-ME_FORJA_VISUAL.md e FORJA_PARIDADE.json | Escopo da candidata e lacunas de paridade | Algumas capacidades ainda exigem teste interativo |
| BIBLIA_CONSOLIDACAO.md | Referência histórica e inventário legado | Não é adotada como contrato integral do futuro |
| Pasted text.txt e Pasted text (2).txt | Intenções, propostas e comparações trazidas pelo usuário | Misturam conversas, raciocínios de assistentes e sugestões não verificadas |

### 2.1 Linha de base histórica registrada na edição 1.0

Esta baseline histórica não é declaração da instalação atual mais recente. A recuperação de outras conversas encontrou relato posterior de `0.47.0-alpha.1`, geração documental, workspace portátil e 347 testes. É relato de assistente, sem artefato/código/testes revalidados nesta revisão; conferir em M0. Não substituir os hashes históricos por esse número de versão.

- Versão declarada do produto: 0.46.0; a revisão 5 é revisão do arquivo, não versão 0.5 do software.
- ZIP: 498 entradas; verificação CRC sem corrupção detectada.
- SHA-256 do ZIP: `4822157e0d83144aa0a4266c1b3e297998d72aa62b6810533fd76c2406ff4a7e`.
- Execução individual dos 46 arquivos de testes: 329 testes aprovados, nenhuma falha observada, em Node 24.19.0.
- Dependências instaladas com `npm ci --ignore-scripts`; `npm run build` concluído.
- SHA-256 do HTML reconstruído: `c7e380ab931a6d869d92b0bb206e5c434e696f121fbe765a3a5ba19170f52e75`, igual ao HTML distribuído.
- Teste interativo novo não executado: navegador exigido pelo ambiente de automação indisponível. Os relatos de navegador dos documentos anteriores permanecem relatos históricos.
- Instalador Windows, instalação limpa, comparação com a segunda máquina e funcionamento integral de todos os fluxos não validados nesta execução.

Os resultados acima são registros históricos preservados da edição 1.0; não foram executados novamente nesta revisão documental. Contagem de testes não mede cobertura por requisito nem qualidade de experiência. A linha de base precisa de uma matriz funcional para que se saiba o que os 329 testes realmente comprovam.

### 2.1.1 Publicação, PC e GitHub

Esta bíblia é publicada em `rsampietro-code/programas`, na pasta `hefestus`, como plano de evolução. A linha de base testada acima é o ZIP identificado pelo hash, não o código da pasta `hefestus` desse repositório. Não foi comprovada equivalência entre as duas bases. A publicação desta bíblia não atualiza fontes, dependências, builds ou instaladores, nem homologa o snapshot do repositório. O confronto das bases integra M0. A pasta Windows indicada pelo usuário não estava acessível no ambiente desta edição; outras bíblias/GDD locais não foram sincronizadas.

### 2.1.2 Fontes e alcance da revisão 2.0

- Bíblia/GDD 1.0 lida integralmente como texto de trabalho, com seu blob Git registrado na revisão.
- Padrão organizacional `padroes/BIBLIA_PADRAO_PROJETOS.md`, versão 1.0.0: referência documental; esta edição especializa sua aplicação ao Hefestus.
- Decisões diretas do usuário nesta conversa: encapsular o processo inteiro; manter Bíblia/GDD como aliases globais; reunir arquitetura, organização e melhorias; priorizar núcleos reutilizáveis para reduzir peso.
- Inspeções locais anteriores desta conversa: manual AGENTS, padrão de arquitetura e regras de menus da instalação Hefestus_0.46. Não equivalem a auditoria integral do código nem a confirmação de identidade com o ZIP ou GitHub.
- A revisão 2.0 não repete os testes da 1.0, não afirma equivalência entre PC/GitHub/ZIP e não altera fontes de outros produtos.
- Na tentativa de acesso desta revisão, o executor local falhou ao provisionar o sandbox antes de ler/gravar arquivos. Consequentemente, a publicação remota não representa sincronização da cópia do PC.

Em futuras consultas, identificar revisão, caminho e hash das fontes locais e remotas; comparar divergências antes de decidir. GitHub não prevalece automaticamente sobre uma decisão autoral local mais recente, nem uma pasta local sobre um contrato remoto validado. Divergências sem evidência permanecem explícitas.

### 2.2 Linguagem de estado

| Estado | Significado |
| --- | --- |
| Proposto | Ideia ou desenho ainda sem implementação comprovada |
| Especificado | Contrato, escopo e aceite definidos |
| Implementado | Código existe; testes ainda podem faltar |
| Testado | Evidências registradas para um ambiente e escopo |
| Homologado | Fluxos e plataformas declarados passaram no aceite definido |
| Depreciado | Mantido por compatibilidade; substituição documentada |
| Arquivado | Fora do caminho ativo, recuperável por referência |

“Pendente”, “bloqueado” e “em execução” descrevem o andamento da tarefa. Não substituem os estados de capacidade acima. Toda evidência registra snapshot, comando ou procedimento, ambiente, data e resultado.

## 3. Estrutura da bíblia viva

A bíblia terá uma entrada principal e documentos especializados. A versão de leitura única pode ser gerada para consulta; os contratos estruturados e os registros técnicos mantêm suas identidades próprias.

| Documento/pasta propostos | Conteúdo | Atualização |
| --- | --- | --- |
| BIBLIA.md | Visão, escopo, índice e regras centrais | A cada alteração relevante do produto |
| docs/estado-atual.md | Capacidades e evidências do snapshot | A cada entrega |
| docs/produto/ | Jornadas, requisitos, exemplos e não objetivos | Quando o escopo muda |
| docs/arquitetura/ | Fronteiras, contratos, dados, concorrência e distribuição | Na mesma mudança que afeta o contrato |
| docs/ux/ | Inventário de telas, comandos, estados e padrões visuais | Ao alterar fluxos |
| docs/decisoes/ | ADRs com contexto, alternativas e consequências | Por decisão estrutural |
| docs/migracao/ | Etapas, compatibilidade, reversão e checklist | Por etapa |
| docs/manuais/ | Usuário, operação, desenvolvimento e integração com IA | Por capacidade entregue |
| quality/ | Matriz de aceite e resultados referenciados | A cada validação |
| schemas/ | Contratos executáveis versionados | Por evolução de formato |
| archive/ | Índice histórico com origem e hash | Por arquivamento |

### 3.1 Autoridade de cada informação

- Intenção do produto: requisito identificado e decisões registradas.
- Formato de entrada/saída: schema e exemplos válidos/ inválidos.
- Funcionamento observado: teste e evidência ligados ao snapshot.
- API implementada: código e teste de contrato, acompanhados de documentação.
- Versão distribuída: manifesto da entrega, dependências fixadas e hashes.
- História: arquivos antigos preservados, sem autoridade sobre contratos atuais.

Um inventário automático comprova presença de arquivos e símbolos. Não pode promover sozinho uma funcionalidade a “testada” ou “homologada”. Comentários extraídos do código não substituem manual de uso, regras de negócio ou aceite.

### 3.2 Documentação viva e autoridade dos dados

A documentação possui uma parte autoral e uma parte derivada. Objetivos, regras do produto, decisões, limites e aceite são autorais. Inventários de telas, comandos, vínculos, dependências e resultados referenciam documentos e evidências estruturadas. Regeneração não sobrescreve decisões humanas.

Fonte única de verdade significa autoridade definida por informação, sem cópias editáveis concorrentes. O documento é autoral para interface/lógica; schemas definem formatos; evidências comprovam execuções. Um relatório derivado registra a revisão que representa e indica quando está desatualizado. O texto Markdown da Bíblia não se transforma automaticamente em código executável.

Mudanças de código e contrato atualizam seus vínculos documentais na mesma entrega. Conteúdo pesado é gerado sob demanda ou na entrega; salvar não dispara compilação integral.

### 3.3 Rastreabilidade mínima

Todo requisito terá ID estável e ligação `requisito → decisão quando necessária → contrato → implementação → teste → evidência → versão de entrega`. Uma alteração que remova capacidade atual deve declarar a substituição, o impacto e a migração. Não resolver contradições apagando o histórico.

## 4. Princípios do padrão de excelência

1. **Verdade verificável:** descrição de função acompanha evidência e limite.
2. **Preservação:** manter formatos, referências e resultados até existir migração testada.
3. **Separação:** lógica de domínio não depende do DOM, da janela desktop ou do provedor de IA.
4. **Contrato antes da troca:** extrair uma fronteira com exemplos de comportamento atual antes de substituir o componente.
5. **Reutilização com origem:** verificar código, dependências e adaptação antes de importar.
6. **Complexidade proporcional:** módulo local por padrão; processo, serviço e linguagem extra apenas com necessidade demonstrada.
7. **Operação observável:** diferenciar sinal emitido, tarefa iniciada, resultado validado, falha e cancelamento.
8. **Qualidade por portões:** estética, número de testes ou score não compensam perda de dados e operação incorreta.
9. **Acessibilidade e consistência:** teclado, foco, rótulos e recuperação de falhas são parte do produto.
10. **Autonomia:** a automação executa o pedido sem etapas de autorização ou confirmação, com evidência e possibilidade de reversão quando aplicável.
11. **Desempenho medido:** escolher Rust, Wasm, Python, JavaScript ou outro motor por operação e destino.
12. **Independência de entrega:** programas gerados levam os recursos necessários e declaram seus pré-requisitos.

## 5. Arquitetura alvo do Hefestus

### 5.1 Estilo estrutural

Adotar um monólito modular como ponto de partida, com portas e adaptadores nas fronteiras externas. Isso permite extrair motores quando necessário sem tornar cada responsabilidade um serviço. A proposta usa a base JavaScript e a integração Tauri documentadas como ponto de partida de compatibilidade até que medições ou limitações justifiquem mudanças. Nenhuma linguagem, implementação ou dependência é definitiva por preferência histórica: pode ser mantida, adaptada ou substituída com contrato, evidência e migração.

### 5.2 Camadas e regras de dependência

| Camada | Responsabilidade | Pode depender de |
| --- | --- | --- |
| Domínio | Documento, IDs, regras, proteção, transações, tipos da lógica | Contratos puros e utilitários de domínio |
| Aplicação | Casos de uso: criar, editar, salvar, testar, gerar | Domínio e interfaces de portas |
| Portas | Persistência, motores, arquivos, geradores, tarefas, IA | Tipos de contrato |
| Adaptadores | IndexedDB, sistema de arquivos, Worker, CLI, Tauri, provedores | Portas e bibliotecas específicas |
| Apresentação | Canvas, Forja, ribbon, formulários, diagnóstico | Casos de uso e modelos de leitura |
| Composição | Inicialização e escolha dos adaptadores | Todas as fronteiras necessárias à montagem |

O domínio não importa UI, ferramentas de empacotamento ou SDK de IA. A UI dispara casos de uso e recebe projeções de estado. Um motor devolve dados ou comandos declarados; não recebe acesso irrestrito ao documento mutável.

### 5.3 Módulos propostos

| Módulo | Contrato principal | Primeiro resultado esperado |
| --- | --- | --- |
| document | Estado autoral, revisão, comandos e proteção | Editar sem dependência do DOM |
| logic | IR, tipos, validação e migração de eventos | Preservar os comportamentos atuais |
| runtime | Execução, tarefas, limites e diagnóstico | Somar dados com resultado rastreável |
| catalog | Metadados leves, núcleos opcionais, versões, dependências e proveniência | Resolver uma capacidade por referência fixada sem carregar a biblioteca inteira |
| engines | Adaptadores de operações por capacidade | Uma operação web e uma operação desktop reais |
| generation | Projeção do projeto para destinos | Aplicação web equivalente à prévia |
| packaging | Fechamento das dependências usadas, manifesto e instalador | Pacote mínimo funcional e verificável no destino declarado |
| workspace | Arquivos, projetos, recuperação e histórico | Ciclo abrir/editar/salvar/reabrir |
| assistance | Propostas de IA e validação de mudanças | Lote rastreável aplicado pelas ferramentas |
| quality | Rastreabilidade, contratos e medições | Relatório sem capacidades sem evidência |

`runtime` pertence à execução do programa; `application` organiza os casos de uso do editor. Evitar um módulo “motor” genérico que concentre todas as responsabilidades.

### 5.4 Responsabilidades adicionais do ciclo integrado

`quality` fornece validações incrementais sem depender da tela. `catalog` descreve as peças, mas não executa seus motores. `generation` calcula recursos exigidos pelo destino; `packaging` monta e verifica a entrega. `workspace` conserva fontes autorais e recuperação; `runtime` conserva estado de execução separado.

O núcleo do próprio Hefestus permanece pequeno, contendo apenas responsabilidades comuns demonstradas. Núcleos de capacidades especializadas entram por contratos e carregamento opcional. Não converter `engines` ou `catalog` em um repositório monolítico de todas as ferramentas.

### 5.5 Caminho de uma edição

Entrada do usuário ou agente → caso de uso → validação/proteção → transação no documento → revisão nova → projeções da interface e documentação. Alterações concorrentes incluem revisão esperada; uma regra obsoleta é rejeitada, sem sobrescrever silenciosamente edição posterior.

### 5.6 Caminho de uma execução

Evento → regra ativa → validação de entrada e contexto → resolução da operação versionada → agendamento → execução no adaptador permitido → validação da saída → aplicação do resultado → diagnóstico. Emitir evento não significa concluir operação.

## 6. Modelo autoral e formato de projeto

### 6.1 Preservar `.hefestus`

Manter a extensão atual e seus leitores. Antes de alterar o contêiner, inspecionar e registrar o formato real, seus importadores e os arquivos existentes. Não presumir que mudar a extensão implementa encapsulamento, nem converter os arquivos atuais automaticamente em ZIP.

Separar três conceitos: documento autoral `.hefestus`; workspace de desenvolvimento com arquivos e recursos; pacote de entrega executável. O documento pode referenciar recursos no workspace. A exportação portátil verifica e inclui os recursos necessários conforme o contrato vigente.

### 6.2 Envelope alvo, ainda proposto

Campos conceituais: `formatVersion`, `projectId`, `documentRevision`, `metadata`, `ui`, `logic`, `dataModels`, `engineBindings`, `assets`, `dependencyLock` e `specification`. A posição exata desses campos deve ser definida após mapear o documento atual. Adaptadores de leitura evitam reescrever tudo simultaneamente.

Versão do formato, versão do produto e revisão do documento são independentes. Campos desconhecidos são preservados quando possível; formatos futuros incompatíveis abrem em modo de leitura ou retornam erro explícito com opção de recuperação.

### 6.3 Garantias de salvamento

- Escrever primeiro em destino temporário e confirmar antes de substituir o arquivo anterior, usando a garantia disponível na plataforma.
- Validar IDs, referências, versões, recursos e integridade antes de declarar pacote completo.
- Nunca gravar parcialmente sobre o único original durante migração.
- Autosave é recuperação; não substitui a ação de salvar nem um backup portátil verificado.
- Histórico é versionado e pode ter política de retenção explícita; não prometer histórico infinito.
- Segredos ficam fora do documento e dos pacotes. O projeto referencia credenciais por identificador de configuração.
- Testar falha de escrita, arquivo truncado, recurso ausente, versão futura, migração interrompida e reabertura.

### 6.4 Reconstrução e sincronização entre PCs

Workspace portátil declara documento, recursos, fontes e contratos necessários. Hashes verificam integridade; não recompõem bytes ausentes. Uma Bíblia só textual não garante reconstrução fiel. Conservar receita de build e dependências fixadas com disponibilidade compatível.

Sincronizar por commits ou snapshots consistentes, com revisão-base e detecção de conflito. Não compartilhar banco operacional em escrita simultânea entre PCs nem escolher automaticamente o arquivo mais novo. Resolver diferenças por conteúdo, contratos, decisões e testes. Dados privados, credenciais e estado de navegador ausentes não são recriados por inferência.

Um restaurador pode verificar conteúdo, adquirir recursos declarados, preparar dependências e reconstruir artefatos permitidos. É capacidade proposta; seu nome/comando será definido após inventariar ferramentas reais. Não confundir restaurador do desenvolvimento com instalador do usuário final.

As regras complementares de documento comum, workspace e sincronização estão em 31.1, 31.5 e 31.7. Não introduzem novos formatos operacionais nesta revisão.

### 6.5 Migração de formato

Cada migrador declara origem, destino, limitações e reversibilidade. Ler e validar o original; criar cópia de segurança identificada; migrar em memória ou staging; validar a versão nova; comparar invariantes; salvar em novo destino; só então oferecer adoção. Transformações irreversíveis não recebem promessa de downgrade sem perdas.

## 7. IR: lógica comum a blocos, grafo e código

O IR é a representação intermediária executável da lógica, separada da disposição visual. Seu primeiro escopo reproduz eventos e ações existentes. Condições, variáveis e loops entram com semântica explícita, testes e migração.

O documento comum da seção 31 relaciona o IR lógico aos modelos visual e semântico; não transforma geometria em fluxo de execução nem exige converter código arbitrário em grafo.

### 7.1 Conteúdo mínimo

| Entidade | Campos conceituais |
| --- | --- |
| Graph | ID, versão, entradas, nós e conexões |
| Node | ID, referência de operação e versão, parâmetros e portas |
| Port | ID, direção, papel de controle/dado, tipo e cardinalidade |
| Connection | ID, nó/porta de origem e nó/porta de destino |
| Variable | ID, tipo, escopo, valor inicial e persistência declarada |
| Macro | Interface pública, grafo interno e versão |
| ViewState | Posição, recolhimento e modo de apresentação, sem semântica de execução |

Nomes de campos finais dependem do schema a implementar. Evitar duas fontes de fluxo concorrentes, como `children` e `connections` descrevendo relações contraditórias. Mapeamentos Unity, C# ou outro destino pertencem ao exportador, não a todo nó do domínio.

### 7.2 Regras semânticas

- IDs de porta são estáveis; renomear um rótulo não rompe conexões.
- Tipos distinguem texto, número, booleano, lista, registro, opcional e referências de recurso. Tipos adicionais entram por contrato.
- Conversão potencialmente ambígua é explícita; somar texto e número não produz coerção silenciosa.
- Define-se a ordem das ações e o tratamento de erro, cancelamento e retorno.
- Ciclos são inválidos salvo quando representados por estruturas de repetição suportadas, com limites declarados.
- Estado de execução não é gravado como estado autoral por acidente.
- Cada migração de eventos antigos tem exemplos de equivalência e casos não convertíveis com diagnóstico.
- Código livre permanece uma extensão identificada, com entradas, saídas, runtime e permissões; não fingir que qualquer código pode voltar para blocos sem perda.

### 7.3 Três apresentações do mesmo IR

| Modo | Experiência | Aceite |
| --- | --- | --- |
| Blocos | Evento e ação, linguagem simples e parâmetros essenciais | Criar clique que muda texto |
| Híbrido | Portas e valores de dados editáveis | Somar dois campos com validação |
| Grafo | Conexões, tipos, macros e diagnóstico completo | Fluxo com condição e repetição limitada |

Alternar modo preserva IDs, versões e comportamento. Não exige que todo nó possa ser simplificado; nós avançados podem aparecer como blocos compostos com identificação clara.

### 7.4 Categorias visuais

Eventos verde, ações azul, variáveis roxo, controle amarelo, matemática/lógica laranja, conversão vermelho e utilitários cinza são a proposta inicial para o Hefestus. Nome, ícone e forma complementam a cor. Não apresentar essa paleta como convenção oficial de ferramentas externas.

### 7.5 Operações em grupo e macros

Aplicar comportamento a vários elementos usa as capacidades compatíveis e uma transação validada em lote. Antes de confirmar, mostrar alvos, exceções e alterações. Uma falha impede aplicação parcial, salvo se o usuário selecionar explicitamente um modo parcial e o contrato o suportar.

Aplicar um comportamento em lote e criar uma macro são operações diferentes. Macro cria uma unidade reutilizável com interface e grafo interno; lote aplica mudanças a vários alvos. Não fundir as duas operações automaticamente.

## 8. Motores, tarefas e isolamento

### 8.1 Manifesto de operação

Uma operação deve declarar ID, versão, capacidade, schemas de entrada/saída, runtime, dependências, permissões, limites, efeitos externos, política de cancelamento e códigos de erro. Ferramentas legadas entram por adaptador; não inferir contrato de negócio apenas a partir do nome da função.

Envelope conceitual de tarefa: `requestId`, `projectRevision`, `operationRef`, `input`, `parameters`, `deadline`, `capabilities`. Resultado: `requestId`, `status`, `output` validado ou erro tipado, duração e avisos. Progresso possui sequência e deve cessar após estado terminal.

Estados: pendente, executando, concluído, falhou, cancelado e prazo excedido. Só existe um estado terminal por solicitação. Retorno tardio não aplica alterações a uma sessão encerrada ou revisão incompatível.

### 8.2 Adaptadores

| Adaptador | Uso | Limite a explicitar |
| --- | --- | --- |
| JavaScript no editor | Código confiável que depende do DOM | Pode bloquear a UI; não é ambiente para código desconhecido |
| Worker web | Cálculo sem DOM e interrupção por término do Worker | Não é sandbox de rede ou do sistema operacional |
| Processo desktop | Motores nativos, Python e ferramentas CLI | Permissões, argumentos, diretórios e ciclo de processo exigem controle |
| Serviço remoto | Operação que depende de servidor | Autenticação, disponibilidade, limites, latência e privacidade |
| Wasm | Operações compatíveis com o destino e benefício medido | APIs hospedeiras continuam delimitando capacidades |

Falha do executor restrito não pode ativar automaticamente um executor mais privilegiado. Cancelar não desfaz efeitos externos já concluídos. Repetição automática só ocorre quando a operação é idempotente ou possui chave de idempotência e política de retry.

### 8.3 Política de escolha de motor

Eliminar primeiro candidatos incompatíveis com plataforma ou contrato. Comparar os restantes com corpus representativo: correção, latência p50/p95, pico de memória, tamanho distribuído, custo de integração e manutenção. Registrar versão, máquina, entrada, aquecimento e dispersão. Um score agregado pode ordenar alternativas válidas, nunca compensar falha de correção.

A diretriz autoral admite dois ou mais motores e sua reprodução nos programas gerados quando evidências justificarem. O Hefestus deve suportar essa composição por contratos, sem exigir múltiplos processos ou um segundo motor artificial para toda operação. Módulo, processo e motor são conceitos distintos.

Escolher linguagem por capacidade, destino, bibliotecas e custo total medido. O conjunto citado pelo usuário inclui Rust, C++, C#, Java e Python; interface web e base JavaScript documentada continuam no mapa. Isso não significa instalar todos os runtimes, criar compilador universal ou reescrever o Hefestus inteiro em Rust. Travessias FFI/IPC, serialização, cópias, inicialização, build e manutenção entram no custo; agrupar trabalho quando chamadas finas destruírem o benefício.

Fallback precisa produzir resultado equivalente ou comunicar diferença, permanecer no limite de permissões e ter evidência. Sem medição, conservar a implementação válida conhecida quando existir; heurísticas orientam experimentos, não troca opaca de resultado.

## 9. Biblioteca de núcleos, catálogo e dependências

### 9.1 Decisão autoral: aproveitar a capacidade necessária

Priorizar o núcleo reutilizável de uma ferramenta em vez de instalar ou distribuir o aplicativo completo. “Kernel” é o apelido informal usado pelo usuário; nesta Bíblia/GDD significa núcleo funcional de uma capacidade, e não kernel do sistema operacional. Não presumir que todo aplicativo exponha um núcleo independente.

Objetivo: biblioteca leve para consultar e carregar, programa gerado com apenas o necessário e manutenção rastreável. O menor número de arquivos não é o critério isolado: um recorte quebrado ou impossível de atualizar não é uma otimização válida.

A biblioteca do Hefestus e o pacote de cada programa são alvos diferentes. Uma capacidade usada para construir o programa pode permanecer apenas no editor; uma capacidade necessária à execução deve acompanhar a entrega ou ter serviço/pré-requisito explicitamente contratado.

### 9.2 Ordem de avaliação da reutilização

| Alternativa | Preferência e condição |
| --- | --- |
| Biblioteca/API headless oficial | Primeira candidata quando realiza a operação e tem plataforma e manutenção adequadas |
| Módulo ou subpacote oficial | Importar pela API pública apenas o necessário; avaliar as dependências transitivas reais |
| Compilação seletiva do projeto original | Usar opções suportadas de build e preservar a receita reproduzível |
| Núcleo extraído com adaptação | Usar quando houver fronteira técnica verificável; assumir manutenção do recorte e de seus patches |
| Motor externo por processo/serviço | Usar quando o isolamento ou acoplamento justificar; o aplicativo externo continua sendo dependência declarada |
| Implementação própria baseada no contrato | Escolher quando não houver recorte viável, com esforço e origem documentados |
| Aplicativo completo | Exceção justificada por capacidade inseparável ou custo total melhor; não adoção automática |

Classificar separadamente a decisão de adoção: reutilizar, adaptar, usar como referência ou criar do zero. Referência visual ou conceitual não vira dependência integrada.

### 9.3 Processo de aquisição e extração

1. Descrever a capacidade procurada, entradas, saídas, destinos, erros e corpus de aceite.
2. Inspecionar origem, versão, API pública e manutenção.
3. Mapear fronteiras e grafo de dependências: código, dados, modelos, fontes, recursos, configurações e ferramentas de build.
4. Identificar dependências de UI, DOM, host, disco, rede, estado global, registro de plugins, inicialização e código gerado.
5. Comparar as alternativas da seção 9.2, incluindo tamanho instalado e custo de atualização.
6. Preparar candidato em staging, fixado em commit/versão/hash, sem alterar silenciosamente peças ativas.
7. Encapsular a operação em um adaptador Hefestus e validar entradas, saídas, efeitos e erros.
8. Executar testes de contrato, corpus, falhas, integração, empacotamento e medição com dependências reais.
9. Registrar decisão e publicar uma versão imutável do candidato aprovado, mantendo a versão anterior.
10. Atualizar o lock do projeto por mudança explícita e executar os testes dos consumidores afetados.

Download de fontes para inspeção/build pode exigir o repositório completo. Isso não obriga sua inclusão no editor ou nos programas gerados. Não prometer “nenhum download grande” sem medir a cadeia de aquisição.

### 9.4 Contrato de um núcleo

Cada núcleo registra:

- Identidade estável, versão do contrato, versão da implementação e capacidade.
- Origem/repositório, commit/tag fixados, caminhos de origem, hashes e modificações locais.
- Entradas/saídas e seus schemas, unidades, nulabilidade, limites, erros e exemplos.
- Dependências diretas/transitivas, recursos de runtime e ferramentas somente de desenvolvimento/build.
- Execução suportada: JavaScript, Worker, processo, Wasm ou remoto; plataformas e restrições.
- Permissões, efeitos externos, cancelamento, timeout e política de repetição.
- API do adaptador Hefestus, compatibilidade, consumidor identificado e evidência.
- Tamanho transferido, instalado e distribuído; tempo de carga, memória e desempenho no corpus.
- Receita de reconstrução, patches, política de atualização e responsável pela manutenção.

Campos e formatos desta ficha são especificados documentalmente; o schema executável e seus validadores ainda devem ser implementados.

### 9.5 Catálogo leve e conteúdo sob demanda

Separar três camadas:

| Camada | Conteúdo | Carregamento |
| --- | --- | --- |
| Índice | IDs, descrição curta, tags, versões, capacidade e compatibilidade | Necessário à busca, sem importar todos os motores |
| Pacote | Código/recursos de uma versão e seu manifesto | Quando solicitado ou exigido pelo projeto |
| Cache | Cópias verificadas e artefatos recuperáveis | Política limitada, com tamanho e dependentes visíveis |

Preservar contratos do armazém existente. IndexedDB permanece o adaptador web inicial registrado na baseline; eventual mudança depende da auditoria e da necessidade. A separação lógica não exige substituir o banco atual de imediato.

Carregamento tardio não significa download oculto. Mostrar se o conteúdo já está disponível localmente e se a ação requer rede. Cancelamento/falha de aquisição deixam o candidato incompleto fora do catálogo ativo. Verificar integridade antes de ativar; conservar configurações e segredos fora dos pacotes.

### 9.6 Dependências mínimas e entrega seletiva

Resolver o fechamento transitivo da capacidade utilizada, incluindo recursos carregados dinamicamente. Tree-shaking e eliminação de código morto podem reduzir o bundle onde forem suportados; não substituem a análise de efeitos colaterais, imports dinâmicos e recursos externos.

O compilador/empacotador recebe entradas explícitas e uma lista de recursos dinâmicos. Testar o artefato resultante, não apenas o código de origem. Bibliotecas C/C++, Python ou outros runtimes precisam de estratégia própria; não presumir que uma opção de bundler JavaScript resolva seu empacotamento.

Evitar engines, UI de editor, exemplos, datasets de teste, ferramentas de build e documentação de desenvolvimento no runtime gerado, salvo dependência comprovada. Manual do usuário e ajuda podem ser necessários mesmo quando a documentação técnica fica fora do runtime.

Um serviço remoto pode reduzir bytes locais, mas acrescenta disponibilidade, credenciais, custo e restrições offline. Não contabilizar essa troca como independência ou redução total comprovada.

### 9.7 Deduplicação, versões e atualização

Hashes identificam conteúdo idêntico; similaridade só sugere revisão. Deduplicar bytes não torna contratos distintos intercambiáveis. Nunca unir versões diferentes apenas pelo nome.

Projetos e entregas fixam versões e recursos em lock. Atualizar o catálogo não regrava projetos existentes. Antes de depreciar/remover uma versão, calcular referências, preservar dependentes ativos e definir recuperação. Coleta de lixo opera sobre itens comprovadamente sem uso, com política de retenção e possibilidade de recuperação aplicável.

Para núcleos extraídos, registrar divergências do upstream e um procedimento de incorporar correções sem perder patches locais. Falha de manutenção ou vulnerabilidade relevante gera revisão da capacidade, sem promover automaticamente outra versão incompatível.

### 9.8 Aceite da política de leveza

Comparar candidato completo e candidato mínimo com a mesma operação, corpus, destino e ambiente. Registrar baseline, valores absolutos, diferenças e metodologia. Medir separadamente catálogo, download, disco, bundle, tempo de carga e memória.

Adotar após correção, compatibilidade e recuperação satisfatórias. Ganho de tamanho não compensa perda de comportamento, startup quebrado, dependência oculta ou atualização impraticável. Nenhuma porcentagem de redução é declarada antes de medir.

A primeira prova usa uma capacidade realmente necessária ao próprio Hefestus. A escolha do pacote ocorre após M0, sem anunciar extração de ferramenta ainda não inspecionada.

## 10. UX e padrão visual profissional

### 10.1 Modelo de navegação proposto

Projetos e telas; Designer; Lógica/Forja; Código; Dados e motores; Biblioteca; Testar; Bíblia/GDD; Gerar e distribuir. São áreas do mesmo workspace, com seleção e contexto consistentes. Validar a navegação por tarefas antes de reconstruir todos os painéis.

A experiência recuperada no plano de integração prioriza familiaridade de aplicativos de produtividade, identidade Hefestus e progressão por tarefas. Tela inicial: novo, modelos, recentes, abrir e recuperar. Backstage: operações do projeto e configurações. Acesso rápido: salvar, desfazer/refazer e executar prévia. Ribbon contextual usa o registro único de comandos.

Abas candidatas: Início, Inserir, Layout, Comportamento, Dados, Testar, Publicar, Exibir e Ajuda. Painel esquerdo: projeto/telas, componentes e camadas. Centro: vistas do documento. Painel direito: propriedades, eventos/vínculos e diagnóstico da seleção. Rodapé: salvamento, tarefa, avisos e zoom. Guias contextuais dependem da seleção sem deslocar os comandos frequentes.

Esta composição é especificação de UX, não imposição de framework nem comprovação de implementação. “Restaurar área de trabalho” recupera painéis fora da janela, sem alterar o documento autoral, quando implementado.

### 10.2 Contrato de comando unificado

Um registro de comandos define ID, rótulo, categoria, disponibilidade, atalhos, argumento e caso de uso. Ribbon, menu contextual, paleta de comandos, toolbar e ferramentas de IA usam esse registro quando aplicável. A regra de negócio não é copiada para cada botão.

### 10.3 Critérios de interação

- Seleção, alças, pivôs, encaixes e feedback de arraste permanecem visíveis no zoom útil.
- Foco, teclado, Tab/Shift+Tab, Escape, desfazer/refazer e rótulos fazem parte do aceite.
- Estados vazio, carregando, sem resultado, inválido, indisponível, erro e recuperação têm comportamento definido.
- Responsividade redistribui painéis e ribbon sem esconder comandos essenciais permanentemente.
- Modo iniciante oferece exemplos e divulgação progressiva; falhas e permissões não ficam ocultas por serem “avançadas”.
- Temas e componentes usam tokens compartilhados; identidade e organização podem variar por produto.
- Ícones têm nome acessível e ajuda. Cor não é o único canal de informação.
- Telas do produto mostram linguagem de tarefa. Diagnóstico técnico fica acessível quando necessário.

### 10.4 Workspace da Engenharia Integrada

O contexto do projeto acompanha Designer, Forja, Código, Dados e motores, Biblioteca, Testar e Gerar/distribuir. Uma entrada “Bíblia/GDD” abre a visão do processo inteiro: objetivo, requisitos, revisão, operações, dependências, diagnósticos e entregas.

O usuário deve localizar um problema e navegar até o elemento, operação ou dependência responsável. Mostrar revisão da evidência, origem do problema e correção possível. Pendências essenciais ficam sinalizadas; salvar e publicar continuam livres.

Não exigir que o usuário domine “IR”, “SBOM” ou “adaptador” para montar o programa. Os detalhes técnicos permanecem acessíveis no contexto e na documentação.

### 10.5 Validação visual

No Hefestus, verificar ao menos 1440, 1024, 768 e 390 pixels para o shell web, com layout esperado documentado por faixa. Isso não promete conforto de edição completa em celular; o perfil de edição deve declarar sua largura recomendada. Capturas comparam estados estáveis, incluindo tema claro/escuro e zoom relevante. Testes funcionais de fluxo complementam capturas.

## 11. IA e automação de construção

CLI e MCP existentes são pontos de entrada. A IA consulta catálogo, entende requisitos, propõe mudanças e usa casos de uso validados. Não recebe uma cópia paralela do modelo nem edita JSON protegido por fora das ferramentas.

Pipeline alvo: requisito → proposta estruturada → validação → aplicação em workspace isolado ou transação → testes adequados → relatório de diferenças → adoção. Não há etapas de autorização ou confirmação: a automação executa o que foi pedido.

Guardar requisito de origem, ferramentas usadas, versões e diferenças. Memória assistida distingue decisão do usuário, observação de teste e sugestão da IA. Não salvar raciocínio interno como especificação nem promover texto gerado a evidência.

Provedores são adaptadores com limites de custo e concorrência. Orquestração de vários agentes, memória externa, voz e suíte de escritório são capacidades opcionais, sujeitas à mesma política de núcleos da seção 9. Não incorporar aplicações completas por terem sido citadas como referência. Suas implementações e fronteiras precisam de avaliação específica.

Autoaperfeiçoamento permanece fase posterior: propostas em staging, avaliação independente, corpus reservado, comparação com baseline e reversão ensaiada. O sistema não pode alterar o critério de sucesso durante a própria avaliação para declarar melhoria. Autohospedagem só é considerada após reconstrução reproduzível e recuperação demonstrada.

### 11.1 RAG, MCP e fine-tuning como procedimentos

O Hefestus segue os [procedimentos de IA do padrão 1.1.0](../padroes/PROCEDIMENTOS_IA.md). Estado por item na última coluna. PROC-MCP-001 está implementado e testado; os demais continuam propostos: nenhum índice ou modelo ajustado foi verificado.

| ID | Procedimento | Aplicação no Hefestus | Estado e aceite |
| --- | --- | --- | --- |
| PROC-MCP-001 | Servidor MCP | `ferramentas/hefestus-mcp.mjs` (41 ferramentas, protocolo 2025-06-18). Efeitos declarados numa tabela única (`ferramentas/efeitosMcp.mjs`), da qual o servidor deriva as indicações MCP; fichas geradas em `docs/ia/mcp/FERRAMENTAS.md` (`npm run mcp:fichas`); ferramentas de leitura não regravam o projeto; resultado também em `structuredContent` | **Implementado e testado** (`testes/mcp.test.mjs`: contrato, fichas em dia, mesmo projeto e mesmo erro pelo motor do editor, CLI e MCP, caminhos fora da pasta recusados). Não homologado com clientes MCP reais |
| PROC-RAG-001 | RAG da documentação | Corpus: esta bíblia, o padrão, os manuais em `docs/ia/` (`MANUAL_FABRICA.md`, `AGENTS_MODELO.md`, `PERFIS_TECNOLOGICOS.md`) e o catálogo de núcleos, com citação de seção. Exposto ao assistente como ferramenta ou recurso do PROC-MCP-001 | **Proposto.** Perguntas-ouro sobre decisões e contratos; resposta “não encontrado” para o que a bíblia não define |
| PROC-RAG-002 | RAG do projeto aberto | Elementos, sinais e especificação do documento `.hefestus` como corpus por revisão, para o assistente responder sobre o projeto do usuário sem ler o JSON por fora das ferramentas | **Proposto.** Resposta cita IDs reais de elementos; índice invalidado quando a revisão muda |
| PROC-FT-001 | Fine-tuning | Não planejado. Só entra se a baseline com contexto, RAG e MCP falhar em tarefa estreita medida (por exemplo, formato do lote de construção) | **Proposto.** ADR com baseline e corpus reservado antes de qualquer treino |

Programas gerados pelo Hefestus herdam a mesma regra: um programa que use IA declara suas fichas na própria bíblia; o gerador não presume RAG, MCP ou modelo ajustado sem requisito.

## 12. Geração e distribuição

Separar projeto autoral, runtime do programa, gerador do destino e empacotador. Um programa gerado não deve carregar o editor inteiro sem necessidade. Uma peça sem implementação para o destino gera erro de capacidade, em vez de exportação aparentemente concluída.

### 12.1 Pipeline alvo

Validar documento e referências; resolver lock; validar capacidades do destino; gerar código/recursos; executar testes de contrato e casos críticos; compilar quando aplicável; montar pacote; gerar manifesto; verificar pacote em ambiente limpo; registrar resultado.

### 12.2 Destinos iniciais

- Web: preservar HTML autônomo como destino existente; declarar recursos externos e comportamento offline.
- Windows/Tauri: manter integração existente e validar build, instalação, abertura, salvamento, desinstalação e pré-requisitos reais.
- Outros sistemas: matriz separada por plataforma e arquitetura, sem promessa de “qualquer PC”.

Política de fontes, runtimes e instaladores offline deve ser explícita. Bootstrapper e runtime completo são opções distintas, a confirmar no empacotamento real. Não fixar tamanho de instalador sem medir a entrega.

O manifesto final registra versão de produto/formato, snapshot do código, dependências, plataforma, hashes, capacidades testadas e limitações. A associação `.hefestus` e seu ícone exigem teste de abertura por duplo clique, caminhos com espaços/acentos e remoção correta da associação aplicável.

### 12.3 Instalador dentro da Bíblia/GDD

O instalador é uma saída da Engenharia Integrada, com requisitos e evidências próprios. “Instalador da Bíblia/GDD” significa instalador do programa definido pelo processo, não um instalador do arquivo Markdown.

Separar instalador do próprio Hefestus e instaladores dos programas gerados. O primeiro inclui recursos do editor realmente necessários; cada programa gerado inclui seu runtime e fechamento de dependências, sem levar a biblioteca inteira ou o Designer por padrão.

Perfis a especificar e verificar: web autônoma; aplicação desktop portátil quando suportada; instalador Windows com pré-requisitos explícitos. Não apresentar os três como já entregues. O usuário escolhe destino e requisito online/offline antes de gerar.

Um instalador deve declarar versão, arquitetura, localização de dados, necessidade de privilégios, pré-requisitos, atalhos, associações, atualização e desinstalação. Testar primeira instalação, atualização, falha/interrupção, reinstalação e remoção no escopo suportado. Não apagar dados autorais por padrão; política de retenção deve ser explícita.

Ambiente limpo é diferente da máquina de desenvolvimento: verificar ausência do repositório, caches, SDKs e caminhos pessoais exigidos indevidamente. Para offline, verificar com rede indisponível e runtimes requeridos incluídos ou previamente declarados. Política de WebView, assinatura e atualizações depende da plataforma/toolchain efetivamente escolhido, sem prometer implementação nesta revisão.

### 12.4 Reprodutibilidade

Mesma entrada e lock devem preservar semântica e conteúdo gerado. Identificar timestamps e outros campos variáveis. Reprodutibilidade byte a byte de binários é meta separada, condicionada ao toolchain; não deduzir isso da igualdade de um HTML. Registrar ambiente e comandos para repetir a entrega.

## 13. Padrão de qualidade e portões de entrega

Este é um padrão interno proposto, não uma certificação externa. Aplica critérios proporcionais ao risco e ao tipo de produto.

| Portão | Condição de passagem | Evidência mínima |
| --- | --- | --- |
| Q0 — Escopo | Requisitos críticos, plataformas e não objetivos definidos | Matriz de requisitos |
| Q1 — Contratos | Formatos, erros e compatibilidade especificados | Schemas, exemplos e ADRs pertinentes |
| Q2 — Implementação | Casos críticos passam e invariantes preservados | Testes de domínio/contrato |
| Q3 — Integração | UI executa motor real e trata falhas | Teste ponta a ponta representativo |
| Q4 — Experiência | Jornadas, teclado, estados e recuperação verificados | Checklist e evidências interativas |
| Q5 — Distribuição | Artefato instala/abre no destino e inclui recursos | Ensaio em ambiente limpo |
| Q6 — Operação | Diagnóstico, backup e recuperação definidos | Manual e teste de restauração |

Os portões são referências, não bloqueios: falha crítica de integridade, perda de dados ou operação incorreta é registrada como risco, e a decisão de homologar e entregar é do responsável. Pendências ficam registradas com impacto e versão de correção. Semáforo ou nota nunca substitui esses portões.

### 13.1 Métricas iniciais propostas

| Dimensão | Meta de aceite | Como obter |
| --- | --- | --- |
| Rastreabilidade | 100% dos requisitos críticos com contrato e evidência | Validação da matriz |
| Persistência | Nenhuma perda nos casos de migração selecionados | Corpus versionado e testes de reabertura |
| Regressão | Zero regressão crítica aceita sem resolução | Comparação com baseline |
| UI | Nenhum bloqueio nas jornadas e perfis declarados | Teste interativo de tarefas |
| Catálogo | Pesquisa p95 até 150 ms no corpus de referência | Benchmark após fixar máquina e tamanho |
| Edição | Resposta p95 até 100 ms em ações simples do corpus | Instrumentação sem incluir renderizações não relacionadas |
| Entrega | Instalar e iniciar no ambiente limpo declarado | Checklist por plataforma |

Os números de latência são metas iniciais, não resultados observados. Antes de cobrá-los, a etapa de baseline fixa máquina, corpus, amostra, instrumentação e orçamento. Se a meta for inviável, registrar a revisão e seu motivo; não trocar silenciosamente o dataset.

### 13.2 Estratégia de testes

Domínio e migrações recebem testes determinísticos. Fronteiras recebem testes de contrato. Fluxos críticos recebem integração e ponta a ponta. Parsers/importadores recebem entradas inválidas e, quando útil, fuzzing limitado. Geradores recebem equivalência semântica e snapshots seletivos. Recursos de segurança recebem casos negativos específicos. Evitar testar detalhes internos apenas para aumentar contagem.

### 13.3 Validação antecipada e evidência por revisão

Validação em tempo de edição aplica verificações estruturais rápidas às partes alteradas. A estratégia shift-left antecipa a detecção, mas mantém testes de integração, artefato e instalação. Resultado rápido não substitui ensaio do programa gerado.

Evidência inclui revisão do projeto, versão dos contratos, snapshot e lock usados. Modificar entradas relevantes invalida a evidência afetada; resultados anteriores ficam no histórico. Uma mudança de rótulo não exige automaticamente repetir a instalação; uma alteração de dependência de runtime pode exigir.

Validador informa regra, severidade, alvo, mensagem e contexto da revisão. Diagnósticos de tarefas antigas não sobrescrevem a revisão atual. Regras estruturais críticas geram aviso destacado; pendências de produto são salvas e sinalizadas.

### 13.4 Observabilidade local

Eventos técnicos com `traceId`, tarefa, operação e versão, estado, duração e erro sanitizado. Separar medições de desempenho, decisões arquiteturais e propostas de IA. Retenção limitada e exportação explícita; nada de conteúdo de documentos, credenciais ou áudio em log por padrão. A abertura do programa não deve depender de telemetria remota.

## 14. Organização padrão dos projetos

Estrutura lógica proposta; não é uma ordem de mover imediatamente os arquivos atuais. Linguagens e ferramentas podem exigir convenções próprias.

| Caminho | Papel |
| --- | --- |
| BIBLIA_ARQUITETURA_GDD.md | Entrada canônica atual deste processo no repositório Hefestus |
| project.manifest.json | Identidade, perfil, destinos e referências documentais |
| schemas/ | Contratos de dados e configuração |
| src/domain/ | Regras e entidades |
| src/application/ | Casos de uso |
| src/ports/ | Interfaces externas |
| src/adapters/ | Implementações por plataforma |
| src/ui/ | Apresentação e recursos de interação |
| assets/ | Recursos autorais e identidade visual |
| tests/ | Contratos, integração, corpus e fluxos |
| docs/ | Produto, arquitetura, decisões e manuais |
| tools/ | Ferramentas de desenvolvimento e geração |
| quality/ | Matrizes e índices de evidência |
| licenses/ | Avisos e proveniência de terceiros |
| build/ e dist/ | Saídas geradas, separadas dos fontes |

No Hefestus, manter fachadas e caminhos legados durante a transição. Este arquivo permanece a entrada canônica atual para preservar links. Uma futura BIBLIA.md, se criada, deve apontar para a mesma fonte ou resultar de migração explícita, sem duas bíblias concorrentes.

Manter a estrutura nativa dos módulos JavaScript, Tauri/Rust e ferramentas que forem comprovados na auditoria. Manifestos referenciam caminhos reais; não mover fontes só para obter simetria de diretórios. Diretório só é criado quando tem conteúdo ou propósito concreto.

### 14.1 Criar, abrir e salvar no padrão

Criar seleciona perfil, destinos e template; gera identidade, documento inicial, índice da bíblia e requisitos mínimos. Abrir detecta formato e versão e mostra diagnóstico sem migrar silenciosamente. Salvar atualiza documento e índices derivados de forma incremental. Geração pesada de documentação ocorre sob demanda ou em tarefa de build; não deve atrasar toda edição.

### 14.2 Documentação por unidade de código

Módulo público informa propósito, entradas/saídas, erros, efeitos, invariantes, dependências e exemplo significativo. Registrar comentários quando explicam intenção e limitações, evitando repetir cada linha. APIs internas triviais não precisam de uma página de manual. Códigos completos ficam no repositório; a bíblia aponta para versão e caminho.

## 15. Aplicação do padrão dentro do Hefestus

Esta edição concentra a organização no próprio Hefestus. Não usa outros projetos do acervo como fonte de capacidade nem afirma que compartilhem sua arquitetura.

| Área do Hefestus | Responsabilidade no processo |
| --- | --- |
| Designer | Interface autoral, seleção e transformações por comandos |
| Forja | Lógica, portas, vínculos e diagnósticos do mesmo documento |
| Ferramentas CLI/MCP | Casos de uso com as mesmas proteções e revisões |
| Biblioteca/armazém | Catálogo leve, origem, pacotes opcionais e locks |
| Runtime | Operações reais, tarefas e resultados validados |
| Documentação | Decisões autorais e projeções com revisão identificada |
| Geração | Projeção para cada destino e compatibilidade |
| Empacotamento | Recursos mínimos necessários, manifesto e instalador |
| Qualidade | Contratos, corpus, regressão, evidências e portões |

Compartilhar código entre áreas quando houver contrato e consumidores reais, evitando duplicar regras em menus, exportadores e agentes. Módulos especializados não entram no núcleo comum sem necessidade.

Programas pequenos gerados pelo Hefestus são consumidores de teste da plataforma. A generalização para outros produtos fica como trabalho posterior fora desta revisão. Não bloquear o aceite do próprio Hefestus pela migração de outro projeto.

## 16. Plano de migração do Hefestus

Refatorar por fatias verticais e contratos preservados. Cada etapa entrega uma versão utilizável, uma evidência e um procedimento de retorno. Não fazer uma reescrita integral antes de aprender com os fluxos reais.

### M0 — Congelar e mapear a base

Entregáveis: snapshot com hash, inventário de formatos/comandos/módulos, mapa dos 329 testes, corpus de projetos antigos e matriz de diferenças entre máquinas. Registrar campos e importadores reais do `.hefestus`.

Aceite: reconstruir HTML da base, abrir o corpus selecionado quando houver ambiente de UI e identificar explicitamente qualquer caso sem evidência. Retorno: snapshot original intacto. Dependência: nenhuma. Risco: arquivos externos faltantes e versões locais divergentes.

### M1 — Instituir bíblia e contratos mínimos

Entregáveis: estrutura documental, requisitos identificados, ADRs iniciais, schemas dos contratos atuais e verificador de referências. Criar perfis mínimo e completo do padrão para evitar burocracia em projetos pequenos.

Aceite: cada requisito crítico aponta para estado e evidência ou lacuna; nenhum schema novo é apresentado como formato já utilizado. Retorno: documentação não altera runtime. Depende de M0.

### M2 — Separar casos de uso e estado da UI

Entregáveis: fachada de documento, comandos de edição, revisão esperada, registro de comandos e modelos de leitura. Aproveitar controlador da Forja e armazém já modularizados.

Aceite: criar, selecionar, aplicar comportamento, desfazer/refazer e salvar usando as mesmas proteções pelo editor e pelas ferramentas. Domínio sem importação de UI. Retorno: fachada encaminha ao caminho anterior. Depende de M1.

### M3 — Introduzir IR compatível

Entregáveis: schema IR v1, adaptador de eventos existentes, validador de portas/tipos, diagnóstico, variáveis e condição inicial. Inicialmente uma fonte autoral com adaptadores de leitura; evitar gravação paralela conflitante do mesmo comportamento.

Aceite: comportamento antigo equivalente após abrir/salvar; projetos simples alternam blocos/híbrido/grafo sem mudar resultado. Loops só entram com semântica e limites testados. Retorno: documento original e caminho de leitura legado. Depende de M2.

### M4 — Fechar runtime e contrato de motor

Entregáveis: manifesto de operação, tarefas, saída validada, limites e adaptadores Worker/processo conforme destino. Preservar compatibilidade das ferramentas existentes.

Aceite: soma de dois campos ponta a ponta; entrada inválida; erro de motor; cancelamento; timeout; saída tardia; resposta inválida. Cada teste usa uma operação real conhecida. Retorno: desativar a nova capacidade para o projeto, sem fallback privilegiado silencioso. Depende de M3.

### M5 — Unificar experiência da Forja

Entregáveis: blocos/híbrido/grafo do mesmo IR, inspetor, lote de comportamentos, macros explícitas, diagnóstico e atalhos. Oficina de Menus passa a ser uma paleta especializada do ambiente de lógica, preservando a capacidade existente.

Aceite: usuário conclui os projetos-âncora com teclado e instruções curtas; seleções e mudanças têm histórico; nenhuma regra desaparece ao trocar modo. Retorno: superfície anterior acessível enquanto houver lacunas de paridade. Depende de M3 e M4.

### M6 — Gerar aplicações independentes

Entregáveis: separação dos geradores web e desktop, lock de recursos, manifesto e testes de equivalência prévia/exportação. Dar continuidade ao pipeline existente, sem substituição desnecessária.

Aceite: programa da soma abre fora do Hefestus, executa, salva/reabre seus dados conforme requisito e informa falhas. Instalação Windows só é aprovada após ensaio no destino. Retorno: exportador anterior continua disponível para os projetos que ele suporta. Depende de M4; usa a interface de M5 quando disponível.

### M7 — Homologar uma capacidade especializada gerada

Entregáveis: selecionar um projeto autoral de teste do Hefestus com necessidade real de motor especializado; definir operações e corpus; resolver núcleo mínimo pela seção 9; gerar pacote independente. O cenário PDF da edição 1.0 permanece candidato histórico, sem auditoria nem obrigação de reconstruir outro produto nesta revisão.

Aceite: executar as operações escolhidas, salvar e reabrir o resultado, verificar integridade, empacotar apenas dependências usadas e instalar no ambiente limpo declarado. Recursos com alegação de segurança precisam de prova específica. Retorno: núcleo e pacote anteriores com documentos originais preservados. Depende de M6.

### M8 — Validar segundo programa gerado e biblioteca mínima

Entregáveis: segundo projeto autoral de teste do Hefestus, com operação diferente da soma, manifesto de dependências e relatório comparativo de tamanho/carga. Compartilhar apenas contratos e núcleos efetivamente consumidos.

Aceite: os dois programas funcionam independentemente do editor e entre si; nenhum recebe a biblioteca inteira; atualizar uma peça exige mudança explícita do lock; versões anteriores permanecem reproduzíveis no escopo declarado. Retorno: adaptadores e pacotes anteriores preservados. Depende de M1 e, para execução/exportação, de M4/M6.

### M9 — Otimização e automação avançada

Entregáveis: benchmarks, propostas comparáveis, corpus reservado, experimentação e eventual autohospedagem. Integrações de memória, equipes de agentes e voz entram somente com caso de uso definido.

Aceite: melhoria reproduzível sem regressão crítica, fallback aplicável testado e retorno demonstrado. Depende de baseline estável e de M6/M8 para os recursos que substituir. Nenhuma adoção automática de candidatos precede esse aceite.

### 16.1 Pacotes transversais recuperados

- M0: reconciliar PC/GitHub/ZIP e relato alpha; inventariar paridade da Forja, ferramentas e formatos reais.
- M1: registrar aliases globais, fichas de núcleo, planos de instalação/verificação e rotas de alteração, inicialmente como contratos.
- M2/M3: ligar validação incremental ao comando/documento e preservar semântica das superfícies.
- M4: validar uma capacidade existente por núcleo/adaptador, com tarefa, aquisição/ativação e lock.
- M5: jornada criar/montar/ligar/testar/publicar com ribbon/painéis e diagnóstico contextual.
- M6: fechar prévia/exportação, documentação por revisão e instalador sem dependências de desenvolvimento indevidas.
- M7/M8: medir reutilização seletiva, segunda capacidade e recuperação dos pacotes.
- M9: score, experimentação e autohospedagem somente sobre a base já verificada.

### 16.2 Ordem e previsão

Caminho principal: M0 → M1 → M2 → M3 → M4 → M5/M6 → M7/M8. M9 é posterior. Prioridade imediata: M0/M1, primeiro contrato de núcleo em M1 e validação incremental ligada a M2/M3. Não adiar toda validação para M6.

Não fixar cronograma de meses com base apenas no número de etapas. Depois de M0, decompor em pacotes de até alguns dias, informar responsável, esforço estimado, dependências e capacidade disponível. Ao concluir M2, revisar a previsão das etapas que dependem do acoplamento real do editor.

## 17. Projetos-âncora de aceite

| ID | Projeto | O que comprova |
| --- | --- | --- |
| ANC-01 | Botão altera texto/cor | UI, evento, ação e histórico |
| ANC-02 | Formulário soma números | Dados, tipos, conversão e erro amigável |
| ANC-03 | Lista filtrável persistente | Estado, persistência e reabertura |
| ANC-04 | Tarefa longa cancelável | Runtime, progresso, timeout e retorno tardio |
| ANC-05 | Programa independente | Equivalência entre prévia e exportação |
| ANC-06 | Operação especializada selecionada após M0 | Núcleo mínimo, integridade de saída e distribuição; PDF permanece candidato histórico |

Esses projetos validam fronteiras; não limitam a ambição do Hefestus a exemplos simples. Cada um tem fonte, dados de teste, passos de reprodução e saída esperada. Jogos/Unity são destinos futuros opcionais, sem bloquear os primeiros aceites.

## 18. Requisitos iniciais identificados

Todos são requisitos desta proposta, sem declaração automática de implementação.

| ID | Requisito | Etapa | Evidência de aceite |
| --- | --- | --- | --- |
| HEF-001 | Preservar projetos `.hefestus` e seus IDs | M0/M3 | Corpus migrado e reaberto |
| HEF-002 | Núcleo sem dependência do DOM | M2 | Regra de importação e teste sem navegador |
| HEF-003 | Mesma proteção por UI, CLI e MCP | M2 | Contratos de edição equivalentes |
| HEF-004 | Blocos e grafo compartilham lógica | M3/M5 | Troca de visão sem alteração semântica |
| HEF-005 | Tipos e erros explícitos | M3/M4 | Casos válidos e inválidos |
| HEF-006 | Cancelamento e saída tardia tratados | M4 | ANC-04 |
| HEF-007 | Comportamento em lote transacional | M5 | Falha parcial simulada sem edição parcial |
| HEF-008 | Exportação executa motor real | M6 | ANC-05 |
| HEF-009 | Recursos e dependências fixados | M6 | Manifesto e verificação de pacote |
| HEF-010 | Instalador e associação testados | M6/M7 | Ensaio Windows limpo |
| HEF-011 | Biblioteca com origem e versão | M1/M4 | Manifesto e auditoria de referência |
| HEF-012 | Bíblia distingue atual e proposto | M1 | Verificação documental e revisão |
| HEF-013 | Gerar estrutura padrão ao criar | M6/M8 | Novo projeto completo e reaberto |
| HEF-014 | Programa gerado com capacidade especializada independente | M7 | Fluxos, integridade e distribuição homologados; cenário anterior PDF preservado como candidato |
| HEF-015 | Segundo programa gerado com dependências seletivas | M8 | Relatório de piloto e regressão dos consumidores |
| HEF-016 | Otimização guiada por medição | M9 | Benchmark reproduzido e comparação |
| HEF-017 | Bíblia/GDD indexam o processo inteiro | M1/M5 | As duas buscas chegam à mesma entrada, sem alterar IDs técnicos |
| HEF-018 | Validar estrutura e destino durante a edição | M2/M3 | Diagnóstico na revisão atual, ligado ao alvo |
| HEF-019 | Preservar conteúdo autoral ao regenerar documentação | M1/M6 | Regeneração conserva decisões e identifica revisão |
| HEF-020 | Catálogo pesquisa sem carregar todos os motores | M4/M8 | Instrumentação de importações e benchmark |
| HEF-021 | Preferir núcleo mínimo à ferramenta completa | M1/M4/M8 | Ficha comparativa, dependências e contrato |
| HEF-022 | Resolver e fixar dependências transitivas e recursos | M4/M6 | Instalação limpa sem dependências ocultas |
| HEF-023 | Compartilhar semântica entre prévia e exportação | M4/M6 | Mesmo corpus e diferenças explicitadas por destino |
| HEF-024 | Desacoplar salvar de build/documentação pesada | M2/M6 | Salvamento e reabertura sem disparar build integral |
| HEF-025 | Invalidar evidências afetadas por mudanças | M1/M6 | Mudança relevante marca ensaios antigos como históricos |
| HEF-026 | Atualizar e reverter núcleo sem alterar consumidores silenciosamente | M4/M8 | Lock, patches e retorno ensaiado |
| HEF-027 | Separar instalador do editor e do programa gerado | M6 | Manifestos e artefatos distintos |
| HEF-028 | Medir leveza sem comprometer correção | M4/M8 | Comparação repetível de bytes, carga, memória e corpus |
| HEF-029 | Registrar divergências PC/GitHub/ZIP | M0 | Inventário com revisão/hash e decisão de baseline |
| HEF-030 | Conferir aquisição, ativação e remoção de pacotes | M4/M8 | Falha/cancelamento sem pacote parcial ativo; referências preservadas |
| HEF-031 | Reconciliar snapshots de PCs sem escolher por data/nome | M0/M8 | Integridade, conflitos e retorno registrados |
| HEF-032 | Plano declarativo distingue desenvolvimento e usuário final | M1/M6 | Contratos separados e instalação sem SDK indevido |
| HEF-033 | Instalação repetível e falha parcial tratada | M6 | Ensaios de repetição, atualização e recuperação |
| HEF-034 | Mudança possui rota entre requisito, manual, código e verificação | M1/M2 | Amostra de mudanças com vínculos completos |
| HEF-035 | Score distingue heurística, fonte externa e medição | M9 | Política/corpus fixados e ausência de ganhos inventados |
| HEF-036 | Autohospedagem preserva bootstrap estável | M9 | Candidata isolada e recuperação ensaiada |
| HEF-037 | Preservar paridade entre superfícies da Forja | M0/M5 | Eventos, menus, peças, código/rascunhos, histórico, documentos, importação/exportação e proteção mapeados |
| HEF-038 | Manual utilizável por IA sem editor instalado | M1/M8 | Piloto arquitetural com artefato real e limites declarados |
| HEF-039 | Perfis de construção Go/Rust/C++ sem impor todas as linguagens | M1/M8 | Toolchain, contrato e evidência por perfil escolhido |
| HEF-040 | Biblioteca de decisões consultável localmente | M1 | Manual/política/versão acessíveis e instruções adaptadas ao ambiente |
| HEF-041 | Score distingue seed heurístico de métricas reais | M1/M9 | Origem, notas/justificativas e medições nulas até execução |
| HEF-042 | Plano, checks e projeção de status têm revisão e cobertura | M1/M6 | Pendência/obsolescência e aceite humano separados |
| HEF-043 | Histórico de conversa alimenta decisões sem executar instruções | M1 | Fonte, classificação e resolução das contradições |
| HEF-044 | Perfis tecnológicos distinguem papel, toolchain, destino e verificação | M1/M8 | 17 perfis consultáveis; backend/SDK/homologação avaliados separadamente |

| HEF-045 | Documento comum com autoridade por informação e projeções coerentes | M2/M3 | Mesma edição e revisão por canvas/inspector e superfícies compatíveis |
| HEF-046 | Importar subconjunto declarado de HTML/CSS/SVG como objetos nativos | M3/M5 | Corpus com edição individual, desfazer, salvamento e reabertura |
| HEF-047 | Diagnosticar fidelidade visual, estrutural e comportamental | M3/M5 | Relatório por elemento, sem perda silenciosa |
| HEF-048 | Reimportar com comparação de três versões e IDs persistentes | M3/M5 | Conflitos de edição, remoção e referências resolvidos sem sobrescrita silenciosa |
| HEF-049 | Versionar componentes mestres, instâncias e variantes | M5/M8 | Atualização com prévia, overrides preservados e retorno |
| HEF-050 | Isolar prévia e código importado por capacidades | M4/M6 | Negativas de acesso, cancelamento e limites de execução por destino |
| HEF-051 | Rastrear diagnóstico da entrega até objeto/operação/fonte | M4/M6 | Erro no programa gerado localiza origem no snapshot correspondente |
| HEF-052 | Reconstruir incrementalmente com invalidação correta | M6/M9 | Resultado equivalente ao build integral no corpus, com medições |
| HEF-053 | Abrir workspace portátil preservando .hefestus | M3/M6 | Recursos e lock verificados em outro ambiente declarado |

## 19. Decisões iniciais e questões abertas

### 19.1 ADRs propostos

| ID | Decisão proposta | Motivo |
| --- | --- | --- |
| ADR-001 | Monólito modular com portas/adaptadores | Separar responsabilidades sem distribuição prematura |
| ADR-002 | Preservar `.hefestus` e leitores atuais | Evitar ruptura de identidade e dados |
| ADR-003 | IR independente de linguagem e visualização | Permitir blocos, grafo e destinos diversos |
| ADR-004 | Migração incremental com fachadas | Usar a base validada e permitir retorno |
| ADR-005 | Comandos compartilhados pela interface | Eliminar comportamento divergente entre menus e atalhos |
| ADR-006 | Um runtime compartilhado por contrato, adaptado por destino | Aproximar prévia e aplicação gerada |
| ADR-007 | Padrão comum com perfis | Reutilizar qualidade sem forçar arquiteturas idênticas |
| ADR-008 | Score após portões obrigatórios | Impedir que ganho de velocidade esconda falha funcional |
| ADR-009 | Bíblia/GDD como aliases do processo completo | Localização simples para usuário e IA |
| ADR-010 | Núcleo reutilizável antes do aplicativo completo | Evitar peso e acoplamento desnecessários |
| ADR-011 | Catálogo de metadados separado do conteúdo | Consultar sem carregar toda a biblioteca |
| ADR-012 | Validação incremental em tempo de edição | Detectar incompatibilidades antes do empacotamento |
| ADR-013 | Documentação autoral separada de projeções geradas | Atualizar inventários sem apagar decisões |
| ADR-014 | Pacote gerado com fechamento seletivo das dependências | Independência e tamanho verificáveis |
| ADR-015 | Evidência ligada à revisão e ao lock | Evitar apresentar testes antigos como atuais |
| ADR-016 | Documento comum com modelos visual, semântico e lógico relacionados | Unificar edição preservando fronteiras |
| ADR-017 | Importação por subconjunto e fidelidade declarados | Evitar promessa de conversão universal |
| ADR-018 | Reimportação por comparação de três versões | Preservar edições locais e explicitar conflitos |
| ADR-019 | Workspace compatível com .hefestus | Organizar fontes sem ruptura de formato |
| ADR-020 | Prévia e extensões com capacidades limitadas | Conter efeitos de código importado |

ADR-001 a ADR-008 preservam propostas arquiteturais anteriores. ADR-009 e a diretriz de ADR-010 registram decisões diretas do usuário nesta conversa. ADR-011 a ADR-015 são especificações de implementação propostas para cumpri-las. Nenhum desses estados declara código implementado. Complementar cada registro com contexto, alternativas, consequências e evidência na etapa correspondente.

### 19.2 Questões a resolver na auditoria M0

- Qual pacote instalado em cada máquina deve ser considerado o baseline operacional do usuário?
- Quais projetos antigos compõem o corpus de compatibilidade e quais recursos externos lhes faltam?
- Qual é a primeira matriz Windows/arquitetura/WebView e qual o requisito de instalação offline?
- Qual operação especializada será escolhida para ANC-06 e qual o seu corpus de integridade?
- Qual hardware e volume de catálogo representarão o uso cotidiano?
- Qual segundo programa de teste gerado pelo Hefestus demonstrará reutilização seletiva?

Essas questões não impedem nenhum trabalho.

## 20. Modelos reutilizáveis

### 20.1 Ficha de requisito

ID; título; usuário e necessidade; origem; regra de negócio; prioridade; entradas; saída; erros; plataformas; dependências; critério de aceite; evidência; estado; versão de entrega; responsável. Acrescentar limites e não objetivos quando houver risco de interpretação.

### 20.2 Ficha de módulo

Nome; propósito; fronteira; API pública; dependências permitidas/proibidas; dados autorais e temporários; concorrência; erros; efeitos; segurança; testes de contrato; desempenho esperado; compatibilidade; proveniência; responsável.

### 20.3 Ficha de núcleo, motor ou biblioteca

Capacidade; contrato; candidatos e alternativa da seção 9.2; origem; versão/commit/hash; arquivos extraídos; patches; API pública; dependências diretas/transitivas; recursos dinâmicos; ferramentas de build separadas do runtime; plataformas; aquisição/ativação; consumo de recursos; corpus; resultados; limitações; manutenção/upstream; fallback aplicável; decisão de reutilizar/adaptar/referenciar/criar; evidência e ADR.

### 20.4 Ficha de tela ou ferramenta

Objetivo do usuário; acesso; ações e atalhos; estados; modelo de leitura; comandos; regras de disponibilidade; seleção; teclado/foco; erros; responsividade; tokens; exemplos; aceite funcional e visual. Essa ficha é parte do GDD de experiência, não apenas um mockup.

### 20.5 Ficha de etapa

Problema; resultado observável; baseline; escopo; fora do escopo; contratos afetados; estratégia incremental; entregáveis; testes; riscos concretos; reversão; dependências; responsável; previsão revisável; critério de encerramento.

### 20.6 Ficha de ADR

ID; data; estado; contexto; decisão; alternativas; consequências; compatibilidade; custo de manutenção; evidência; condição de revisão; requisito de origem. Estados: proposto, aceito, substituído e rejeitado.

### 20.7 Ficha de entrega

Nome; versão; snapshot; artefatos e hashes; lock; ambiente; testes executados; testes não executados; resultados; pendências; destinos suportados; procedimento de instalação; recuperação; responsável pelo aceite. Não declarar “funciona em qualquer PC”.

## 21. Primeiro pacote de trabalho do plano

O próximo trabalho de implementação começa pelo M0/M1: indexar a bíblia existente, classificar afirmações, mapear formato e testes, criar a matriz de requisitos e registrar as decisões propostas. Nenhuma reescrita do núcleo é pré-condição para esse trabalho.

Checklist para iniciar:

- Preservar ZIP e hashes da base validada.
- Identificar o corpus de projetos, sem inventar arquivos ausentes.
- Separar código antigo e histórico do estado atual.
- Listar comandos e operações com acesso, efeitos e evidência.
- Mapear os 329 testes aos requisitos que cobrem, registrando lacunas.
- Formalizar contratos atuais antes de desenhar migradores novos.
- Preparar ANC-01 e ANC-02 como critérios da primeira fatia vertical.
- Atualizar esta bíblia a cada mudança estrutural, sem marcar propostas como entregas.

**Definição de conclusão do plano completo:** o próprio Hefestus constrói, salva, reabre, testa e distribui programas com interface e operações reais; preserva o corpus legado selecionado; valida a experiência e a instalação nos destinos declarados; mantém documentação e evidências por revisão; e dois programas gerados comprovam reutilização seletiva sem carregar a biblioteca inteira. Alterar esta Bíblia/GDD é entrega documental, não conclusão desse plano.

## 22. Ciclo integrado: do objetivo ao programa instalado

Esta seção organiza as etapas já especificadas, sem criar um segundo motor de fluxo nem uma segunda fonte de regras. Todos os caminhos de entrada usam os mesmos casos de uso e contratos.

### 22.1 Jornada completa e suas saídas

| Fase | Entrada | Resultado esperado | Portão aplicável |
| --- | --- | --- | --- |
| Definir | Objetivo e restrições | Requisitos, destino e primeiro fluxo-âncora | Q0 |
| Auditar | Código atual, corpus e Bíblia alvo | Capacidades, diferenças e plano incremental | Q0/Q1 |
| Resolver peças | Capacidade e catálogo | Reutilizar/adaptar/referenciar/criar, origem e lock | Q1 |
| Montar | Documento e modelos | Interface e lógica por transações reversíveis | Q1/Q2 |
| Conectar | Eventos e contratos | Operações reais, entradas, saídas e erros | Q2/Q3 |
| Executar | Projeto e dados | Resultado, diagnóstico e evidência da revisão | Q3 |
| Salvar/reabrir | Documento e recursos | Integridade e compatibilidade verificadas | Q2/Q6 |
| Gerar | Destino, projeto e lock | Código/runtime/recursos necessários | Q3/Q5 |
| Empacotar | Artefato e plano de instalação | Pacote, manifesto, avisos e instalador aplicável | Q5 |
| Instalar/verificar | Pacote e ambiente | Fluxo real fora do Hefestus | Q5/Q6 |
| Evoluir | Problema ou proposta | Delta rastreável e nova revisão avaliada | Portões afetados |

Criar, montar, ligar, testar e publicar são a linguagem de tarefa. Bíblia/GDD indexam o ciclo inteiro. Pode-se salvar antes de completar todos os portões; a entrega deve indicar seu estado real.

### 22.2 Validação durante a edição

Validar IDs/referências; tipos/cardinalidade das portas; escopo; ciclos suportados; recursos ausentes; contrato/versão do núcleo; disponibilidade no destino; ligações sem operação; limites declarados. Cada regra tem custo e gatilho: verificações locais rápidas na mudança; análise ampla agendada; testes/build em ação explícita.

Diagnóstico não executa automaticamente motores desconhecidos, downloads, comandos de sistema ou builds. Operações caras informam tarefa/cancelamento e respeitam o runtime.

Aceite: erro no elemento correto; resultado obsoleto não chega à revisão atual; trabalho incompleto pode ser salvo; entrega anunciada como funcional é sinalizada claramente se faltar operação essencial.

### 22.3 Prévia, código e exportação

Semântica e corpus são compartilhados entre prévia e destinos. Runtime/adaptadores podem diferir por plataforma; diferenças recebem contrato, diagnóstico e teste. “Single-runtime” não significa binário único para todos os destinos.

Código autoral, gerado e descritores de extensão têm donos distintos. Nunca sobrescrever código manual silenciosamente. Ida e volta visual/código é garantida apenas no subconjunto suportado; fora dele, preservar extensão identificada com entradas/saídas e limites. Não presumir reversibilidade de código arbitrário.

### 22.4 Salvar, documentar e recuperar

A transação altera documento e revisão. Salvamento conserva conteúdo autoral e referências verificadas; inventários leves são atualizados ou marcados para regeneração. Documentação pesada, testes completos, compilação e instalação são tarefas separadas.

Estados visíveis: alterações não salvas, salvando, salvo, falhou e recuperação disponível quando implementada. Histórico de edição, backup e histórico Git atendem propósitos distintos. Restaurar um não comprova os outros.

Aceite: reabrir preserva IDs, telas, lógica, recursos e vínculos do corpus; falha não corrompe o único original. Autosave não é apresentado como sincronização entre PCs sem adaptador real.

### 22.5 Plano declarativo de instalação e verificação

A proposta recuperada de `install.json` e `verify.json` é incorporada como contratos a formalizar. JSON representa dados; sua extensão não concede segurança, idempotência ou portabilidade.

Distinguir:
- **Preparação/reconstrução do desenvolvimento:** SDKs, fontes, dependências de build e geração.
- **Instalação do usuário final:** binários, recursos, runtimes redistribuíveis, atalhos e associações necessários ao programa.

O usuário final não recebe compiladores/fontes por padrão. Instalador que compila localmente declara esse perfil e seus pré-requisitos.

Campos conceituais: ID/versão do formato; revisão da especificação; produto/destino; artefatos/hashes; pré-condições; ações tipadas; dependências de ordem; efeitos; privilégios; verificações; recuperação. Cada ação tem ID e semântica fixa no executor.

Preferir ações limitadas: verificar recurso, copiar artefato, registrar associação suportada. Evitar shell livre como mecanismo universal. Extensões executáveis exigem procedência, parâmetros estruturados, limites, permissões e verificação; aquisição/build não são executados só porque aparecem em pacote.

O executor ainda precisa de implementação e testes de caminhos, integridade, entradas inválidas, repetição e falha parcial. Não prometer tamanho/linhas. Validar caminhos para impedir escrita fora dos destinos declarados. Recursos adquiridos têm fonte e integridade verificadas.

Idempotência aplica-se às ações declaradas: repetir não duplica entradas ou corrompe estado. Recuperação registra o que realmente mudou. Desinstalar não equivale a desfazer: dados autorais, recursos compartilhados e migrações irreversíveis exigem política própria.

`verify.json` liga requisitos de instalação a verificações reais. Nem toda frase da Bíblia vira teste automático: objetivos, decisões e julgamento de UX recebem revisão humana identificada; não aplicáveis têm justificativa. Existência de pasta não comprova operação funcional.

## 23. Manifestos e mapa de organização

### 23.1 Contratos com papéis distintos

| Artefato conceitual | Autoridade | Conteúdo |
| --- | --- | --- |
| Documento .hefestus | Projeto autoral | UI, lógica, vínculos, recursos e especificação suportada |
| Manifesto de projeto | Identidade e referências | Versões, perfil, destinos, caminhos e revisão |
| Manifesto de núcleo | Capacidade | Contratos, origem, dependências e limites |
| Lock | Resolução fixada | Versões e conteúdo usado |
| Plano de instalação | Mudanças de instalação | Ações tipadas e pré/pós-condições |
| Plano de verificação | Verificações | Requisitos, procedimento, resultado esperado |
| Manifesto de entrega | Artefato produzido | Snapshot, lock, hashes, destinos e evidências |
| Bíblia/GDD e manuais | Visão humana do processo | Objetivos, arquitetura, decisões, operação e índices |

São papéis conceituais, não arquivos existentes por decreto. Mapear formatos reais antes de criar schemas. Referenciar dados em vez de replicar o mesmo campo editável em vários manifestos.

### 23.2 Manuais por módulo e cinco planos de consulta

Organizar a consulta por estado atual; arquitetura alvo; migração; decisões; histórico. Índice global direciona ao detalhe; contratos locais direcionam a código, exemplos e evidência.

Módulo com API pública, regras ou operação complexa possui manual contextual: propósito, entradas/saídas, invariantes, dependências, erros, efeitos, testes e mudanças. Usar README/MANUAL conforme a convenção atual. Não criar manual vazio por diretório nem árvore aspiracional cheia de pastas.

Inventário classifica módulo como existente avaliado, existente não avaliado ou planejado. Estados da seção 2.2 permanecem separados. Manual incompleto não prova código ausente; código presente não prova funcionamento.

### 23.3 Rotas para mudanças comuns

| Mudança | Ponto de entrada lógico | Verificação principal |
| --- | --- | --- |
| Adicionar comando | Registro + caso de uso | Significado/estado por UI/CLI/MCP |
| Alterar documento | Domínio + schema + migração aplicável | Corpus e reabertura |
| Adicionar bloco | Operação + IR + apresentação | Tipos, semântica e alternância de modos |
| Incorporar núcleo | Catálogo + adaptador + lock | Origem, corpus e entrega seletiva |
| Trocar motor/linguagem | Porta + adaptador + destino | Correção, custo e compatibilidade |
| Ajustar ribbon/painéis | Apresentação + comandos | Foco, teclado, escala e tarefa |
| Melhorar score | Política + corpus reservado | Ordenação útil e critérios congelados |
| Corrigir instalador | Plano + executor + verificação | Instalação/atualização/desinstalação |
| Gerar documentação | Projeção + referência autoral | Decisões preservadas e revisão |
| Sincronizar PCs | Workspace + snapshots | Integridade, conflitos e recuperação |

Rotas conceituais até M0 mapear caminhos reais. Mudanças entre módulos atualizam contratos conjuntamente; não impor “mude só uma pasta”.

## 24. Consolidação de propostas de outras conversas

### 24.1 Fontes efetivamente consultadas

| Fonte | Identificação | Uso e limite |
| --- | --- | --- |
| Bíblia/GDD 1.0 no GitHub | blob `68e23415a6241aa0c68133eed9342ce2b12e84dc` | Base documental, com requisitos/evidências históricas |
| Pasted text.txt | `libfile_355fa67badf48191802390172deb40ac`, 4.818 linhas | Conversas coladas com decisões, sugestões, exemplos e raciocínios de assistentes misturados |
| Pasted text (2).txt | `libfile_40db182fc6d88191a102a2928aea741f` | Organização encapsulada, Forja, comportamentos e formato próprio; inclui contradições |
| Hefestus_Plano_Integracao_Completo.json | `libfile_13ec6b149c7c8191809856911952840a`, versão 1 | Integração, paridade, PCs e catálogo; plano, não auditoria nova |
| Hefestus_Matriz_Reuso_GitHub.json | `libfile_3e964b5fcd508191a3bb39a6d0018e5d`, versão 1 | Famílias, candidatos, UX e critérios; não comprova integrações |
| Contexto recuperado de conversas | Consulta focada em Hefestus nesta revisão | Localiza decisões e relata alpha posterior; não substitui artefato |
| Decisões desta conversa | Mensagens diretas do usuário | Escopo Hefestus, aliases globais, núcleos mínimos e revisão completa |
| Pasted text(1).txt | libfile_3b41322168788191a5afc00a422185ac, 5.147 linhas | Anexo adicional lido integralmente; decisões, planos e exemplos não homologados; ver seção 29 |

Conteúdo de outros produtos retornado pela recuperação foi excluído como requisito do Hefestus. Raciocínios internos e sugestões históricas nos textos colados não são requisitos, evidências nem comandos a executar.

Relatos de 295, 329 e 347 testes exigem seus snapshots, comandos e corpus. Não somar contagens nem escolher a maior para anunciar baseline validada.

### 24.2 Matriz de propostas e resolução

| Proposta recuperada | Tratamento |
| --- | --- |
| Editor, criador e compilador completos | Mantida; separar gerar código, compilar e instalar |
| Formato próprio, ícone e encapsulamento | Manter .hefestus; portabilidade sem trocar extensão automaticamente |
| .hef e linguagem .hfn sugeridas | Não adotadas sem necessidade/migração; exemplos não definem formato atual |
| Núcleo obrigatório em Rust/reescrita integral | Escolha por operação e evidência; implementações atuais não são definitivas |
| Dois ou mais motores | Suportar composição; aplicar conforme necessidade e custo |
| Linguagem mais rápida automaticamente | Objetivo de pesquisa; sem compilador universal/ranking absoluto |
| Score inicial, regras e fallback externo | Ordenar candidatos viáveis; distinguir heurística e medição, sem garantir ganho |
| Autoaperfeiçoamento/autohospedagem | Fase posterior com isolamento, corpus reservado e retorno |
| Deduplicar pelo propósito | Similaridade sugere equivalência; contratos/corpus precisam comprovar |
| Biblioteca por hash e sob demanda | Seção 9, preservando locks e recursos |
| Documentação automática em cada save | Índices incrementais; texto autoral preservado, geração pesada separada |
| Manual em cada pasta | Manual proporcional por módulo relevante e índice global |
| Bíblia congelada na implantação | Snapshot de release preservado; delta e patches rastreáveis |
| install.json e verify.json | Contratos propostos com executor limitado/testes; sem executar prosa |
| Instalador sempre reversível | Recuperação conforme efeito; desinstalar não reverte tudo |
| Toda linha do GDD vira check | Requisito recebe evidência adequada; UX/intenção podem exigir revisão humana |
| IA lê código atual e implementa alvo | Diferença controlada; não tratar alvo como estado atual |
| Blocos/híbrido/grafo | Mesmo IR; destinos opcionais sem contaminar domínio |
| Lote de comportamentos igual a macro | Corrigida: lote aplica; macro encapsula grafo reutilizável |
| Ribbon contextual familiar | Seção 10 com comandos, foco e tarefas |
| Funcionar em qualquer PC | Matriz de plataforma/pré-requisitos testados |
| Ganhos percentuais/seleção sempre melhor | Não adotar como fato; exigir medições |

### 24.3 Lacunas preservadas

Conferir baseline operacional e alpha; equivalência PC/GitHub/ZIP; paridade da Forja; schemas reais; primeiro núcleo a recortar; Windows/offline; executor; assinatura/atualização; corpus de instalação/recuperação.

Este registro não inicia aquisição nem implementação de todos os candidatos. Esta entrega é documental.

## 25. Evolução por evidências, score e autonomia

### 25.1 Seleção de motores e ferramentas

Aplicar primeiro restrições de contrato, correção, destino e integridade. Comparar candidatos válidos por critérios/pesos declarados. Se houver compromissos, apresentar alternativas em vez de esconder tudo em nota única.

Separar origem: medição local contextualizada; benchmark externo comparável; heurística; sugestão IA; desconhecido. Não atribuir confiança numérica arbitrária. Ranking de linguagem não prova velocidade da operação do Hefestus.

A política versionada declara corpus, hardware, volume, pesos, custo de travessia e validade. Sem evidência, indicar insuficiência e conservar o caminho válido conhecido quando aplicável. Score orienta experimentos sem promover incompatibilidade.

### 25.2 Experimentos e promoção

Propor hipótese; fixar baseline/corpus/critérios; preparar candidato isolado; verificar; medir; comparar ganhos/regressões; registrar decisão; promover versão/lock; monitorar no escopo permitido e conservar retorno.

Separar corpus de desenvolvimento e avaliação reservada quando houver ajuste automático. Candidato não muda seus próprios portões, saída esperada ou corpus para passar. Ausência de regressão no corpus não prova equivalência universal.

Execução sombra exige operação sem efeito ou ambiente isolado. Não duplicar gravações, chamadas pagas ou ações externas ao comparar implementações.

### 25.3 Deduplicação por conteúdo e capacidade

Conteúdo idêntico pode compartilhar armazenamento. Equivalência exige schema, semântica, efeitos e resultados compatíveis no contexto. Nomes iguais e semelhança de código não bastam.

Preservar implementações úteis em plataformas/contextos distintos. Alias lógico pode encaminhar a versões fixadas sem fundir código. Depreciar com dependentes mapeados; arquivar recuperavelmente; remover segundo política verificada. Não apagar alternativas por uma única medição.

### 25.4 Autonomia delimitada e autohospedagem

Níveis propostos: observar; recomendar; testar em staging; adotar. Cada nível declara efeitos, escopo, orçamento, teste e retorno.

Autohospedagem: versão estável gera candidata do Hefestus em destino separado, sem sobrescrever o bootstrap estável. Reconstruir, testar, comparar, instalar quando aplicável e demonstrar recuperação antes de promover.

Guardar fontes, locks, receita e recursos recuperáveis. Bíblia sozinha e hashes sem os bytes não reconstroem versão. Não prometer melhoria em toda geração nem exigir rede neural na primeira etapa.

## 26. Governança de mudanças e promoção documental

### 26.1 Baseline, delta e revisão ativa

Cada release possui snapshot identificado de fontes, documento, contratos, lock, evidências e documentação. Git conserva história; não duplicar repositórios inteiros em pastas “v47/v48”.

Propostas recebem delta: requisito, impacto, módulos, contratos, dados, dependências, verificação, retorno e estado. Versão alvo pode conter requisito pendente explicitado. Nunca editar retroativamente evidência de release.

Correções críticas na implantação podem gerar patch com decisão/testes; congelamento não obriga distribuir defeito conhecido. Atualizar código, contrato e manual consistentemente na mesma mudança, sem exigir alterar um de cada vez.

### 26.2 Protocolo para pessoa, CLI/MCP e IA

1. Ler código/contratos reais, documento e decisões da baseline.
2. Localizar requisito e versão alvo da Bíblia/GDD.
3. Definir diferença implementável e impacto.
4. Consultar implementação existente antes de criar outra.
5. Aplicar comandos transacionais no documento e ferramentas apropriadas no código.
6. Validar fluxo, falhas, compatibilidade e artefato.
7. Atualizar estado, vínculos e evidências.
8. Promover apenas o que passou nos portões; conservar pendências.

A regra contra editar JSON autoral protegido fora das ferramentas não proíbe manter schemas, manifests e fontes do próprio Hefestus. Distinguir documento do usuário de implementação.

### 26.3 Registro de mudanças desta edição

- Versão documental 2.0, sem alterar versão do produto.
- Bíblia/GDD indexam o processo inteiro e suas rotas.
- Núcleo mínimo, catálogo separado e entrega seletiva.
- Validação em edição, prévia/exportação e documentação por revisão.
- Instalação/verificação declarativas, reconstrução e sincronização.
- Propostas anteriores consolidadas, com contradições e afirmações sem prova identificadas.
- Requisitos ampliados e migração incremental focada no próprio Hefestus.
- Fontes operacionais, formatos e instalador não são modificados por esta publicação.

## 27. Referências técnicas da política de componentes

Fontes fundamentam conceitos; não elegem fornecedores nem comprovam integração:

- [esbuild: remoção de código não utilizado](https://github.com/evanw/esbuild/blob/main/docs/architecture.md): limites da seleção por dependências.
- [Rollup: tree-shaking e efeitos de módulos](https://rollupjs.org/configuration-options/): referência de build sem adoção automática.
- [Padrão documental do acervo](../padroes/BIBLIA_PADRAO_PROJETOS.md): organização especializada nesta Bíblia/GDD.

Essas fontes não acrescentam dependências nem capacidades prontas ao Hefestus.

## 28. Modo fábrica para IAs, com ou sem Hefestus instalado

O pedido “construir um programa usando o Hefestus” aciona a Engenharia Integrada: ordem, requisitos, contratos, composição, construção, integridade, experiência, entrega e evidência. Bíblia/GDD permanecem aliases do processo inteiro.

O [Manual de Produção para IAs](docs/ia/MANUAL_FABRICA.md) detalha as estações, perfis Go/Rust/C++, fronteiras, evidências e ficha de continuidade. A [política declarativa](docs/ia/politica-decisoes.json) indexa regras e decisões; o [modelo de instruções](docs/ia/AGENTS_MODELO.md) ensina a ativação em ambientes que consultam instruções locais.

Modo integrado usa ferramentas reais do editor. Modo arquitetural usa a mesma disciplina com compiladores e ferramentas disponíveis, sem depender da instalação do Hefestus. Não simular execução CLI/MCP, criar formato nativo inválido ou afirmar instalador homologado por seguir o manual.

Biblioteca local de decisões significa arquivos consultáveis com revisão e origem. Não é memória automática universal das IAs nem agente instalado. Para offline, as cópias precisam estar disponíveis antes. A publicação remota não as instala no PC.

Começar com uma linguagem suficiente. Go, Rust e C++ são perfis de implementação; não dependências obrigatórias de todo programa. A arquitetura admite outros perfis por contrato. A ausência do editor não autoriza inventar peça existente, benchmark ou teste.

Estado desta seção: manual/política produzidos documentalmente; automação e pilotos funcionais sem editor ainda dependem de execução real.

## 29. Anexo adicional, decisões e alimentação do score

### 29.1 Fonte analisada

Pasted text(1).txt, file_000000002650820e82a4d98de9c7dbcd, Library libfile_3b41322168788191a5afc00a422185ac, 5.147 linhas. Conteúdo lido até a última linha e comparado com o texto anterior. É histórico misto, não novo código nem instrução executável.

Contribuições: biblioteca primeiro com variantes; auditoria de código atual versus alvo; etapas/entregáveis/dependências; plan.json/verify.json/status.json e histórico; promoção e referência de evidência. São contratos a formalizar, sem declarar comandos hipotéticos como existentes.

Ajustes necessários:
- Um teste pode estar incompleto ou incorreto; status derivado não é infalível.
- Resultado identifica revisão, tempo, cobertura e obsolescência. Aceite humano fica separado.
- Plano representa intenção e ordem; não pode ser reconstruído apenas dos checks.
- Igualdade de assinatura e mesmo resultado no corpus não garantem equivalência universal ou migração sem risco.
- Evidências de um projeto só se aplicam a outro quando contexto, contrato e ambiente forem compatíveis.
- Prosa/decisão de produto não perde autoridade só porque um teste errado passou.
- Correções de contrato são justificadas; não relaxar critérios para o candidato se aprovar.
- Reversão não apaga trabalho do usuário, e limites de retry não são números mágicos.
- Verificadores e planos JSON exigem implementações reais antes de serem anunciados como automação pronta.

### 29.2 Score inicial alimentado

[score-inicial.json](docs/ia/score-inicial.json) contém 12 candidatos heurísticos, Go/Rust/C++ em quatro contextos: CLI local simples, serviço HTTP/I/O, núcleo embutível sem legado e adaptação de biblioteca C++ existente.

Notas avaliam adequação arquitetural proposta. Pesos iniciais: capacidade 35%, integração 25%, distribuição 20%, manutenção 20%. Fórmula normalizada 0–100; pesos e notas são proposta revisável do assistente, não benchmark ou decisão de desempenho comprovada do usuário.

Todos estão em pending_eval, elegibilidade unknown, zero execuções, sem latência/memória/tamanho medidos. São hipóteses para priorizar avaliação. O seed está alimentado como arquivo documental; não foi importado em motor de score do aplicativo.

Versão de pacote/ferramenta não auditada permanece referência, com score nulo. Não inserir percentuais de ganho, confiança arbitrária ou números públicos de outro hardware como medição local.

Promoção exige portões da seção 13 e contexto real: contrato, correção, dependências, efeitos, integridade e destino. Métrica de performance só pode ser declarada após medição reproduzível. Dataset e política são versionados; candidato não altera critérios para se aprovar.

### 29.3 Registro da revisão 2.1

Acrescenta manual para IAs, política local, instruções adaptáveis, score seed e análise do anexo. Mantém requisitos anteriores e a separação de estado atual/alvo. Nenhuma implementação operacional, compilação em Go/Rust/C++, instalação local ou benchmark é declarada executada nesta entrega documental.

## 30. Perfis tecnológicos ampliados

Por pedido do usuário, o modo fábrica passa a documentar C#, TypeScript, JavaScript, Java, SQL, ActionScript, HTML, CSS, PHP, Objective-C, Swift, Kotlin, Shell Script e PowerShell, além de Go/Rust/C++.

O [complemento de perfis](docs/ia/PERFIS_TECNOLOGICOS.md) informa papel, organização, implementação, verificação, entrega e fontes oficiais. O manual 1.1.0 e a política 1.1.0 direcionam a consulta. Estes são guias de implementação convencional/integrada, não novos compiladores ou backends prontos no Hefestus.

Distinguir aplicação/runtime, marcação HTML, estilo CSS, dados SQL e automação Shell/PowerShell. SQL exige SGBD/dialeto; ActionScript exige versão/runtime compatível; apps Apple/Android exigem SDKs e destinos reais. Não instalar todas as linguagens por padrão nem usar disponibilidade documental como elegibilidade técnica.

O score 1.1.0 preserva as 12 notas heurísticas de Go/Rust/C++ e acrescenta fila de avaliação dos 14 perfis, com score nulo, pending_eval e elegibilidade desconhecida. Contexto e evidência precisam existir antes de pontuar. Nenhuma nova medição de velocidade, memória ou tamanho é declarada.

Revisão 2.2: atualização documental e de índice. Aceite funcional por perfil/destino permanece tarefa posterior, conforme toolchain e escopo do programa.


## 31. Documento comum, importação nativa e ciclo de produção

### 31.1 Direção e autoridade dos modelos

Revisão documental 2.3, de 23/10/2026. Origem: Texto colado.txt (Library libfile_e2e5895de4ac81918b437cc96d6270bb) e proposta desta conversa, cuja incorporação foi solicitada diretamente pelo usuário. O anexo mistura propostas e conversas; suas afirmações sobre bibliotecas externas não são adotadas como capacidades verificadas.

Direção incorporada: um documento autoral comum relaciona estrutura, aparência, dados e comportamentos por IDs estáveis. Canvas, inspector, blocos, grafo e código trabalham por casos de uso sobre as representações suportadas. Uma superfície pode mostrar conteúdo avançado como extensão identificada; não deve descartá-lo para simplificar a apresentação.

| Modelo | Responsabilidade | Invariante |
| --- | --- | --- |
| Visual | Geometria, texto, pintura, transformações e layout | Alterar aparência não apaga identidade ou vínculos |
| Semântico | Papel de controle, hierarquia, acessibilidade e propriedades | Botão conserva papel, foco e ação enquanto compatíveis |
| Dados e lógica | Tipos, eventos, operações, persistência e erros | Execução segue o IR e os contratos das seções 7 e 8 |
| Proveniência | Origem, conversão, versões e correspondência com fontes | Diagnóstico identifica o snapshot e o elemento correspondente |
| Apresentação do editor | Seleção, zoom, recolhimento e posição do grafo | Estado da ferramenta não altera comportamento do programa |

Documento comum significa autoridade explícita por informação, conforme 3.2. Não exige um arquivo monolítico, um grafo que misture todas as relações ou cópias editáveis concorrentes. Hierarquia visual, parentesco semântico e conexões de execução possuem papéis próprios.

Para projetos novos, o documento nativo é autoral; código gerado é derivado. Uma edição textual suportada deve produzir comandos validados no documento. Para importados, preservar a fonte original como snapshot e a conversão-base; mudanças locais pertencem ao documento atual. Código não representável fica como extensão com contrato. Edição externa inicia reconciliação, sem estabelecer uma segunda autoridade silenciosa.

### 31.2 Contrato conceitual do objeto nativo

Antes de implementar, mapear os campos atuais e produzir schema versionado, exemplos válidos/inválidos e migrador quando necessário. Campos abaixo são conceituais, não uma API anunciada:

- Identidade estável, tipo, revisão e referências de hierarquia.
- Geometria, coordenadas, unidades, transformações, restrições e política de layout.
- Texto, estilos, fontes e recursos; converter texto em contornos é ação explícita com perda de edição textual informada.
- Propriedades semânticas, rótulos, foco, acessibilidade e estados do controle.
- Referências de eventos, dados, operações e componentes versionados.
- Proveniência, capacidades convertidas, limitações e alterações locais.

IDs são persistidos; seletores, nomes e posições ajudam a localizar origem, mas não são identidade suficiente. Correspondência ambígua gera diagnóstico. Comandos de edição respeitam proteção, revisão esperada, validação e transação existentes. Falha em operação composta reverte o documento e seu histórico no escopo contratado; efeitos externos não são desfeitos por promessa genérica.

### 31.3 Pipeline de importação HTML/CSS/SVG

1. Inventariar fonte, recursos, fontes tipográficas, dependências e código; fixar snapshot e hashes.
2. Analisar em ambiente isolado, sem executar scripts importados por padrão. Captura dinâmica, quando necessária, usa capacidades limitadas.
3. Resolver estrutura e layout no viewport e nos estados declarados. Registrar estilos e recursos efetivamente usados.
4. Classificar por elemento a conversão visual, semântica e comportamental.
5. Apresentar prévia, limitações, dependências ausentes e opções de tratamento.
6. Converter o subconjunto suportado em staging; validar IDs, referências, recursos e contratos.
7. Confirmar em uma transação e conservar fonte, mapa de origem, relatório e base de comparação.

Subconjunto inicial candidato: textos, caixas, cores, bordas, grupos, imagens referenciadas e primitivas SVG compatíveis. Flex/grid, responsividade, pseudo-elementos, filtros, animações e comportamento dinâmico só entram após contrato e corpus específicos. Uma captura em viewport fixo não comprova reconstrução das regras responsivas.

SVG pode ser formato intermediário quando útil; não é passagem obrigatória. Rasterização, foreignObject e contentEditable não comprovam objetos vetoriais nativos. Imagens raster continuam raster salvo operação de vetorização explicitamente escolhida; traçado não recupera sua estrutura original.

### 31.4 Matriz de fidelidade e diagnóstico

| Classe | Tratamento | Informação obrigatória |
| --- | --- | --- |
| Nativo | Converte propriedades suportadas em objetos individuais | Propriedades editáveis, origem e diferenças conhecidas |
| Parcial | Converte parte e preserva recurso/extensão para o restante | Limites e impacto de cada edição |
| Incorporado | Mantém conteúdo em fronteira isolada | Editabilidade interna e destinos compatíveis |
| Não suportado | Mantém fonte recuperável e bloqueia a operação incompatível | Motivo e alternativas, sem descarte silencioso |

Registrar fidelidade visual, estrutural e comportamental separadamente. Fidelidade de aparência não comprova foco, acessibilidade, dados ou execução. O relatório pertence à revisão importada; alterações relevantes podem invalidá-lo. Capturas de tela complementam testes de estrutura e comportamento.

### 31.5 Sincronização código e visual

A reimportação compara três versões: base importada anterior, nova fonte convertida e documento com alterações locais. Mudanças sem conflito podem ser propostas automaticamente; conflitos recebem prévia, origem e resolução explícita antes de confirmar.

Tratar alteração simultânea de propriedade, remoção com referências ativas, reparentamento, identidade ambígua e mudança de contrato de operação. Não reaplicar overrides cegamente após remover ou mudar o tipo de um objeto. Preservar os snapshots necessários à recuperação.

Regenerar a partir da fonte pode substituir edições apenas por operação explícita, com impacto exibido e retorno disponível no escopo do histórico. Escrita de volta no código original é capacidade separada e restrita ao subconjunto suportado; não prometer round-trip universal.

### 31.6 Componentes reutilizáveis

Componente mestre define identidade, versão, interface pública, propriedades, slots, variantes, eventos e dependências. Instância referencia versão fixada e guarda somente alterações locais suportadas, sem perder sua identidade.

Antes de atualizar, calcular consumidores afetados e mostrar alterações, incompatibilidades e conflitos. Atualização e reversão preservam overrides válidos; casos incompatíveis exigem migração ou resolução explícita. Publicar versão no catálogo não modifica projetos existentes. Aplicam-se proveniência, lock e fechamento de dependências da seção 9.

### 31.7 Workspace e geração por destino

Preservar documento .hefestus, workspace e aplicação distribuída como conceitos distintos. O workspace organiza fontes autorais, recursos, dependências fixadas, documentação e saídas regeneráveis. Manifesto aponta a autoridade de cada arquivo; não duplica conteúdo editável. Nomes como hefestus.json, .hefir e .hefk no anexo são sugestões, não formatos aprovados nesta revisão.

Uma entrega portátil inclui bytes necessários, referências resolvidas e verificações de integridade. Abrir em outro ambiente identifica recursos ausentes e incompatibilidades sem regravar automaticamente o projeto.

Cada destino declara sua matriz de capacidades: controles, layout, recursos, operações, extensões e requisitos de execução. SVG/PDF estático não é equivalente funcional a um aplicativo web. Diagnósticos de geração e execução devem localizar objeto, operação, fonte e revisão quando o mapeamento existir; código otimizado pode exigir mapa específico do destino.

Dependências dinâmicas, efeitos colaterais e recursos usados em estados futuros impedem remoção ingênua de conteúdo. Oculto não significa dispensável. Reconstrução incremental depende de grafo de dependências e invalidação correta; comparar saída e comportamento com build integral no corpus. Metas de latência só serão fixadas após medir hardware, projeto e volume declarados. Salvar permanece separado de build pesado.

### 31.8 Execução isolada e qualidade

Prévia e extensões importadas declaram acesso a rede, arquivos, processos e credenciais por capacidades. Negar por padrão o acesso não concedido; o isolamento efetivo depende da plataforma e deve ser testado. Operações expõem entradas, saídas, efeitos, falhas, cancelamento e limites de tempo/recursos. Limites não ficam exclusivamente sob controle de script importado.

Corpus deve cobrir: comandos por superfícies compatíveis; entrada inválida; recurso ausente; código com efeito; conflito e remoção na reimportação; interrupção de conversão; desfazer/refazer; reabertura; layout/foco/teclado em navegador real; isolamento; equivalência prévia/exportação e instalação aplicável. Aceite visual e testes DOM são evidências distintas.

Cada capacidade recebe requisito, contrato, exemplo, limite, dependências, critério de aceite e estado real. Evidências identificam snapshot, ambiente e revisão; documentação publicada não promove capacidades automaticamente.

### 31.9 Quatro entregas integradas ao plano existente

Estas entregas refinam M0–M9; não substituem suas dependências ou portões.

| Entrega | Vínculo | Resultado e aceite | Retorno |
| --- | --- | --- | --- |
| E1 — Editar | M0/M1 como pré-condições; M2/M3/M5 | Importar subconjunto declarado; editar objetos individualmente; desfazer; salvar e reabrir preservando IDs e vínculos | Fonte e projeto anterior intactos; importação em staging |
| E2 — Executar | E1 e M4; fatia web de M6 | Calculadora com entradas válidas/inválidas, operação tipada e erro rastreável; distinguir persistência do projeto de dados do aplicativo | Runtime anterior e documento compatível preservados |
| E3 — Atualizar | E1/E2, M5 e contratos de M8 | Reimportar com conflitos visíveis; atualizar componente com prévia; conservar overrides válidos e demonstrar reversão | Base importada e versões anteriores fixadas |
| E4 — Distribuir | E2/E3, M6 e portões de M7/M8 aplicáveis | Aplicação independente no destino escolhido, recursos fechados, testes em ambiente limpo e instalação quando aplicável | Pacote anterior recuperável sem apagar dados do usuário |

Piloto de integração: importar calculadora HTML/CSS do subconjunto, editar texto/layout no canvas, conectar operação de soma, validar entradas, salvar/reabrir, atualizar a fonte com conflito intencional e gerar aplicação web independente. Ensaio desktop é adicional e depende do toolchain e instalação reais. O exemplo de soma descrito em EVOLUCAO_047.md usa extensão autoral; não comprova este novo pipeline.

### 31.10 Estado, decisões e continuidade da revisão 2.3

A incorporação aprova a direção documental e seus critérios de aceite. HEF-045 a HEF-053 e ADR-016 a ADR-020 registram os novos vínculos; contratos executáveis, implementação, medições e homologação continuam pendentes. Detalhar schemas e ADRs com alternativas, consequências e exemplos antes de mudar o formato.

Próximo pacote: mapear modelo atual e importadores em M0; formalizar objeto nativo e autoridade por informação; fechar subconjunto/corpus de E1; implementar uma fatia vertical reversível. Avaliar reutilização existente antes de adquirir componentes externos. Nenhum fornecedor, linguagem adicional ou biblioteca do anexo é incorporado automaticamente.

Verificação desta revisão é documental: preservação do texto anterior salvo atualização de versão e referências aditivas; numeração e vínculos conferidos; publicação restrita à Bíblia/GDD. Não foram executados novos testes funcionais nem alterados fontes, dependências ou instaladores.
