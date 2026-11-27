# Hefestus 0.37 — repertório e ferramentas

Aplicado na central: Projetos\Hefestus\aplicacao\dist\hefestus.html.

O agente utiliza dez regras explícitas de menus e um catálogo de seis referências com URL, finalidade, plataforma e licença declarada. A ferramenta planejar_menu devolve esse repertório. Nenhum editor Office ou código dessas suítes foi incorporado; não houve treinamento de modelo nem autoalteração irrestrita do programa.

Correções: movimento de containers acompanha seus descendentes por painel e comandos; arraste não aplica deslocamento duas vezes; editar um filho não desfaz o grupo silenciosamente. Grupos livres redimensionam a posição e o tamanho dos descendentes proporcionalmente. Undo restaura a operação. Rotação e espelhamento de grupos não receberam nova implementação nesta entrega.

Inserir reúne Formas e Básicas em um grupo, com galeria de retângulos e formas básicas, miniaturas e nomes. Caixa, elipse e linha continuam acessíveis. As definições vetoriais avançadas existentes foram preservadas.

Salvar agora entrega um .hefestus.zip com projeto editável e documentos. Abrir aceita esse ZIP e os JSON anteriores. Extraia o ZIP para obter uma pasta documentos real. HTML, componentes e o pacote de geração Windows também incluem a pasta. Autosalvamento continua interno; copiar para a área de transferência não gera arquivos.

Documentos: arquitetura.txt, nucleo.txt, interface.txt, ferramentas.txt, ferramentas/*.txt, metricas.txt e contexto_ia.json. O JSON contém documento, conexões, métricas estáticas, repertório e fontes de texto. O salvamento de projeto inclui também sua memória e histórico. As implementações das ferramentas são separadas do núcleo. Código complementar do usuário é registrado separadamente.

Aplicativo Windows: Arquivo > Aplicativo Windows permite nome, versão, autor e ícone ICO/PNG. O ZIP contém material para construir o aplicativo Electron e instalador NSIS, em janela própria. Não inclui o Designer no aplicativo instalado. A documentação permanece no pacote de geração e fica fora dos arquivos empacotados no instalador. Execute GERAR_INSTALADOR.bat após extrair, usando Windows, Node.js 22+ e internet. O destinatário do EXE gerado não precisa de Node.js. ASAR não equivale a criptografia. Executável e instalação ainda não foram compilados/testados nesta sessão: o ambiente bloqueou o acesso de rede necessário.

Validação: bateria completa com 204 testes aprovados; após estender documentação a HTML/componentes e projeto+histórico, os seis testes específicos de agrupamento/documentação passaram. Compilação do HTML aprovada. Validação visual e instalação Windows pendentes.

Antares não foi localizado: nenhuma regra ou resultado foi atribuído a esse documento. Paridade integral com Axiom e demais itens anteriores não foi certificada.

Referências verificadas em 20/10/2026:
- https://github.com/fluentribbon/Fluent.Ribbon — WPF, MIT; referência adaptada, não dependência JavaScript.
- https://github.com/microsoft/fluentui — MIT no código; termos próprios para recursos visuais.
- https://github.com/genspark-ai/genoffice — Apache-2.0, exceção ee/.
- https://github.com/leag1234/elixiroffice — AGPL-3.0.
- https://github.com/ONLYOFFICE/DocumentServer — Community AGPL-3.0.
- https://github.com/euro-office — organização; verificar cada repositório.

As fontes fornecem referências e licenças declaradas, não comprovação de compatibilidade perfeita, aprovação universal ou ausência de defeitos. Nenhum código de terceiros foi copiado nesta atualização.
