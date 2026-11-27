# Hefestus 0.46 — consolidado (casa 0.45 + trabalho 0.40)

21/10/2026. As duas linhas do Hefestus, que se separaram em 15/10 a partir do `Hefestus-projeto-completo`, foram unidas por fusão de três vias (git merge-file) usando essa versão como base comum.

## O que veio de cada lado
- **Casa (0.35–0.45):** temas System/Light/Dark/Dim/Alto contraste, layouts da faixa, Opções, telas próprias, formato `.hefestus` + hefestus-cli, Craft (operações de forma com curvas exatas, traço em forma), servidor MCP + AGENTS.md, exportar programa com janela própria e instalador (Tauri), ligações/motor (PDF Studio 0.7), orquestrador e oficinas.
- **Trabalho (0.35–0.40):** menus adaptativos e registro de comandos, enquadrar conteúdo, Forja (editor inferior), pincel de formatação completo, menu de contexto 0.39 com submenus e configuração flutuante, importar HTML e recriar artefato, armazém (IndexedDB), recuperação de projeto corrompido, pacote Windows, primeiros passos.

## Onde os dois mudaram a mesma coisa
- Editor inferior, menu de contexto e compactação da faixa: ficou o desenho do trabalho (Forja / menu contextual / menus adaptativos). Na compactação, voltou a regra de casa: o grupo menos usado cede primeiro e grupos fixados/recolhidos são respeitados.
- Salvar: formato `.hefestus` de casa (diálogo do Windows na janela própria). O pacote `.zip` com documentação do trabalho virou `salvarPacoteDocumentado()`; Abrir aceita `.hefestus`, `.json` e `.zip`.
- Restaurar projeto: migração de formato de casa + recuperação de campos/histórico inválidos do trabalho.

## Verificação
263 de 263 testes automatizados passaram (`node --test testes/*.test.mjs`). `node build.mjs` gerou `dist/hefestus.html` e `hefestus.html` com integridade total.

## Melhorias aplicadas em 21/10/2026
- **Cabeçalho e layout responsivo:** corrigida a sobreposição do botão "Oficina de menus". O espaçamento da barra de título foi ajustado para 450 px e ganha regras responsivas em 1366 px e 980 px, garantindo visibilidade total em janelas de 1600 px ou menores.
- **Atalho rápido da Oficina:** adicionados atalhos de teclado `F7` e `Ctrl+Shift+O` para alternar diretamente para a Oficina de menus e ferramentas a qualquer momento (documentado no diálogo de atalhos `F1`).
- **Fontes restaurados:** os 119 módulos JavaScript foram integralmente desempacotados e organizados na pasta `js/` (núcleo, ui, agente, app) com compatibilidade total para `node build.mjs`.
- **Atalhos atualizados:** unificados os atalhos `Hefestus.lnk` (Área de Trabalho e `Atalhos\Projetos`) para apontar para a versão consolidada mais avançada.
