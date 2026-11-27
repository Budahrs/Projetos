# Estado da reconstrução

Produto 2.1.0, canal de desenvolvimento: reconstrução em validação. Data: 28/10/2026. Formato de projeto .hefestus permanece 1. A versão numérica do produto é separada do canal porque o armazém atual não aceita sufixos semver.

## Proveniência

Repositório rsampietro-code/programas, commit b130843db46aa5a22831fbf19eaff5189ac5f263. Os 438 arquivos oficiais do produto foram reconstruídos e comparados por Git blob SHA-1 antes da edição, sem divergência. Relatório: quality/baseline-github.json. A árvore local é um snapshot selecionado do monorepo, não um clone de todo o histórico. O commit local de retorno é 5e3b5f6. Na reconstrução inicial, projetos existentes não foram substituídos. Posteriormente, por pedido do dono, duas instalações antigas foram removidas; veja a nota de organização abaixo.

## Entregue

Preservados Designer/Código exclusivos, Ribbon, motores vetoriais/Craft, sincronização de objetos, importador isolado, exportação e ferramentas já existentes. Acrescentados parser nativo de HTML inline; fachada DocumentoAtivo; revisão esperada; reimportação de três versões; diagnóstico de conexões; soma validada; painel Bíblia/GDD e CLI. Preferências inválidas não interrompem mais o Visual Script.

## Verificação

380 testes passaram, zero falhas, com --test-concurrency=4, em quality/regressao-reimportacao-estrutural.txt. Esta etapa acrescentou 12 testes do domínio estrutural e dois de integração CLI/MCP. Registros de etapas anteriores permanecem como evidências históricas. Build HTML passou. Validação manual no navegador: importação nativa gerou objetos separados, listados no Visual Script; painel Bíblia/GDD abriu; calculadora exportada executou 2+3=5, rejeitou abc e recuperou com 2,5+3=5.5. Não depende do editor para executar. Auditoria do exemplo: zero diagnósticos. Evidências adicionais em quality/aceite-reconstrucao.json.

## Limites

Os 53 requisitos e os marcos M0–M9 não estão todos concluídos. Não foi gerado nem homologado instalador Windows/Rust. O parser não converte CSS externo, flex/grid completo, scripts, mídia ou SVG em objetos. Adições/remoções na reimportação exigem IDs HTML explícitos e escolhas de remoção. Alteração de tipo continua exigindo nova composição. Importação e reimportação nativas agora estão expostas pelo MCP; validação com clientes MCP externos permanece pendente. Não houve ensaio de instalação em Windows limpo, medição de desempenho comparativa nem certificação de interoperabilidade Illustrator/PowerPoint. Recursos pendentes continuam descritos na Bíblia e na matriz.

As referências Construct 3, Node-RED, FlutterFlow e GDevelop orientam a evolução em docs/referencias-evolucao.md. Aplicada a navegação de diagnóstico para objeto/grafo/nó. O build usa hard links locais quando disponíveis para evitar aliases duplicados; o pacote de distribuição contém uma única entrada completa. O arquivo de publicação parcial dist/hefestus-pagina.html é regenerável e foi retirado dos intermediários locais para poupar espaço.

## Designer/Código — validação final

Toggle animado Designer/Código com F7. Código contém Blocos, Grafo e Código-fonte sem criar terceiro workspace. Os blocos projetam os nós existentes; Aplicar campos grava uma única transação e rejeita revisão obsoleta. Rascunhos de campos e HTML/CSS/JS ficam na sessão, sem substituir o salvamento do projeto. O HTML funcional completo é gerado e somente leitura. Não há conversão arbitrária de JavaScript para grafo nem transpiler TypeScript novo.

No navegador foram confirmados: rascunho de bloco preservado ao trocar Grafo/Blocos; aplicar, desfazer e refazer os campos; seleção preservada ao usar F7 dentro do editor; rascunho CSS preservado ao retornar; aplicação e desfazer do CSS. Alterações de QA foram revertidas. A conexão de automação teve interrupções, resolvidas com inspeção da tela e controles acessíveis.

## Organização local solicitada

Permanece uma instalação de trabalho em C:\workspace\programas-hephaestus\hefestus. A cópia Hephaestus_2_0_Preview2_NotesBase foi excluída e Hefestus_0.46 foi enviado à Lixeira; ela não foi esvaziada. O programa autoral PDF Studio foi transferido para programas/pdf-studio, com os 17 arquivos conferidos por SHA-256 antes da remoção da instalação antiga. Esse conteúdo autoral permanece local, fora do commit do editor. Projetos .hefestus do usuário foram preservados. Não foi criado novo ZIP ou diretório de versão. O retorno do editor usa o histórico Git, inclusive o snapshot local 5e3b5f6.

## Engenharia MCP — implementação validada

Quatro ferramentas: verificar projeto, importar HTML nativo, preparar reimportação e aplicar reimportação. Usam DocumentoAtivo/Nucleo e o gravador oficial do projeto. Revisão SHA-256 protege chamadas de arquivo; token temporário vincula comparação ao caminho e aos bytes originais. Metadados desconhecidos do envelope, memória e documento são preservados no ensaio. Importação e reimportação sincronizam objetos antes de concluir a transação, evitando passo artificial de conciliação ao reabrir.

Servidor stdio real testado: equivalência com o domínio; salvar/reabrir/desfazer/refazer; conflitos local/fonte; revisão obsoleta; fonte inválida/grande; formato futuro; estrutura alterada; link externo; token expirado e limite de 32 planos; projeto que precisa de recuperação não é sobrescrito. Não é homologação em cliente externo. Rust/Cargo e tsc não foram encontrados no PATH desta máquina; não foram instaladas toolchains nem produzidos instaladores nesta etapa.

## Reimportação pela CLI

comparar-html e atualizar-html completam a comparação/aplicação pelo mesmo domínio na linha de comando. A aplicação exige revisaoArquivo e revisaoFonte da comparação, recalcula o plano e usa as mesmas resoluções local/fonte do domínio. engenhariaArquivos.mjs compartilha com o MCP a persistência, limites, metadados e conferência de hash. A CLI não grava planos nem cria backups. Manual contém exemplo PowerShell e escolhas JSON.

Os sete testes novos validam comandos reais em caminhos com espaços, ausência de escrita na comparação/falhas, conflitos, fontes/projetos alterados, resoluções inválidas, metadados e desfazer/refazer após reabrir. A primeira regressão sem limite de concorrência teve um timeout de resposta de cinco segundos no MCP sob carga simultânea. A execução com quatro arquivos simultâneos passou integralmente; npm test agora fixa essa concorrência. Não houve nova compilação nativa nem novo suporte TypeScript nesta etapa.

## Reimportação estrutural

Adições recebem IDs novos sem reutilizar IDs retirados na mesma operação. IDs comuns são preservados. Cada ausência na nova fonte exige escolher local (conservar e desvincular) ou fonte (solicitar remoção). O plano é recalculado antes de aplicar; candidato, fonte, base, mapa e grafo são gravados em uma transação. Referências remanescentes e hierarquias inválidas recusam a atualização inteira. Tipo diferente e fonte sem qualquer elemento suportado continuam recusados. Mudança estrutural com identidade automática também é recusada; importações antigas com IDs explícitos são conferidas pela fonte preservada.

Validação visual: diálogo mostrou uma adição e uma ausência; escolha local preservou o objeto anterior e adicionou o novo; editar HTML depois de comparar impediu aplicar escolhas antigas. Desfazer da atualização e da composição de QA restaurou o estado anterior. Evidência em quality/interface-reimportacao-estrutural.png. Servidor de teste local foi restabelecido antes da verificação do build novo. A primeira execução integral foi interrompida pelo limite de 55 segundos do executor; a execução com prazo suficiente concluiu em aproximadamente 45 segundos, com 380 aprovações.

A inspeção de referências é conservadora: valores/chaves e referências literais a IDs, incluindo código, podem impedir remoções. Não interpreta código arbitrário para comprovar ausência de referências construídas dinamicamente. Não homologa toda a Bíblia nem elimina as pendências de TypeScript/instalador.
