/* HEFESTUS 2.0 — biblioteca de ícones
   Grade 24×24 · traço 1,5 px · terminações e junções arredondadas.
   Classes de cor (k = a, b, e, l, v, x, r):
     k  → traço na cor k        kf → preenchimento sólido na cor k
     kt → traço + preenchimento translúcido na cor k        f → preenchimento na cor base
   a = âmbar (destaque) · b = azul (vetor/mídia) · e = evento · l = lógica · v = variável · x = ação · r = erro */
(function (root) {
  const RECT_SEL = 'M6 3v15l4-4 2.8 6.3 2.4-1-2.8-6.2H18z';
  const LUPA = '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>';
  const TESOURA = '<circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M8.3 15.7L18 4M15.7 15.7L6 4"/>';
  const MAO = '<path d="M8 14V6.5a1.5 1.5 0 0 1 3 0V11M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V5.5a1.5 1.5 0 0 1 3 0V12M17 12V8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1.4a6 6 0 0 1-4.6-2.2l-3.3-4a1.6 1.6 0 0 1 2.4-2.1L8 14.5"/>';
  const CANETA = '<path class="a" d="M12 21L7.5 11 9 4h6l1.5 7z"/><path class="a" d="M12 21v-7.5"/><circle class="a" cx="12" cy="12" r="1.4"/>';
  const ESTRELA = 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z';
  const SHAPE_BUILDER = '<circle cx="9" cy="10" r="5.5"/><circle cx="15" cy="10" r="5.5"/><path class="af" d="M12 5.4a5.5 5.5 0 0 1 0 9.2a5.5 5.5 0 0 1 0-9.2z"/><path class="f" d="M15.5 14.5v7l1.8-1.7 1.2 2.7 1.1-.5-1.2-2.6h2.4z"/>';
  const COPIAR = '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>';
  const OLHO = '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>';
  const JANELA = '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 8h18"/>';
  const ARQUIVO = '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5"/>';
  const NUVEM = '<path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5z"/>';
  const AUDIO = '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>';

  const GROUPS = [
    { id: 'interface', mode: 'global', name: 'Interface global', note: 'Barra de título, painéis e barra de status',
      items: [
        ['logo', 'Marca Hefestus', '<path class="af" d="M3 8h13c0 2.5 2 4 5 4-1.5 1.7-4 2.5-6.5 2.5H13v2h2.5L17 20H6l1.5-3.5H10V14C6 14 3.5 11.5 3 8z"/><path class="a" d="M9.5 2.5v2.5M6.5 3.5l1.2 1.5M12.5 3.5l-1.2 1.5"/>'],
        ['buscar', 'Pesquisar ferramentas', LUPA, 'Ctrl+K'],
        ['salvar', 'Salvar', '<path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>', 'Ctrl+S'],
        ['desfazer', 'Desfazer', '<path d="M9 13.5L4 8.5l5-5"/><path d="M4 8.5h10a6 6 0 0 1 0 12h-3"/>', 'Ctrl+Z'],
        ['refazer', 'Refazer', '<path d="M15 13.5l5-5-5-5"/><path d="M20 8.5H10a6 6 0 0 0 0 12h3"/>', 'Ctrl+Shift+Z'],
        ['tela-cheia', 'Tela cheia', '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>', 'F11'],
        ['vincular', 'Vincular', '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'],
        ['configuracoes', 'Configurações', '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'],
        ['visivel', 'Camada visível', OLHO + '<circle cx="12" cy="12" r="3"/>'],
        ['oculto', 'Camada oculta', OLHO + '<path d="M4 4l16 16"/>'],
        ['bloqueado', 'Bloqueado', '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'],
        ['desbloqueado', 'Desbloqueado', '<rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>'],
        ['pasta', 'Pasta / grupo', '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>'],
        ['camadas', 'Camadas', '<path d="M12 3.5l9 4.5-9 4.5L3 8z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16l9 4.5 9-4.5"/>'],
        ['prancheta', 'Prancheta', '<rect x="6" y="6" width="12" height="12"/><path d="M6 2v3M18 2v3M6 19v3M18 19v3M2 6h3M2 18h3M19 6h3M19 18h3"/>'],
        ['grade', 'Grade', '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>'],
        ['aumentar-zoom', 'Aumentar zoom', '<path d="M12 5v14M5 12h14"/>', 'Ctrl+='],
        ['diminuir-zoom', 'Diminuir zoom', '<path d="M5 12h14"/>', 'Ctrl+-'],
        ['seta-baixo', 'Expandir', '<path d="M6 9l6 6 6-6"/>'],
        ['seta-cima', 'Recolher', '<path d="M6 15l6-6 6 6"/>'],
        ['seta-direita', 'Abrir painel', '<path d="M9 6l6 6-6 6"/>'],
        ['seta-esquerda', 'Voltar', '<path d="M15 6l-6 6 6 6"/>'],
        ['mais-opcoes', 'Mais opções', '<circle class="f" cx="5.5" cy="12" r="1.4"/><circle class="f" cx="12" cy="12" r="1.4"/><circle class="f" cx="18.5" cy="12" r="1.4"/>'],
        ['fechar', 'Fechar', '<path d="M6 6l12 12M18 6L6 18"/>'],
        ['sucesso', '0 erros · conexões válidas', '<circle class="v" cx="12" cy="12" r="9"/><path class="v" d="M8 12.5l2.7 2.7L16 9.8"/>'],
        ['alerta', 'Alerta', '<path class="a" d="M12 3.5L21.5 20h-19z"/><path class="a" d="M12 10v4.5M12 17.2v.3"/>'],
        ['erro', 'Erro', '<circle class="r" cx="12" cy="12" r="9"/><path class="r" d="M9 9l6 6M15 9l-6 6"/>'],
        ['compartilhar', 'Compartilhar', '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4"/>'],
      ] },

    { id: 'arquivo', mode: 'designer', name: 'Arquivo', note: 'Backstage: predefinições e exportação híbrida',
      items: [
        ['novo-arquivo', 'Novo arquivo', ARQUIVO + '<path class="a" d="M12 11v6M9 14h6"/>', 'Ctrl+N'],
        ['abrir', 'Abrir', '<path d="M3 18V6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h7.5A1.5 1.5 0 0 1 20 8.5V10"/><path d="M3 18l3-7.5h16L19 18z"/>', 'Ctrl+O'],
        ['importar', 'Importar', '<path class="a" d="M12 3v12M7.5 10.5L12 15l4.5-4.5"/><path d="M4 13v6a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-6"/>'],
        ['exportar', 'Exportar', '<path class="a" d="M12 15V3M7.5 7.5L12 3l4.5 4.5"/><path d="M4 13v6a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-6"/>', 'Ctrl+E'],
        ['predef-slide', 'Predefinição slide 16:9', '<rect x="2.5" y="6" width="19" height="11" rx="1"/><path class="a" d="M6 10h7M6 13h4"/>'],
        ['predef-web', 'Predefinição web / UI', '<rect x="2.5" y="4" width="19" height="16" rx="1.5"/><path d="M2.5 8h19"/><path class="b" d="M5 6h.01M7 6h.01M9 6h.01" stroke-width="2"/><rect class="bt" x="5.5" y="11" width="6" height="6" rx="1"/><path d="M14 12h4.5M14 15h3"/>'],
        ['predef-impressao', 'Predefinição impressão A4', '<rect x="6" y="3" width="12" height="18" rx="1"/><path class="a" d="M9 7h6M9 10h6M9 13h3.5"/>'],
        ['exportar-pptx', 'Apresentação dinâmica (.pptx)', ARQUIVO + '<rect class="at" x="8" y="12" width="8" height="5" rx=".8"/>'],
        ['exportar-vetor', 'Vetor editável (.svg / .ai)', ARQUIVO + '<path class="b" d="M8 17.5c1.2-4 6.8-4 8 0"/><rect class="bf" x="11" y="12.3" width="2" height="2"/>'],
        ['exportar-pdf', 'Pacote de impressão (.pdf)', '<rect x="7" y="7" width="10" height="10"/><path class="a" d="M7 2v3M17 2v3M7 19v3M17 19v3M2 7h3M2 17h3M19 7h3M19 17h3"/>'],
        ['historico', 'Histórico de versões', '<path d="M3.5 12a8.5 8.5 0 1 0 2.5-6"/><path d="M3 4v4h4"/><path class="a" d="M12 7.5V12l3 2"/>'],
      ] },

    { id: 'ferramentas-designer', mode: 'designer', name: 'Caixa de ferramentas · Designer', note: 'Barra vertical à esquerda',
      items: [
        ['selecao', 'Seleção total', '<path class="f" d="' + RECT_SEL + '"/>', 'V'],
        ['selecao-direta', 'Seleção direta de nós', '<path d="' + RECT_SEL + '"/><rect class="af" x="17" y="17" width="4" height="4"/>', 'A'],
        ['caneta', 'Caneta vetorial', CANETA, 'P'],
        ['texto', 'Texto', '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', 'T'],
        ['forma', 'Forma geométrica', '<rect class="bt" x="4" y="4" width="16" height="16" rx="1"/>', 'M'],
        ['elipse-ferr', 'Elipse', '<ellipse class="bt" cx="12" cy="12" rx="8.5" ry="6.5"/>', 'L'],
        ['estrela-ferr', 'Estrela', '<path class="b" d="' + ESTRELA + '"/>'],
        ['construtor-formas', 'Construtor de formas', SHAPE_BUILDER, 'Shift+M'],
        ['tesoura-ferr', 'Tesoura', TESOURA, 'C'],
        ['conta-gotas', 'Conta-gotas', '<path d="M14.5 6.5l3 3"/><path d="M17.2 3.3a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L18.5 9 15 5.5z"/><path d="M16 8l-9 9-3 1 1-3 9-9"/><path class="af" d="M4 22c-.9 0-1.4-.6-1.1-1.3L4 19l1.1 1.7c.3.7-.2 1.3-1.1 1.3z"/>', 'I'],
        ['mao', 'Mão', MAO, 'H'],
        ['zoom', 'Zoom', LUPA + '<path d="M10.5 8v5M8 10.5h5"/>', 'Z'],
        ['preenchimento-traco', 'Preenchimento e traçado', '<rect x="8.5" y="8.5" width="12" height="12" rx="1.5" stroke-width="2.5"/><rect class="af" x="3.5" y="3.5" width="11" height="11" rx="1.5"/>', 'X'],
      ] },

    { id: 'pagina-inicial', mode: 'designer', name: 'Página Inicial', note: 'Área de transferência, alinhamento e organização',
      items: [
        ['copiar', 'Copiar', COPIAR, 'Ctrl+C'],
        ['colar', 'Colar', '<path d="M9 4.5H6.5A1.5 1.5 0 0 0 5 6v13.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H15"/><rect x="9" y="3" width="6" height="3" rx="1"/>', 'Ctrl+V'],
        ['recortar', 'Recortar', TESOURA, 'Ctrl+X'],
        ['copiar-estilo', 'Copiar estilo', '<rect x="4" y="3.5" width="13" height="5" rx="1"/><path d="M17 6h2.5v5H11v3"/><rect class="at" x="9.5" y="14" width="3" height="7" rx="1"/>'],
        ['colar-frente', 'Colar na frente', '<path d="M9 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v4"/><rect class="at" x="9" y="9" width="11" height="11" rx="1"/>', 'Ctrl+F'],
        ['colar-atras', 'Colar atrás', '<path class="a" d="M9 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v4"/><rect x="9" y="9" width="11" height="11" rx="1"/>', 'Ctrl+B'],
        ['nova-prancheta', 'Nova prancheta', '<rect x="3" y="7" width="12" height="13" rx="1"/><path class="a" d="M19.5 2.5v6M16.5 5.5h6"/>'],
        ['duplicar-tela', 'Duplicar tela', COPIAR + '<path class="a" d="M14 11.5v5M11.5 14h5"/>', 'Ctrl+D'],
        ['alinhar-esquerda', 'Alinhar à esquerda', '<path d="M4 3v18"/><rect class="bt" x="7" y="6" width="12" height="4" rx="1"/><rect class="bt" x="7" y="14" width="7" height="4" rx="1"/>'],
        ['alinhar-centro-h', 'Centralizar horizontalmente', '<path d="M12 3v3M12 10v4M12 18v3"/><rect class="bt" x="5" y="6" width="14" height="4" rx="1"/><rect class="bt" x="8" y="14" width="8" height="4" rx="1"/>'],
        ['alinhar-direita', 'Alinhar à direita', '<path d="M20 3v18"/><rect class="bt" x="5" y="6" width="12" height="4" rx="1"/><rect class="bt" x="10" y="14" width="7" height="4" rx="1"/>'],
        ['alinhar-topo', 'Alinhar ao topo', '<path d="M3 4h18"/><rect class="bt" x="6" y="7" width="4" height="12" rx="1"/><rect class="bt" x="14" y="7" width="4" height="7" rx="1"/>'],
        ['alinhar-centro-v', 'Centralizar verticalmente', '<path d="M3 12h3M10 12h4M18 12h3"/><rect class="bt" x="6" y="5" width="4" height="14" rx="1"/><rect class="bt" x="14" y="8" width="4" height="8" rx="1"/>'],
        ['alinhar-base', 'Alinhar à base', '<path d="M3 20h18"/><rect class="bt" x="6" y="5" width="4" height="12" rx="1"/><rect class="bt" x="14" y="10" width="4" height="7" rx="1"/>'],
        ['distribuir-h', 'Distribuir horizontalmente', '<path d="M3.5 3v18M20.5 3v18"/><rect class="bt" x="9.5" y="7" width="5" height="10" rx="1"/>'],
        ['distribuir-v', 'Distribuir verticalmente', '<path d="M3 3.5h18M3 20.5h18"/><rect class="bt" x="7" y="9.5" width="10" height="5" rx="1"/>'],
        ['trazer-frente', 'Trazer para a frente', '<rect class="at" x="4" y="3" width="16" height="4" rx="1"/><path d="M8 15l4-4 4 4M8 20l4-4 4 4"/>', 'Ctrl+Shift+]'],
        ['avancar', 'Avançar', '<rect class="at" x="4" y="3" width="16" height="4" rx="1"/><path d="M8 16.5l4-4 4 4"/>', 'Ctrl+]'],
        ['recuar', 'Recuar', '<rect class="at" x="4" y="17" width="16" height="4" rx="1"/><path d="M8 7.5l4 4 4-4"/>', 'Ctrl+['],
        ['enviar-tras', 'Enviar para trás', '<rect class="at" x="4" y="17" width="16" height="4" rx="1"/><path d="M8 4l4 4 4-4M8 9l4 4 4-4"/>', 'Ctrl+Shift+['],
        ['agrupar', 'Agrupar', '<rect x="3" y="3" width="18" height="18" rx="1" stroke-dasharray="2.5 2"/><rect class="bt" x="6.5" y="6.5" width="6" height="6" rx="1"/><circle class="b" cx="15" cy="15" r="3"/>', 'Ctrl+G'],
        ['desagrupar', 'Desagrupar', '<rect class="bt" x="3.5" y="3.5" width="7" height="7" rx="1"/><circle class="b" cx="17" cy="17" r="3.5"/><path stroke-dasharray="2 2" d="M14 3.5h6.5V10M10 20.5H3.5V14"/>', 'Ctrl+Shift+G'],
      ] },

    { id: 'inserir', mode: 'designer', name: 'Inserir', note: 'Formas inteligentes, desenho de precisão, tipografia e mídia',
      items: [
        ['retangulo', 'Retângulo', '<rect x="3" y="6.5" width="18" height="11" rx="1"/>', 'M'],
        ['elipse', 'Elipse', '<circle cx="12" cy="12" r="8"/>', 'L'],
        ['poligono', 'Polígono', '<path d="M12 3.5l7.4 4.25v8.5L12 20.5l-7.4-4.25v-8.5z"/>'],
        ['estrela', 'Estrela', '<path class="a" d="' + ESTRELA + '"/>'],
        ['caneta-ins', 'Caneta', CANETA, 'P'],
        ['curvatura', 'Curvatura', '<path class="b" d="M3 17c3-9 6-10 9-6s6 3 9-6"/><rect class="f" x="1.8" y="15.8" width="2.4" height="2.4"/><rect class="f" x="10.8" y="9.8" width="2.4" height="2.4"/><rect class="f" x="19.8" y="3.8" width="2.4" height="2.4"/>', 'Shift+~'],
        ['lapis', 'Lápis', '<path class="a" d="M15.5 4.5l4 4L9 19l-5 1 1-5z"/><path class="a" d="M13.5 6.5l4 4"/><path d="M5 15l4 4"/>', 'N'],
        ['pincel', 'Pincel caligráfico', '<path class="b" d="M20 3.5c-3 1.2-7.5 5.3-9.5 8l2 2c2.7-2 6.8-6.5 8-9.5z"/><path class="b" d="M10.5 11.5c-2.2 0-3.5 1.6-3.7 3.5-.2 1.8-1 3-2.8 3.5 3.3 1.6 7.6.6 8.4-2.6.2-.8.1-1.5-.1-2.1"/>', 'B'],
        ['texto-ponto', 'Texto de ponto', '<path d="M5 6V4h14v2M12 4v16M9 20h6"/><circle class="af" cx="4" cy="20" r="1.6"/>'],
        ['texto-area', 'Texto de área', '<rect x="3" y="3" width="18" height="18" rx="1" stroke-dasharray="2 2"/><path d="M8 8h8M12 8v9"/>'],
        ['texto-caminho', 'Texto em caminho', '<path class="b" d="M3 19c4-6 14-6 18 0"/><path d="M8 4.5h8M12 4.5v9"/>'],
        ['imagem', 'Imagem', '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path class="b" d="M3 17l5.5-5.5 4 4 2.5-2.5L21 19"/><circle class="a" cx="15.5" cy="8.5" r="1.8"/>'],
        ['vetorizar', 'Vetorizar imagem', '<path d="M12 4H4.5A1.5 1.5 0 0 0 3 5.5v13A1.5 1.5 0 0 0 4.5 20H12"/><path class="b" d="M3 17l5-5 4 4"/><path class="a" d="M12 4h7.5A1.5 1.5 0 0 1 21 5.5V20h-9" stroke-dasharray="2 2"/><path class="a" d="M12 16l4-5 5 6"/><rect class="af" x="14.8" y="9.8" width="2.4" height="2.4"/>'],
        ['video', 'Vídeo', '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8.5 3v18M15.5 3v18M5 7.5h3.5M5 12h3.5M5 16.5h3.5M15.5 7.5H19M15.5 12H19M15.5 16.5H19"/>'],
        ['audio', 'Áudio', AUDIO + '<path class="b" d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>'],
        ['modelo-3d', 'Modelo 3D', '<path class="bt" d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path class="b" d="M4 7.4l8 4.6 8-4.6M12 12v9.2"/>'],
      ] },

    { id: 'modificar-formas', mode: 'designer', name: 'Modificar Formas', note: 'Pathfinder, engenharia de caminho e destruição',
      items: [
        ['construtor-formas-mod', 'Construtor de formas', SHAPE_BUILDER, 'Shift+M'],
        ['unir', 'Unir', '<path class="at" d="M4 4h10v6h6v10H10v-6H4z"/>'],
        ['intersecao', 'Interseção', '<path stroke-dasharray="2 2" d="M10 14H4V4h10v6M14 10h6v10H10v-6"/><rect class="af" x="10" y="10" width="4" height="4"/>'],
        ['subtrair', 'Excluir frente', '<path class="at" d="M4 4h10v6h-4v4H4z"/><path stroke-dasharray="2 2" d="M14 10h6v10H10v-6"/>'],
        ['excluir-sobreposicao', 'Excluir sobreposição', '<path class="at" d="M4 4h10v6h-4v4H4zM14 10h6v10H10v-6h4z"/>'],
        ['dividir', 'Dividir', '<path d="M3.5 3.5h9v5h-4v4h-5z"/><rect class="af" x="9.5" y="9.5" width="5" height="5"/><path d="M15.5 10.5h5v10h-10v-5h5z"/>'],
        ['deslocar-caminho', 'Deslocar caminho', '<rect x="3" y="3" width="18" height="18" rx="5" stroke-dasharray="2 2"/><rect class="bt" x="7.5" y="7.5" width="9" height="9" rx="1.5"/>'],
        ['simplificar', 'Simplificar traçado', '<path class="b" d="M3 16c4-10 14-10 18 0"/><circle class="f" cx="3" cy="16" r="1.6"/><circle class="f" cx="21" cy="16" r="1.6"/><circle class="af" cx="12" cy="8.5" r="1.6"/>'],
        ['contornar-traco', 'Contornar traçado', '<path class="at" d="M3.5 17.5l14-14 3 3-14 14z"/><path d="M5 19L19 5" stroke-dasharray="1.5 2"/>'],
        ['borracha', 'Borracha vetorial', '<path d="M14.5 4l6 6-9 9.5H7.5L3.5 15.5z"/><path class="a" d="M9 9.5l6 6"/><path d="M11.5 19.5H20"/>', 'Shift+E'],
        ['faca', 'Faca', '<path d="M19.5 3.5c1.5 1.5-1 6-6 11l-3-3c4-4 7.5-9.5 9-8z"/><path class="a" d="M10.5 11.5L4 18l2 2 6.5-6.5"/>'],
        ['tesoura', 'Tesoura', TESOURA, 'C'],
      ] },

    { id: 'design-aparencia', mode: 'designer', name: 'Design & Aparência', note: 'Cores, bordas, degradês e transparência',
      items: [
        ['preenchimento', 'Preenchimento', '<path d="M5 11l7-7 7 7-7 7z"/><path class="af" d="M5.5 11h13L12 17.5z"/><path class="a" d="M20 15s1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 1.5-3 1.5-3z"/>'],
        ['contorno', 'Contorno', '<rect class="a" x="4" y="4" width="16" height="16" rx="1.5" stroke-width="3"/>'],
        ['espessura', 'Espessura do traço', '<path d="M3 5h18" stroke-width="1"/><path d="M3 11h18" stroke-width="2"/><path d="M3 18h18" stroke-width="3.5"/>'],
        ['tracejado', 'Linha tracejada', '<path d="M3 8h18" stroke-dasharray="3 2.5"/><path class="a" d="M3 16h18" stroke-dasharray="1 3"/>'],
        ['cantos', 'Cantos arredondados', '<path d="M4 20V11a7 7 0 0 1 7-7h9"/><path class="a" d="M4 11a7 7 0 0 1 7-7"/><circle class="af" cx="9" cy="9" r="1.6"/>'],
        ['paleta-rgb', 'Paleta RGB', '<circle class="r" cx="12" cy="8" r="5"/><circle class="v" cx="8.5" cy="14" r="5"/><circle class="b" cx="15.5" cy="14" r="5"/>'],
        ['amostras', 'Amostras de cor', '<rect class="af" x="3" y="3" width="8" height="8" rx="1.5"/><rect class="bf" x="13" y="3" width="8" height="8" rx="1.5"/><rect class="vf" x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>'],
        ['gradiente-linear', 'Gradiente linear', '<rect class="af" x="4" y="6" width="4" height="12"/><rect class="af" opacity=".6" x="8" y="6" width="4" height="12"/><rect class="af" opacity=".3" x="12" y="6" width="4" height="12"/><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/>'],
        ['gradiente-radial', 'Gradiente radial', '<circle class="af" opacity=".25" cx="12" cy="12" r="8"/><circle class="af" opacity=".5" cx="12" cy="12" r="5.5"/><circle class="af" cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8.5"/>'],
        ['gradiente-livre', 'Gradiente de forma livre', '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8 9l8-1-5 8z" stroke-dasharray="1 2"/><circle class="af" cx="8" cy="9" r="2"/><circle class="bf" cx="16" cy="8" r="2"/><circle class="lf" cx="11" cy="16" r="2"/>'],
        ['malha', 'Malha de degradê', '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path class="b" d="M3.5 9.5c6-2 11 2 17 0M3.5 15c6-2 11 2 17 0M9 3.5c-2 6 2 11 0 17M15 3.5c-2 6 2 11 0 17"/>', 'U'],
        ['mesclagem', 'Modo de mesclagem', '<circle cx="9" cy="12" r="5.5"/><circle cx="15" cy="12" r="5.5"/><path class="af" d="M12 7.4a5.5 5.5 0 0 1 0 9.2a5.5 5.5 0 0 1 0-9.2z"/>'],
        ['opacidade', 'Opacidade', '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path class="f" opacity=".5" d="M3.5 3.5h4.25v4.25H3.5zM12 3.5h4.25v4.25H12zM7.75 7.75H12V12H7.75zM16.25 7.75h4.25V12h-4.25zM3.5 12h4.25v4.25H3.5zM12 12h4.25v4.25H12zM7.75 16.25H12v4.25H7.75zM16.25 16.25h4.25v4.25h-4.25z"/>'],
        ['sombra', 'Sombra', '<rect class="f" opacity=".3" x="7.5" y="7.5" width="13" height="13" rx="2"/><rect x="3.5" y="3.5" width="13" height="13" rx="2"/>'],
        ['desfoque', 'Desfoque', '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="7" stroke-dasharray="1.5 2.5" opacity=".7"/><circle cx="12" cy="12" r="9.5" stroke-dasharray="1 3.5" opacity=".4"/>'],
      ] },

    { id: 'layout-responsivo', mode: 'designer', name: 'Layout Responsivo', note: 'Grades, auto layout e regras de tela',
      items: [
        ['grade-colunas', 'Grade de colunas', '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path class="bf" opacity=".35" d="M5.5 3h3v18h-3zM10.5 3h3v18h-3zM15.5 3h3v18h-3z"/>'],
        ['grade-linhas', 'Grade de linhas', '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path class="bf" opacity=".35" d="M3 5.5h18v3H3zM3 10.5h18v3H3zM3 15.5h18v3H3z"/>'],
        ['auto-layout-h', 'Auto layout horizontal', '<rect x="2.5" y="6" width="19" height="12" rx="2"/><rect class="bt" x="5.5" y="9" width="5" height="6" rx="1"/><rect class="bt" x="13.5" y="9" width="5" height="6" rx="1"/>', 'Shift+A'],
        ['auto-layout-v', 'Auto layout vertical', '<rect x="6" y="2.5" width="12" height="19" rx="2"/><rect class="bt" x="9" y="5.5" width="6" height="5" rx="1"/><rect class="bt" x="9" y="13.5" width="6" height="5" rx="1"/>'],
        ['padding', 'Padding', '<rect x="3" y="3" width="18" height="18" rx="2"/><rect class="bt" x="8" y="8" width="8" height="8" rx="1"/><path class="a" d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20"/>'],
        ['gap', 'Gap', '<rect class="bt" x="3" y="5" width="6" height="14" rx="1"/><rect class="bt" x="15" y="5" width="6" height="14" rx="1"/><path class="a" d="M10.5 9.5v5M13.5 9.5v5M10.5 12h3"/>'],
        ['preencher', 'Preencher (fill)', '<path d="M3 4v16M21 4v16"/><rect class="bt" x="5.5" y="8" width="13" height="8" rx="1"/><path class="a" d="M8.5 12h7M8.5 12l1.8-1.8M8.5 12l1.8 1.8M15.5 12l-1.8-1.8M15.5 12l-1.8 1.8"/>'],
        ['abracar', 'Abraçar conteúdo (hug)', '<rect class="bt" x="8" y="8" width="8" height="8" rx="1"/><path class="a" d="M3 9l3 3-3 3M21 9l-3 3 3 3"/>'],
        ['flex-quebra', 'Quebra de linha (wrap)', '<rect class="bt" x="3" y="4" width="5" height="5" rx="1"/><rect class="bt" x="9.5" y="4" width="5" height="5" rx="1"/><rect class="bt" x="16" y="4" width="5" height="5" rx="1"/><rect class="bt" x="3" y="15" width="5" height="5" rx="1"/><path class="a" d="M18.5 10.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-5.5"/><path class="a" d="M13 11.5l-1.5 2 1.5 2"/>'],
        ['ponto-quebra', 'Pontos de quebra', '<path d="M3 12h18"/><path class="a" d="M8 7v10M16 7v10"/><circle class="af" cx="8" cy="12" r="1.8"/><circle class="af" cx="16" cy="12" r="1.8"/>'],
        ['desktop', 'Desktop', '<rect x="2.5" y="4" width="19" height="12.5" rx="1.5"/><path d="M9 20h6M12 16.5V20"/>'],
        ['tablet', 'Tablet', '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M11 18.5h2"/>'],
        ['mobile', 'Mobile', '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>'],
        ['restricoes', 'Restrições', '<rect x="7" y="7" width="10" height="10" rx="1"/><path class="a" d="M12 2.5V7M12 17v4.5M2.5 12H7M17 12h4.5"/>'],
      ] },

    { id: 'exibir', mode: 'designer', name: 'Exibir', note: 'Modos de visualização, guias e snapping',
      items: [
        ['apresentacao', 'Modo apresentação', '<rect x="2.5" y="4" width="19" height="13" rx="1.5"/><path class="af" d="M10 8v5l4.5-2.5z"/><path d="M9 20.5h6M12 17v3.5"/>', 'F5'],
        ['modo-recorte', 'Modo recorte', '<path d="M6 2.5V18h15.5"/><path d="M2.5 6H18v15.5"/>'],
        ['aramado', 'Visualização aramada', '<circle cx="9" cy="10" r="5.5"/><rect x="11" y="11" width="9.5" height="9.5"/><rect class="af" x="9.8" y="9.8" width="2.4" height="2.4"/><rect class="af" x="19.3" y="19.3" width="2.4" height="2.4"/>', 'Ctrl+Y'],
        ['reguas', 'Réguas', '<path d="M3 3h18v5H8v13H3z"/><path d="M11 3v2.5M14 3v2M17 3v2.5M3 11h2.5M3 14h2M3 17h2.5"/>', 'Ctrl+R'],
        ['guias-inteligentes', 'Guias inteligentes', '<path class="l" d="M3 9h18M15 3v18" stroke-dasharray="2 2"/><rect x="5" y="11" width="8" height="8" rx="1"/>', 'Ctrl+U'],
        ['ajustar-grade', 'Ajustar à grade', '<path d="M3 4h18M3 10h18M4 3v18M10 3v18" opacity=".45"/><path class="a" d="M13 13v4a3 3 0 0 0 6 0v-4M13 15h2M17 15h2"/>'],
        ['ajustar-pixel', 'Ajustar ao pixel', '<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" opacity=".45"/><rect class="af" x="9" y="9" width="6" height="6"/>'],
      ] },

    { id: 'ferramentas-script', mode: 'script', name: 'Caixa de ferramentas · Visual Script', note: 'Barra vertical à esquerda do canvas de nós',
      items: [
        ['selecao-nos', 'Selecionar nós', '<path class="af" d="' + RECT_SEL + '"/>', 'V'],
        ['fio-dinamico', 'Fio dinâmico', '<path class="e" d="M5 19c8 0 6-14 14-14"/><circle class="ef" cx="5" cy="19" r="2.2"/><circle class="e" cx="19" cy="5" r="2.2"/>', 'W'],
        ['inserir-no', 'Inserir nó rápido', '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>', 'Tab'],
        ['agrupador', 'Agrupador de código', '<rect class="a" x="3" y="4" width="18" height="16" rx="2" stroke-dasharray="2.5 2"/><path class="a" d="M3 8.5h18"/><rect x="6.5" y="12" width="4" height="4" rx=".8"/><rect x="13.5" y="12" width="4" height="4" rx=".8"/><path d="M10.5 14h3"/>', 'G'],
        ['anotacao', 'Balão de anotação', '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4 4v-4h-.5A1.5 1.5 0 0 1 4 14.5z"/><path d="M8 8.5h8M8 12h5"/>', 'C'],
        ['mao-nos', 'Mão', MAO, 'H'],
        ['zoom-nos', 'Zoom', LUPA, 'Z'],
        ['minimapa', 'Minimapa', '<rect x="3" y="5" width="18" height="14" rx="1.5"/><rect class="bt" x="9" y="8.5" width="7" height="5" rx=".8"/>', 'M'],
        ['no', 'Nó', '<rect x="5" y="5" width="14" height="14" rx="2.5"/><path d="M5 9.5h14"/><circle class="ef" cx="5" cy="14" r="1.8"/><circle class="e" cx="19" cy="14" r="1.8"/>'],
        ['objeto-designer', 'Objeto do Designer', '<rect class="at" x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M8 11.5h8"/>'],
      ] },

    { id: 'eventos', mode: 'script', name: 'Eventos de Gatilho', note: 'Nós de evento · laranja',
      items: [
        ['ao-clicar', 'Ao clicar', '<path class="ef" d="M8 7v13l3.4-3.4 2.4 5.4 2-.9-2.4-5.3H18z"/><path class="e" d="M8 3V1.8M4.2 4.7l-.9-.9M11.8 4.7l.9-.9M4 8.5H2.5"/>'],
        ['ao-passar-mouse', 'Ao passar o mouse', '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 3v6"/><path class="e" d="M20.5 8.5a5 5 0 0 1 0 7M3.5 8.5a5 5 0 0 0 0 7"/>'],
        ['ao-pressionar', 'Ao pressionar', '<rect x="3" y="13" width="18" height="7" rx="2"/><path class="e" d="M12 3v7M9 7.5l3 3 3-3"/>'],
        ['ao-arrastar', 'Ao arrastar', '<path class="e" d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>'],
        ['ao-rolar', 'Ao rolar a página', '<rect x="3.5" y="3" width="17" height="18" rx="1.5"/><path d="M7 7h7M7 10.5h7M7 14h5"/><path class="e" d="M17.5 6v5"/>'],
        ['ao-carregar', 'Ao carregar', JANELA + '<path class="e" d="M15.5 14a3.5 3.5 0 1 1-1-2.5"/><path class="e" d="M14.8 10v1.8H13"/>'],
        ['ao-abrir', 'Ao abrir', JANELA + '<path class="e" d="M12 18v-6.5M9.5 14l2.5-2.5 2.5 2.5"/>'],
        ['ao-fechar', 'Ao fechar', JANELA + '<path class="e" d="M9.5 11.5l5 5M14.5 11.5l-5 5"/>'],
        ['ao-focar', 'Ao focar', '<circle cx="12" cy="12" r="8"/><circle class="ef" cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'],
        ['teclado', 'Teclado', '<rect x="2.5" y="6" width="19" height="12" rx="1.5"/><path d="M6 9.5h.01M9 9.5h.01M12 9.5h.01M15 9.5h.01M18 9.5h.01M6 12.5h.01M9 12.5h.01M12 12.5h.01M15 12.5h.01M18 12.5h.01" stroke-width="2"/><path class="e" d="M8 15.5h8"/>'],
        ['campo-alterado', 'Campo alterado', '<rect x="2.5" y="7" width="19" height="10" rx="1.5"/><path d="M6 12h5"/><path class="e" d="M14 9.5v5M16 10l2.5 2-2.5 2"/>'],
      ] },

    { id: 'acoes', mode: 'script', name: 'Ações & Animações', note: 'Nós de ação · azul elétrico',
      items: [
        ['ir-para-tela', 'Ir para tela', '<rect x="3" y="5" width="10" height="14" rx="1.5"/><path class="x" d="M13 12h8M18 9l3 3-3 3"/>'],
        ['link-externo', 'Abrir link externo', '<path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/><path class="x" d="M14 4h6v6M20 4l-9 9"/>'],
        ['abrir-painel', 'Abrir painel', '<rect x="3" y="4" width="18" height="16" rx="1.5"/><rect class="xt" x="7" y="8" width="10" height="8" rx="1"/>'],
        ['iniciar-animacao', 'Iniciar animação', '<path class="x" d="M8 4.5v15l12-7.5z"/><path d="M2.5 9h3M3.5 15h2.5"/>'],
        ['pausar', 'Pausar', '<path class="x" d="M8 5v14M16 5v14" stroke-width="2.5"/>'],
        ['alternar-visibilidade', 'Alternar visibilidade', OLHO + '<path class="xf" d="M12 9a3 3 0 0 1 0 6z"/><path class="x" d="M12 9a3 3 0 0 0 0 6"/>'],
        ['alterar-opacidade', 'Alterar opacidade', '<circle cx="12" cy="12" r="8"/><path class="xf" d="M12 4a8 8 0 0 1 0 16z"/>'],
        ['alterar-cor', 'Alterar cor', '<path d="M12 3.5s6 6.5 6 10.5a6 6 0 0 1-12 0c0-4 6-10.5 6-10.5z"/><path class="x" d="M9 14.5a3 3 0 0 0 3 3"/>'],
        ['transicao-morph', 'Transição Morph', '<path class="a" d="M12 2.5c.6 5 4.5 8.9 9.5 9.5-5 .6-8.9 4.5-9.5 9.5-.6-5-4.5-8.9-9.5-9.5 5-.6 8.9-4.5 9.5-9.5z"/>'],
        ['interpolar-forma', 'Interpolar forma', '<rect x="2.5" y="8.5" width="7" height="7" rx="1"/><circle class="x" cx="18" cy="12" r="3.5"/><path d="M11.5 12h3" stroke-dasharray="1 1.5"/>'],
        ['escalar', 'Escalar', '<rect x="3" y="11" width="10" height="10" rx="1"/><path class="x" d="M13 11l7-7M15 4h5v5"/>'],
        ['girar', 'Girar', '<path class="x" d="M20 12a8 8 0 1 1-2.3-5.7"/><path class="x" d="M20 4v4.5h-4.5"/>'],
        ['tocar-som', 'Tocar som', AUDIO + '<path class="x" d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>'],
        ['linha-tempo', 'Linha do tempo', '<path d="M3 12h18"/><path class="xf" d="M7 9.5l2.5 2.5L7 14.5 4.5 12z"/><path class="xf" d="M17 9.5l2.5 2.5-2.5 2.5-2.5-2.5z"/><path class="a" d="M12 5.5v13"/>'],
        ['curva-easing', 'Curva de easing', '<path d="M3.5 20.5h17M3.5 20.5V3.5" opacity=".5"/><path class="x" d="M3.5 20.5C10 20.5 9 3.5 20.5 3.5"/>'],
      ] },

    { id: 'variaveis', mode: 'script', name: 'Variáveis & Dados', note: 'Nós de variável · verde esmeralda',
      items: [
        ['variavel', 'Variável', '<path d="M8 4c-2 0-2.5 1-2.5 3v2c0 1.5-.8 3-2 3 1.2 0 2 1.5 2 3v2c0 2 .5 3 2.5 3M16 4c2 0 2.5 1 2.5 3v2c0 1.5.8 3 2 3-1.2 0-2 1.5-2 3v2c0 2-.5 3-2.5 3"/><path class="v" d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>'],
        ['booleano', 'Valor booleano', '<rect class="v" x="2.5" y="7" width="19" height="10" rx="5"/><circle class="vf" cx="16.5" cy="12" r="3"/>'],
        ['definir-variavel', 'Definir variável', '<path class="v" d="M3.5 12h9M9.5 9l3 3-3 3"/><rect x="14" y="7" width="6.5" height="10" rx="1.5"/>'],
        ['obter-variavel', 'Obter variável', '<rect x="3.5" y="7" width="6.5" height="10" rx="1.5"/><path class="v" d="M11.5 12h9M17.5 9l3 3-3 3"/>'],
        ['variavel-texto', 'Caixa de texto', '<rect x="2.5" y="6" width="19" height="12" rx="1.5"/><path class="v" d="M6 9.5h5M8.5 9.5V15"/><path d="M13.5 15h4.5" opacity=".5"/>'],
        ['numero', 'Número', '<path class="v" d="M9.5 4L7.5 20M16.5 4l-2 16M4.5 9h16M3.5 15h16"/>'],
        ['checkbox', 'Caixa de seleção', '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path class="v" d="M8 12.5l3 3 5.5-6"/>'],
        ['radio', 'Botão de rádio', '<circle cx="12" cy="12" r="8.5"/><circle class="vf" cx="12" cy="12" r="4"/>'],
        ['lista-suspensa', 'Lista suspensa', '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M6.5 12h6"/><path class="v" d="M15.5 10.5l2 2 2-2"/>'],
        ['lista', 'Lista (array)', '<path d="M7 4H4v16h3M17 4h3v16h-3"/><path class="v" d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="2.4"/>'],
        ['somar', 'Somar', '<circle class="v" cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>'],
        ['subtrair-valor', 'Subtrair', '<circle class="v" cx="12" cy="12" r="8.5"/><path d="M8 12h8"/>'],
        ['multiplicar', 'Multiplicar', '<circle class="v" cx="12" cy="12" r="8.5"/><path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6"/>'],
        ['dividir-valor', 'Dividir', '<circle class="v" cx="12" cy="12" r="8.5"/><path d="M8 12h8"/><circle class="f" cx="12" cy="8.8" r="1.1"/><circle class="f" cx="12" cy="15.2" r="1.1"/>'],
        ['contador', 'Contador de pontos', '<path d="M5 5v14M9 5v14M13 5v14M17 5v14"/><path class="v" d="M3 16L19 8"/>'],
        ['planilha', 'Planilha', '<path class="vf" opacity=".3" d="M3 8.5h18V5a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 5z"/><rect x="3" y="3.5" width="18" height="17" rx="1.5"/><path d="M3 8.5h18M3 13.5h18M9 3.5v17"/>'],
        ['banco-dados', 'Banco de dados', '<ellipse class="v" cx="12" cy="5.5" rx="7.5" ry="2.8"/><path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8"/>'],
        ['buscar-dados', 'Buscar dados (API)', NUVEM + '<path class="v" d="M12 10.5v5.5M9.8 13.8L12 16l2.2-2.2"/>'],
      ] },

    { id: 'logica', mode: 'script', name: 'Lógica & Condições', note: 'Nós de lógica · violeta',
      items: [
        ['se-entao', 'Se / Então', '<path class="l" d="M12 2.5l5 5-5 5-5-5z"/><path d="M7 7.5H4.5V20M17 7.5h2.5V20"/><path d="M2.5 18l2 2 2-2M17.5 18l2 2 2-2"/>'],
        ['escolher', 'Escolher (switch)', '<path class="l" d="M3 12h5"/><path d="M8 12c3 0 3-6 7-6h5M8 12h12M8 12c3 0 3 6 7 6h5"/>'],
        ['porta-e', 'E (AND)', '<path class="l" d="M7 5h5a7 7 0 0 1 0 14H7z"/><path d="M3 9h4M3 15h4M19 12h2.5"/>'],
        ['porta-ou', 'OU (OR)', '<path class="l" d="M6 5c6 0 10 3 13 7-3 4-7 7-13 7 2.5-4.5 2.5-9.5 0-14z"/><path d="M3 9h4.3M3 15h4.3M19 12h2.5"/>'],
        ['porta-nao', 'NÃO (NOT)', '<path class="l" d="M6 5v14l10-7z"/><circle class="l" cx="18.5" cy="12" r="2"/><path d="M2.5 12H6"/>'],
        ['maior-que', 'Maior que', '<path class="l" d="M7 6l10 6-10 6"/>'],
        ['menor-que', 'Menor que', '<path class="l" d="M17 6L7 12l10 6"/>'],
        ['igual', 'Igual a', '<path class="l" d="M5 9h14M5 15h14"/>'],
        ['diferente', 'Diferente de', '<path class="l" d="M5 9h14M5 15h14"/><path d="M15 4.5L9 19.5"/>'],
        ['atraso', 'Atraso (delay)', '<path class="l" d="M5.5 3.5h13M5.5 20.5h13"/><path d="M7 3.5v1.8c0 2.5 5 4 5 6.7 0-2.7 5-4.2 5-6.7V3.5M7 20.5v-1.8c0-2.5 5-4 5-6.7 0 2.7 5 4.2 5 6.7v1.8"/>'],
        ['repetir', 'Repetir (loop)', '<path class="l" d="M17 3.5l3 3-3 3"/><path d="M4 11.5V10a3.5 3.5 0 0 1 3.5-3.5H20"/><path class="l" d="M7 20.5l-3-3 3-3"/><path d="M20 12.5V14a3.5 3.5 0 0 1-3.5 3.5H4"/>'],
        ['para-cada', 'Para cada item', '<path d="M9 6h11M9 12h11M9 18h11"/><path class="l" d="M3.5 4.8L5.5 6l-2 1.2zM3.5 10.8l2 1.2-2 1.2zM3.5 16.8l2 1.2-2 1.2z"/>'],
        ['cronometro', 'Cronômetro', '<circle cx="12" cy="13.5" r="7.5"/><path d="M10 2.5h4M12 2.5V6"/><path class="l" d="M12 13.5V9.5M12 13.5l2.5 1.5"/>'],
        ['intervalo', 'A cada intervalo', '<circle cx="12" cy="12" r="8.5"/><path class="l" d="M12 7v5h4"/>'],
        ['aleatorio', 'Aleatório', '<rect x="4" y="4" width="16" height="16" rx="3"/><circle class="lf" cx="8.5" cy="8.5" r="1.3"/><circle class="lf" cx="15.5" cy="8.5" r="1.3"/><circle class="lf" cx="12" cy="12" r="1.3"/><circle class="lf" cx="8.5" cy="15.5" r="1.3"/><circle class="lf" cx="15.5" cy="15.5" r="1.3"/>'],
      ] },

    { id: 'estados', mode: 'script', name: 'Estados de Componente', note: 'Microinterações e travas de scroll · âmbar',
      items: [
        ['componente', 'Componente', '<path class="a" d="M12 3l3 3-3 3-3-3zM6 9l3 3-3 3-3-3zM18 9l3 3-3 3-3-3zM12 15l3 3-3 3-3-3z"/>'],
        ['instancia', 'Instância', '<path class="a" d="M12 4l8 8-8 8-8-8z"/>'],
        ['desanexar', 'Desanexar instância', '<path class="a" d="M12 4l3.5 3.5M20 12l-3.5 3.5M12 20l-3.5-3.5M4 12l3.5-3.5"/><path d="M9.5 9.5l5 5"/>'],
        ['variantes', 'Estados / variantes', '<rect x="3" y="4" width="8" height="7" rx="1.5"/><rect class="at" x="13" y="4" width="8" height="7" rx="1.5"/><rect x="3" y="13" width="8" height="7" rx="1.5"/><rect x="13" y="13" width="8" height="7" rx="1.5" stroke-dasharray="2 1.6"/>'],
        ['microinteracao', 'Microinteração', '<rect x="3" y="10" width="14" height="8" rx="4"/><path class="a" d="M19 3v4M17 5h4M15.5 7.5l1.2 1.2"/>'],
        ['estado-carrinho', 'Estado: carrinho', '<path d="M3 4h2.5l2.2 10.5h10.5L20.5 7H7"/><circle cx="9.5" cy="18.5" r="1.5"/><circle cx="16.5" cy="18.5" r="1.5"/><path class="a" d="M11 10.5h5"/>'],
        ['cabecalho-fixo', 'Cabeçalho fixo (sticky)', '<rect x="3" y="3" width="18" height="18" rx="1.5"/><rect class="at" x="3" y="3" width="18" height="5" rx="1.5"/><path d="M7 12.5h10M7 16h7" opacity=".6"/>'],
        ['travar-rolagem', 'Travar rolagem', '<rect x="3.5" y="3" width="10" height="18" rx="1.5"/><path d="M6.5 7h4M6.5 10.5h4"/><rect class="a" x="15" y="13" width="6.5" height="6" rx="1"/><path class="a" d="M16.3 13v-1.5a2 2 0 0 1 4 0V13"/>'],
      ] },

    { id: 'compilar', mode: 'script', name: 'Compilar & Dev', note: 'Execução, depuração e modo desenvolvedor',
      items: [
        ['executar', 'Executar', '<path class="vf" d="M7 4.5v15l12.5-7.5z"/>', 'F5'],
        ['depurar', 'Depurar', '<rect x="7.5" y="7.5" width="9" height="12" rx="4.5"/><path d="M9.5 7.5a2.5 2.5 0 0 1 5 0M12 11v8.5M7.5 12H4M16.5 12H20M7.5 16.5l-3 1.5M16.5 16.5l3 1.5M8 9L5 7M16 9l3-2"/>', 'F9'],
        ['parar', 'Parar', '<rect class="r" x="6" y="6" width="12" height="12" rx="1.5"/>', 'Shift+F5'],
        ['passo', 'Avançar um passo', '<path d="M4 12h10M11 8l4 4-4 4"/><path class="a" d="M19 5v14"/>', 'F10'],
        ['ponto-interrupcao', 'Ponto de interrupção', '<circle class="rf" cx="12" cy="12" r="5"/><circle class="r" opacity=".5" cx="12" cy="12" r="8.5"/>'],
        ['monitor-execucao', 'Monitor ao vivo', '<path class="v" d="M3 12h4l2-5 4 10 2-5h6"/>'],
        ['analisador-fios', 'Analisador de fios', '<path d="M3 17c6 0 5-10 11-10"/><path class="a" d="M17.5 12l3.8 6.5h-7.6z"/><path class="a" d="M17.5 14.6v1.4"/>'],
        ['loop-infinito', 'Alerta de loop infinito', '<path class="r" d="M12 12c-2-2.5-3.5-4-5.5-4a4 4 0 0 0 0 8c2 0 3.5-1.5 5.5-4s3.5-4 5.5-4a4 4 0 0 1 0 8c-2 0-3.5-1.5-5.5-4z"/>'],
        ['compilar', 'Compilar', '<path class="a" d="M10.5 6.5l7 7" stroke-width="4"/><path d="M14 10l-9.5 9.5"/><path class="a" d="M19.5 3.5L21 2M20.5 7H22M16 3V1.5"/>', 'Ctrl+B'],
        ['codigo', 'Código', '<path class="b" d="M8 7l-5 5 5 5M16 7l5 5-5 5"/><path d="M13.5 5l-3 14"/>'],
        ['modo-dev', 'Modo desenvolvedor', '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M15 4v16"/><path class="b" d="M7.5 9.5L5.5 12l2 2.5M10.5 9.5l2 2.5-2 2.5"/>'],
        ['console', 'Console', '<rect x="2.5" y="4" width="19" height="16" rx="1.5"/><path class="v" d="M6 9l3 3-3 3"/><path d="M11 15h6"/>'],
        ['codigo-html', 'Gerar HTML', ARQUIVO + '<path class="b" d="M10 12l-2 2.5 2 2.5M14 12l2 2.5-2 2.5"/>'],
        ['codigo-css', 'Gerar CSS', ARQUIVO + '<path class="b" d="M10.5 11.5c-1 0-1.3.5-1.3 1.3v.6c0 .6-.4 1.1-.9 1.1.5 0 .9.5.9 1.1v.6c0 .8.3 1.3 1.3 1.3M13.5 11.5c1 0 1.3.5 1.3 1.3v.6c0 .6.4 1.1.9 1.1-.5 0-.9.5-.9 1.1v.6c0 .8-.3 1.3-1.3 1.3"/>'],
        ['codigo-js', 'Gerar JavaScript', ARQUIVO + '<path class="b" d="M8 14.5h3.5M8 16.5h3.5M13.5 13l2.5 2.5-2.5 2.5"/>'],
        ['codigo-csharp', 'Gerar C#', ARQUIVO + '<path class="b" d="M10.5 11.5l-1 6M13.5 11.5l-1 6M8.5 13.5h6M8 15.5h6"/>'],
        ['codigo-componente', 'Gerar componente (JSX)', ARQUIVO + '<path class="b" d="M10 12.5L8 14.5l2 2M14 12.5l2 2-2 2M12.6 12l-1.2 5"/>'],
        ['publicar', 'Publicar', NUVEM + '<path class="b" d="M12 17v-6M9.5 13.5L12 11l2.5 2.5"/>'],
      ] },
  ];

  const PALETTES = {
    dark:  { base: '#E6E3DC', a: '#E3A24A', b: '#4AA3F0', e: '#F2913D', l: '#A97BF0', v: '#3CC98A', x: '#4C8DFF', r: '#E5534B' },
    light: { base: '#2B2F36', a: '#B5741A', b: '#1F6FB8', e: '#C8611A', l: '#7046C8', v: '#16875A', x: '#2560D6', r: '#C33A33' },
  };

  // Converte as classes de cor em atributos para um SVG autônomo.
  function resolve(inner, pal, baseIsCurrent) {
    const base = baseIsCurrent ? 'currentColor' : pal.base;
    return inner.replace(/ class="([a-z]{1,2})"/g, (m, c) => {
      if (c === 'f') return ` fill="${base}" stroke="none"`;
      const k = c[0], mod = c[1], col = pal[k];
      if (!col) return m;
      if (mod === 'f') return ` fill="${col}" stroke="none"`;
      if (mod === 't') return ` stroke="${col}" fill="${col}" fill-opacity=".22"`;
      return ` stroke="${col}"`;
    });
  }

  function toSVG(inner, opts) {
    opts = opts || {};
    const pal = PALETTES[opts.theme || 'dark'];
    const size = opts.size || 24;
    const base = opts.currentColor ? 'currentColor' : pal.base;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${base}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      resolve(inner, pal, !!opts.currentColor) + '</svg>';
  }

  const api = { GROUPS, PALETTES, toSVG };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HEF_ICONS = api;
})(this);
