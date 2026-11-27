# Hephaestus 2.0 — contrato de interface e implementação

Fonte confirmada: especificação e dois mockups aprovados na conversa de 26/10/2026. Base de código: Hefestus 0.47 Alpha4 entregue anteriormente. Os desenhos de ferramentas nos mockups não demonstram que seus motores existam.

## Invariantes
- Nome público: Hephaestus; nome público da antiga Forja: Visual Script.
- Um documento, dois workspaces mutuamente exclusivos: Designer e Visual Script.
- Toggle segmentado na extremidade direita da linha das abas, abaixo de Desfazer/Refazer, sem sobrepor os comandos.
- Designer: Arquivo, Página Inicial, Inserir, Modificar Formas, Design & Aparência, Layout Responsivo, Exibir.
- Visual Script: Eventos de Gatilho, Ações & Efeitos, Lógica & Condições, Variáveis & Dados, Estados de Componente, Compilar & Dev.
- Cada workspace transforma seu Ribbon, sua barra de ferramentas e seu canvas. Nenhum editor de nós é montado abaixo do canvas vetorial.
- No Visual Script, Camadas e Componentes reutilizáveis ficam fixados à esquerda. A árvore mantém identidade, seleção e hierarquia.
- As operações do editor continuam pelo núcleo, com histórico e proteção das decisões.
- Ferramentas anteriores fora das abas atuais continuam disponíveis pela busca de comandos e inspetor. Formatos e chaves internas legados permanecem compatíveis.

## Critérios de aceite
1. Alternar workspace nunca muda conteúdo, histórico ou tamanho da tela do projeto.
2. Em Designer, apenas o canvas vetorial é visível; em Visual Script, apenas o canvas de nós é visível (prévia de execução é opcional).
3. Não há abas contextuais adicionais nem segundo seletor de workspace.
4. Inserir, renomear e remover elementos ou componentes de modelos atualiza os nós sem perder posições e lógica existentes.
5. Salvar e reabrir preserva documento, grafos e histórico. Desfazer/refazer continua funcionando.
6. Ferramentas visíveis ativas possuem implementação real. Recursos sem motor permanecem no inventário de capacidades ou desabilitados com explicação.
7. Build e testes acompanham a entrega. A homologação visual e o instalador são declarados separadamente.

## Motores que não podem ser declarados completos com base no mockup
Image Trace completo, mesh de degradê, gradiente livre, Shape Builder por arraste, faca/tesoura interativas, extrusão 3D, Morph vetorial, exportação nativa AI/PPTX/C# e conectores arbitrários de banco de dados. Precisam de implementação e validação próprias. A versão inicial mantém SVG, HTML, componentes React/Vue e operações vetoriais que já existem, com melhorias concretas documentadas na entrega.
