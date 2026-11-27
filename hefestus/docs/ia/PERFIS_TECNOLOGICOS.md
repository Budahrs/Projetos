# Perfis tecnológicos complementares da fábrica Hefestus

Versão: 1.0.0 · 23/10/2026 · Estado: orientação documental, sem toolchains ou backends instalados por esta publicação.
Processo: [Bíblia/GDD](../../BIBLIA_ARQUITETURA_GDD.md). Procedimento comum: [Manual para IAs](MANUAL_FABRICA.md).

## 1. Regras de seleção

Estes 14 perfis complementam Go, Rust e C++ do manual. São 17 perfis de linguagens/tecnologias consultáveis; não 17 geradores implementados ou homologados pelo Hefestus.

HTML estrutura a apresentação; CSS define estilo/layout; SQL descreve operações de dados; Shell Script e PowerShell automatizam tarefas. Os demais perfis também têm contextos e runtimes distintos. Não calcular ranking universal entre tecnologias com papéis diferentes.

Em cada projeto: fixar destino, versão da linguagem/toolchain, framework quando necessário, dependências, recursos, contrato de erros, testes e entrega. Preferir tecnologia existente que atende ao requisito; adotar outra por razão concreta. Nenhuma exige migrar a base atual do Hefestus.

Comandos abaixo são referências condicionadas ao projeto e à versão real. Não foram executados nesta entrega. Ferramentas devem estar disponíveis e dependências revisadas; não baixar/instalar compiladores só por ler este documento. Comando de build com sucesso não substitui tarefa real, integração ou instalação no destino.

## 2. C#

**Papel:** aplicações .NET, CLI, serviços, desktop ou núcleo reutilizável compatível com o destino.

**Organização:** .csproj por fronteira real; domínio/aplicação podem iniciar em uma única biblioteca e entrada. Solução apenas quando ajudar a composição. Testes em projeto próprio quando necessário. Fixar SDK/TargetFramework, pacotes e política de resolução/lock. Não impor WPF, WinForms, MAUI ou ASP.NET a toda aplicação.

**Implementação:** nullability coerente, erros explícitos, IDisposable/using para recursos, CancellationToken nas operações canceláveis. Evitar domínio dependente de UI. Native/interop especifica ownership, layout e ABI.

**Verificação:** dotnet --info, dotnet build e dotnet test na solução/projetos corretos. Conferir se há testes realmente descobertos. dotnet publish -c Release gera saída de publicação; declarar RID e perfil framework-dependent ou self-contained conforme necessidade. Single-file/AOT/trimming exigem compatibilidade e testes específicos, sem promessa universal.

**Entrega/aceite:** testar recursos, bibliotecas nativas e runtime no destino; publicar não cria automaticamente instalador. Windows desktop não vira multiplataforma por estar em C#.

**Fonte:** [publicação .NET](https://learn.microsoft.com/en-us/dotnet/core/deploying/).

## 3. TypeScript

**Papel:** aplicação web/Node, ferramentas e contratos de frontend/backend.

**Organização:** package.json, lock do gerenciador escolhido, tsconfig.json e src/ por funcionalidade. Declarar execução em navegador ou runtime servidor, ESM/CJS, target e resolução de módulos. Não duplicar modelos de domínio entre UI e servidor sem contrato.

**Implementação:** tipos estáticos não validam JSON externo. Validar entradas de rede/arquivo; distinguir desconhecido, opcional e nulo; evitar any como atalho para ignorar contrato. Preservar código autoral na geração.

**Verificação:** executar scripts reais do projeto. Com TypeScript local instalado em projeto npm, npm exec --offline -- tsc --noEmit pode verificar tipos sem emissão. Não usar npx para adquirir compilador implicitamente. Testes de runtime e build do destino são verificações separadas.

**Entrega/aceite:** declarar JavaScript emitido/bundle, assets e APIs externas. Suporte nativo a sintaxe TypeScript em um runtime depende da versão e não equivale à checagem de tipos. Browser/servidor precisam ser testados no perfil declarado.

**Fonte:** [tsc e opções](https://www.typescriptlang.org/docs/handbook/compiler-options.html).

## 4. JavaScript

**Papel:** comportamento web, Node, ferramentas, runtime do programa ou extensão.

**Organização:** distinguir código de navegador e servidor; módulos pequenos; package.json/lock quando houver dependências. Registrar Node/navegadores suportados e ESM/CJS.

**Implementação:** validar dados externos, declarar efeitos, tratamento de promises/rejeições, cancelamento nas fronteiras e término de listeners/timers/workers. Usar DOM seguro para texto e tratar HTML importado como conteúdo não confiável. Não embutir credenciais no bundle.

**Verificação:** node --check arquivo.js verifica sintaxe no perfil compatível; node --test executa testes adequadamente descobertos na versão suportada. Ambos não verificam DOM/browser nem substituem testes do pacote. Usar scripts existentes quando houver.

**Entrega/aceite:** conferir recursos dinâmicos, offline/online, runtime necessário, prévia/exportação e ausência do editor. Não instalar biblioteca inteira para uma função.

**Fonte:** [test runner Node](https://nodejs.org/api/test.html).

## 5. Java

**Papel:** aplicações JVM, serviços, CLI ou integrações com biblioteca/ecossistema Java.

**Organização:** Maven ou Gradle conforme projeto; não ambos sem necessidade. Layout nativo src/main e src/test; fixar JDK, nível de linguagem, plugins/dependências e runtime alvo. Verificar compatibilidade entre compilação e execução.

**Implementação:** erros/recursos claros, try-with-resources para recursos aplicáveis, limites de threads e cancelamento de tarefas. Validar serialização, nulos e unidades. Domínio não depende de servidor/framework de UI.

**Verificação:** java -version; em projeto Maven, mvn -B verify com plugins/testes configurados. Wrapper só se existir e sua distribuição estiver disponível/revisada. Gradle usa tarefas realmente definidas. Confirmar cobertura dos testes de integração, não apenas build vazio.

**Entrega/aceite:** JAR comum, JAR com dependências, imagem de runtime ou pacote nativo são entregas diferentes. Declarar JVM/módulos/recursos; uso de jlink/jpackage depende do JDK/perfil e não elimina aceite no destino.

**Fonte:** [ciclo Maven](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html).

## 6. SQL

**Papel:** modelo persistente, consultas, restrições e migrações, normalmente compondo outro perfil.

**Organização:** identificar SGBD/versão e dialeto; migrações ordenadas, schema, fixtures pequenas e política de dados. SQLite/PostgreSQL/MySQL/SQL Server não são intercambiáveis por trocar conexão.

**Implementação:** parâmetros preparados para valores; identificadores dinâmicos exigem validação própria. Restrições de integridade, isolamento, índices e plano de consulta seguem o SGBD. Definir comportamento para NULL, fuso, encoding, precisão/decimais e paginação.

**Verificação:** banco isolado com schema real; migração da versão anterior; consultas e transações com falha/concorrência relevante; backup/restauração. EXPLAIN ANALYZE e certas ferramentas executam a consulta: não tratar como inspeção sempre sem efeito. Não executar migração de produção por conter exemplo no manual.

**Entrega/aceite:** SQL não gera executável autônomo universal. Declarar servidor/driver/credenciais ou arquivo embarcado. DDL transacional e reversão variam por SGBD; não prometer downgrade sem perdas.

**Fontes:** [parâmetros por SGBD/driver](https://go.dev/doc/database/prepared-statements), [PREPARE PostgreSQL](https://www.postgresql.org/docs/current/sql-prepare.html).

## 7. ActionScript

**Papel:** manutenção/importação de projetos existentes, componentes e aplicações AIR quando runtime/SDK atendam ao destino.

**Organização:** identificar ActionScript 2 ou 3, formato de projeto, assets, bibliotecas SWC, descriptor e toolchain existente. Não presumir compatibilidade entre versões nem converter legado automaticamente.

**Implementação:** separar lógica da display list, lifecycle, listeners e recursos. Extensões nativas têm contrato/destino próprios. Registrar versão dos SDKs e runtimes.

**Verificação:** usar compilador do SDK real com classpath/descriptor do projeto. Compilar SWF não comprova aplicação desktop/mobile. Executar no runtime definido, testar eventos, assets, integração e pacote.

**Entrega/aceite:** um navegador atual não deve ser presumido como executor de Flash. Avaliar AIR/alternativa compatível por versão e plataforma, redistribuição e requisitos reais. Reuso de núcleo deve ser demonstrado; não escolher ActionScript como dependência padrão de novos programas.

**Fontes:** [AIR SDK](https://airsdk.dev/docs), [compiladores](https://airsdk.dev/docs/building/actionscript-compilers).

## 8. HTML

**Papel:** estrutura semântica da interface e composição de documentos web.

**Organização:** pontos de entrada, assets e componentes/templates quando necessários. Documento simples pode ser um único HTML autônomo com recursos incluídos; projeto maior separa fontes e distribuição conforme requisito.

**Implementação:** idioma, encoding, hierarquia, labels, botões/links semânticos, estados vazio/carregando/erro e foco. Formulário e diálogo precisam de comportamento real; HTML não implementa sozinho coleta de rede local, VNC ou regra de backend.

**Verificação:** conformidade estrutural, links/assets, teclado, zoom, responsividade e tarefa em navegador. Validação sintática não comprova acessibilidade completa ou funcionamento. Incluir servidor quando origem/permissões/APIs exigirem, sem prometer que file:// equivale a HTTP.

**Entrega/aceite:** declarar frontend estático, servidor/API e recursos externos. Iframe não substitui API nem contorna autenticação/CSP. Testar offline quando prometido.

**Fontes:** [HTML Standard](https://html.spec.whatwg.org/multipage/), [teclado WAI](https://www.w3.org/WAI/WCAG21/Understanding/keyboard).

## 9. CSS

**Papel:** layout, tokens, temas, estados visuais e adaptação da apresentação.

**Organização:** tokens de cores/espaçamento/tipografia; escopo de componentes e estratégia de cascata; breakpoints por necessidade. Adotar CSS simples antes de framework obrigatório. CSS faz parte do pacote web; não é backend.

**Implementação:** foco visível, contraste, estados além da cor, tamanhos úteis, overflow e conteúdo variável. Animação respeita redução de movimento e custo de renderização; evitar layout que esconde comandos essenciais. Estilo não substitui semântica de HTML.

**Verificação:** larguras e zoom declarados, textos longos, temas, estado de erro, impressão quando necessária. Inspeção/capturas de navegador complementam verificação funcional. Prefixos/transpilação dependem dos navegadores alvo.

**Entrega/aceite:** recursos e fontes resolvidos, layout sem colisões nos casos testados. Não atribuir nota de performance de linguagem nativa ao CSS.

**Fonte:** [Media Queries](https://www.w3.org/TR/mediaqueries-4/).

## 10. PHP

**Papel:** backend web, APIs e CLI com runtime PHP explícito.

**Organização:** diretório público separado de fontes/configuração/dados; Composer quando necessário, com composer.json/lock e extensões/versão registradas. Segredos fora da raiz publicada. Preservar framework existente válido.

**Implementação:** regras independentes da request; validação, erros, autenticação/autorização quando necessárias; SQL parametrizado e escape no contexto da saída. Limitar upload/caminhos, evitar execução de shell com texto externo. Definir sessões/CSRF nos fluxos que exigirem.

**Verificação:** php -v e php -l arquivo.php verificam ambiente/sintaxe; -l não executa caso de negócio. Testes e análise configurados no projeto, dependências resolvidas e integração no servidor compatível.

**Entrega/aceite:** servidor, PHP, extensões e banco declarados. Servidor de desenvolvimento não é perfil de produção. Não expor vendor/configuração ou .env por erro de empacotamento.

**Fontes:** [CLI PHP](https://www.php.net/commandline.options), [PDO](https://www.php.net/manual/en/pdo.prepare.php).

## 11. Objective-C

**Papel:** aplicações/bibliotecas Apple e integração com bases Objective-C existentes; outras plataformas exigem avaliação própria de runtime/framework.

**Organização:** interfaces .h e implementações .m; .mm somente para ponte Objective-C++; projeto/workspace e targets reais. Fixar SDK, deployment target, dependências e política ARC/manual do código existente.

**Implementação:** propriedade de recursos, ciclos de retenção, delegates, NSError quando aplicável e limites entre C/Objective-C/C++/Swift. UIKit/AppKit e atualizações de UI respeitam a thread exigida. Não presumir Foundation ou ARC como contrato universal fora do destino escolhido.

**Verificação:** compilar/testar schemes e destinos existentes com Xcode/toolchain do perfil; XCTest quando configurado. xcodebuild -list só lista projeto, não comprova build ou teste. Não inventar scheme, device ou assinatura.

**Entrega/aceite:** aplicativo/framework, recursos, SDK e assinatura/provisionamento conforme plataforma. Build Windows de núcleo independente não prova aplicativo Apple. Verificar em destino real/simulador conforme escopo, explicitando diferença.

**Fontes:** [guia Objective-C arquivado](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/ProgrammingWithObjectiveC/Introduction/Introduction.html), [testes Xcode](https://developer.apple.com/documentation/xcode/adding-tests-to-your-xcode-project). O guia arquivado serve à linguagem; SDK/destino atuais exigem documentação correspondente.

## 12. Swift

**Papel:** aplicações Apple, bibliotecas e CLI/serviços nas plataformas suportadas pelo toolchain escolhido.

**Organização:** Package.swift/Sources/Tests para SwiftPM ou projeto Xcode quando necessário; versão, plataformas mínimas, recursos e dependências fixadas. UI Apple não deve contaminar domínio portável.

**Implementação:** optionals/erros, ownership, concorrência e isolamento com semântica da versão real. Evitar bloquear UI e tratar cancelamento. Ponte Objective-C/C exige contrato de tipo/memória e suporte do destino.

**Verificação:** swift --version, swift build e swift test no pacote válido. App com SDK Apple requer fluxo Xcode/esquemas reais. Teste de pacote sem UI não comprova navegação no aplicativo.

**Entrega/aceite:** declarar SO/arquitetura, bibliotecas/recursos, runtime e distribuição aplicáveis. Swift disponível fora de macOS não fornece automaticamente UIKit/AppKit ou capacidade de construir apps Apple.

**Fontes:** [SwiftPM](https://www.swift.org/documentation/package-manager/), [Swift Testing](https://developer.apple.com/documentation/testing).

## 13. Kotlin

**Papel:** JVM, Android, multiplataforma ou nativo, escolhendo o destino antes do layout/toolchain.

**Organização:** Gradle Kotlin DSL ou convenção já existente; fixar plugins, wrapper, JDK/toolchain e dependências. Source sets comuns/específicos apenas quando houver multiplataforma real.

**Implementação:** nullability, erros, coroutines com ciclo de vida/cancelamento e disciplina de estado compartilhado. Evitar GlobalScope como dono implícito de tarefas. Contratos Java/nativos declaram limites; código comum não importa API exclusiva de plataforma.

**Verificação:** wrapper disponível/revisado e tarefas do projeto, como test/build em JVM quando existentes. Android distingue teste local, teste instrumentado, lint e execução em dispositivo; nenhum deles é substituído por “compilou”.

**Entrega/aceite:** declarar JVM/Android SDK/NDK ou Kotlin/Native conforme perfil; JAR, APK/AAB e binário nativo têm distribuição/assinatura diferentes. Não instalar todos os destinos por padrão.

**Fontes:** [Kotlin/Gradle](https://kotlinlang.org/docs/gradle-configure-project.html), [toolchains JVM](https://docs.gradle.org/current/userguide/toolchains.html).

## 14. Shell Script

**Papel:** automação de desenvolvimento/instalação e tarefas de SO compatível.

**Organização:** declarar POSIX sh, Bash ou outro shell específico, versão e utilitários externos. .sh não garante portabilidade. Parametrizar entrada/configuração, sem caminhos pessoais.

**Implementação:** quoting, listas/argumentos, códigos de saída, diretórios e temporários controlados. Evitar eval e shell construído com dados externos. set -e não é tratamento universal de falha; pipefail não é POSIX e deve respeitar shell escolhido.

**Verificação:** sh -n script.sh para sintaxe POSIX pretendida; bash -n script.sh para Bash. Analisador disponível pode complementar, não comprova efeitos. Testar em diretório temporário, inclusive espaços/acentos, erro e repetição. Não rodar instalador só para verificar sintaxe.

**Entrega/aceite:** declarar shell/utilitários/permissões. Repetição e recuperação verificadas; dry-run tem semântica real. Operação recursiva/destrutiva valida caminho resolvido e escopo antes de executar. Bash/Linux não são presumidos em Windows.

**Fonte:** [quoting Bash](https://www.gnu.org/software/bash/manual/html_node/Quoting.html).

## 15. PowerShell

**Papel:** automação Windows ou multiplataforma nos módulos suportados.

**Organização:** identificar Windows PowerShell 5.1 ou PowerShell 7+, módulos/versões e SO. Scripts/funções têm parâmetros tipados quando úteis; módulos com manifest quando reutilização justificar.

**Implementação:** objetos e parâmetros em vez de texto concatenado; -LiteralPath para caminhos literais; tratar erros terminantes e códigos de saída de executáveis externos. Evitar Invoke-Expression e bypass global de política. SupportsShouldProcess/WhatIf só quando implementados corretamente, sem fingir reversão.

**Verificação:** consultar versão, analisar sintaxe via System.Management.Automation.Language.Parser.ParseFile sem executar o script; inspecionar os erros retornados. PSScriptAnalyzer/Pester são opcionais conforme projeto e disponibilidade, não dependências já instaladas por este manual. Executar casos em dados temporários, incluindo falha/repetição.

**Entrega/aceite:** declarar módulos, permissões e restrições do SO. PowerShell 7 multiplataforma não torna módulos Windows universais. Não enumerar caminhos em PowerShell e enviá-los para cmd para remoção/movimento; manter operações de arquivos em um shell com caminhos verificados.

**Fonte:** [PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/overview).

## 16. Composição e interoperabilidade

Um mesmo programa pode combinar HTML/CSS/JS na UI, C#/Go/Rust/Java/PHP no servidor e SQL nos dados. Isso é exemplo, não stack obrigatória. Combinar Swift/Objective-C/Kotlin quando plataforma/legado exigirem; scripts ficam na preparação/instalação, sem substituir o núcleo por acaso.

Aplicar contratos da seção 12 do manual para processo/ABI e contratos HTTP/arquivo conforme caso. Definir versão, tipos, encoding, unidades, transações, timeout, cancelamento, tamanho e erros. A escolha de linguagens não pode duplicar regras de negócio em telas, banco e serviços sem dono definido.

## 17. Score e estado dos perfis

Os 14 perfis foram adicionados ao índice de avaliação, com score nulo e estado pending_eval. Disponibilidade do compilador, suporte pelo Hefestus e compatibilidade do destino continuam não avaliados até inspeção/teste.

As 12 notas heurísticas anteriores de Go/Rust/C++ são preservadas como seed; não são estendidas por analogia a HTML/CSS/SQL ou às novas linguagens. Contextos e critérios próprios são exigidos antes de atribuir notas. Não inventar benchmark para preencher catálogo.

## 18. Aceite documental e funcional

Esta publicação verifica referências, IDs e JSON. Homologação funcional exige piloto em cada perfil/destino escolhido, com ferramenta real, dependências e evidência. O manual não implementa transpilers, backends, compiladores, runtimes ou instaladores.

Ao construir um programa, a IA consulta o perfil correspondente, registra decisões e realiza apenas os checks aplicáveis. Ausência do Hefestus instalado mantém o modo arquitetural; ausência do SDK/ambiente precisa aparecer como limitação real.
