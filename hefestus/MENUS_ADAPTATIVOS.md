# Hefestus 0.35 — menus adaptativos

Atualização aplicada em `C:\Users\r.sampietro\Documents\Codex\Projetos\Hefestus\aplicacao`.
O atalho da central continua abrindo `dist\hefestus.html`. Reabra essa janela para carregar a atualização. Projetos do usuário não foram regravados.

## O que entrou

- Motor de escalonamento compartilhado pelo editor, prévia e exportações HTML, React, Vue e Web Component. Prioridade menor cede antes; empates preservam a ordem de leitura. As larguras vêm dos elementos renderizados.
- Grupos recolhidos permanecem acessíveis por botão de grupo ou **Mais**. O painel mantém seções com os nomes originais e usa os próprios controles, preservando IDs e eventos.
- Registro de comandos com ID estável, estado contextual, habilitado, marcado, valor e notificações. A faixa e o acesso rápido consultam esse registro para executar os comandos integrados. O histórico continua sob responsabilidade do núcleo; uma edição não gera dois registros.
- KeyTips numéricos no editor: **Alt**, número da aba, número do comando. **Esc** cancela. Os atalhos com letras já existentes não foram substituídos por traduções fictícias.
- Máquina de estados separada para sidebar: `minimal` abaixo de 640 px, `compact` de 640 a 1023 px e `open` a partir de 1024 px, calculados pela largura do contêiner.
- Modelo **Navegação lateral adaptativa** em Biblioteca → Modelos → Menus. No modo minimal, o painel sobrepõe o conteúdo; nos demais, ocupa espaço no layout. Toggle, Esc, clique no fundo, foco e preferência de recolhimento da sessão estão implementados. Os itens emitem sinais de navegação, para o programa consumidor executar a ação.
- A lateral esquerda do editor passa a sobrepor o canvas quando o espaço é mínimo. O trilho de ferramentas mantém seus nomes acessíveis e dicas.
- Configuração `menu` versionada, migração em memória e validação. Configuração inválida gera diagnóstico no runtime em vez de interromper a abertura de todo o documento.
- Motor, registro e migração publicados no manifesto local e em `seed/meta.json`, para reutilização pelos outros projetos. Isso não aplica alterações automaticamente ao Axiom.

## Usar nos menus criados

Selecione um container. Nas propriedades, ative **Faixa com grupos adaptativos**. Os containers filhos diretos serão os grupos da faixa. Em cada grupo, ajuste **Prioridade do grupo**: valores maiores preservam espaço por mais tempo. Use uma estrutura horizontal de grupos.

Para sidebar, insira o modelo novo ou ative **Navegação lateral adaptativa** em um container com dois containers filhos: navegação primeiro, conteúdo depois. Não ative sidebar e faixa adaptativa no mesmo container.

Exemplo de propriedades de uma faixa:

```json
{
  "menu": { "versao": 1, "adaptativo": true },
  "layout": { "modo": "linha", "abracar": false }
}
```

No grupo filho:

```json
{ "menu": { "versao": 1, "prioridade": 200 } }
```

Configuração avançada de sidebar:

```json
{
  "menu": {
    "versao": 1,
    "sidebar": {
      "modo": "auto",
      "minimalAbaixo": 640,
      "compactoAbaixo": 1024,
      "expandida": 264,
      "compacta": 56
    }
  }
}
```

Os rótulos de texto do modelo nativo usam `menu.rotuloSidebar: true`, para desaparecer no modo compacto sem remover os ícones nem o nome acessível do comando. O modo calculado não sobrescreve a preferência `auto`. O drawer minimal volta fechado após sair desse breakpoint.

`menu.schema.json` documenta a configuração. `migrarMenu` aceita a configuração legada sem versão como versão 0 e produz a versão 1 sem mudar o objeto original. Versões futuras, propriedades desconhecidas e dimensões inválidas são recusadas. O schema se refere à propriedade `menu`, não substitui o formato completo do projeto Hefestus.

## Tipos e comportamentos

| Tipo | Comportamento principal | Situação |
|---|---|---|
| Ribbon | Abas, grupos, compactação e overflow por grupo | Motor novo integrado; editor já tinha abas contextuais e QAT |
| Barra de menus | Submenus em cascata, teclado e respeito às bordas | Implementação existente preservada |
| Sidebar | Auto open/compact/minimal, push/overlay | Modelo novo e adaptação da lateral do editor |
| Contextual | Abrir junto ao objeto, Esc e clique fora | Implementação existente preservada |
| Galeria | Opções visuais, rolagem e mais opções | Existente; preview transacional ainda pendente |
| Mega menu | Painel com colunas e itens | Modelo existente preservado |
| Radial/Pie | Comandos em disposição circular | Modelo existente preservado; não recebeu algoritmo Ribbon |

## Checklist que ainda precisa de desenvolvimento ou validação

- [ ] Validação visual em navegador real, incluindo 390, 768, 1024 e 1440 px, foco, zoom e leitor de tela. O navegador desta sessão recusou abrir arquivos locais; não houve aprovação visual da interface.
- [ ] SizeDefinitions particulares por grupo exportado: os modelos existentes conservam seu conteúdo e recolhem para botão/overflow. Não foram inventadas versões média e pequena para todos os controles. No editor, os níveis visuais existentes são medidos pelo motor.
- [ ] Internacionalização integral por recursos e espelhamento RTL de toda a interface. Medição real no motor não equivale a traduzir o aplicativo.
- [ ] Live Preview de estilos com transação temporária, rollback ao sair e um único commit ao confirmar.
- [ ] Split buttons, tooltips ricos e critérios uniformes de atraso de menus.
- [ ] Densidade automática por dispositivo; a seleção manual de densidade já existente foi preservada.
- [ ] Seletor visual de níveis para depuração. A API `motorMenus().planejar(grupos, largura, { forcar: 2 })` já permite forçar um nível em testes.
- [ ] Catálogo único de comandos cobrindo também todos os itens de galerias e menus clássicos. A integração inicial cobre os comandos da faixa e os acessos rápidos correspondentes.
- [ ] Estado bidirecional e histórico do documento hospedeiro nas exportações: os artefatos emitem sinais; o consumidor continua responsável pelas operações reais e pelo Undo/Redo do seu documento.
- [ ] Sidebar secundária contextual e árvore que expande até o item ativo; não incluídas nesta atualização.
- [ ] Ajustes de desempenho e integração do Axiom: permanecem uma etapa separada.

## Verificação e recuperação

184 testes automatizados passaram, incluindo o conjunto existente, proteção de decisões e oito testes novos para menus, sidebar, registro, histórico, migração e exportações. O arquivo distribuído foi reconstruído a partir dos módulos.

O backup anterior está em `Hefestus\versoes\antes_menus_<data_hora>`. A atualização e os hashes dos arquivos constam em `Atualizacao_Hefestus_Menus.json`. As origens e versões preservadas durante a centralização não foram apagadas.

Para desfazer a atualização de código, restaure `js`, `css`, `dist` e `README.md` do backup correspondente; regenere a semente com o código restaurado. Isso não exige alterar os projetos criados pelo usuário.
