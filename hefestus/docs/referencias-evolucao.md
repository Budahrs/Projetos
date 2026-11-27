# Referências para evolução do Hephaestus

Referências indicadas pelo usuário e conferidas na documentação oficial em 28/10/2026. Elas orientam decisões; não são dependências incorporadas nem licença para copiar código. A autoridade continua sendo a Bíblia Mestra e a Bíblia/GDD. Designer e Visual Script permanecem as duas áreas exclusivas.

## Aprendizados verificados e aplicação

| Referência oficial | Aprendizado | Aplicação ao Hephaestus | Estado |
|---|---|---|---|
| [Construct 3](https://www.construct.net/en/make-games/manuals/construct-3/scripting/overview) | Combinar eventos e código JS/TS. | Código contextual no Visual Script, com portas e IDs estáveis. | Direção de evolução; compilador TypeScript não incluído. |
| [Node-RED](https://nodered.org/docs/user-guide/handling-errors) | Erros ligados ao nó e tratáveis pelo fluxo. | Localizar diagnóstico no objeto/nó; ampliar sucesso, erro e cancelamento. | Navegação contextual e soma com saída de erro implementadas; propagação universal pendente. |
| [FlutterFlow](https://docs.flutterflow.io/concepts/custom-code/custom-actions/) | Ações personalizadas com entradas e resultado assíncrono. | Ações reutilizáveis com contrato de conclusão, erro e cancelamento. | Direção de evolução; não inclui motor Flutter/Dart. |
| [GDevelop](https://wiki.gdevelop.io/gdevelop5/events/js-code/javascript-in-extensions/) | Integrar código por ações, condições e expressões. | Blocos/grafo/código compartilham semântica e dependências seletivas. | Runtime HTML compartilhado existente; extensão completa pendente. |

FlutterFlow usa Flutter/Dart. Sua geração web não equivale a um editor de HTML/CSS de objetos DOM; adotamos o contrato de ações, sem trocar o motor do Hephaestus. Construct e FlutterFlow são referências de produto, não motores embarcados. Não foram incorporados pacotes de Node-RED ou GDevelop nesta rodada. As adaptações Craft existentes mantêm seus avisos e proveniência.

## Aplicado nesta rodada

O botão Localizar do painel Bíblia/GDD fecha o diálogo, muda para a área correta e enquadra o nó via VisualScript.irPara, ou seleciona o objeto no Designer. Não chama mais um método inexistente de seleção de grafo. O diagnóstico do grafo já contém IDs; o runtime da soma já fornece sucesso/erro/resultado e funciona no HTML independente. O teste novo cobre destinos distintos e identificador ausente.

## Ordem de evolução proposta

1. Contratos de operação: ação/condição/expressão com assinatura tipada, versão, documentação e resultado; todas as superfícies usam o mesmo caso de uso. HEF-003/004/005/037.
2. Assíncrono: conclusão, erro, cancelamento e descarte de resposta tardia. Testar em prévia e exportação. HEF-006/008/023.
3. Código contextual: editor JS/TS dentro do Visual Script, funções puras versus ações com efeitos, compilação TS real e isolamento por capacidades. Sem eval no núcleo e sem prometer conversão arbitrária de JS para grafo. HEF-004/021/045/050.
4. Reutilização: subfluxos, parâmetros, versões, origem e lista transitiva de dependências. Importar apenas o necessário na entrega. HEF-011/014/015/022/049.
5. Depuração: ligar execução/erros à operação, objeto e fonte; observar valores e testar regressão do aplicativo gerado. HEF-005/008/051.

Aceite mínimo para cada ação nova: exemplo válido, inválido, erro tratável, desfazer quando autoral, salvar/reabrir, executar/parar e paridade de exportação. Estas etapas são propostas e não foram marcadas como implementadas.
