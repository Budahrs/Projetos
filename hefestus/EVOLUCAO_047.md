# Hefestus 0.47.0-alpha.1 — estado real da evolução

Data: 23/10/2026. Base: Hefestus_Forja_Visual_Candidata.zip, revisão 5, SHA-256 `4822157e0d83144aa0a4266c1b3e297998d72aa62b6810533fd76c2406ff4a7e`. O pacote distribuído incorpora esta evolução. Código da pasta antiga `hefestus` no GitHub não foi substituído por este trabalho.

## Resultado

O padrão de organização deixou de existir apenas em documentação: salvar o projeto e exportar pelos caminhos existentes inclui BIBLIA.md, manifesto de organização, diagnóstico estático e, no perfil jogo, GDD.md. Um workspace independente pode ser extraído sem executar código e sem substituir destino existente.

## Mudanças implementadas

| Área | Mudança | Evidência |
| --- | --- | --- |
| Núcleo documental | Perfis editor, monitoramento, jogo, conteúdo, IA, catálogo e biblioteca; níveis inicial/produto/ampliado | Testes de padrão e validação de organização |
| Salvamento/exportação | Bíblia, manifesto, GDD e qualidade distribuídos com o projeto, preservando `.hefestus` v1 | Reabertura e comparação do documento |
| Compatibilidade | Declarações atuais do canvas prevalecem sobre as antigas, preservando campos não substituídos | Caso com declarações divergentes |
| Diagnóstico | Referências quebradas, ciclos de parentesco, eventos inválidos, requisitos duplicados e lacunas | Testes de entradas inválidas; relatório explicitamente estático |
| CLI/MCP/agente | Perfil/nível na criação, ferramentas configurar_padrao e diagnosticar_projeto; comandos CLI qualidade/workspace | Testes por processos CLI e uso do núcleo protegido |
| Documentação na UI | Perfil, nível, destinos, responsável, decisões, plano e pendências | Teste DOM com mudança de perfil e desfazer |
| Campos da UI | Corrigido valor de textarea e select; requisitos estruturados exibidos como JSON por linha | Teste DOM com objeto preservado |
| Lotes | Falha reverte documento e histórico em memória, além de impedir a gravação | Caso com primeira edição válida seguida de ferramenta inexistente |
| Escrita de arquivo | Temporário exclusivo e limpeza; não colide com `.tmp` do usuário | Teste com temporário preexistente |
| Extração/workspace | Validação integral de caminhos e colisões antes da escrita; staging e hashes SHA-256 | Casos de escape, alias Windows, arquivo-diretório, hashes e destino existente |
| Exportador Tauri | Staging, recusa de substituição de pasta, caminhos reais no manifesto e estado de compilação explícito | Geração de fontes desktop e conferência do manifesto |
| Verificação | Runner confere resultado e resumo de todos os arquivos individualmente | Relatório com 49 arquivos e 347 testes aprovados |
| Documentação própria | Entrada BIBLIA.md, padrão e modelos incluídos, instruções atuais antes do histórico | Arquivos no pacote |

Reversão de lote cobre o documento autoral; não desfaz downloads ou efeitos externos já realizados por ferramentas. Extração e exportação recusam destinos existentes: para regenerar, escolha pasta nova. A exportação Tauri prepara fontes e configuração, não um instalador já produzido.

## Exemplo ponta a ponta

`exemplos/soma-padrao-047/` inclui documento editável, HTML independente, bíblia, requisitos, diagnóstico e manifesto de integridade. Abra `interface/index.html` ou reabra `projeto.hefestus` no Hefestus. A operação aceita ponto/vírgula decimal, rejeita campo vazio e entrada inválida e preserva os valores do formulário após erro.

O exemplo usa a extensão de código autoral existente no Hefestus, com a operação somarEntradas testada separadamente. Não é uma implementação do IR geral nem do editor de grafos. Valores do formulário são temporários; persistência do projeto e persistência dos dados da aplicação são diferentes.

## Verificação executada

- Ambiente: Node 24.19.0, Linux x64.
- Dependências: `npm ci --ignore-scripts`; lock atualizado e conferido com instalação offline.
- Suíte completa: `npm test -- --relatorio quality/testes-047.json` — 49 arquivos, 347 testes, todos aprovados.
- Build web: `npm run build` concluído, com verificação sintática do bundle pelo empacotador.
- DOM: componente Documentação testado com jsdom; comportamento do HTML independente exercitado com execução dos seus scripts.
- Exportação desktop: fontes gerados e caminhos conferidos; nenhum build de instalador executado.

## Não verificado e limites

O navegador Playwright não pôde ser instalado: o download retornou arquivo inválido/truncado. Não houve nova inspeção visual da tela completa, medição de layout, teclado em navegador real ou ensaio com usuário. jsdom não substitui essas verificações.

Não houve build nativo, instalação Windows limpa, teste físico em outro PC, conexão real com serviços externos ou benchmark global. A versão e os metadados Tauri/Cargo foram alinhados; isso não comprova compilação Rust.

As dependências e funções prévias foram preservadas. As melhorias desta edição não homologam automaticamente todos os módulos antigos. O diagnóstico de qualidade não executa código ou rede nem certifica evidências declaradas. As plataformas do manifesto são destinos declarados, não destinos aprovados.

## Etapas seguintes

1. Aceite visual e operação nas instalações reais, com corpus de projetos antigos.
2. Mapear o estado divergente das pastas no GitHub e dos computadores do usuário.
3. Especificar o IR geral e os migradores para eventos já existentes.
4. Entregar blocos/dados/grafo progressivamente, com condições, loops e macros testados.
5. Validar motores externos e operações especializadas de PDF Studio, com dados de referência.
6. Compilar, instalar e testar o programa independente no Windows suportado.
7. Medir desempenho antes de trocar linguagens, persistência ou arquitetura de processos.

## Preservação e retorno

O ZIP da revisão 5 permanece como versão anterior. A evolução foi desenvolvida em cópia separada, sem tocar a pasta Windows do usuário ou substituir os fontes antigos do GitHub. O formato autoral permanece v1; os documentos de organização são aditivos. A bíblia de arquitetura é o plano completo, enquanto este relatório descreve apenas a capacidade efetivamente entregue nesta edição.

## Identificação do pacote entregue

Revisão do arquivo candidato: 6. Arquivos: 543. Tamanho: 47.461.220 bytes. SHA-256: `5742a1adefdb0cc95a25bbbc233d9bb44dace71743ed957eca8fc038b6b1d22b`. Nenhum arquivo da revisão anterior foi removido. O pacote atualizado foi salvo com sucesso; os fontes antigos desta branch permanecem preservados.
