# Ferramentas MCP do Hefestus — fichas

Gerado por `npm run mcp:fichas` a partir do servidor `ferramentas/hefestus-mcp.mjs` (versão 2.1.0, protocolo 2025-06-18) e dos efeitos declarados em `ferramentas/efeitosMcp.mjs`. Não editar à mão. Procedimento: PROC-MCP-001 (`padroes/PROCEDIMENTOS_IA.md` §4, bíblia §11.1). Schemas completos: [ferramentas.json](ferramentas.json).

Estado: **implementado e testado** (`testes/mcp.test.mjs`: contrato, equivalência motor/CLI/MCP, erros e caminhos). Não homologado com clientes MCP reais.

Todas as ferramentas usam o mesmo núcleo e as mesmas ferramentas do agente do editor e da CLI. Nenhuma conversa com serviços externos. Erros voltam com `isError: true` e mensagem acionável; o resultado sai como texto JSON e como `structuredContent`.

## Resumo (45 ferramentas)

| Ferramenta | Efeito | Destrutiva | Idempotente | Confirmar |
| --- | --- | --- | --- | --- |
| `hefestus_manual` | Leitura | não | sim | não |
| `hefestus_listar_projetos` | Leitura | não | sim | não |
| `hefestus_modelos` | Leitura | não | sim | não |
| `hefestus_novo_projeto` | Grava arquivo na pasta de trabalho | sim | não | não |
| `hefestus_resumo` | Leitura | não | sim | não |
| `hefestus_lote` | Altera o projeto | não | não | não |
| `hefestus_exportar_html` | Grava arquivo na pasta de trabalho | sim | sim | não |
| `hefestus_exportar_programa` | Grava fora da pasta de trabalho | sim | sim | sim |
| `hefestus_ligacoes` | Leitura | não | sim | não |
| `hefestus_verificar_projeto` | Leitura | não | sim | não |
| `hefestus_importar_html_nativo` | Altera o projeto | não | não | não |
| `hefestus_preparar_reimportacao_html` | Leitura | não | não | não |
| `hefestus_aplicar_reimportacao_html` | Altera o projeto | não | não | não |
| `hefestus_criar_elemento` | Altera o projeto | não | não | não |
| `hefestus_alterar_elemento` | Altera o projeto | não | sim | não |
| `hefestus_remover_elemento` | Altera o projeto | sim | sim | não |
| `hefestus_ligar_evento` | Altera o projeto | não | não | não |
| `hefestus_aplicar_paleta` | Altera o projeto | não | sim | não |
| `hefestus_ligar_comportamento` | Altera o projeto | não | não | não |
| `hefestus_inserir_modelo` | Altera o projeto | não | não | não |
| `hefestus_agrupar_em_container` | Altera o projeto | não | não | não |
| `hefestus_criar_variantes` | Altera o projeto | não | não | não |
| `hefestus_refinar_elemento` | Altera o projeto | não | não | não |
| `hefestus_manter_opcao` | Altera o projeto | sim | não | não |
| `hefestus_construtor_listar` | Leitura | não | sim | não |
| `hefestus_construtor_tema` | Altera o projeto | não | sim | não |
| `hefestus_construtor_criar` | Altera o projeto | não | não | não |
| `hefestus_construtor_editar` | Altera o projeto | não | sim | não |
| `hefestus_construtor_adicionar` | Altera o projeto | não | não | não |
| `hefestus_construtor_remover` | Altera o projeto | sim | sim | não |
| `hefestus_importar_svg` | Altera o projeto | não | não | não |
| `hefestus_combinar_formas` | Altera o projeto | sim | não | não |
| `hefestus_converter_em_vetor` | Altera o projeto | não | sim | não |
| `hefestus_criar_tema` | Altera o projeto | não | não | não |
| `hefestus_preparar_aplicativo_windows` | Altera o projeto | não | não | não |
| `hefestus_importar_html` | Altera o projeto | não | não | não |
| `hefestus_planejar_menu` | Leitura | não | sim | não |
| `hefestus_auditar_interface` | Altera o projeto | não | sim | não |
| `hefestus_explicar_elemento` | Leitura | não | sim | não |
| `hefestus_exportar_artefato` | Altera o projeto | não | não | não |
| `hefestus_gerar_documentacao` | Altera o projeto | não | não | não |
| `hefestus_colocar_no_container` | Altera o projeto | não | não | não |
| `hefestus_organizar` | Altera o projeto | não | não | não |
| `hefestus_contexto` | Leitura | não | sim | não |
| `hefestus_propor_layout` | Grava arquivo na pasta de trabalho | não | não | não |

## Fichas

### `hefestus_manual`

Lê o manual de como montar programas no Hefestus (AGENTS.md): fluxo, peças, convenções e checagem final. Leia antes de começar um programa.

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| — | — | — | Sem parâmetros |

### `hefestus_listar_projetos`

Lista os projetos .hefestus da pasta de trabalho.

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| — | — | — | Sem parâmetros |

### `hefestus_modelos`

Lista os modelos prontos da biblioteca (menus, faixas, barras, abas, diálogos…). Use o id em hefestus_inserir_modelo: montar com peças prontas é melhor que montar elemento por elemento.

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| — | — | — | Sem parâmetros |

### `hefestus_novo_projeto`

Cria um projeto .hefestus vazio, com nome e tamanho da tela.

- **Efeito:** Grava arquivo na pasta de trabalho. Destrutiva: sim. Idempotente: não. Pedir confirmação: não.
- **Nota:** Destrutiva só com substituir: true, que sobrescreve um projeto existente.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":true,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `nome` | string | não |  |
| `largura` | number | não | px (padrão 1280) |
| `altura` | number | não | px (padrão 800) |
| `fundo` | string | não | #rrggbb |
| `substituir` | boolean | não | sobrescrever se já existir |

### `hefestus_resumo`

Mostra a tela e todos os elementos do projeto (id, tipo, posição, tamanho, textos, cores, eventos). Use os ids para alterar, ligar eventos e organizar.

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |

### `hefestus_lote`

Executa vários passos de uma vez no projeto: lista de { ferramenta, args }, onde ferramenta é o nome sem o prefixo hefestus_ (ex.: "criar_elemento"). Tudo ou nada: se um passo falhar, nada é gravado. Prefira lote para montar um esqueleto inteiro.

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Nota:** Tudo ou nada: se um passo falhar, nada é gravado. Os efeitos são os dos passos.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `passos` | array | sim |  |

### `hefestus_exportar_html`

Gera o HTML final do projeto (abre em qualquer navegador, com comportamentos e responsivo).

- **Efeito:** Grava arquivo na pasta de trabalho. Destrutiva: sim. Idempotente: sim. Pedir confirmação: não.
- **Nota:** Sobrescreve o .html de saída, que é gerado.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":true,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `saida` | string | não | arquivo .html (padrão: mesmo nome do projeto) |

### `hefestus_exportar_programa`

Exporta o projeto como PROGRAMA com janela própria e instalador (projeto Tauri) em programas/<nome> dentro do Hefestus. Todos os comandos saem ligados (veja hefestus_ligacoes). Leva junto o projeto (para reabrir no Hefestus) e programa.json (descrição em linguagem de máquina). O usuário gera o instalador com npm install e npm run instalador nessa pasta.

- **Efeito:** Grava fora da pasta de trabalho. Destrutiva: sim. Idempotente: sim. Pedir confirmação: sim.
- **Nota:** Grava em programas/<nome> dentro da pasta do Hefestus, fora da pasta de trabalho, e sobrescreve uma exportação anterior.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":true,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `nome` | string | não | nome do programa (padrão: nome do projeto) |
| `versao` | string | não | x.y.z (padrão 1.0.0) |
| `largura` | number | não | largura da janela |
| `altura` | number | não | altura da janela |
| `ligacoes` | string | não | arquivo de ligações dentro de ligacoes/ do Hefestus (ex.: "pdf-studio.json"): vale sobre ligacoes/<nome>.json, que é usado sozinho quando existe |

### `hefestus_ligacoes`

Mostra como cada comando do programa será ligado ao exportar (o Hefestus liga todos por padrão): pelo arquivo ligacoes/<programa>.json, por um motor externo, pelo motor de PDF embutido ou por ações da janela. Lista os pendentes, que precisam de um motor novo.

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `nome` | string | não | nome do programa (padrão: nome do projeto); escolhe ligacoes/<nome>.json |

### `hefestus_verificar_projeto`

Diagnostica estrutura e grafo pelo mesmo caso de uso do Designer. Retorna revisaoArquivo SHA-256 sem regravar o projeto.

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Nota:** Diagnóstico compartilhado e revisão SHA-256; não regrava.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Projeto .hefestus existente, dentro da pasta de trabalho. |

### `hefestus_importar_html_nativo`

Importa HTML inline como objetos nativos editáveis no projeto existente. Preserva fonte e gera IDs sincronizados com o grafo. Uma transação desfazível; exige revisaoArquivo atual. Não substitui a importação isolada legada.

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Nota:** Exige revisão SHA-256 atual; HTML vira objetos nativos com fonte preservada.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Projeto .hefestus existente, dentro da pasta de trabalho. |
| `html` | string | sim | Fonte HTML inline; até 2 MB UTF-8. Não executa scripts nem busca recursos. |
| `revisaoArquivo` | string | sim | SHA-256 retornado por hefestus_verificar_projeto. Protege contra edição de arquivo antigo. |
| `nome` | string | não |  |
| `largura` | number | não |  |
| `altura` | number | não |  |

### `hefestus_preparar_reimportacao_html`

Compara fonte HTML nova com base e edições locais. Só lê; retorna alterações/conflitos e token de sessão válido por 10 minutos. Adições/remoções exigem IDs HTML explícitos; remoções viram conflitos e não podem romper vínculos. Tipos existentes são preservados. Aplicar é outra chamada.

- **Efeito:** Leitura. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Nota:** Só lê o arquivo; cria token temporário de sessão, limitado a 10 minutos e 32 planos.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Projeto .hefestus existente, dentro da pasta de trabalho. |
| `raiz` | string | sim | ID da raiz retornada pela importação nativa. |
| `html` | string | sim | Fonte HTML inline; até 2 MB UTF-8. Não executa scripts nem busca recursos. |

### `hefestus_aplicar_reimportacao_html`

Aplica uma comparação preparada nesta sessão, com resoluções local/fonte por chave de conflito. Rejeita token inválido ou arquivo alterado. Recalcula o plano no núcleo e grava uma transação desfazível.

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Nota:** Token vinculado a arquivo/revisão; conflitos exigem local/fonte. Falhas não salvam.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Projeto .hefestus existente, dentro da pasta de trabalho. |
| `token` | string | sim | Token de hefestus_preparar_reimportacao_html, vinculado ao arquivo e à revisão. |
| `resolucoes` | object | não | Mapa chave de conflito para local ou fonte. |

### `hefestus_criar_elemento`

Cria um elemento na tela. tipo: botao, texto, caixa, container, forma, elipse, linha, icone, campo, toggle, menu, modal, toast. x/y são o canto superior esquerdo em px. propriedades opcionais usam os mesmos caminhos de alterar_elemento. Devolve o id criado. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `tipo` | string | sim |  |
| `x` | number | não |  |
| `y` | number | não |  |
| `largura` | number | não |  |
| `altura` | number | não |  |
| `propriedades` | object | não | ex.: {"rotulo": "Enviar", "estilo.fundo": "#16a34a"} |

### `hefestus_alterar_elemento`

Muda propriedades de um elemento existente. Caminhos: x, y, largura, altura, nome, visivel, travado, estilo.fundo, estilo.cor (cor do texto), estilo.borda, estilo.larguraBorda, estilo.raio, estilo.tamanhoFonte, estilo.peso (300\|400\|600\|700), estilo.sombra (nenhuma\|pequena\|media\|grande), estilo.opacidade (0-1), estilo.fonte (sistema\|segoe\|arial\|verdana\|tahoma\|trebuchet\|calibri\|inter\|roboto\|opensans\|montserrat\|poppins\|plex\|serifa\|times\|cambria\|garamond\|lora\|merriweather\|playfair\|mono\|consolas\|courier\|jetbrains\|firacode\|arredondada\|quicksand\|varela\|oswald\|bebas\|impact\|cinzel\|caveat\|pacifico\|segoeprint), estilo.alinhamento (esquerda\|centro\|direita), estilo.entrelinha, estilo.desfoque (px), estilo.vidro (px, vidro fosco), rotacao (graus), espelharH, espelharV, estados.hover.fundo, estados.active.fundo, transicao.duracao, acessibilidade.ariaLabel, e os do tipo (botao: rotulo, desabilitado; texto: texto; campo: placeholder; toggle: ligado; menu: itens; modal: titulo, mensagem, overlay, fechaAoClicarFora, iniciaAberto; toast: mensagem, autoFechar, iniciaAberto; icone: simbolo, traco; container: layout.modo (livre\|linha\|coluna), layout.espaco, layout.margem, layout.alinhar (inicio\|centro\|fim\|esticar), layout.abracar; forma: forma (retangulo, retArredondado, cantoCortado, cantosCortados, cantoArredondado, elipse, triangulo, trianguloRetangulo, losango, paralelogramo, trapezio, pentagono, hexagono, octogono, cruz, anel, moldura, coracao, lua, raio, nuvem, setaDireita, setaEsquerda, setaCima, setaBaixo, setaDupla, setaPentagono, chevron, estrela4, estrela5, estrela6, explosao, faixa, selo, balao, balaoArredondado, balaoOval, processo, decisao, terminal, dados, documento, banco, conector, poligono, estrela, arco, vetor), texto). Responsivo: restricoes.h (auto\|esquerda\|direita\|ambos\|centro\|escala), restricoes.v (auto\|topo\|base\|ambos\|centro\|escala), responsivo.ocultarAbaixo e responsivo.mostrarAbaixo (0\|480\|768\|1024), dimensao.largura (fixa\|preencher\|abracar) e dimensao.altura (fixa\|preencher) dentro de containers, layout.justificar (inicio\|centro\|fim\|entre), layout.quebrar, layout.empilharAbaixo. Abrir/fechar: abertura.iniciaFechado, abertura.animacao (nenhuma\|aparecer\|deslizar\|crescer\|lateral), abertura.fecharFora, abertura.fecharEsc, abertura.fecharAoEscolher, abertura.fundoEscuro, abertura.ancorar (abre colado ao gatilho); estilo avançado (valem para caixa, container, forma, elipse, botão): estilo.preenchimentos = lista [{tipo: solido\|linear\|radial\|conico\|imagem, cor, angulo, paradas:[{pos 0-100, cor, alfa 0-1}], opacidade}] (o primeiro fica por cima), estilo.tracos = [{cor, largura, posicao: dentro\|centro\|fora, estilo: solido\|tracejado\|pontilhado, ponta, juncao}], estilo.efeitos = [{tipo: sombra\|sombraInterna\|desfoque\|vidro, x, y, blur, espalhar, cor (aceita rgba)}], estilo.cantos = [topo-esq, topo-dir, base-dir, base-esq], estilo.mistura (normal\|multiply\|screen\|overlay...); forma paramétrica: forma=poligono\|estrela\|arco com lados, razao, canto, giro, inicio, fim, espessura; estados.ativo.fundo e estados.ativo.cor. Linha usa estilo.fundo como cor e altura como espessura. Cores em #rrggbb. Para a tela inteira use id "__canvas" com largura, altura ou fundo. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |
| `propriedades` | object | sim |  |

### `hefestus_remover_elemento`

Remove um elemento. O usuário pode desfazer com Ctrl+Z. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: sim. Idempotente: sim. Pedir confirmação: não.
- **Nota:** Remove do documento; o histórico permite desfazer no editor.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":true,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |

### `hefestus_ligar_evento`

Faz um elemento emitir um sinal quando algo acontece e, opcionalmente, executar uma ação visual em outro elemento. evento: onClick, onContext (botão direito), onHover, onFocus, onChange, onSelect, onOpen, onClose (conforme o tipo). acao: animar, aplicarEstilo, aplicarForma, abrir, fechar, alternar, destacar, mostrarSo, fixar ou vazio. Não existe lógica de negócio: o sinal só avisa quem usa a interface. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |
| `evento` | string | sim |  |
| `sinal` | string | sim | nome em snake_case, ex. login_enviado |
| `acao` | string | não |  |
| `alvo` | string | não | id do elemento afetado pela ação |

### `hefestus_aplicar_paleta`

Recolore TODOS os elementos do canvas com uma paleta. Use só quando o usuário pedir para recolorir os elementos/o design; "tema" sozinho é da interface (use tema_interface). paleta: claro, escuro, forja. Cores que o usuário definiu antes viram uma pergunta para ele. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `paleta` | string | sim |  |

### `hefestus_ligar_comportamento`

Liga um comportamento pronto entre um gatilho e um alvo, num passo só. comportamento: menuClique (Menu suspenso: Clique abre e fecha; fecha ao clicar fora, com Esc ou ao escolher um item; setas navegam); menuHover (Menu ao passar o mouse: Abre ao passar o mouse, espera um instante para você chegar nele e fecha ao sair); dica (Dica (tooltip): Aparece ao passar o mouse e some ao sair); gaveta (Gaveta lateral: Clique abre pela lateral com fundo escurecido; fecha ao clicar fora ou com Esc); acordeao (Acordeão: Clique mostra e esconde o conteúdo logo abaixo); modal (Abrir janela (modal): Clique abre a janela com fundo escurecido); abas (Abas: Gatilho: o container das abas. Alvo: o container dos painéis. Cada aba mostra o seu painel, em ordem). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `comportamento` | string | sim |  |
| `gatilho` | string | sim |  |
| `alvo` | string | sim |  |

### `hefestus_inserir_modelo`

Insere um modelo pronto da biblioteca (já montado com containers inteligentes). modelo: menuContextoCompacto (Menu do mouse — compacto com busca), menuHefestus (Menu do Hefestus — faixa editável), janelaTesteHefestus (Janela de teste — minimizar e maximizar), menuAxiom (Menu do Axiom Studio — completo), ref-ribbon-1 (Ribbon — Separado com contorno), ref-ribbon-2 (Ribbon — Separado plano), ref-ribbon-3 (Ribbon — Conectado), ref-ribbon-4 (Ribbon — Conectado arredondado), ref-ribbon-5 (Ribbon — Abas coloridas), ref-ribbon-6 (Ribbon — Abas coloridas arredondadas), ref-contexto-claro (Menu contextual e galerias — Claro), ref-contexto-escuro (Menu contextual e galerias — Escuro), ref-lateral-expansivel (Barra lateral com painéis exclusivos), ref-controles-flutuantes (Controles flutuantes — modos e opções), ref-galeria-formas (Galeria de formas — categorias Office), navResponsiva (Navegação responsiva), menuSubmenus (Menu horizontal com submenus), megaMenu (Mega menu), menuLateralRecolhivel (Menu lateral recolhível), menuAcordeao (Menu lateral acordeão), menuTelaCheia (Menu em tela cheia), fxVidro (Caixa de vidro fosco (Glassmorphism)), fxNeon (Caixa neon (brilho)), fxOled (Caixa Dark OLED), fxTilt (Caixa 3D inclinada), fxParallax (Caixa em camadas (parallax)), fxFlutuante (Caixa flutuante (sombras em camadas)), fxBento (Bento grid), fxCarrossel (Faixa de cards (carrossel)), fxExpansivel (Cartão que expande em tela cheia), menuRadial (Menu radial), menuDrillDown (Menu drill-down (mobile)), menuBlocos (Menu em blocos coloridos), botoesRelevo (Botões em relevo e 3D), botoesNeumorficos (Botões neumórficos), botoesNeon (Botões neon e brilho), botoesVidro (Botões de vidro), botoesAcao (Botões de ação (primário, secundário, perigo)), botoesPilula (Botões pílula com degradê), botoesPulso (Botões com pulso), barraAbasInferior (Barra de abas inferior), barraComBusca (Barra com busca), menuPorPerfil (Barra com teclas de acesso e perfis), faixaAxiom (Faixa do Axiom Studio), botaoMenu (Botão com menu suspenso), abasPaineis (Abas com painéis), barraMenus (Barra de menus), menuSuspenso (Menu suspenso), menuContexto (Menu de contexto), faixa (Faixa de opções), officeCompleto (Office completo), faixaHibrida (Faixa de opções híbrida), faixaPowerPoint (Faixa estilo PowerPoint), faixaWord (Faixa estilo Word), grupoGrandePequenos (Grupo: botão grande + pequenos), grupoPilha3 (Grupo: três comandos empilhados), grupoGrandesLado (Grupo: comandos grandes lado a lado), grupoFonte (Grupo: combos + linha de ícones), grupoGradeIcones (Grupo: grade de ícones (2 linhas)), grupoGaleria (Grupo: galeria com rolagem), grupoGrandeGrade (Grupo: botão grande + grade 2×2), faixaHibridaRecolhida (Faixa híbrida (começa recolhida)), menuArquivoOffice (Menu Arquivo (Office)), barraFerramentas (Barra de ferramentas), barraFlutuante (Barra flutuante), trilho (Trilho lateral), barraApp (Barra superior), abas (Barra de abas), barraStatus (Barra de status), painelProps (Painel de propriedades), dialogo (Caixa de diálogo), notificacoes (Lista de notificações), pdfStudioTarefas (PDF Studio · menu e ferramentas), sidebarAdaptativa (Navegação lateral adaptativa), radioControlador (Controlador de rádios), pdf-studio-profissional (PDF Studio · faixa por tarefas). x e y opcionais (canto superior esquerdo). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `modelo` | string | sim |  |
| `x` | number | não |  |
| `y` | number | não |  |

### `hefestus_agrupar_em_container`

Põe elementos dentro de um novo container inteligente. modo: livre (mantém posições, move junto), linha ou coluna (arruma sozinho com espaço e margem). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `ids` | array | sim |  |
| `modo` | string | não |  |

### `hefestus_criar_variantes`

Cria variantes de um componente lado a lado num container: tipo="tamanhos" (P/M/G) ou tipo="estilos" (primário, secundário, contorno, fantasma, perigo). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |
| `tipo` | string | sim |  |

### `hefestus_refinar_elemento`

Gera 3 opções de acabamento (1 suave, 2 contraste, 3 minimalista) do elemento, lado a lado, para o usuário escolher. Depois, manter_opcao fica com a escolhida. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |

### `hefestus_manter_opcao`

Fica com a opção N (1-3) gerada por refinar_elemento: aplica no elemento original e descarta as outras. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: sim. Idempotente: não. Pedir confirmação: não.
- **Nota:** Descarta as variantes não escolhidas.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":true,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `numero` | integer | sim |  |

### `hefestus_construtor_listar`

Lista o que já foi criado pelo FORMULÁRIO (modo híbrido): containers, menus/boxes do botão direito e faixas de opções, com ids e campos. Use antes de editar. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |

### `hefestus_construtor_tema`

Aplica um TEMA COMPLETO a todos os itens do formulário (faixa, menus, blocos, laterais, abas, componentes, containers): axiom, hefestus, hospitalar, vidro, neon, industrial, minimalista, fluent, retro. Num passo desfazível. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `tema` | string | sim |  |

### `hefestus_construtor_criar`

PREFERIDO para criar menus e caixas: cria pelo formulário (tipo=paineis: painéis divididos com divisores arrastáveis; dados regioes esq\|dir\|baixo, tamEsq, tamDir, tamBaixo, largura, altura, titulos{esq,dir,baixo,centro}) (editável depois pelo usuário na aba do modo híbrido). tipo=caixa (container: nome, x, y, largura, altura, fundo, borda, raio, modo livre\|linha\|coluna, filhos[{tipo texto\|botao\|icone, texto\|rotulo, sinal}]), tipo=menu (menu/box do botão direito: nome, itens["Copiar", "-", {rotulo, icone, atalho, sinal}]) ou tipo=ribbon (faixa de opções: nome, abas["Início", "Inserir"], busca, estilo office\|claroHefestus\|escuro\|vidro\|ciber\|mac), tipo=blocos (grade de blocos home/touch/mega menu: colunas, variante icone\|cartao, itens[{titulo, subtitulo, icone, status}]), tipo=lateral (barra lateral retrátil: marca, itens[{rotulo, icone}]) ou tipo=abasDoc (abas de documento estilo navegador: abas["Mapa", "Andar 1"], fechavel). tipo=componente (modelo breadcrumb\|paginacao\|chips\|badges\|progresso\|stepper\|toast\|status\|toolbar\|modal\|calendario\|slider\|tabela\|grafico\|radial; modal: variante info\|confirmacao\|alerta\|erro\|sucesso, titulo, mensagem, itens[botões]; calendario: mes, ano, valor; grafico: tipoGrafico barras\|linha\|rosca, titulo, mensagem, legenda, serie 1,2,3, valor (rosca); radial: formaMenu circulo\|hexagono; tabela: colunas[3], itens[{rotulo, valor, detalhe, cor}]; valor, total, estiloBarra classica\|moderna\|neon\|minimalista, vertical, efeito nenhum\|sombra\|brilho\|neon\|vidro\|gradiente\|borda, itens[{rotulo, icone, valor, cor, detalhe}]). Todo item aceita efeito/acento; blocos/lateral/abasDoc têm formato/variante. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `tipo` | string | sim |  |
| `dados` | object | não |  |

### `hefestus_construtor_editar`

Muda um campo de um item criado pelo formulário, por caminho: caixa (nome, x, y, largura, altura, estilo.fundo, estilo.borda, estilo.raio, layout.modo, comportamento.sinal, comportamento.acao, comportamento.alvo, comportamento.menuContexto = id do menu que abre no botão direito, comportamento.hoverFundo), menu (nome, fundo, cor, hoverFundo, largura), ribbon (nome, banda, largura, abaAtiva). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |
| `caminho` | string | sim |  |
| `valor` | — | sim |  |

### `hefestus_construtor_adicionar`

Acrescenta ao formulário: onde=filho (em caixa; dados: tipo, texto\|rotulo, sinal), item ou separador (em menu; dados: rotulo, icone, atalho, sinal), aba (em ribbon; dados: nome), grupo (ribbon; dados: nome, aba), comando (ribbon; dados: rotulo, icone, sinal, aba, grupo), bloco (em blocos; dados: titulo, subtitulo, icone, status), item (também em lateral; dados: rotulo, icone), aba (também em abasDoc; dados: nome), subitem (em menu; dados: item, rotulo, atalho). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |
| `onde` | string | sim |  |
| `dados` | object | não |  |

### `hefestus_construtor_remover`

Remove um item criado pelo formulário (e todos os elementos gerados por ele). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: sim. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":true,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |

### `hefestus_importar_svg`

Desenha um ícone/ilustração: recebe o código SVG (path, rect, circle, ellipse, polygon, line; fill/stroke/transform; sem gradientes, texto ou filtros) e cria formas vetoriais editáveis agrupadas. Escreva o SVG com viewBox, ex.: 24x24. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `svg` | string | sim |  |
| `nome` | string | não |  |
| `x` | number | não |  |
| `y` | number | não |  |

### `hefestus_combinar_formas`

Operação booleana entre 2 ou mais formas/caixas/elipses: unir, subtrair (a mais ao fundo menos as de cima), intersectar ou excluir (tudo menos a sobreposição). Gera um vetor editável e remove os originais. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: sim. Idempotente: não. Pedir confirmação: não.
- **Nota:** Substitui as formas de origem pelo resultado.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":true,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `ids` | array | sim |  |
| `operacao` | string | sim |  |

### `hefestus_converter_em_vetor`

Transforma formas, caixas ou elipses em vetor livre (caminho editável por nós). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Nota:** Conserva o ID do elemento.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `ids` | array | sim |  |

### `hefestus_criar_tema`

Cria e aplica um tema completo nos ELEMENTOS a partir de uma descrição: modo (escuro/claro), cor de destaque (azul, ciano, verde…), saturação (pastel, vibrante, neutro) e cantos (suaves, retos, pílula). Ex.: "escuro com azul ciano e cantos suaves". (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `descricao` | string | sim |  |

### `hefestus_preparar_aplicativo_windows`

Abre a exportação do aplicativo Windows para configurar nome, versão e ícone. Gera material de compilação, não um EXE já compilado. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |

### `hefestus_importar_html`

Recria uma página ou trecho HTML como artefato isolado, com código editável na Forja. Preserva CSS/JS embutidos sem executá-los no Designer; não converte cada tag em um objeto nativo. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Nota:** Recria o HTML como artefato isolado; não executa o JS no Designer nem busca nada na rede.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `html` | string | sim |  |
| `css` | string | não |  |
| `js` | string | não |  |
| `nome` | string | não |  |
| `largura` | number | não |  |
| `altura` | number | não |  |
| `online` | boolean | não |  |
| `combinarComSelecao` | boolean | não |  |

### `hefestus_planejar_menu`

Recomenda o tipo e as regras de menu por objetivo. Leia antes de criar menus adaptativos; não altera o documento. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Nota:** Só recomenda; não altera o documento.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `descricao` | string | sim |  |

### `hefestus_auditar_interface`

Audita a interface: contraste WCAG, nome acessível, estado hover, transições longas, alvos pequenos, eventos apontando para elementos inexistentes, nomes repetidos. Com corrigir=true aplica as correções automáticas (num passo desfazível). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Nota:** Só lê, a menos que corrigir: true aplique as correções automáticas.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `corrigir` | boolean | não |  |

### `hefestus_explicar_elemento`

Explica em palavras o que um elemento é, como aparece, como reage e que sinais emite. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |

### `hefestus_exportar_artefato`

Exporta a interface como artefato derivado e baixa o arquivo: react (.jsx), vue (.vue), webcomponent (.js) ou tema (tokens de tema em CSS). (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Nota:** Pode gravar arquivos gerados na pasta do projeto.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `tipo` | string | sim |  |

### `hefestus_gerar_documentacao`

Gera a documentação Markdown do contrato de sinais, regras, elementos e auditoria, e baixa o arquivo. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Nota:** Pode gravar arquivos gerados na pasta do projeto.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |

### `hefestus_colocar_no_container`

Coloca um elemento dentro de um container existente (ou tira, com container vazio). Em linha/coluna ele se arruma sozinho. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |
| `container` | string | não |  |

### `hefestus_organizar`

Alinha à tela, muda a camada ou duplica um elemento. acao: alinhar_esquerda, centralizar_horizontal, alinhar_direita, alinhar_topo, centralizar_vertical, alinhar_base, frente, tras, duplicar, girar_90, espelhar_horizontal, espelhar_vertical. (Edita e grava o projeto indicado em "arquivo".)

- **Efeito:** Altera o projeto. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `arquivo` | string | sim | Caminho do projeto .hefestus, relativo à pasta de trabalho (ex.: "painel-noc.hefestus"). |
| `id` | string | sim |  |
| `acao` | string | sim |  |

### `hefestus_contexto`

Lê o snapshot exportado do editor (hefestus-contexto.json), com data e hash. Não representa o estado vivo.

- **Efeito:** Leitura. Destrutiva: não. Idempotente: sim. Pedir confirmação: não.
- **Nota:** Só existe quando a pasta tem hefestus-contexto.json (compatibilidade 0.37).
- **Indicações MCP:** `{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| — | — | — | Sem parâmetros |

### `hefestus_propor_layout`

Grava uma proposta de layout revisável em propostas/, para importar manualmente no editor.

- **Efeito:** Grava arquivo na pasta de trabalho. Destrutiva: não. Idempotente: não. Pedir confirmação: não.
- **Nota:** Grava uma proposta em propostas/; não aplica no projeto.
- **Indicações MCP:** `{"readOnlyHint":false,"destructiveHint":false,"idempotentHint":false,"openWorldHint":false}`

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `layout` | object | sim |  |
| `justificativa` | string | sim |  |
