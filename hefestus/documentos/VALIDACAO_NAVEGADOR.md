# Validação do Preview 2 — 26/10/2026

Chromium 153, Playwright, Linux, viewport 1600 × 1000. Build HTML aberto via file://, sem servidor e sem dependências externas obrigatórias.

Verificado por interação e inspeção da página:

- Sete abas no Designer e seis no Visual Script, com rótulos e ordem atuais.
- Alternância preserva o documento e o histórico; o canvas inativo não ocupa espaço.
- Toggle abaixo do acesso rápido alinhado à direita; indicador transiciona por transform e respeita prefers-reduced-motion.
- Camadas e biblioteca de Componentes reutilizáveis visíveis nas duas áreas.
- Busca e inserção de um modelo dentro de Visual Script mantém essa área ativa e cria objetos/nós correspondentes.
- Soltar objeto no canvas materializa o bloco imediatamente, sem abrir busca intermediária e sem duplicar o bloco canônico.
- Modificar Formas > Adicionar pontos médios dobra as âncoras e um Undo restaura a contagem.
- Modificar Formas > Dividir em grade: diálogo 3 × 2 produz seis contornos no mesmo objeto; um Undo restaura a geometria.
- Todas as abas do Visual Script abrem sem exceções JavaScript.
- Capturas internas das duas áreas inspecionadas; rótulos longos do Ribbon têm reticências e tooltip completo.

Os testes automatizados em testes/hephaestus-preview2.test.mjs também verificam união de subcaminhos com alças Bézier, limites/espaçamento da grade, preservação de identidade/histórico, SVG dos ícones e execução/desligamento dos novos nós. A suíte completa consta em validacao-hephaestus.txt.

Não foi compilado instalador Tauri nem homologado o backend Rust: Cargo não está instalado no ambiente. Não há certificação de AI/PPTX/C#, Morph vetorial, Mesh, Image Trace, CMYK/ICC, 3D ou Shape Builder por arraste.
