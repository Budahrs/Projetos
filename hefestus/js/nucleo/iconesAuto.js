const REGRAS_NOVAS = [
  [/\b(instalador|instalar|setup)\b/, "instalador"], [/\b(aplicativo|programa|executavel|exe)\b/, "aplicativo"],
  [/\b(paineis|painel|dashboard)\b/, "grafico"], [/\b(projetos?)\b/, "pasta"], [/\b(deploy|publicar|publicacao)\b/, "exportar"],
  [/\b(download|baixar)\b/, "exportar"], [/\b(upload|enviar)\b/, "exportar"],

];
// Ícone certo para o rótulo: "Salvar" → disquete, "Imprimir" → impressora… Usado quando o item ainda está com o ícone padrão (estrela).
const REGRAS_FAIXA = [
  [/\bnegrito\b/, "md-format-bold"], [/\bitalico\b/, "md-format-italic"], [/\bsublinhado\b/, "md-format-underline"], [/\btachado\b/, "md-format-strikethrough"],
  [/\b(realcar|realce)\b/, "md-format-color-highlight"], [/\bcor do texto\b/, "md-format-color-text"], [/\bpincel de formatacao\b/, "md-format-paint"],
  [/\blista\b/, "md-format-list-bulleted"], [/\bnumeracao\b/, "md-format-list-numbered"], [/\brecuo\b/, "md-format-indent-increase"], [/\bespacamento\b/, "md-format-line-spacing"],
  [/\b(normal|paragrafo)\b/, "md-format-paragraph"], [/\btitulo 1\b/, "md-format-header-1"], [/\btitulo 2\b/, "md-format-header-2"],
  [/\bsubstituir\b/, "md-find-replace"], [/\bselecionar\b/, "md-select"], [/\bditar\b/, "md-microphone"], [/\bsuplementos\b/, "md-puzzle"],
  [/\b(folha de rosto|pagina em branco)\b/, "md-file-document"], [/\bquebra de pagina\b/, "md-page-layout-body"], [/\btabela\b/, "md-table-of-contents"],
  [/\b(formas?)\b/, "md-shape"], [/\bicones\b/, "md-star-circle"], [/\bcaptura de tela\b/, "md-monitor-dashboard"], [/\bindicador\b/, "md-bookmark"],
  [/\bcabecalho\b/, "md-page-layout-header"], [/\brodape\b/, "md-page-layout-footer"], [/\bequacao\b/, "md-code-braces"], [/\bsimbolo\b/, "md-at"],
  [/\bcaneta\b/, "md-pencil"], [/\bborracha\b/, "md-eraser"], [/\btinta\b/, "md-brush"], [/\bregua\b/, "md-ruler"], [/\bfontes?\b/, "md-format-font"],
  [/\befeitos\b/, "md-blur"], [/\bmarca d agua\b/, "md-image-filter-vintage"], [/\bcor da pagina\b/, "md-palette"], [/\bbordas?\b/, "md-border-all"],
  [/\bmargens\b/, "md-page-layout-sidebar-left"], [/\borientacao\b/, "md-rotate-right"], [/\btamanho\b/, "md-resize"], [/\bcolunas\b/, "md-view-column"],
  [/\bposicao\b/, "md-arrow-all"], [/\btrazer para frente\b/, "md-layers"], [/\b(ortografia|gramatica)\b/, "md-spellcheck"], [/\bsinonimos\b/, "md-book"],
  [/\bcontar palavras\b/, "md-text"], [/\banterior\b/, "md-arrow-left"], [/\bproximo\b/, "md-arrow-right"], [/\bcontrolar alteracoes\b/, "md-pencil-box"],
  [/\baceitar\b/, "md-check-circle"], [/\brejeitar\b/, "md-close-circle"], [/\bmodo de leitura\b/, "md-eye-outline"], [/\blayout da web\b/, "md-monitor"],
  [/\blinhas de grade\b/, "md-grid"], [/\bpainel de navegacao\b/, "md-menu-open"], [/\b100\b/, "md-magnify"], [/\buma pagina\b/, "md-file-outline"],
  [/\borganizar tudo\b/, "md-view-grid"], [/\bdividir\b/, "md-dock-window"], [/\bmostrar treinamento\b/, "md-help-circle"],
];
const REGRAS = [
  [/\b(novo|nova|adicionar|criar|inserir|incluir|cadastrar)\b/, "mais"], [/\b(abrir|abra)\b/, "abrir"], [/\b(salvar|gravar|guardar)\b/, "salvar"], [/\bimprimir|impressao\b/, "impressora"],
  [/\b(exportar|exportacao)\b/, "exportar"], [/\b(importar|importacao)\b/, "importar"], [/\bcopiar\b/, "copiar"], [/\b(colar)\b/, "colar"], [/\b(recortar|cortar)\b/, "cortar"],
  [/\bdesfazer\b/, "desfazer"], [/\brefazer\b/, "refazer"], [/\b(duplicar|clonar)\b/, "duplicar"], [/\b(excluir|apagar|remover|deletar|lixeira)\b/, "excluir"],
  [/\b(buscar|busca|pesquisar|pesquisa|procurar|localizar|encontrar)\b/, "buscar"], [/\b(filtrar|filtro|filtros)\b/, "filtro"], [/\b(ordenar|ordem)\b/, "ordenar"],
  [/\b(config|configuracao|configuracoes|ajustes|preferencias|opcoes)\b/, "engrenagem"], [/\bferramentas?\b/, "ferramentas"], [/\bajuda|suporte|duvidas?\b/, "ajuda"], [/\b(sobre|informacao|informacoes|detalhes)\b/, "info"],
  [/\b(inicio|home|principal|painel inicial)\b/, "casa"], [/\b(usuarios|equipe|pessoas|grupos?)\b/, "usuarios"], [/\b(usuario|perfil|conta|minha conta)\b/, "usuario"], [/\b(sair|logout|desconectar)\b/, "sair"], [/\b(entrar|login|acessar)\b/, "entrar"],
  [/\b(senha|seguranca|chave|credenciais?)\b/, "chave"], [/\b(escudo|protecao|protegid[oa]s?|antivirus)\b/, "escudo"], [/\b(email|e-mail|correio|mensagens?)\b/, "email"], [/\b(telefone|ligar|ramal|ramais|chamadas?)\b/, "telefone"],
  [/\b(calendario|agenda|datas?)\b/, "calendario"], [/\b(relogio|horario|hora|tempo)\b/, "relogio"], [/\b(notificacoes?|avisos?|sino)\b/, "sino"], [/\b(alertas?|alarmes?|atencao)\b/, "alerta"], [/\b(erro|falhas?)\b/, "erro"],
  [/\b(relatorios?|graficos?|estatisticas?|dashboard|metricas|indicadores)\b/, "grafico"], [/\b(documentos?|arquivos?|ata|atas)\b/, "documento"], [/\b(pasta|pastas|diretorio)\b/, "pasta"], [/\b(pdf)\b/, "pdf"], [/\b(excel|planilhas?)\b/, "excel"], [/\b(csv)\b/, "csv"],
  [/\b(mapa|planta|localizacao|local|andar|andares|endereco)\b/, "mapa"], [/\b(imagens?|fotos?|figuras?)\b/, "imagem"], [/\b(camera|cameras|cftv)\b/, "camera"], [/\b(video|videos|play|reproduzir|iniciar)\b/, "play"], [/\b(pausar|pausa)\b/, "pausa"], [/\b(parar|stop|encerrar)\b/, "parar"],
  [/\b(atualizar|recarregar|sincronizar|reiniciar|refresh)\b/, "girar"], [/\b(baixar|download)\b/, "baixar"], [/\b(enviar|upload|subir)\b/, "enviar"], [/\b(compartilhar)\b/, "compartilhar"], [/\b(link|links|url)\b/, "link"], [/\b(editar|edicao|alterar|modificar|renomear)\b/, "editar"],
  [/\b(visualizar|ver|previa|visao|exibir)\b/, "olho"], [/\b(ocultar|esconder)\b/, "olhoFechado"], [/\b(zoom|ampliar|lupa)\b/, "zoom"], [/\b(tema|temas|cores?|aparencia|estilo|estilos)\b/, "tema"], [/\b(texto|fonte|tipografia)\b/, "texto"], [/\b(camadas?|niveis)\b/, "camadas"],
  [/\b(alinhar|alinhamento)\b/, "alinhar"], [/\b(girar|rotacionar|rotacao)\b/, "girar"], [/\b(tela cheia|maximizar)\b/, "telaCheia"], [/\b(favoritos?|destaques?|importante)\b/, "estrela"], [/\b(salvos|marcadores?|etiquetas?|tags?)\b/, "etiqueta"],
  [/\b(rede|redes|topologia)\b/, "topologia"], [/\b(wifi|wi-fi|sem fio|wireless)\b/, "wifi"], [/\b(access point|ap|aps)\b/, "accessPoint"], [/\b(switch|switches)\b/, "switchRede"], [/\b(roteador|roteadores|gateway)\b/, "roteador"], [/\b(servidor|servidores|server)\b/, "servidor"],
  [/\b(banco de dados|database|sql|dados)\b/, "bancoDados"], [/\b(nuvem|cloud)\b/, "nuvem"], [/\b(backup|backups)\b/, "backup"], [/\b(restaurar|restauracao)\b/, "restaurar"], [/\b(logs?|registros?|eventos)\b/, "logs"], [/\b(historico)\b/, "historico"], [/\b(monitorar|monitoramento|monitor)\b/, "monitorPulso"],
  [/\b(computador|desktop|estacao|estacoes|maquinas?|pcs?)\b/, "computador"], [/\b(celular|smartphone|mobile)\b/, "celular"], [/\b(tablet)\b/, "tablet"], [/\b(tv|televisao)\b/, "televisao"], [/\b(hospital|saude|clinica|paciente|pacientes)\b/, "hospital"], [/\b(plugins?|extensoes|modulos?)\b/, "plugin"],
  [/\b(carrinho|compras|pedidos?)\b/, "carrinho"], [/\b(pagamentos?|cartao|financeiro|faturas?)\b/, "cartao"], [/\b(favorit[oa])\b/, "coracao"], [/\b(modelos?|templates?)\b/, "modelo"], [/\b(biblioteca|acervo)\b/, "biblioteca"], [/\b(chat|conversa|conversas|comentarios?)\b/, "chat"],
  [/\b(travar|bloquear|cadeado)\b/, "travar"], [/\b(destravar|desbloquear)\b/, "destravar"], [/\b(check|concluir|concluido|aprovar|ok|confirmar)\b/, "check"], [/\b(cancelar|fechar)\b/, "fechar"], [/\b(menos|diminuir|reduzir)\b/, "menos"],
];
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9\- ]+/g, " ").replace(/\s+/g, " ").trim();
/** Ícone sugerido para o rótulo, ou null quando nenhuma regra serve. */
export function iconePorRotulo(rotulo) {
  const t = norm(rotulo);
  if (!t) return null;
  for (const [re, ic] of REGRAS_FAIXA) if (re.test(t)) return ic;
  for (const [re, ic] of REGRAS) if (re.test(t)) return ic;
  for (const [re, ic] of REGRAS_NOVAS) if (re.test(t)) return ic;
  return null;
}
/** Ícone final do item: o escolhido pelo usuário; se ainda for a estrela padrão (ou vazio), o que combina com o rótulo. */
export const iconeDe = (it, rotulo = it.rotulo ?? it.titulo ?? it.nome, padrao = "estrela") => (it.icone && !["estrela","auto"].includes(it.icone) ? it.icone : (iconePorRotulo(rotulo) ?? (it.icone === "auto" ? "caixa" : it.icone) ?? padrao));

