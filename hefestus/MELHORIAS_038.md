# Hefestus 0.38 — pincel completo

Atualizado na central: Projetos\Hefestus\aplicacao\dist\hefestus.html.

Uso: selecione um elemento de origem e abra Página Inicial > Área de transferência > Pincel de formatação. Clique no elemento de destino. Um clique arma o pincel para uma aplicação. Dois cliques rápidos no botão mantêm o uso até Esc. A opção Ativar pincel contínuo permite o mesmo pelo teclado. Clicar novamente no botão após a sequência inicial também encerra o pincel.

Opções do pincel permite marcar ou desmarcar quatro categorias:
- Cores, fonte e bordas: estilo e estados visuais.
- Efeitos e sombras: efeitos, sombra, desfoque e vidro.
- Vínculos, interações e transições: eventos, referências de ferramentas, abertura e transições.
- Código: HTML, CSS e JavaScript autoral do elemento.

As quatro categorias começam marcadas. As escolhas ficam salvas. Cada categoria marcada SUBSTITUI a correspondente no destino, inclusive quando vazia na origem. Não há mesclagem de código ou eventos. Texto comum, nome, tipo, posição, tamanho e hierarquia do destino são preservados. HTML autoral copiado pode mudar o conteúdo renderizado pela extensão de código na prévia/exportação.

A captura é uma cópia independente da origem. Eventos com alvo igual ao ID da origem passam a apontar para o destino. Referências a outros elementos e ferramentas mantêm seus IDs e versões. O pincel não duplica ferramentas, dependências ou descendentes. Código autoral permanece literal: IDs escritos dentro de HTML/CSS/JS não são reescritos automaticamente; código que utiliza raiz funciona no contexto do novo elemento. Não há execução de código durante a cópia no Designer; vale a execução existente na prévia e exportação.

Destinos travados são ignorados. Uma aplicação gera um comando desfazível; Ctrl+Z restaura as categorias anteriores e Ctrl+Y reaplica. Decisões protegidas continuam seguindo a resolução do núcleo.

Verificação: 211 testes aprovados, incluindo seis testes específicos de captura independente, preservação de geometria e conteúdo comum, desfazer/refazer, categorias seletivas, vínculos/eventos, autorreferências e clique no canvas em modo formulário. Compilação do HTML aprovada. Validação visual de clique duplo e uso no navegador ainda pendente nesta sessão.

Backup anterior em Hefestus\versoes\antes_pincel_038_20261020.
