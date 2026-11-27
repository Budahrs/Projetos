import {analisarHTMLNativo} from '../nucleo/htmlNativo.js';
/**
 * Contrato de prévia de conteúdo não confiável.
 * Retorna apenas descritor. O host é responsável por criar iframe sandboxed,
 * com CSP isolada e sem acesso ao documento do editor.
 */
const MAX_BYTES=2*1024*1024;
const CSP="default-src 'none'; img-src data:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'; connect-src 'none'; script-src 'none'; object-src 'none'; frame-src 'none'";
function escapar(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
export function prepararPreviaIsolada({conteudo,tipo='html'}={}){
 if(typeof conteudo!=='string')throw new TypeError('Conteúdo da prévia deve ser texto.');
 if(new TextEncoder().encode(conteudo).length>MAX_BYTES)throw new RangeError('Prévia excede 2 MiB.');
 if(!['html','css','javascript','json','svg','desconhecido'].includes(tipo))
  throw new TypeError('Tipo de prévia não suportado.');
 // Não interpretar HTML ou SVG não confiável. Exibir fonte escapada como texto.
 const texto=escapar(conteudo);
 const srcdoc='<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+escapar(CSP)+'"><title>Prévia isolada</title><style>body{font:13px/1.5 monospace;margin:16px;overflow-wrap:anywhere;background:#f4f5f7;color:#24262a}pre{white-space:pre-wrap}</style></head><body><pre>'+texto+'</pre></body></html>';
 return {tipo,modo:'codigo-seguro',srcdoc,sandbox:'',politicaConteudo:CSP,
  permiteScripts:false,permiteFormularios:false,permiteRede:false,
  aviso:'Prévia de código-fonte, não renderização visual. O host deve manter sandbox sem permissões.'};
}

/**
 * Visualização aproximada gerada exclusivamente do modelo nativo limitado.
 * Nunca insere HTML/CSS/JS original no documento de prévia.
 */
export function prepararPreviaVisualNativa({conteudo,nome='Prévia HTML',largura=640,altura=400}={}){
 const modelo=analisarHTMLNativo(conteudo,{nome,largura,altura});
 const dimensao=n=>Math.max(0,Math.min(4000,Number.isFinite(n)?n:0));
 const cor=s=>typeof s==='string'&&(/^(?:#[0-9a-f]{6}|transparent)$/i.test(s))?s:'transparent';
 const caixas=modelo.elementos.map(item=>{
  const p=item.props,e=p.estilo||{},tipo=item.tipo;
  const css='position:absolute;box-sizing:border-box;overflow:hidden;'+
   'left:'+dimensao(p.x)+'px;top:'+dimensao(p.y)+'px;'+
   'width:'+dimensao(p.largura)+'px;height:'+dimensao(p.altura)+'px;'+
   'background:'+cor(e.fundo)+';color:'+cor(e.cor)+';'+
   'border:'+dimensao(e.larguraBorda)+'px solid '+cor(e.borda)+';'+
   'border-radius:'+dimensao(e.raio)+'px;font-size:'+dimensao(e.tamanhoFonte)+'px;';
  const rotulo=tipo==='texto'?p.texto:tipo==='botao'?p.rotulo:tipo==='campo'?p.placeholder||p.valor:'';
  return '<div style="'+css+'">'+escapar(rotulo||'')+'</div>';
 }).join('');
 const srcdoc='<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+escapar(CSP)+'"><style>body{margin:0;font-family:Arial,sans-serif;background:#f4f5f7}main{position:relative;overflow:hidden}</style></head><body><main style="width:'+dimensao(modelo.largura)+'px;height:'+dimensao(modelo.altura)+'px">'+caixas+'</main></body></html>';
 return {modo:'visual-aproximado',srcdoc,sandbox:'',politicaConteudo:CSP,
  permiteScripts:false,permiteRede:false,avisos:modelo.avisos,
  fidelidade:modelo.fidelidade,
  aviso:'Prévia aproximada de objetos suportados; não renderiza a página original. O host deve usar iframe sandbox sem permissões.'};
}
