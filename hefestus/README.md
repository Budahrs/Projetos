# Hephaestus 2.0 — Preview 2

> Primeira vez, ou sem o ambiente do dono? Leia [COMECE_AQUI.md](COMECE_AQUI.md): requisitos, instalação, CLI, MCP e o que fica de fora.

Abra **hephaestus.html** com duplo clique, ou execute **Abrir_Hephaestus.bat**. O editor principal está empacotado e funciona no navegador sem instalar Node ou Rust. Fontes web são opcionais; os ícones e o código estão incluídos.

No repositório o `hephaestus.html` não vem pronto (é gerado): rode uma vez `npm ci` e `npm run build`. A bíblia do produto é [BIBLIA_ARQUITETURA_GDD.md](BIBLIA_ARQUITETURA_GDD.md).

## Duas áreas, um projeto

- **Designer**: desenho e edição Bézier, formas paramétricas, camadas, operações booleanas, máscaras, imagens incorporadas, gradientes lineares/radiais e Auto Layout.
- **Visual Script**: objetos ativos, eventos, variáveis, condições, temporizadores, animações, fios, grupos, comentários, prévia ao vivo e depuração.
- Alterne pelo toggle **DESIGNER | VISUAL SCRIPT**, à direita da linha das abas. **F7** alterna as áreas. O Designer tem sete abas e o Visual Script tem seis, na ordem da especificação atual. Cada área tem sua própria caixa de ferramentas. O canvas vetorial e o editor de nós são exclusivos.
- Os mesmos objetos, IDs, modelos, seleção e histórico são compartilhados. Converter uma forma em vetor agora preserva seu ID e os vínculos existentes.
- As funções anteriores continuam disponíveis na busca do título (**Ctrl+K**), nos modelos e no inspetor. O formato de projeto continua `.hefestus` nesta versão para compatibilidade.

## Comece pelo exemplo funcional

Um documento novo sem conteúdo abre a identidade visual do Hephaestus. Se já houver um projeto salvo no navegador, ele é preservado. Use **Arquivo > Exemplo interativo** para abrir o exemplo.

No exemplo, entre em Visual Script e use **Eventos de Gatilho > Executar / Parar**. Clique em **Iniciar** na prévia: o emblema pulsa e um aviso aparece. O fluxo real está no grafo **Objetos do Designer**. Projetos anteriores continuam com seus eventos e códigos; não foram duplicados automaticamente.

## Ferramentas incorporadas do Craft

Em **Modificar Formas**, converta uma forma em vetor e use **Adicionar pontos médios**, **Suavizar caminho** ou **Simplificar caminho**. Essas operações foram adaptadas do VectorCraft, com o snapshot, fonte original e licença MIT incluídos. O motor FigCraft de booleanas e contornar traço da base nativa também foi preservado.

Veja [a integração Craft](documentos/INTEGRACAO_CRAFT.md) e [o contrato de interface](documentos/HEPHAESTUS_2_GUIA_DE_IMPLEMENTACAO.md).

## Limites desta entrega

Esta é uma **preview funcional**, não a implementação completa de todas as ferramentas do Illustrator. Múltiplas pranchetas/slides, texto em caminho, Image Trace, mesh de degradê, gradiente livre, Shape Builder por arraste, faca/tesoura, offset com curvas, 3D, Morph vetorial, CMYK/ICC, AI, PPTX e C# ainda exigem seus motores. Eles não aparecem como ferramentas concluídas. Consulte **Arquivo > Capacidades desta versão**.

O SVG é uma exportação estática de caminhos, textos básicos e imagens incorporadas; não substitui o HTML para preservar componentes web, comportamento, layout flexível e todas as aparências avançadas. React/Vue/Web Component preservam a exportação da interface e sinais da base; o interpretador completo do Visual Script é incluído no HTML funcional.

**Não foi produzido um instalador EXE.** A compilação do backend Rust e as operações exclusivas do desktop não foram homologadas, pois não há Cargo/Rust instalado nesta máquina.

## Validação

A suíte de regressão e os testes novos estão em `testes/`; o resultado está em `validacao-hephaestus.txt`. Houve também validação no navegador do toggle, Ribbons diferentes, exclusividade dos canvases, exemplo interativo e execução do botão conectado ao efeito e ao aviso.

## Desenvolvimento

Os fontes estão em `js/`, `css/` e `src-tauri/`. Para reconstruir o HTML: `npm ci` e `npm run build`. Para testar: `npm test`. O build preserva os nomes legados em dist para os scripts de automação existentes e também gera hephaestus.html.

## Novidades do Preview 2

- Toggle segmentado animado, com suporte à preferência de movimento reduzido.
- Camadas e Componentes reutilizáveis fixados à esquerda nas duas áreas. Componentes são modelos inseridos como cópias independentes; não há propagação automática entre instâncias.
- Arrastar um objeto para o grafo materializa o bloco imediatamente. No grafo do Designer, reposiciona o bloco canônico sem duplicá-lo; nos demais, insere uma referência ao mesmo ID.
- Biblioteca de ícones SVG anexada pelo usuário integrada ao Ribbon e aos trilhos. Ícones de conteúdo e formatos anteriores continuam compatíveis.
- Craft: Juntar caminhos abertos e Dividir em grade, além das três ferramentas anteriores. Grade gera um caminho composto no objeto selecionado e mantém suas conexões.
- Novos nós executáveis: Ao pressionar, Ao rolar página, Estado do componente, Cabeçalho fixo (Sticky) e Travar rolagem. Estado define `data-hp-state` e emite `hephaestus:estado`; a aparência é configurada com CSS/classes/estilos do componente. Sticky depende da estrutura de rolagem do documento.
- Atalhos: M ou R para retângulo; W para conectar portas; + ou Tab abre a busca de nós; C cria anotação; F7 alterna áreas.

O catálogo completo solicitado permanece como objetivo de produto. Ferramentas sem motor não são anunciadas como concluídas; Shape Builder está desabilitado com explicação, e os demais recursos pendentes estão no inventário de capacidades.

## Abertura com sons

Ao abrir, três marteladas na bigorna e uma voz dizendo "Hephaestus". As marteladas são sintetizadas na hora (`js/ui/abertura.js`); a voz é gerada offline com a voz Microsoft Daniel (pt-BR) por `npm run voz:abertura` e fica embutida em `js/ui/vozAbertura.js`. Toque ou **Esc** pula. Se o navegador bloquear som sem gesto, a abertura pede um toque. **Exibir > Sons** liga/desliga a abertura e permite vê-la de novo.

## Android (Tauri 2)

1. Instale o Android Studio (SDK Platform, Build-Tools, NDK e Command-line Tools), o Rust (`rustup`) e defina `ANDROID_HOME`, `NDK_HOME` e `JAVA_HOME` (o JBR do Android Studio serve).
2. `npm ci` e depois `npm run android:preparar`: cria `src-tauri/gen/android`, os ícones e libera o som da abertura na WebView.
3. Celular com depuração USB: `npm run android:dev`. APK: `npm run android:apk`.

No Android, Abrir/Salvar usam o seletor de arquivos do sistema (endereços `content://`), e Ctrl+S regrava só arquivos escolhidos nesse seletor durante a sessão.
