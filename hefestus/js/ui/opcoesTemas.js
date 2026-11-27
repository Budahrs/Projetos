import { contrasteCores } from "../nucleo/temasCompartilhados.js";
import { gerarAdaptadoresTemas } from "../nucleo/adaptadoresTemas.js";
import { h } from "./dom.js";
import { TEMAS_UI, salvarTemaUsuario, importarTemasUsuario, exportarTemas } from "./temas.js";
function abrirOpcoesTemas(app){
 const base=TEMAS_UI[app.ui.temaUI]?.contrato||TEMAS_UI.light.contrato;
 const nome=h('input',{value:'Meu tema',maxlength:80,'aria-label':'Nome do tema'});
 let origemReferencia=null;
 const campos={};const labels={interface:'Fundo da interface',painel:'Painéis e menus',area:'Área de trabalho',texto:'Texto principal',secundario:'Texto secundário',borda:'Bordas',acento:'Destaque',selecao:'Seleção',cabecalho:'Cabeçalho',textoCabecalho:'Texto do cabeçalho'};
 const msg=h('p',{role:'status','aria-live':'polite'},'As cores do documento não são alteradas. O tema precisa manter contraste legível.');
 const cores=h('div',{class:'temas-editar-cores'},Object.entries(labels).map(([k,label])=>{const input=h('input',{type:'color',value:base.tokens[k],'aria-label':label});campos[k]=input;return h('label',{},label,input);}));
 const guardar=()=>{try{
  const t={...base,id:'user_'+Date.now(),nome:nome.value.trim(),tokens:Object.fromEntries(Object.entries(campos).map(([k,el])=>[k,el.value])),origem:origemReferencia??'criado pelo usuário',movimentoReduzido:true};
  const id=salvarTemaUsuario(t);app.definirTemaUI(id);msg.textContent=id===t.id?'Tema salvo e aplicado. Está disponível no seletor e na exportação.':'Tema equivalente já disponível: aplicado sem criar duplicata.';
 }catch(err){msg.textContent=err.message;}};
 const importar=h('input',{type:'file',accept:'.json,application/json',hidden:true,onchange:async e=>{try{
  const file=e.target.files[0];if(!file)return;const p=JSON.parse(await file.text());
  const r=importarTemasUsuario(p,file.name);app.render();msg.textContent=r.adicionados+' temas adicionados; '+r.reutilizados+' equivalentes reutilizados. Temas internos preservados.';
 }catch(err){msg.textContent=err.message;}}});
 const referencia=h('input',{type:'file',accept:'.css,.html,.svg,.txt','aria-label':'Extrair cores de referência',onchange:async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>1000000)throw Error('Referência limitada a 1 MB.');const texto=await f.text(),contagem=new Map();for(const m of texto.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-f])/ig)){let c=m[1];if(c.length===3)c=[...c].map(v=>v+v).join('');c='#'+c.toUpperCase();contagem.set(c,(contagem.get(c)||0)+1);}const candidatas=[...contagem].sort((a,b)=>b[1]-a[1]).map(([c])=>c);if(!candidatas.length)throw Error('Nenhuma cor hexadecimal encontrada.');const fundo=candidatas.find(c=>c!=='#FFFFFF'&&contrasteCores(c,base.tokens.texto)>=4.5);if(fundo)campos.interface.value=fundo;const destaque=candidatas.find(c=>c!=='#FFFFFF'&&c!=='#000000');if(destaque)campos.acento.value=destaque;nome.value='Referência '+f.name.slice(0,50);origemReferencia='Tokens extraídos de '+f.name+'; adaptação revisável, não importação completa do tema.';msg.textContent=candidatas.length+' cores encontradas. Fundo e destaque sugeridos; revise antes de salvar. A validação de contraste continua ativa.';}catch(err){msg.textContent=err.message;}}});
 const corpo=h('div' ,{class:'opcoes-temas'},h('label',{},'Nome do tema',nome),cores,msg,h('label',{},'Extrair cores de CSS/HTML/SVG ',referencia),
  h('button',{class:'bt',type:'button',onclick:guardar},'Salvar e aplicar tema'),
  h('button',{class:'bt',type:'button',onclick:()=>app.baixarJSON(exportarTemas(),'temas-hefestus.json')},'Exportar catálogo compartilhável'),
  h('button',{class:'bt',type:'button',onclick:()=>app.baixarJSON(gerarAdaptadoresTemas(exportarTemas()),'adaptadores-temas.arquivos.json')},'Exportar adaptadores web, Tk e WPF'),
  h('button',{class:'bt',type:'button',onclick:()=>importar.click()},'Importar temas'),importar);
 app.dialogo({titulo:'Opções de temas',icone:'tema',texto:'Crie uma variação confortável. Light, Dark, Dim e High Contrast continuam disponíveis; System acompanha o sistema.',corpo,opcoes:[{id:'fechar',rotulo:'Fechar',fazer:()=>{}}]});
}
export { abrirOpcoesTemas };
