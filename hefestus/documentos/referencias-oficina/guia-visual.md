# Guia das referências da Oficina

Estas referências foram fornecidas pelo usuário. As imagens numeradas são cópias locais para manter o guia junto dos fontes. Observação visual não comprova detalhes internos dos programas ilustrados.

| Imagem | Observação confirmada na referência | Aplicação ao Hefestus |
| --- | --- | --- |
| 01.jpg | Scratch: categorias por cor, catálogo de blocos, área de montagem, palco e lista de objetos | Categorias e encaixes na Oficina; prévia ao lado |
| 02.jpg | Sequência de eventos, parâmetros dentro dos blocos e comandos aninhados | Campos editáveis no bloco; hierarquia tipada |
| 03.webp | Catálogo expansível e estruturas que recebem outros blocos | Catálogo lateral; encaixes compatíveis |
| 04.png | MakeCode: categorias, pesquisa, área livre, zoom e blocos iniciais | Área inteira na Forja; zoom e categorias |
| 05.png | Escolher categoria revela blocos coloridos com parâmetros | Catálogo de comandos e ferramentas arrastáveis |
| 06.jpeg | Visão de nós conectados; texto pequeno demais para identificar operações com segurança | Referência de conexões, sem inferir funções ilegíveis |
| 07.webp | Nós com portas e conexões distintas de fluxo e dados | Direção para uma futura visão de grafo; ainda não implementada como editor de fios |
| 08.png | Fluxo ilustrado com setas e agrupamentos | Clareza de direção e agrupamento; não significa implementar criptografia |
| 09.jpeg | Categorias e estruturas aninhadas em um editor baseado em blocos | Tipos de encaixe e organização; OpenCL não foi incorporado |
| 10.webp | Programação visual associada à prévia e aos objetos do projeto | Ligação entre construção, comportamento e aparência |

## Implementado nesta evolução

- Oficina em uma área inteira dentro da Forja.
- Blocos reais de interface, aba/seção, grupo, comando e comportamento.
- Categorias por cor, parâmetros editáveis, arraste com encaixes, zoom, desfazer e refazer.
- Prévia ao lado em telas largas; prioridade à montagem em telas estreitas.
- Validação do contrato completo antes de aplicar; peças desconectadas não substituem o menu válido.
- Tipos de interface: Ribbon, lateral, botão direito e janela.
- Regras independentes, ativáveis; os modelos continuam objetos nativos editáveis no Designer.
- Construção de peças do programa e aplicação de comportamentos à seleção na área Programa e comportamentos.

## Distinções e pendências

As referências incluem loops, matemática, variáveis e grafos. Esta evolução implementa construção e eventos de interface. Não anuncia um compilador geral dessas estruturas nem execução arbitrária por fios. Esses recursos exigem contratos, semântica de execução, limites e testes próprios.

Ao construir um programa a partir de novas referências, o guia deve inventariar todas as telas, menus, submenus, ferramentas, estados e atalhos identificáveis. Funções não demonstradas ficam pendentes de confirmação; funções confirmadas precisam de motor e evidência de teste, além do controle visual.
