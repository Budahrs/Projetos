import { emJanelaNativa } from "../nucleo/nativo.js";
import { NOS, CATEGORIAS } from '../nucleo/visualScript.js';
import { MODOS_MISTURA } from '../nucleo/estiloAvancado.js';
const grupo=(nome,icone,cmds)=>({nome,icone,cmds:cmds.filter(Boolean)});
const aba=(id,rotulo,grupos)=>({id,rotulo,grupos});
export function abasHephaestus(app,legadas=[]) {
 const n=app.n,u=app.ui,sel=()=>n.selecionados(),vazio=()=>!sel().length,unico=()=>n.selecionado();
 const catalogo=new Map();
 const visitar=c=>{if(c?.id)catalogo.set(c.id,c);if(Array.isArray(c?.flyout))c.flyout.forEach(visitar);};
 for(const a of legadas)for(const g of a.grupos||[])for(const c of g.cmds||[])visitar(c);
 const leg=(id,rotulo)=>{const c=catalogo.get(id);return c?{...c,...(rotulo?{rotulo}:{}),tam:'pequeno'}:null;};
 const cmd=(id,rotulo,icone,acao,extra={})=>({id,rotulo,icone,acao,tam:'pequeno',...extra});
 const grande=(id,rotulo,icone,acao,extra={})=>cmd(id,rotulo,icone,acao,{tam:'grande',...extra});
 const painel=(id,rotulo,nome,icone='propriedades')=>cmd(id,rotulo,icone,()=>app.abrirPainelDir(nome));
 const sp=(id,rotulo,campo,padrao,min,max,unidade='px')=>({id,tipo:'spinner',rotulo,icone:'propriedades',unidade,min,max,passo:campo==='estilo.opacidade'?0.05:1,valor:()=>unico()?campo.split('.').reduce((a,k)=>a?.[k],unico())??padrao:null,aoMudar:v=>n.definirNosSelecionados({[campo]:Math.min(max,Math.max(min,v))},rotulo),desabilitado:()=>vazio()||(campo.startsWith('layout.')&&unico()?.tipo!=='container')});
 const iconesNo={'ev.clique':'ao-clicar','ev.entrar':'ao-passar-mouse','ev.pressionar':'ao-pressionar','ev.arrastar':'ao-arrastar','ev.rolar':'ao-rolar','ev.iniciar':'ao-carregar','ev.abrir':'ao-abrir','ev.fechar':'ao-fechar','ev.tecla':'teclado','ev.mudar':'campo-alterado','fl.se':'se-entao','l.comparar':'igual','l.e':'porta-e','l.ou':'porta-ou','l.nao':'porta-nao','fl.esperar':'atraso','fl.repetir':'repetir','ev.intervalo':'intervalo','ui.objeto':'objeto-designer','ui.elemento':'objeto-designer','ui.link':'link-externo','ui.abrir':'abrir-painel','ui.alternar':'alternar-visibilidade','ui.efeito':'iniciar-animacao','ui.transicao':'curva-easing','ui.estado':'variantes','ui.sticky':'cabecalho-fixo','ui.scrollLock':'travar-rolagem','var.obter':'obter-variavel','var.definir':'definir-variavel','var.incrementar':'contador','c.numero':'numero','c.texto':'variavel-texto','c.logico':'booleano','m.somar':'somar','m.subtrair':'subtrair-valor','m.multiplicar':'multiplicar','m.dividir':'dividir-valor'};
 const no=(tipo,rotulo)=>NOS[tipo]?cmd('no-'+tipo,rotulo||NOS[tipo]?.nome,iconesNo[tipo]||'no',()=>app.adicionarNo(tipo)):null;
 const abrir=(id,rotulo)=>cmd('painel-'+id,rotulo,'painelInferior',()=>app.estudio.abrirAba(id));
 const arquivo=aba('arquivo','Arquivo',[
  grupo('Documento','novo',[grande('hp-novo','Novo documento','novo',()=>app.novoDocumentoHP()),leg('abrir'),leg('salvar'),leg('salvar-como')]),
  grupo('Exportar','exportar',[grande('hp-svg','SVG editável','exportar',()=>app.baixarSVG()),leg('exp-html','HTML + documentos'),leg('exp-comp'),leg('exp-windows')]),
  grupo('Projeto e recuperação','relogio',[leg('exp-separado'),leg('exp-docs'),cmd('hp-historico','Histórico','relogio',()=>app.mostrarFerramentaProjeto('historico')),cmd('hp-auditoria','Auditoria','check',()=>app.mostrarFerramentaProjeto('auditoria'))]),
  grupo('Hephaestus','bigorna',[cmd('hp-engenharia','Bíblia / GDD','documento',()=>app.mostrarEngenharia()),cmd('hp-exemplo','Exemplo interativo','modelo',()=>app.novoExemploHP()),cmd('hp-capacidades','Capacidades desta versão','info',()=>app.mostrarCapacidades()),cmd('hp-ajuda','Atalhos e ajuda','ajuda',()=>u.hibrido?app.estudio.mostrarAjuda():app.mostrarAtalhos()),cmd('hp-modelos','Biblioteca de modelos','biblioteca',()=>app.mostrarFerramentaProjeto('biblioteca'))])
 ]);
 if(u.hibrido) { const abasScript = [
  aba('gatilhos','Eventos de Gatilho',[
   grupo('Interação','raio',[no('ev.clique'),no('ev.entrar'),no('ev.pressionar'),no('ev.arrastar'),no('ev.duplo'),no('ev.contexto')]),
   grupo('Ciclo de vida','play',[no('ev.iniciar','Ao carregar'),no('ev.rolar'),no('ev.abrir'),no('ev.fechar'),no('ev.redimensionar')]),
   grupo('Entrada','campo',[no('ev.tecla'),no('ev.mudar'),no('ev.foco'),no('ev.sinal')]),
   grupo('Execução','play',[grande('vs-executar','Executar / Parar','play',()=>app.estudio.alternarExecucao(),{atalho:'F5'}),abrir('depurador','Depurar'),abrir('problemas','Problemas')])
  ]),
  aba('acoes','Ações & Efeitos',[
   grupo('Interface','link',[no('ui.abrir'),no('ui.fechar'),no('ui.alternar'),no('ui.mostrarSo'),no('ui.focar')]),
   grupo('Aparência e movimento','efeitos',[no('ui.estilo'),no('ui.transicao'),no('ui.efeito'),no('ui.forma')]),
   grupo('Conteúdo','texto',[no('ui.texto'),no('ui.valor'),no('ui.link'),no('ui.aviso')]),
   grupo('Organizar o grafo','grade',[cmd('vs-organizar','Organizar automaticamente','grade',()=>app.estudio.organizar()),cmd('vs-enquadrar','Enquadrar','telaCheia',()=>app.estudio.enquadrar()),cmd('vs-agrupar','Agrupar nós','camadas',()=>app.estudio.agrupar())])
  ]),
  aba('variaveis','Variáveis & Dados',[
   grupo('Variáveis','etiqueta',[grande('vs-nova-variavel','Nova variável','mais',()=>app.estudio.novaVariavel()),no('var.obter'),no('var.definir'),no('var.incrementar'),no('var.inverter')]),
   grupo('Valores','texto',[no('c.numero'),no('c.texto'),no('c.logico'),no('ui.somarCampos'),no('ui.obterTexto'),no('ui.obterValor')]),
   grupo('Transformação de dados','codigo',[no('t.juntar'),no('t.formatar'),no('t.numero'),no('t.caixa'),no('t.hora')]),
   grupo('Observação','buscar',[abrir('observar','Observar valores'),cmd('vs-importar','Importar grafo','abrir',()=>app.estudio.abrirImportar())])
  ]),
  aba('logica','Lógica & Condições',[
   grupo('Decisões','topologia',[no('fl.se'),no('l.comparar'),no('l.e'),no('l.ou'),no('l.nao'),no('l.escolher')]),
   grupo('Tempo e repetição','relogio',[no('fl.esperar'),no('fl.repetir'),no('ev.intervalo'),no('fl.umaVez'),no('fl.portao')]),
   grupo('Matemática','grade',[no('m.somar'),no('m.subtrair'),no('m.multiplicar'),no('m.dividir'),no('m.aleatorio')]),
   grupo('Organização','camadas',[cmd('vs-novo-grafo','Novo grafo','mais',()=>app.estudio.novoGrafo()),cmd('vs-nota','Comentário','documento',()=>app.estudio.novaNota(...app.estudio.centroVisivel()),{atalho:'C'}),no('rr','Desvio de fio')])
  ]),
  aba('componentes','Estados de Componente',[
   grupo('Objetos ativos','caixa',[no('ui.elemento','Referência ao objeto'),no('ui.visivel'),no('ui.habilitar'),no('ui.classe')]),
   grupo('Eventos e estados','estados',[no('ui.estado'),no('ui.sinal'),no('ev.personalizado'),no('fl.disparar'),no('ev.variavel')]),
   grupo('Travas de scroll','travar-rolagem',[no('ui.sticky'),no('ui.scrollLock')]),
   grupo('Composição e modelos','modelo',[abrir('modelos','Modelos'),abrir('composicao','Composição'),abrir('faixa','Ribbon do projeto')]),
   grupo('Comportamentos','raio',[abrir('comportamento','Comportamentos existentes'),abrir('efeitos','Efeitos do objeto'),abrir('codigoEl','Código do objeto')])
  ]),
  aba('compilar','Compilar & Dev',[
   grupo('Testar','play',[grande('vs-testar','Executar / Parar','play',()=>app.estudio.alternarExecucao()),abrir('depurador','Console'),abrir('problemas','Validar conexões')]),
   grupo('Código','codigo',[abrir('codigo','Ler diagrama em texto'),abrir('codigoEl','HTML / CSS / JavaScript'),leg('exp-comp')]),
   grupo('Entregar','exportar',[leg('exp-html','Exportar HTML funcional'),cmd('vs-exp-texto','Exportar grafo em TXT','documento',()=>app.estudio.exportarTxt('forja')),abrir('documentacao','Documentação')]),
   grupo('Revisão','relogio',[cmd('vs-engenharia','Bíblia / GDD','documento',()=>app.mostrarEngenharia()),abrir('historico','Histórico'),abrir('agente','Agente'),cmd('vs-fios','Aparência dos fios','link',()=>app.estudio.alternarPopFios())])
  ])
 ]; return ['gatilhos','acoes','logica','variaveis','componentes','compilar'].map(id=>abasScript.find(a=>a.id===id)); }
 return [arquivo,
  aba('inicio','Página Inicial',[
   grupo('Seleção','selecao',[grande('hp-select','Seleção','selecao',()=>app.setFerramenta('selecao'),{atalho:'V'}),cmd('hp-direta','Seleção direta','nos',()=>app.editarSelecaoDireta(),{atalho:'A'}),leg('sel-tudo'),leg('sel-inv')]),
   grupo('Área de transferência','copiar',[leg('copiar-el'),leg('cortar'),leg('colar'),cmd('hp-colar-frente','Colar na frente','frente',()=>app.colarNaCamada('frente'),{atalho:'Ctrl+F'}),cmd('hp-colar-tras','Colar atrás','tras',()=>app.colarNaCamada('tras'),{atalho:'Ctrl+B'}),cmd('hp-pincel','Copiar aparência','pincel',()=>app.ativarPincel(),{desabilitado:vazio})]),
   grupo('Alinhamento e distribuição','alinhar',['esquerda','centroH','direita','topo','centroV','base'].map((m,i)=>cmd('hp-al-'+m,['Esquerda','Centro horizontal','Direita','Topo','Centro vertical','Base'][i],'alinhar',()=>n.alinharVarios(sel(),m),{desabilitado:vazio})).concat([cmd('hp-dist-h','Distribuir horizontal','distH',()=>n.distribuir(sel(),'h')),cmd('hp-dist-v','Distribuir vertical','distV',()=>n.distribuir(sel(),'v'))])),
   grupo('Organizar','camadas',[cmd('hp-grupo','Agrupar','camadas',()=>app.agrupar('livre'),{desabilitado:vazio,atalho:'Ctrl+G'}),cmd('hp-desgrupo','Desagrupar','camadas',()=>app.desagrupar(),{desabilitado:vazio}),cmd('hp-frente','Trazer para frente','frente',()=>n.camadaVarios(sel(),'frente'),{desabilitado:vazio}),cmd('hp-tras','Enviar para trás','tras',()=>n.camadaVarios(sel(),'tras'),{desabilitado:vazio}),cmd('hp-duplicar','Duplicar','duplicar',()=>n.duplicarVarios(sel()),{desabilitado:vazio})])
  ]),
  aba('inserir','Inserir',[
   grupo('Formas geométricas','estrela',[grande('hp-ret','Retângulo','caixa',()=>app.setFerramenta('caixa')),grande('hp-elipse','Elipse','elipse',()=>app.setFerramenta('elipse')),cmd('hp-poligono','Polígono','forma',()=>app.inserirForma('poligono')),cmd('hp-estrela','Estrela','estrela',()=>app.inserirForma('estrela')),{...sp('hp-lados','Lados / Pontas','lados',6,3,60,''),desabilitado:()=>!['poligono','estrela'].includes(unico()?.forma)}]),
   grupo('Desenho de precisão','caneta',[grande('hp-caneta','Caneta','caneta',()=>app.setFerramenta('caneta'),{atalho:'P'}),cmd('hp-nos','Editar pontos','nos',()=>app.editarSelecaoDireta(),{desabilitado:vazio}),cmd('hp-linha','Linha','linha',()=>app.setFerramenta('linha')),cmd('hp-svg-abrir','Importar SVG','abrir',()=>app.entradaSVG.click())]),
   grupo('Tipografia e interface','texto',[grande('hp-texto','Texto','texto',()=>app.setFerramenta('texto'),{atalho:'T'}),cmd('hp-botao','Botão','botao',()=>app.setFerramenta('botao')),cmd('hp-campo','Campo de texto','campo',()=>app.inserir('campo')),cmd('hp-toggle','Interruptor','toggle',()=>app.inserir('toggle'))]),
   grupo('Mídia e modelos','biblioteca',[grande('hp-imagem','Imagem','imagem',()=>app.importarImagemHP()),cmd('hp-biblioteca','Modelos','biblioteca',()=>app.mostrarFerramentaProjeto('biblioteca')),cmd('hp-icones','Ícones SVG / PNG','icone',()=>app.importarIcones()),cmd('hp-html','Importar HTML','codigo',()=>app.importarHTMLHP())])
  ]),
  aba('modificar','Modificar Formas',[
   grupo('Operações booleanas','boolUnir',[grande('hp-unir','Unir','boolUnir',()=>app.combinar('unir'),{desabilitado:()=>sel().length<2}),cmd('hp-subtrair','Subtrair','boolSubtrair',()=>app.combinar('subtrair'),{desabilitado:()=>sel().length<2}),cmd('hp-inter','Interseção','boolIntersecao',()=>app.combinar('intersecao'),{desabilitado:()=>sel().length<2}),cmd('hp-excluir','Excluir interseção','boolExcluir',()=>app.combinar('excluir'),{desabilitado:()=>sel().length<2})]),
   grupo('Caminhos','nos',[cmd('hp-vetor','Converter em vetor','caneta',()=>n.converterEmVetor(sel()),{desabilitado:vazio}),cmd('hp-simplificar','Simplificar caminho','nos',()=>app.simplificarSelecaoHP(),{desabilitado:vazio}),cmd('hp-traco','Contornar traçado','linha',()=>app.tracoEmForma(),{titulo:'Contornar traçado — exige versão desktop compilada com motor Craft',desabilitado:()=>!emJanelaNativa()||!n.podeConverterTraco(n.selecao)}),cmd('hp-craft-pontos','Adicionar pontos médios','nos',()=>app.operarCraftHP('pontos'),{desabilitado:vazio}),cmd('hp-craft-suave','Suavizar caminho','caneta',()=>app.operarCraftHP('suavizar'),{desabilitado:vazio}),cmd('hp-craft-juntar','Juntar caminhos abertos','vincular',()=>app.operarCraftHP('juntar'),{desabilitado:vazio}),cmd('hp-craft-grade','Dividir em grade','grade',()=>app.dividirGradeHP(),{desabilitado:vazio}),cmd('hp-editar','Editar nós e alças','nos',()=>app.editarSelecaoDireta(),{desabilitado:vazio})]),
   grupo('Máscaras','mascara',[cmd('hp-mask','Criar máscara','mascara',()=>app.mascara(),{desabilitado:()=>sel().length<2}),cmd('hp-unmask','Liberar máscara','mascara',()=>app.liberarMascara(),{desabilitado:vazio})]),
   grupo('Transformação','girar',[cmd('hp-girar','Girar 90°','girar',()=>n.girar(sel(),90),{desabilitado:vazio}),cmd('hp-esp-h','Espelhar horizontal','espelharH',()=>n.espelhar(sel(),'H'),{desabilitado:vazio}),cmd('hp-esp-v','Espelhar vertical','espelharV',()=>n.espelhar(sel(),'V'),{desabilitado:vazio})])
  ]),
  aba('aparencia','Design & Aparência',[
   grupo('Preenchimento e contorno','preencher',[grande('hp-fill','Preenchimento','preencher',()=>app.editarCorHP('estilo.fundo','Preenchimento'),{desabilitado:vazio}),cmd('hp-stroke','Contorno','contorno',()=>app.editarCorHP('estilo.borda','Contorno'),{desabilitado:vazio}),sp('hp-stroke-width','Espessura','estilo.larguraBorda',1,0,100)]),
   grupo('Gradientes e estilos','pincel',[cmd('hp-gradient','Gradiente linear','preencher',()=>app.gradienteHP(),{desabilitado:vazio}),cmd('hp-gradient-radial','Gradiente radial','elipse',()=>app.gradienteHP('radial'),{desabilitado:vazio}),cmd('hp-eyedrop','Conta-gotas','contaGotas',()=>app.setFerramenta('conta')),painel('hp-estilos','Estilos e camadas de cor','estilo')]),
   grupo('Transparência','efeitos',[sp('hp-opacity','Opacidade','estilo.opacidade',1,0,1,''),cmd('hp-blend','Modo de mesclagem','efeitos',()=>app.escolherMisturaHP(),{desabilitado:vazio}),painel('hp-effects','Sombras e efeitos','efeitos','efeitos')]),
   grupo('Tipografia','fonte',[leg('f-fonte'),sp('hp-font','Tamanho da fonte','estilo.tamanhoFonte',16,6,300,'pt'),cmd('hp-bold','Negrito','texto',()=>n.definirNosSelecionados({'estilo.peso':(unico()?.estilo?.peso||400)>=600?400:700},'Alternar negrito'),{desabilitado:vazio}),painel('hp-text-style','Propriedades do texto','inspetor')])
  ]),
  aba('layout','Layout Responsivo',[
   grupo('Auto Layout','camadas',[grande('hp-flex-row','Auto Layout horizontal','distH',()=>app.agrupar('linha'),{desabilitado:vazio}),cmd('hp-flex-col','Auto Layout vertical','distV',()=>app.agrupar('coluna'),{desabilitado:vazio}),cmd('hp-flex-free','Agrupamento livre','camadas',()=>app.agrupar('livre'),{desabilitado:vazio})]),
   grupo('Espaçamento','grade',[sp('hp-padding','Padding','layout.margem',0,0,200),sp('hp-gap','Gap','layout.espaco',0,0,200),painel('hp-layout-props','Alinhamento e quebra','responsivo')]),
   grupo('Dispositivos','tela',[cmd('hp-desktop','Desktop 1920 × 1080','tela',()=>app.tamanhoTelaHP(1920,1080)),cmd('hp-tablet','Tablet 768 × 1024','tablet',()=>app.tamanhoTelaHP(768,1024)),cmd('hp-mobile','Celular 390 × 844','telefone',()=>app.tamanhoTelaHP(390,844))]),
   grupo('Componentes','modelo',[cmd('hp-paineis','Painéis divididos','painelLateral',()=>n.adicionarItemConstrutor('paineis')),cmd('hp-menu','Menu','menu',()=>n.adicionarItemConstrutor('menu')),cmd('hp-ribbon','Faixa de opções','menu',()=>n.adicionarItemConstrutor('ribbon'))])
  ]),
  aba('exibir','Exibir',[
   grupo('Visualização','previa',[grande('hp-preview','Prévia interativa','previa',()=>app.setModo('previa')),cmd('hp-fullscreen','Tela cheia','telaCheia',()=>app.telaCheia()),cmd('hp-outline','Linhas / Aramado','nos',()=>app.alternarUI('hpAramado'),{atalho:'Ctrl+Y',ativo:()=>!!u.hpAramado}),cmd('hp-fit','Enquadrar conteúdo','tela',()=>app.area.enquadrarConteudo())]),
   grupo('Réguas e atração','grade',[cmd('hp-rulers','Réguas','regua',()=>app.alternarUI('reguas',true),{ativo:()=>u.reguas!==false}),cmd('hp-grid','Grade','grade',()=>app.alternarUI('grade'),{ativo:()=>!!u.grade}),cmd('hp-snap','Ajustar à grade','ima',()=>app.alternarUI('snap',true),{ativo:()=>u.snap!==false}),cmd('hp-guides-clear','Limpar guias','excluir',()=>n.limparGuias())]),
   grupo('Painéis','painelLateral',[cmd('hp-layers','Camadas','camadas',()=>app.mostrarFerramentaProjeto('camadas')),painel('hp-inspector','Propriedades','inspetor'),cmd('hp-agent','Agente','chat',()=>app.mostrarFerramentaProjeto('agente')),cmd('hp-store','Armazém','servidor',()=>app.mostrarFerramentaProjeto('armazem'))]),
   grupo('Workspace','design',[cmd('hp-ribbon-fix','Recolher / Fixar Ribbon','alfinete',()=>app.ribbon.alternarRecolhido()),cmd('hp-ui','Aparência do editor','pincel',()=>app.mostrarAparenciaHP()),cmd('hp-search','Buscar ferramentas','buscar',()=>app.barra.focarBusca(),{atalho:'Ctrl+K'})]),
   grupo('Sons','volume',[cmd('hp-abertura','Abertura com sons','bigorna',()=>app.alternarUI('abertura',true),{ativo:()=>u.abertura!==false}),cmd('hp-abertura-ver','Ver abertura','play',()=>app.verAbertura()),leg('sons')])
  ])
 ];
}
