import {elementoHTMLNativo} from './elementosHTML.js';
import {classificarEntrada} from './classificarEntrada.js';
import {prepararPreviaIsolada,prepararPreviaVisualNativa} from './previaIsolada.js';
import {prepararReimportacaoHTML,aplicarReimportacaoHTML} from './reimportacaoHTML.js';
import { CATALOGO } from '../nucleo/catalogo.js';
import { CommandRegistry } from '../nucleo/comandos.js';
import { analisarHTMLNativo } from '../nucleo/htmlNativo.js';
import { validarScript } from '../nucleo/visualScript.js';
import { sincronizarObjetosForja } from '../nucleo/forjaObjetos.js';
const copiar=o=>JSON.parse(JSON.stringify(o));
function erro(codigo,msg){return Object.assign(new Error(msg),{codigo});}
/** Casos de uso compartilháveis. O Nucleo continua dono do documento e do histórico. */
export class DocumentoAtivo {
 constructor(nucleo){this.n=nucleo;this.comandos=new CommandRegistry(()=>({n:this.n}));this.comandos.registrar({id:'projeto.verificar',rotulo:'Verificar projeto',acao:()=>this.diagnosticar()});this.comandos.registrar({id:'projeto.classificar-entrada',rotulo:'Classificar entrada',acao:entrada=>this.classificarEntrada(entrada)});this.comandos.registrar({id:'projeto.preparar-importacao-universal',rotulo:'Preparar importação universal',acao:entrada=>this.prepararImportacaoUniversal(entrada)});this.comandos.registrar({id:'projeto.preparar-previa-visual',rotulo:'Preparar prévia visual aproximada',acao:entrada=>this.prepararPreviaVisual(entrada)});this.comandos.registrar({id:'projeto.preparar-previa-isolada',rotulo:'Preparar prévia segura',acao:entrada=>this.prepararPreviaIsolada(entrada)});this.comandos.registrar({id:'projeto.preservar-fonte-original',rotulo:'Preservar fonte original',acao:entrada=>this.preservarFonteOriginal(entrada)});this.comandos.registrar({id:'projeto.importar-entrada-universal',rotulo:'Importar entrada classificada',acao:entrada=>this.importarEntradaUniversal(entrada)});this.comandos.registrar({id:'projeto.importar-html-nativo',rotulo:'Importar elementos HTML',acao:entrada=>this.importarHTML(entrada)});this.comandos.registrar({id:'projeto.reimportar-html',rotulo:'Atualizar elementos HTML',acao:(plano,resolucoes)=>this.aplicarReimportacao(plano,resolucoes)});}
 get revisao(){return this.n.revisao;}
 abrir(texto){const d=JSON.parse(texto);if(d.formato==='hefestus'&&d.versao>1)throw erro('FORMATO_FUTURO','O formato deste projeto é mais recente. O original foi preservado.');this.n.abrirTexto(texto);return this.resumo();}
 resumo(){return {revisao:this.revisao,formato:'hefestus',versaoFormato:1,nome:this.n.tela.nome,elementos:this.n.elementos().length};}
 diagnosticar(){const ids=this.n.elementos().map(e=>e.id);const estrutura=this.n.auditar().map(d=>({...d,origem:'documento'}));const logica=validarScript(this.n.doc.elementos.__script,ids).map(d=>({...d,origem:'visual-script'}));return {revisao:this.revisao,diagnosticos:[...estrutura,...logica]};}
 classificarEntrada(entrada){return classificarEntrada(entrada);}
 prepararImportacaoUniversal(entrada={}){
  if(!entrada||typeof entrada!=='object'||Array.isArray(entrada))throw erro('ENTRADA_INVALIDA','Informe os dados da entrada.');
  const {nome='',mime='',conteudo=null}=entrada;
  const classificacao=classificarEntrada({nome,mime,conteudo});
  const podeConverter=classificacao.tipo==='html'&&!classificacao.divergencia&&typeof conteudo==='string'&&Boolean(conteudo.trim());
  return {classificacao,podeConverter,acao:podeConverter?'importar-html-nativo':'sem-conversao',
   revisao:this.revisao,avisos:[...classificacao.avisos,...(podeConverter?[]:['Não existe conversor nativo confirmado para esta entrada.'])]};
 }
 importarEntradaUniversal(entrada={}){
  const plano=this.prepararImportacaoUniversal(entrada);
  if(!plano.podeConverter)return {...plano,aplicado:false,motivo:'CONVERSAO_NAO_SUPORTADA'};
  return {...plano,...this.importarHTML({html:entrada.conteudo,nome:entrada.nome||'HTML nativo',
    largura:entrada.largura,altura:entrada.altura})};
 }
 prepararPreviaVisual(entrada={}){
  const plano=this.prepararImportacaoUniversal(entrada);
  if(!plano.podeConverter)throw erro('PREVIA_NAO_SUPORTADA','Prévia visual exige HTML textual compatível.');
  return prepararPreviaVisualNativa({conteudo:entrada.conteudo,nome:entrada.nome||'Prévia HTML',largura:entrada.largura,altura:entrada.altura});
 }
 prepararPreviaIsolada(entrada={}){
  const plano=this.prepararImportacaoUniversal(entrada);
  if(plano.classificacao.divergencia)throw erro('TIPO_DIVERGENTE','Confirme o formato antes de preparar a prévia.');
  return prepararPreviaIsolada({conteudo:entrada.conteudo,tipo:plano.classificacao.tipo});
 }
 preservarFonteOriginal(entrada={}){
  const plano=this.prepararImportacaoUniversal(entrada);
  if(plano.classificacao.divergencia)throw erro('TIPO_DIVERGENTE','MIME e extensão não coincidem. Confirme o formato antes de preservar.');
  if(typeof entrada.conteudo!=='string'||!entrada.conteudo.length)
   throw erro('FONTE_AUSENTE','Informe conteúdo textual não vazio.');
  const bytes=new TextEncoder().encode(entrada.conteudo).length;
  if(bytes>2*1024*1024)throw erro('FONTE_GRANDE','A fonte excede 2 MiB.');
  if(['imagem','video','audio'].includes(plano.classificacao.tipo))
   throw erro('RECURSO_BINARIO','Recursos binários exigem armazenamento próprio.');
  const temporario=copiar(this.n.doc);
  const id=this.n.novoIdEm(temporario,'container').id;
  const base=CATALOGO.container.padrao();
  const item={...base,tipo:'container',nome:entrada.nome||'Fonte original',x:0,y:0,
   largura:320,altura:180,grupo:true,importacaoNativa:{
    formato:'hefestus.fonte-preservada',versao:1,nome:entrada.nome||'',
    mime:entrada.mime||'',tipo:plano.classificacao.tipo,fonte:entrada.conteudo,
    fidelidade:'fonte-preservada',executavel:false}};
  const r=this.n.comando({texto:'Preservar fonte original sem executar',alvos:[id],
   propriedades:['*'],revisaoEsperada:plano.revisao},d=>{
    d.elementos[id]=item;sincronizarObjetosForja(d);
   });
  return {aplicado:r.acao==='aplicado',resultado:r,id:r.acao==='aplicado'?id:null,
   revisao:this.revisao,avisos:plano.avisos};
 }
 prepararHTML(entrada){const {html,nome='HTML nativo',largura=640,altura=400}=entrada;return {modelo:analisarHTMLNativo(html,{nome,largura,altura}),html,revisao:this.revisao};}
 importarHTML(entrada){const plano=this.prepararHTML(entrada),m=plano.modelo;const temporario=copiar(this.n.doc);const raiz=this.n.novoIdEm(temporario,'container').id;temporario.elementos[raiz]={};const ids={};for(const item of m.elementos){ids[item.chave]=this.n.novoIdEm(temporario,item.tipo).id;temporario.elementos[ids[item.chave]]={};}
  const root=CATALOGO.container.padrao();const novos={[raiz]:{...root,tipo:'container',nome:m.nome,x:0,y:0,largura:m.largura,altura:m.altura,grupo:true,layout:{...root.layout,modo:'livre',abracar:false,margem:0},estilo:{...root.estilo,fundo:'transparent',borda:'transparent',larguraBorda:0,raio:0},importacaoNativa:{formato:'hefestus.html-nativo',versao:1,fonte:plano.html,base:m,mapa:ids}}};let z=Math.max(0,...this.n.elementos().map(e=>e.z||0));novos[raiz].z=++z;
  for(const item of m.elementos)novos[ids[item.chave]]=elementoHTMLNativo(item,ids,raiz,++z);
  const r=this.n.comando({texto:'Importar HTML como objetos nativos',alvos:Object.keys(novos),propriedades:['*'],revisaoEsperada:plano.revisao},d=>{Object.assign(d.elementos,novos);sincronizarObjetosForja(d);});if(r.acao!=='aplicado')return {aplicado:false,resultado:r,avisos:m.avisos};this.n.selecionar(raiz);return {aplicado:true,raiz,ids,avisos:m.avisos,fidelidade:m.fidelidade,revisao:this.revisao};
 }
 prepararReimportacao(raiz,html){return prepararReimportacaoHTML(this.n,raiz,html);}
 aplicarReimportacao(plano,resolucoes={}){return aplicarReimportacaoHTML(this.n,plano,resolucoes);}
}
