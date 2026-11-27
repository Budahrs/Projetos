# Hefestus 0.40 — importar HTML e compor artefatos

A versão na central foi atualizada: Projetos\Hefestus\aplicacao\dist\hefestus.html. Recarregue o Hefestus antes de usar.

Uso: Forja > Colar HTML, ou Forja > Código > Colar HTML e recriar artefato. Também disponível em Inserir > Biblioteca. Cole a página completa, incluindo style e script, escolha nome e tamanho e clique Recriar e testar. O título do HTML sugere o nome quando não há nome preenchido. CSS/JavaScript adicionais são opcionais. A visualização no formulário e o Designer são estáticos; a Prévia interativa executa o componente isolado.

O analisador identifica título, botões, menus, links, campos, SVG, scripts, eventos, referências externas, rádios, transições e estados CSS. Isso é análise estrutural, não interpretação universal de qualquer linguagem ou reconstrução de cada tag como objeto nativo. HTML, CSS e JavaScript originais continuam editáveis na Forja e são preservados no projeto, biblioteca e exportação.

Seu botão de engrenagem foi usado como teste: SVG, gradientes, sombras, transições, abertura por clique, fechamento fora e Esc. A fonte Inter externa é opcional; sem rede usa as alternativas do CSS. O script original foi testado com eventos simulados, sem avaliação de scripts no Designer.

O carrossel enviado usa rádios e :checked. Suas transições só começam quando muda a seleção; não havia avanço automático. O exemplo Carrossel_Animado.html acrescenta avanço a cada 3,5 segundos, setas, indicadores, pausa, teclado e sinais carrossel_selecionado/carrossel_acessar. O avanço pausa durante interação/foco e respeita movimento reduzido. Os botões Acessar emitem uma solicitação; serviços como autenticação e navegação de negócio não são inventados.

Composição: selecione um artefato existente, abra Colar HTML e marque Combinar com a seleção atual. O resultado contém o HTML novo e uma cópia isolada da seleção. Código, estilos e IDs internos são preservados; o original não é alterado. A composição inteira pode ser movida, redimensionada e salva como novo artefato na biblioteca, e um Ctrl+Z desfaz sua criação.

Foi gerado Carrossel + Rádio usando o Controlador de rádios já incluído no Hefestus. O carrossel fica acima do rádio, e ambos mantêm seus próprios controles e código. Não foi criada uma associação automática entre cada card e uma emissora: isso exige escolher os vínculos desejados. A lista e as fontes de rádio existentes foram preservadas; a disponibilidade dos streams e a reprodução de áudio não foram verificadas nesta sessão.

Arquivos:
- Carrossel_Radio.artefato.json: importar pela biblioteca para reutilizar em outros projetos.
- Carrossel_Radio.hefestus.zip: abrir como projeto completo, com pasta documentos.
- Carrossel_Radio.html: composição exportada para executar diretamente.
- Carrossel_Animado.html: carrossel independente e código pronto para colar.
- Engrenagem_Premium.hefestus.zip: seu exemplo de engrenagem como projeto editável.

Os componentes HTML usam iframe com sandbox, sem acesso direto ao DOM do editor. Recursos HTTPS externos só são liberados quando escolhidos ou preservados de uma dependência de rádio já existente. Cliques, mudanças, foco e sinais podem ser encaminhados ao runtime por mensagens aceitas apenas da janela daquela instância. Não há acesso a arquivos nativos, instalação de dependências ou execução no editor durante a colagem. Arquivos locais e backend não são incorporados automaticamente.

A documentação inclui o documento completo, código dos componentes, análise e ferramenta geradora do HTML isolado. O agente também recebeu importar_html, com opção de composição com a seleção.

Validação: 224 testes aprovados e compilação do HTML aprovada. Foram testados o avanço do carrossel por temporizador/setas/pausa, preservação do exemplo da engrenagem, composição com o rádio real, originais intactos, um único desfazer, reutilização do modelo, restauração do projeto, isolamento e exportações. O arquivo de biblioteca gerado foi reaberto com os dois componentes. Verificação visual no navegador e reprodução de áudio continuam pendentes.

Backup anterior: Hefestus\versoes\antes_importar_html_040_20261020. O projeto aberto no navegador do usuário não foi substituído automaticamente.
