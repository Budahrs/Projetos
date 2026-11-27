# Hephaestus — IDE híbrida de criação e compilação

Definição aprovada como direção pelo usuário em 28/10/2026: ambiente de desenvolvimento para programas, motores e páginas web, com criação visual, programação em blocos/grafos e edição de código. A interface combina a organização familiar do PowerPoint com ferramentas vetoriais do Illustrator. Não implica compatibilidade integral com seus motores ou formatos proprietários.

## Duas áreas, três representações

Designer é responsável por objetos, vetores, camadas e layout. Visual Script reúne lógica em blocos/grafo e código contextual. Código puro é uma representação/painel dessa área, sem criar terceiro workspace. IDs, propriedades e operações pertencem ao mesmo documento. Trocar a representação não deve duplicar a regra de negócio.

## Contrato pretendido para linguagens

| Linguagem/conteúdo | Caminho atual | Limite explícito |
|---|---|---|
| HTML | Importação isolada e subconjunto nativo editável | Não converte qualquer DOM/CSS em objetos equivalentes |
| CSS | CSS do artefato isolado; estilos inline no parser nativo | CSS externo, cascata e layout completo não são convertidos em objetos |
| JavaScript | Código de artefato isolado e runtime Visual Script exportado em HTML | Não há conversão arbitrária de código para grafo nem API geral de plugins tipados |
| TypeScript | Requisito de evolução para código contextual | Transpilação, checagem e exportação TS não implementadas nesta reconstrução |
| Outras linguagens | Perfis e adaptadores conforme Bíblia | Disponibilidade depende de toolchain instalada e ensaios por destino; não executa só por reconhecer extensão |

A importação de fonte deve preservar bytes/origem, diagnosticar capacidade ausente e evitar execução automática. Compilar deve informar perfil, dependências, artefatos, erros e evidências. Salvar projeto não deve iniciar build pesado. Cada exportador deve declarar sua cobertura real de comportamento.

## Aceite de futuras integrações

Arquivo fonte e assinatura tipada persistem após salvar/reabrir; edição visual/código mantém referências; erros indicam arquivo/linha/nó quando conhecidos; prévia e exportação compartilham semântica; runtime para limpa eventos e cancela operações; programa gerado funciona independentemente do editor. Adotar os padrões das referências sem copiar interfaces ou implementar adaptadores fictícios.

Rastreabilidade: HEF-003/004/005/006/008/014/015/021/022/023/037/039/044/045/046/050/051. Ver referencias-evolucao.md e matriz-reconstrucao.md para a separação entre atual e proposto.
