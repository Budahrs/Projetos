# Hefestus 0.37 — ferramentas, referências e pendências

Data: 19/10/2026. Instalação original e atalho em Meus Projetos atualizados. Recarregue o editor e confira v0.37.0.

## O que foi implementado

- Opções: Projetos e componentes, Dados e indicadores, IA local e contexto, Pedidos e métricas.
- Layout: organização por aba/grupo, limite de ações simples, densidade compacta/confortável, prévia temporária com aplicar/cancelar e reversão.
- Overflow: busca nos comandos do grupo; painel flutuante escolhe espaço acima/abaixo. Controles especializados permanecem intactos.
- Acessibilidade: foco contido em diálogos, títulos únicos, Esc somente no diálogo superior e restauração de foco no menu do canvas.
- Métricas locais: renderização, mudança de aba, tempo entre aba e comando, expansão, contexto e abertura de flyout. São eventos técnicos, não avaliações humanas de satisfação.
- Curadoria: interface para revisar unificação de referências, justificativa/evidências e reversão; código de implementações distintas não é fundido automaticamente.
- Oficina de projetos: contratos JSON com versão, origem/licença, cores, caminhos SVG, campos e controlador; biblioteca com versões imutáveis, instâncias, atualização e relatório de conflitos.
- Designer/código: exportação de HTML com contrato incorporado; importação recupera esse contrato; HTML manual é preservado separadamente e não executado na prévia. Não traduz JavaScript arbitrário para o designer.
- Cinco modelos de ferramentas: notas, pendências, formulário, calculadora de taxas e catálogo pesquisável. Modelos web têm persistência local e importação/exportação de dados. Formulário Windows salva registros em linhas JSON; tarefas Windows são texto marcado, não cartões.
- Geradores: web responsiva/PWA com manifesto/cache offline; projeto Windows WPF com eventos e persistência. São fontes, não executáveis compilados. PWA não é APK nem aplicativo iOS nativo; instalação depende do navegador e HTTPS/localhost.
- Temas nos projetos gerados: canônicos e System/Auto. Adaptadores exportáveis CSS, Tk e WPF. Extração revisável de cores hexadecimais de CSS/HTML/SVG; não equivale à importação completa de um tema externo.
- Dados locais: CSV com campos entre aspas, JSON tabular, filtros, agrupamento, contagem/soma/média/mínimo/máximo, barras acessíveis, definições de indicadores salvas e exportação com origem/denominadores. Até 20 mil registros, 100 colunas, tabela com 200 linhas visíveis. Não conecta SQL/bancos externos.
- Acompanhamento dos 52 pedidos e das metas do plano; evidências e próxima ação editáveis. Nenhum pedido foi marcado como validado por esta implementação.
- IA local: consulta compatível com chat completions a endpoint loopback, cancelamento/timeout e aplicação revisada de propostas de layout. Servidor/modelo precisam estar iniciados e aceitar a origem do editor; documento só entra no contexto se marcado.
- MCP stdio: ferramentas de leitura de snapshot exportado e gravação de propostas. Não observa nem controla uma janela ao vivo. Configuração de cliente não foi alterada.

## Como usar

Na guia Opções, abra a oficina desejada. Em Projetos e componentes, escolha o modelo, edite o contrato e aplique para visualizar. Salve versões na biblioteca. O HTML exportado abre diretamente; projetos com vários arquivos são exportados em pacote JSON.

Materializar um pacote em pasta nova:

    node Ferramentas/materializar-projeto.mjs projeto.arquivos.json pasta-nova

Extrair contratos de projetos Hefestus existentes, sem executar scripts:

    node Ferramentas/extrair-componentes.mjs biblioteca-nova.json projeto.json projeto.html

Modelos já materializados estão em Modelos/Web e Modelos/Windows. Adaptadores estão em Adaptadores-temas.

Para um cliente MCP que aceite o protocolo 2025-06-18, configurar comando node, argumentos caminho-absoluto/Ferramentas/hefestus-mcp.mjs e pasta-de-contexto. Na pasta, colocar hefestus-contexto.json exportado pelo editor. As propostas ficam em propostas/ e devem ser importadas/revisadas em IA local e contexto. Não usar o snapshot como estado vivo.

## Referências consultadas

- ArtCraft: https://getartcraft.com/apps e https://github.com/storytold
- FigCraft: https://github.com/storytold/figcraft — separação entre documento, layout, engine, UI e MCP no workspace; componentes/instâncias e comandos comuns como referências de arquitetura.
- Apache Superset: https://superset.apache.org/ — fontes, indicadores, filtros e visualizações separados.
- Metabase: https://www.metabase.com/ — consultas guiadas e métricas reutilizáveis.
- Redash: https://redash.io/ — filtros e visualizações sobre resultados.
- Lightdash: https://github.com/lightdash/lightdash — organização modular e definições reutilizáveis de métricas.
- Panthera: https://github.com/Ashishkumar201/panthera-fullstack — referência de filtros e navegação; o README descreve o chat como respostas estáticas. Não foi tomado como motor de IA funcional.
- Microsoft Ribbon: https://learn.microsoft.com/en-us/windows/win32/uxguide/cmd-ribbons
- Perfis VS Code: https://code.visualstudio.com/docs/configure/profiles
- PWA: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- MCP: https://github.com/modelcontextprotocol/modelcontextprotocol/tree/main/docs/specification/2025-06-18

Nenhum código dos projetos de referência foi incorporado. Consultar repositórios e registros de licença específicos antes de incorporar dependências futuras. Usar projetos consolidados como referência permanece uma decisão do projeto; considerar maturidade e capacidade real de cada referência.

## Limites que continuam abertos

1. Instalar/ligar o catálogo de temas e a atualização de componentes em todos os aplicativos existentes, com migração e reversão por consumidor. Os adaptadores gerados não fazem essa instalação.
2. Integração MCP ao vivo com seleção e operações do editor, além de snapshots e propostas.
3. Tradução bidirecional de código manual arbitrário e mescla funcional automática de algoritmos.
4. Pipeline native Android/iOS e comprovação de execução de todos os alvos; geração PWA não substitui isso.
5. Polimento completo das variantes e menus contextuais, reorganização global de artefatos e herança de layouts por projeto.
6. UX/satisfação, economia e metas de desempenho precisam de coleta real. Sem valores fictícios.

## Estado da verificação

Não foram executados testes, compilação dos projetos WPF, inspeção interativa ou chamadas ao servidor de IA, por orientação do usuário. Foi executado somente o empacotador do editor e a geração dos modelos/adaptadores. Portanto esta versão está implementada sem validação funcional, e não encerra todas as pendências.

Backup dos módulos anteriores: work/hefestus-antes-037. Os dados e documentos do navegador não foram regravados por scripts de instalação. Arquivos locais anteriores de distribuição continuam disponíveis.
