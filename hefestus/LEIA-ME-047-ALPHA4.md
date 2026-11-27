# Hefestus 0.47 — Alpha 4: Forja integrada

Abra **hefestus.html** nesta pasta. Não é necessário instalar dependências para abrir o editor no navegador.

## O que mudou

- A aba Forja abre o estúdio VisualScript. O painel antigo e o acesso duplicado à Oficina de menus foram substituídos.
- O grafo **Objetos do Designer** contém automaticamente um nó por objeto real, inclusive todos os componentes gerados por modelos e pelo formulário. Os nós usam os mesmos IDs dos objetos.
- Pastas e seus filhos possuem fios de hierarquia. Renomear, inserir, remover e desfazer/refazer atualizam a projeção. A posição dos nós e as conexões manuais são preservadas.
- A seleção do Designer acompanha o nó correspondente. Selecionar um nó de objeto seleciona o objeto original. O inspetor incorpora os controles reais de edição do objeto.
- Nós de objeto oferecem referência, texto, valor, visibilidade, evento Ao clicar e ações Mostrar/Ocultar/Alternar. Conecte **Ao clicar** de um botão à entrada **Ocultar** de outro objeto para controlar sua visibilidade.
- Os recursos anteriores de Composição, Ribbon, Modelos, Código por elemento, Efeitos, Comportamentos, Histórico, Agente e Documentação estão no painel da nova Forja. Os eventos já existentes continuam no motor original, sem executar uma cópia migrada do mesmo comportamento.
- Os recursos da instalação 0.46 (menus, armazenamento, importação HTML, exportação e proteção de decisões) foram mantidos na base de código.

## Uso

1. Crie um objeto no Designer ou insira um modelo.
2. Abra **Forja** (também pelo botão superior ou F7). O grafo de objetos abre automaticamente.
3. Clique em um objeto na árvore para localizar seu nó. Edite o objeto no inspetor ou use **Ver elemento no Designer**.
4. Arraste fios entre portas compatíveis. **F5** executa a prévia.
5. Salve normalmente. Os nós e a lógica seguem com o projeto. Para remover um nó de objeto, remova o objeto no Designer; para duplicá-lo, duplique o objeto.

## Validação e limites

A suíte automatizada e os seis testes específicos de integração estão em `testes/`; os resultados desta entrega estão em `validacao-alpha4.txt`. Os testes cobrem identidade, modelos, hierarquia, histórico, reabertura e execução de conexões de clique/visibilidade. A sintaxe dos scripts do HTML distribuído também é verificada.

A inspeção visual no navegador não foi concluída: o controle do navegador bloqueou a interação por não conseguir determinar a URL atual com segurança. Não foi compilado nem homologado um instalador nativo.

Esta cópia foi preparada em Downloads porque a sessão só permite leitura na instalação de Documentos. Abra o HTML desta cópia para testar as correções.

## Desenvolvimento

Os fontes estão em `js/` e `css/`. Para reconstruir com todas as dependências: `npm ci` e `npm run build`. Para repetir a suíte: `npm test`. O arquivo principal já está empacotado e abre diretamente no navegador.
