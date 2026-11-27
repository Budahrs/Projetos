# Usar esta entrega

Abra hephaestus.html no navegador. hefestus.html permanece como entrada compatível. São arquivos gerados por node build.mjs; index.html é a entrada de desenvolvimento, não a recomendada para abrir diretamente.

## Criar e programar

1. No Designer, use Inserir → Importar HTML.
2. Selecione Objetos nativos — HTML inline. Cole HTML com IDs explícitos e estilos inline.
3. Recriar artefato cria objetos individuais; leia o status de fidelidade e edite pelas Camadas/Inspetor.
4. Alterne para Código pelo toggle superior ou F7. Os objetos aparecem na árvore; use nós de evento e ação e valide as conexões.
5. Bíblia/GDD fica em Arquivo no Designer ou Compilar & Dev em Código. Não existe uma terceira área.
6. Salve como .hefestus para continuar editando; exporte HTML funcional para execução independente.

## Atualizar uma importação

Selecione a raiz nativa e abra Importar HTML → Atualizar composição nativa selecionada. Cole a fonte nova mantendo IDs/tipos. Se houver conflitos, escolha Manter local ou Usar nova fonte. Se a revisão mudar, prepare um novo plano. Adições/remoções exigem IDs HTML explícitos e as escolhas descritas abaixo; alterações de tipo continuam exigindo nova composição. CSS/JS adicionais usam o modo isolado. Desfazer/Refazer opera sobre as transações.

## Exemplo

Abra exemplos/engenharia/calculadora.html para executar ou calculadora.hefestus no editor para inspecionar os objetos e o grafo calculo-validado. O HTML exportado é independente. A fonte não contém handlers: a lógica está no Visual Script.

## Desenvolver e verificar

Node 24 foi usado. Dependências têm package-lock.json; npm ci deve ser executado em ambiente com acesso ao registro. Nesta máquina Blockly 13.4.0 foi reaproveitado da instalação existente e conferido contra a versão declarada. Não execute npm update para reproduzir.

- node build.mjs
- npm test
- npm run verify:reconstrucao
- node ferramentas/engenharia.mjs importar-html fonte.html saida.hefestus
- node ferramentas/engenharia.mjs verificar saida.hefestus
- node ferramentas/engenharia.mjs resumo saida.hefestus

A CLI não sobrescreve saídas por padrão; --substituir é explícito. Para host nativo consulte a documentação Tauri existente e valide a toolchain. Esta entrega não inclui um novo instalador.

## Alternar representações

- Designer cria e organiza a interface. Código programa os mesmos objetos; F7 alterna as áreas mantendo a seleção.
- Blocos lista os nós do grafo atual. Edite os campos e clique Aplicar campos para gravar uma única alteração desfazível. Descartar campos recupera os valores aplicados. Se o documento mudar depois de iniciado o rascunho, uma revisão obsoleta é rejeitada; descarte e refaça a edição sobre os dados atuais.
- Grafo mantém o canvas de nós e fios. Localizar no grafo sai do bloco e enquadra o nó real. Novos eventos, ações e variáveis usam os comandos existentes do Ribbon.
- Código-fonte edita as extensões HTML, CSS e JavaScript do objeto selecionado. Aplicar código grava no documento; Descartar rascunho recupera o que já foi aplicado. O HTML funcional completo é gerado e somente leitura. Não é um editor TypeScript nem um conversor de JavaScript arbitrário para nós.

Rascunhos sobrevivem às trocas de área/representação nesta sessão. Aplique antes de salvar o .hefestus; um rascunho ainda não aplicado não integra o projeto salvo. Ctrl+Z/Ctrl+Y desfaz/refaz alterações aplicadas. Os aliases legados Forja/Web/visual-script continuam aceitos internamente.

## Engenharia pelo MCP

O servidor existente ferramentas/hefestus-mcp.mjs recebe uma pasta de trabalho e mantém o transporte stdio. Reinicie o servidor no seu cliente após atualizar o código. As ferramentas novas trabalham sobre um projeto .hefestus existente nessa pasta:

1. hefestus_verificar_projeto com arquivo retorna diagnósticos e revisaoArquivo (SHA-256). Não grava.
2. hefestus_importar_html_nativo recebe arquivo, html e revisaoArquivo atual; nome, largura e altura são opcionais. Retorna raiz, mapa de IDs, fidelidade e avisos. O nome legado hefestus_importar_html continua sendo a importação isolada.
3. Para atualizar, hefestus_preparar_reimportacao_html recebe arquivo, raiz e html novo. Só compara e retorna token, alterações e conflitos.
4. hefestus_aplicar_reimportacao_html recebe arquivo, token e resolucoes: um objeto cujas chaves são as chaves dos conflitos, com valores local ou fonte. Conflitos precisam de escolha explícita. Sem conflitos, omita resolucoes.

Token dura dez minutos e pertence à sessão e aos bytes do arquivo; até 32 comparações são mantidas. Se outra edição mudar o arquivo, prepare novamente. Não envie um plano/deltas como parâmetros. A aplicação é uma transação e pode ser desfeita ao abrir o projeto no editor. Até 2 MB UTF-8 por fonte e 64 MB por projeto; arquivos futuros ou que precisam de recuperação não são sobrescritos. Campos desconhecidos do envelope e do documento permanecem preservados. O fluxo foi testado por stdio, sem homologar um cliente MCP externo.

## Atualizar HTML pela linha de comando

A CLI de Engenharia agora oferece comparar-html e atualizar-html, além dos comandos já existentes. Use a raiz retornada por importar-html. Comparar só lê; não cria plano nem backup em disco. Exemplo em PowerShell, para uma raiz container_1:

```powershell
$comparacao = node ferramentas/engenharia.mjs comparar-html projeto.hefestus container_1 nova-fonte.html | ConvertFrom-Json
$comparacao.conflitos
node ferramentas/engenharia.mjs atualizar-html projeto.hefestus container_1 nova-fonte.html --revisao-arquivo $comparacao.revisaoArquivo --revisao-fonte $comparacao.revisaoFonte
```

Se houver conflitos, crie um arquivo escolhas.json com as chaves exatas retornadas em conflitos e os valores local ou fonte. Acrescente --resolucoes escolhas.json ao comando atualizar-html. Exemplo de conteúdo: {"salvar|rotulo":"local"}. Essa chave é ilustrativa; use a chave efetivamente retornada.

Mudança no projeto ou no HTML depois da comparação exige comparar novamente. A ferramenta também confere a fonte e o projeto antes de persistir. Falha de conflito, resolução, revisão, formato ou recuperação não grava alteração parcial. O limite do JSON de escolhas é 1 MB. Fonte HTML tem limite de 2 MB UTF-8; projeto, 64 MB. IDs comuns e tipos existentes são preservados; adições/remoções seguem as escolhas estruturais abaixo. A atualização altera o projeto indicado, em uma transação que pode ser desfeita ao reabrir no editor.

A importação inicial mantém a sintaxe importar-html FONTE.html SAIDA.hefestus [--substituir]. A opção --substituir só pertence a esse comando; atualização de um projeto existente usa os hashes, sem substituição cega.

Regressão reproduzível nesta máquina: npm test usa --test-concurrency=4 para limitar os arquivos de teste simultâneos. A suíte completa também foi executada com --test-timeout=20000; o registro mostra 366 testes aprovados.

## Adicionar e remover objetos ao atualizar HTML

Use id ou data-hefestus-id em todos os elementos das duas fontes quando houver mudança estrutural. A comparação mostra adicoes, remocoes e conflitos. IDs internos de elementos que continuam na fonte não mudam; adições recebem IDs próprios. Alterações de tipo ainda exigem nova composição. A nova fonte precisa conter ao menos um elemento do subconjunto suportado.

Uma ausência na fonte é sempre um conflito, mesmo se o objeto não tiver sido editado localmente:

- Manter objeto local (resolução local): conserva o objeto e suas propriedades, desvinculando-o da importação. Se a chave reaparecer no HTML, ela cria outro objeto; não sobrescreve o objeto local.
- Remover objeto (resolução fonte): solicita apagá-lo. Se houver dependências remanescentes, a atualização inteira é recusada. Mova filhos locais ou ajuste eventos/fios/referências no editor, ou mantenha o objeto local, e compare novamente.

CLI e MCP usam as mesmas resoluções JSON. Exemplo de chave de remoção: {"salvar|@remover":"local"}; use a chave exata retornada na comparação. A remoção com fonte não apaga automaticamente vínculos autorais. Objetos derivados do Designer e hierarquia são sincronizados na mesma transação. Salvar/reabrir e desfazer/refazer preservam a operação.

Se o HTML do diálogo for editado depois de mostrar conflitos, clique Recriar artefato novamente para recalcular a comparação. A inspeção de referências é conservadora e pode recusar um texto/código que mencione literalmente o ID; referências calculadas dinamicamente por código não têm rastreamento universal nesta versão.
