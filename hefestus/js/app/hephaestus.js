import { mostrarEngenhariaIntegrada } from '../ui/engenhariaIntegrada.js';
import { adicionarPontosCraft, suavizarCraft, removerRedundantesCraft, juntarCaminhosCraft, dividirGradeCraft } from "../nucleo/craft/caminhos.js";
import { h, avisar } from '../ui/dom.js';
import { NOS } from '../nucleo/visualScript.js';
import { MODOS_MISTURA } from '../nucleo/estiloAvancado.js';
import { gerarSVGDesigner } from '../nucleo/designerHephaestus.js';
import { abrirImportacaoHTML } from '../ui/importarHTML.js';
import { abrirOpcoesTemas } from '../ui/opcoesTemas.js';
import { lerCaminho } from '../nucleo/vetor.js';
import { mostrarAbertura } from '../ui/abertura.js';
export class HephaestusApp {
 mostrarEngenharia(){return mostrarEngenhariaIntegrada(this); }
 verAbertura() { return mostrarAbertura({sons:this.ui.sons!==false,reduzirMovimento:!!this.ui.reduzirMovimento}); }
 exemploHephaestus() {
  const n=this.n;
  n.definir("__canvas",{nome:"Identidade visual",largura:1280,altura:720,fundo:"#f4efe6"},"Documento de exemplo Hephaestus");
  const tit=n.criar("texto",90,200,{nome:"Título",texto:"FORJE SUAS\nIDEIAS",largura:620,altura:160,estilo:{fundo:"transparent",cor:"#202c39",tamanhoFonte:60,peso:700,fonte:"sistema",entrelinha:1.05}});
  n.criar("texto",94,390,{nome:"Subtítulo",texto:"Design, vetores e lógica\nno mesmo lugar.",largura:540,altura:80,estilo:{fundo:"transparent",cor:"#536170",tamanhoFonte:25,peso:400,fonte:"sistema"}});
  n.criar("texto",92,100,{nome:"Marca",texto:"HEPHAESTUS 2.1",largura:450,altura:40,estilo:{fundo:"transparent",cor:"#a77028",tamanhoFonte:20,peso:700,fonte:"sistema"}});
  const caminho=lerCaminho("M780 260 L1130 260 L1080 325 L995 345 L995 445 L1070 480 L1070 515 L830 515 L830 480 L900 445 L900 345 L850 325 Z M835 210 L1080 210 L1080 247 L835 247 Z");
  const emblema=n.criarVetor(caminho,{texto:"Emblema vetorial",estilo:{fundo:"#bc8a43",cor:"#17202a",borda:"#8c642d",larguraBorda:2,opacidade:1}});
  n.definir(emblema,{nome:"Emblema"},"Nome do emblema");
  const botao=n.criar("botao",94,520,{nome:"Botão Iniciar",rotulo:"Iniciar  →",largura:250,altura:56,eventos:[],estilo:{fundo:"#bc8a43",cor:"#17202a",borda:"#9e6a2b",larguraBorda:1,raio:7,tamanhoFonte:22,peso:600,fonte:"sistema"}});
  n.comando({texto:"Ligar exemplo no Visual Script",alvos:["__script"],propriedades:["*"]},d=>{
   const g=d.elementos.__script.grafos.find(g=>g.origem==="designer");
   g.nos.forEach((x,i)=>{x.x=(i%3)*340;x.y=420+Math.floor(i/3)*260;});
   const b=g.nos.find(x=>x.id===botao);b.x=0;b.y=0;
   g.nos.push({id:"exemplo-efeito",tipo:"ui.efeito",x:360,y:0,v:{alvo:emblema,efeito:"pulsar",ms:500,repetir:1}},{id:"exemplo-aviso",tipo:"ui.aviso",x:720,y:0,v:{texto:"Bem-vindo ao Hephaestus!",ms:2200}});
   g.ligacoes.push({id:"exemplo-l1",de:botao,sp:"exec",para:"exemplo-efeito",ep:"exec"},{id:"exemplo-l2",de:"exemplo-efeito",sp:"exec",para:"exemplo-aviso",ep:"exec"});
  });
  n.projeto.historico=[];n.projeto.cursor=0;n.selecionar(botao);n.sujo=false;
 }
 novoExemploHP(){this.confirmarDescartar("Abrir exemplo Hephaestus",()=>{this.n.novo();this.exemploHephaestus();this.setModo("designer");requestAnimationFrame(()=>this.area.enquadrarConteudo());});}
 adicionarNo(tipo) {
  if(!NOS[tipo])throw new Error('Nó indisponível: '+tipo);
  if(!this.ui.hibrido)this.setModo('visual-script');
  const no=this.estudio.criarNo(tipo,...this.estudio.centroVisivel(),{...(NOS[tipo].ent.some(p=>p.id==='alvo')&&this.n.selecao?{alvo:this.n.selecao}:{})});
  this.estudio.render();return no;
 }
 editarSelecaoDireta(){if(!this.n.selecao)return this.mensagem('Selecione uma forma para editar seus pontos.');return this.editarNos(this.n.selecao);}
 colarNaCamada(onde){const ids=this.colarSelecao(true);this.n.camadaVarios(this.n.selecionados(),onde);return ids;}
 mostrarFerramentaProjeto(nome){
  if(this.ui.hibrido && ['historico','agente','biblioteca'].includes(nome)){this.estudio.abrirAba(nome==='biblioteca'?'modelos':nome);return;}
  if(this.ui.hibrido)this.setModo('designer');
  this.ui.esq=nome;this.salvarUI();this.render();
 }
 importarHTMLHP(){abrirImportacaoHTML(this);}
 mostrarAparenciaHP(){abrirOpcoesTemas(this);}
 tamanhoTelaHP(largura,altura){this.n.definir('__canvas',{largura,altura},`Tela ${largura} × ${altura}`);}
 novoDocumentoHP(){
  const presets=[['Apresentação 16:9',1920,1080],['Apresentação 4:3',1024,768],['A4 — 96 px/pol.',794,1123],['Web Desktop',1440,900],['Celular',390,844]];
  const escolha=h('select',{'aria-label':'Predefinição do documento'},presets.map(([rot],i)=>h('option',{value:String(i)},rot)));
  this.dialogo({titulo:'Novo documento Hephaestus',icone:'novo',corpo:h('label',{},'Predefinição ',escolha),opcoes:[{id:'criar',rotulo:'Criar documento',primario:true,fazer:()=>this.confirmarDescartar('Novo documento',()=>{this.n.novo();const p=presets[Number(escolha.value)];this.n.definir('__canvas',{nome:'Documento sem título',largura:p[1],altura:p[2]},'Definir documento');this.setModo('designer');this.area.enquadrarConteudo();})},{id:'cancelar',rotulo:'Cancelar',fazer:()=>{}}]});
 }
 editarCorHP(campo,titulo){
  const e=this.n.selecionado();if(!e)return;
  const valor=campo.split('.').reduce((v,k)=>v?.[k],e);
  const input=h('input',{type:'color',value:/^#[0-9a-f]{6}$/i.test(valor||'')?valor:'#c18b43','aria-label':titulo});
  this.dialogo({titulo,icone:'preencher',corpo:input,opcoes:[{id:'aplicar',rotulo:'Aplicar',primario:true,fazer:()=>this.n.definirNosSelecionados({[campo]:input.value,...(campo==='estilo.fundo'?{'estilo.preenchimentos':[]}:{} )},titulo)},{id:'cancelar',rotulo:'Cancelar',fazer:()=>{}}]});
 }
 gradienteHP(tipo='linear'){
  if(!this.n.selecionados().length)return;
  const a=h('input',{type:'color',value:'#d6a253','aria-label':'Cor inicial'}),b=h('input',{type:'color',value:'#303b4a','aria-label':'Cor final'}),angulo=h('input',{type:'number',value:90,min:0,max:360,'aria-label':'Ângulo'});
  this.dialogo({titulo:'Gradiente '+tipo,icone:'preencher',corpo:h('div',{class:'hp-dialog-controls'},h('label',{},'Início ',a),h('label',{},'Fim ',b),h('label',{},'Ângulo ',angulo)),opcoes:[{id:'aplicar',rotulo:'Aplicar',primario:true,fazer:()=>this.n.definirNosSelecionados({'estilo.preenchimentos':[{tipo,visivel:true,opacidade:1,angulo:Number(angulo.value),cor:a.value,paradas:[{pos:0,cor:a.value,alfa:1},{pos:100,cor:b.value,alfa:1}]}]},'Aplicar gradiente '+tipo)},{id:'cancelar',rotulo:'Cancelar',fazer:()=>{}}]});
 }
 escolherMisturaHP(){
  const e=this.n.selecionado();if(!e)return;
  const select=h('select',{'aria-label':'Modo de mesclagem'},MODOS_MISTURA.map(([id,rot])=>h('option',{value:id,selected:id===(e.estilo?.mistura||'normal')},rot)));
  this.dialogo({titulo:'Modo de mesclagem',icone:'efeitos',corpo:select,opcoes:[{id:'aplicar',rotulo:'Aplicar',primario:true,fazer:()=>this.n.definirNosSelecionados({'estilo.mistura':select.value},'Modo de mesclagem')},{id:'cancelar',rotulo:'Cancelar',fazer:()=>{}}]});
 }
 importarImagemHP(){
  const input=h('input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif'});
  input.onchange=async()=>{
   const arquivo=input.files[0];if(!arquivo)return;
   if(arquivo.size>25*1024*1024){avisar('Escolha uma imagem de até 25 MB.','alerta');return;}
   try{
    const url=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('Falha ao ler a imagem.'));r.readAsDataURL(arquivo);});
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Imagem inválida.'));i.src=url;});
    const escala=Math.min(1,800/img.naturalWidth,600/img.naturalHeight);
    this.n.criar('caixa',undefined,undefined,{nome:arquivo.name,largura:Math.round(img.naturalWidth*escala),altura:Math.round(img.naturalHeight*escala),imagem:{url,largura:img.naturalWidth,altura:img.naturalHeight,nome:arquivo.name},estilo:{fundo:'transparent',borda:'transparent',larguraBorda:0,raio:0,preenchimentos:[{tipo:'imagem',url,visivel:true,opacidade:1,ajuste:'conter'}]}});
   }catch(e){avisar(e.message,'alerta');}
  };input.click();
 }
 operarCraftHP(operacao) {
  const id=this.n.selecao,e=this.n.elemento(id);if(!e)return;
  if(e.travado)return this.mensagem('Desbloqueie o objeto antes de editar seu caminho.');
  if(e.tipo!=="forma"||e.forma!=="vetor")return this.mensagem('Converta a seleção em vetor antes desta operação.');
  const cs=this.n.contornosDoVetor(id),fn={pontos:adicionarPontosCraft,suavizar:suavizarCraft,redundantes:removerRedundantesCraft,juntar:juntarCaminhosCraft}[operacao];
  if(!fn)throw new Error('Operação Craft desconhecida.');
  const novo=fn(cs);
  if(JSON.stringify(cs)===JSON.stringify(novo))return this.mensagem('O caminho já está sem alterações aplicáveis.');
  return this.n.definirVetor(id,novo,'Craft: '+{pontos:'Adicionar pontos médios',suavizar:'Suavizar caminho',redundantes:'Remover pontos redundantes',juntar:'Juntar caminhos abertos'}[operacao]);
 }
 dividirGradeHP(){
  const id=this.n.selecao,e=this.n.elemento(id);if(!e||e.travado)return this.mensagem('Selecione um objeto desbloqueado.');
  const linhas=h('input',{type:'number',min:1,max:100,value:2,'aria-label':'Linhas'}),colunas=h('input',{type:'number',min:1,max:100,value:2,'aria-label':'Colunas'}),gap=h('input',{type:'number',min:0,max:200,value:8,'aria-label':'Espaçamento'});
  this.dialogo({titulo:'Craft · Dividir em grade',icone:'grade',corpo:h('div',{class:'hp-dialog-controls'},h('p',{},'Substitui a geometria do objeto por retângulos em um caminho composto; preserva sua identidade e conexões.'),h('label',{},'Linhas',linhas),h('label',{},'Colunas',colunas),h('label',{},'Espaçamento (px)',gap)),opcoes:[{id:'cancelar',rotulo:'Cancelar',fazer:()=>{}},{id:'aplicar',rotulo:'Aplicar',primario:true,fazer:()=>{
   const atual=this.n.elemento(id);if(!atual||atual.travado)return;const cs=dividirGradeCraft(atual,+linhas.value,+colunas.value,+gap.value);if(!cs.length){this.mensagem('A grade não cabe: confira as medidas e o espaçamento.');return;}
   this.n.definirVetor(id,cs,'Craft: Dividir em grade');
  }}]});
 }
 simplificarSelecaoHP(){return this.operarCraftHP('redundantes');}
 async baixarSVG(){const r=gerarSVGDesigner(this.n.doc);await this.n.baixar(this.n.slug()+'.svg',r.svg,'image/svg+xml');if(r.avisos.length)avisar(`${r.avisos.length} objetos HTML sem representação vetorial; use também a exportação HTML para manter a interface completa.`,'alerta');}
 mostrarCapacidades(){
  this.dialogo({titulo:'Hephaestus 2.1 — capacidades',icone:'info',corpo:h('div',{class:'hp-capacidades'},h('h3',{},'Disponível nesta versão'),h('p',{},'Designer e Visual Script exclusivos, Ribbon por workspace, vetores Bézier, cinco ferramentas adaptadas do Craft, formas paramétricas, booleanas, máscaras, gradientes lineares/radiais, imagens incorporadas, Auto Layout, objetos/nós sincronizados, execução e depuração, SVG e HTML. Comandos anteriores continuam na busca.'),h('h3',{},'Motores ainda pendentes'),h('p',{},'Múltiplas pranchetas/slides, texto em caminho, Image Trace, gradiente livre e mesh, Shape Builder por arraste, faca/tesoura, extrusão 3D, Morph vetorial, CMYK/ICC de impressão e exportações nativas AI, PPTX e C#. Nenhum desses recursos é apresentado como concluído.'),h('p',{},'React, Vue e Web Component exportam a interface e sinais; o interpretador Visual Script completo está no HTML funcional. Os formatos .hefestus anteriores continuam compatíveis.')),opcoes:[{id:'fechar',rotulo:'Fechar',fazer:()=>{}}]});
 }
}
