# App Shell universal (issue #43) — auditoria e proposta

Situação em 20/11/2026, sobre a `main` com o Hephaestus 2.1 integrado (merge `5669554`). Origem: [issue #43](https://github.com/rsampietro-code/programas/issues/43); prioridade P0 do [#44](https://github.com/rsampietro-code/programas/issues/44). Estado: **auditoria verificada no código; fases S0 (contrato de perfil), S1 (áreas extraídas para o shell) e S2/S2b (perfil L-SEED ligado à Central, com todas as áreas) implementadas e testadas; ainda não usadas no PC; S3–S4 não implementadas.** Nenhum instalador foi gerado nem homologado.

## 1. O que já existe (verificado no código)

| Parte | Onde | O que faz | Observação |
|---|---|---|---|
| Casca desktop | `src-tauri/` (Tauri 2, v2.1.0, `br.hefestus.editor`) | Serve `dist/` gerado por `build.mjs`; janela criada pelo código; instalador NSIS por usuário, pt-BR; associação `.hefestus` | **`csp: null`** — sem política de conteúdo |
| Comandos nativos | `src-tauri/src/lib.rs` (235 linhas) | `craft_booleana`, `craft_contornar_traco`, `salvar_disco`, abrir/salvar projeto por diálogo, `gravar_arquivo` (só endereços escolhidos pela pessoa), `mostrar_janela`, `info_motor` | Gravação atômica (arquivo temporário + `rename`) |
| Permissões | `src-tauri/capabilities/default.json` | `core`, `dialog`, `opener` padrão | Enxutas |
| Motores vetoriais | `src-tauri/craft/` (`color`, `doc`, `geom`, `pathops`; Apache/MIT) | Booleanas e traços em Rust | Testes Rust existem; **não rodados** nesta auditoria |
| Ponte JS ↔ Rust | `src-tauri/ponte.js` | Espelha o projeto no disco e controla a abertura da janela, sem mudar o editor | — |
| Comandos | `js/nucleo/comandos.js` (`CommandRegistry`) | IDs estáveis; estado visível/habilitado/marcado; o núcleo é dono das transações e do desfazer/refazer | Base natural para comandos de qualquer perfil |
| Temas | `js/ui/temas.js`, `js/nucleo/adaptadoresTemas.js` | 21 temas (`automatico` segue o sistema, `light`, `dark`, `highContrast`…); catálogo `hefestus.temas` v1 → tokens `--hf-*` com adaptadores **CSS, XAML e Python** | Respeita `prefers-color-scheme` e `prefers-reduced-motion` |
| Áreas e painéis | `js/app/areasHephaestus.js`, `js/app/workspace.js` | Áreas Designer/Script, abas do Ribbon, painéis esquerdo/direito, barra de acesso rápido, inspetor; modos `designer`/`web`/`previa` com migração só de preferências | Hoje fixos para o editor |
| Persistência | `js/nucleo/armazem.js`, `arquivoProjeto` | Armazém no IndexedDB (memória nos testes); projeto `.hefestus` formato 1 | Independe dos programas de origem |
| Acessibilidade | `js/ui/` | `aria-*`/`role` em 37 de 50 módulos de interface | Sem auditoria WCAG feita |
| Responsivo | Bíblia, §482 | Verificação em 1440, 1024, 768 e 390 px | — |
| MCP | `ferramentas/hefestus-mcp.mjs` | 43 ferramentas; contrato do acervo: 0 erros (`orq.mjs mcp-verificar`) | Peça compartilhada com o L-SEED |

Testes na `main`: 389 de 390 (o que falha precisa do build com dependências npm).

## 2. Proposta: um shell, vários perfis

O App Shell **não é um aplicativo novo**: é extrair do Hefestus o que já é genérico e deixar cada projeto entrar como **perfil**.

- **O shell oferece, uma vez só:** comandos (`CommandRegistry`), desfazer/refazer, temas e tokens, áreas/painéis/abas, persistência (armazém, projeto, ponte Tauri), acessibilidade e o servidor MCP no contrato do acervo.
- **Cada perfil declara, num manifesto:** id, nome, áreas e abas, painéis, comandos (ids do registro), tema padrão, destinos e o motor próprio.
  - Áudio: Fábrica de Som.
  - Animação: Anima Studio.
  - Cognição: L-SEED.
  - NOC: painel NOC.
- **O que não se duplica:** nenhum perfil reimplementa tema, salvamento, desfazer ou MCP. Motor e identidade continuam de cada projeto (diretriz do #44).

### Fases e portões

| Fase | Entrega | Portão |
|---|---|---|
| S0 · Contrato | `perfil.schema.json` + validação, a partir dos campos que já existem em `areasHephaestus.js` e `workspace.js` | Esquema com teste; o próprio Hefestus descrito como perfil |
| S1 · Extração | Módulo do shell dentro de `hefestus/`, sem mudar o comportamento | Os 389 testes continuam passando; mesmas telas |
| S2 · Primeiro perfil externo | Cognição (L-SEED), alinhado à prioridade do #44 | Abrir, salvar, tema e comandos funcionando com o motor do L-SEED |
| S3 · Casca nativa | `npm ci`, `npm run build` e `tauri build` no PC; definir a CSP | Build e testes Rust no PC; instalador de teste |
| S4 · Demais perfis | Áudio, animação, NOC | Um por vez, com testes de regressão |

### Riscos

- `csp: null` na casca Tauri: definir uma política antes de carregar conteúdo de perfis.
- Toolchain Rust/Tauri nunca validado no PC atual; 8 GB de RAM.
- O L-SEED hoje tem interface servida em Python (Central); o perfil de cognição precisa de uma ponte, sem reescrever a Central.

## 3. Decisões do Ricardo (20/11/2026)

1. O shell fica **dentro de `hefestus/`** (não é um aplicativo novo).
2. O primeiro perfil externo é **cognição (L-SEED)**.

## 4. Fase S0 — feita

- `perfis/perfil.schema.json`: contrato do perfil (formato `hefestus.perfil` v1). É a fonte única.
- `js/shell/perfil.js`: valida o perfil contra o esquema e confere referências internas: área inicial, aba inicial de cada área, repetições e tema existente no catálogo. Gera as preferências iniciais de interface. Sem dependências.
- `perfis/hefestus.perfil.json`: o próprio editor como perfil. O teste acusa se ele divergir de `areasHephaestus.js`.
- `perfis/l-seed.perfil.json`: rascunho do perfil de cognição (estado `proposto`), com motor na Central e MCP do L-SEED.
- `testes/perfil.test.mjs`: 4 testes. Suíte do Hefestus: 393/394, e o que falha é o `dist`, que precisa do build com npm.
- **Achado:** o padrão do editor é `temaUI: "ambar"`, um apelido que não existe no catálogo de temas. Hoje ele cai no tema do sistema. O perfil declara isso como `automatico`, e nada foi alterado no editor.

## 5. Fase S1 — feita (primeira extração)

- `js/shell/areas.js`: áreas e abas genéricas a partir de um perfil (`criarAreas`), com ganchos para o que é de cada projeto: apelidos de área, preferências extras e ajustes ao trocar de área.
- `js/shell/perfilHefestus.js`: o perfil do Hefestus em JS, porque o empacotador não importa JSON. O teste garante que ele é igual a `perfis/hefestus.perfil.json`.
- `js/app/areasHephaestus.js` passa a usar o shell. As abas vêm do perfil; o resto (Visual Script, `temaUI: "ambar"`) fica como era.
- **Comportamento idêntico, provado por teste:** `testes/areas-shell.test.mjs` compara a versão nova com uma cópia da anterior (`testes/referencia/`) em 2.000 sequências de operações. Um teste de mutação, que tira um apelido, faz esse teste falhar.
- O módulo genérico também foi exercitado com um perfil de outro projeto, sem nada do Hefestus.
- **Empacotador:** simulado sem o Blockly, aceita os módulos novos (151 módulos). O build real precisa de `npm ci`.
- **Suíte do Hefestus:** 396/397. O que falha é o `dist`, que precisa de npm.
- **Ainda não extraídos:** comandos, temas e persistência já são genéricos e ficam onde estão. O shell os reúne por perfil quando a fase S2 precisar deles.

## 6. Fase S2 — feita (perfil L-SEED ligado à Central)

**Como abrir:** com a Central do L-SEED rodando, entre em `http://127.0.0.1:8765/shell`.

**Decisão de arquitetura:** a Central serve a página do shell na mesma origem dela. Assim a página chama a API da Central sem CORS, e a checagem de origem e de host da Central continua igual. A Central não foi reescrita: ganhou só uma rota de leitura.

- **Central** (`l-seed/INDICE-VETORIAL-v1.5/central_lseed.py`, +41 linhas):
  - `/shell` redireciona para `/hefestus/shell/l-seed.html`;
  - `/hefestus/…` serve só `shell/`, `js/` e `perfis/` do `hefestus/` do repositório, só `.html`, `.js`, `.json` e `.css`, com bloqueio de subida de pasta;
  - o repositório é encontrado como no `teste_mcp_lseed.py`: `LSEED_REPO`, ou `D:\L-SEED` no PC, ou a raiz da cópia do repositório.
- **Shell:**
  - `js/shell/motorLseed.js`: ponte com `/api/estado`, `/api/conversar` (lê o fluxo NDJSON aos pedaços) e `/api/salvar`;
  - `js/shell/sessaoConversa.js`: uma conversa por persona; abrir e exportar em JSON do shell (`hefestus.conversa` v1);
  - `js/shell/comandosLseed.js`: comandos no `CommandRegistry`: `lseed.salvar` (grava no cofre pela Central), `lseed.abrir`, `lseed.exportar`, `lseed.parar`, `lseed.buscar` e `lseed.dados` (liga e desliga a memória e os dados do cofre);
  - `js/shell/paginaLseed.js` + `shell/l-seed.html`: áreas e abas do perfil, temas do catálogo (`aplicarTemaUI`), modelo e preferências guardadas no navegador.
- **Portão da S2:**

| Item | Resultado |
|---|---|
| Abrir | Abre uma conversa exportada pelo shell |
| Salvar | Grava no cofre, no formato do L-SEED |
| Tema | Os 21 temas, com o automático seguindo o sistema |
| Comandos | Pelo registro do núcleo |

- **Fora desta fase:** as áreas Memória e Projetos aparecem, mas avisam que ainda não estão ligadas ao motor. A Central não tem API para abrir conversas já salvas no cofre.
- **Os módulos da página ficam fora do editor:** o simulador do empacotador continua com os mesmos 151 módulos.

**Verificado aqui:**
- Hefestus: 405/406 (o que falha é o `dist`, que precisa de npm).
- `testes/shell-lseed.test.mjs`: 9 testes, incluindo fluxo cortado no meio de acentos e erros da Central.
- `teste_shell_central.py`: 4 testes (rotas, tipos, recusas, host).
- `testar_tudo.py --sem-repo`: 0 falhas.
- Central real rodando com um Ollama falso: estado, conversa em fluxo, persona inválida e salvar funcionaram pelo módulo e pela página no Chrome sem janela. Também enviar, salvar, alternar busca, trocar tema e aba, ver a área Memória, recarregar mantendo as preferências e caber em 390 px sem rolagem lateral, com 0 erros no console.

**Não verificado:** no PC, com o Ollama e os modelos de verdade. O PC precisa do `central_lseed.py` novo, igual ao do repositório, e do repositório atualizado (ATUALIZAR-REPO).

## 7. Fase S2b — feita (áreas desconectadas ligadas)

Pedido do Ricardo (21/11/2026): conectar o que estava desconectado. Tudo é **só leitura**. Aprovar memórias continua no Obsidian, porque só o Ricardo aprova.

- **Motor:** `l-seed/INDICE-VETORIAL-v1.5/painel_shell.py` reaproveita o que o L-SEED já tem:

| Aba | Fonte |
|---|---|
| Memória › fila | `MEMORIA/FILA-DE-REVISAO.md` |
| Memória › decisões | `METODO/DECISOES.md` |
| Memória › dados | Banco do cofre (`banco_lseed.responder`), com campo de pergunta |
| Projetos › orquestração | `PARA/Projetos/ORQUESTRACAO.md` |
| Projetos › catálogo | `portfolio.buscar`, com campo de busca |
| Projetos › DNA | Notas `PARA/Projetos/DNA/prj-*.md`; abre só as que estão na lista |

  - Textos com mais de 60 mil caracteres são cortados, com aviso.
- **Conversas salvas:** a página lista e abre de volta as conversas que a Central gravou no cofre. As linhas "lembrar:/decisão:" continuam citadas, para que salvar de novo não repita as propostas de memória.
- **Central:** `GET /api/painel`, `/api/conversas` e `/api/conversa` (+20 linhas, fins de linha preservados). A Central exige host local, e o caminho da conversa não pode sair da pasta de conversas.
- **Shell:** `motorLseed.painel/conversas/abrirConversa`, `carregarConversa` e o comando `lseed.abrirCofre` ("Abrir do cofre"). As áreas mostram o campo de consulta, os itens e o texto. O modelo agora cai no primeiro disponível quando o padrão não está instalado.

**Verificado aqui:**
- Hefestus: 407/408 (o que falha é o `dist`, que precisa de npm).
- `teste_painel_shell.py`: 7 testes. `teste_shell_central.py`: 5 testes. `testar_tudo.py --sem-repo`: 0 falhas.
- Central real com um Ollama falso e um cofre de teste, no Chrome sem janela: salvar → listar → abrir do cofre; as seis abas; consulta de dados e de catálogo; DNA; recarregar; 390 px. 0 erros no console.

**Não verificado:** no PC, com o cofre e o banco de verdade.

Próximo: S3, a casca nativa (build no PC e definição da CSP).
