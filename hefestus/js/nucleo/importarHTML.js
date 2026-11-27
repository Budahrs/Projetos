/** HTML é preservado como artefato isolado, sem avaliar o código durante a importação. */
function analisarHTMLImportado(html='') {
  const texto=String(html),semBlocos=texto.replace(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'');
  const contar=tag=>(semBlocos.match(new RegExp('<'+tag+'\\b','gi'))??[]).length;
  const movimento={radios:(semBlocos.match(/<input\b[^>]*type\s*=\s*['"]radio['"]/gi)??[]).length,transicoesCSS:/\btransition\s*:/i.test(texto),estadosCSS:/:checked\b/i.test(texto),animacaoAutomaticaCSS:/\banimation(?:-name)?\s*:/i.test(texto),temporizadorJS:/\bset(?:Interval|Timeout)\s*\(/.test(texto)};
  return {titulo:(texto.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]??'').replace(/<[^>]*>/g,'').trim(),botoes:contar('button'),menus:contar('nav'),links:contar('a'),campos:contar('input')+contar('textarea')+contar('select'),svg:contar('svg'),estilos:(texto.match(/<style\b/gi)??[]).length,scripts:(texto.match(/<script\b/gi)??[]).length,eventos:[...new Set([...texto.matchAll(/addEventListener\s*\(\s*['"]([^'"]+)['"]/g)].map(m=>m[1]))],recursosExternos:[...new Set([...texto.matchAll(/https?:\/\/[^\s'"<>)]+/g)].map(m=>m[0]).filter(u=>u!=='http://www.w3.org/2000/svg'))].slice(0,30),...movimento,modo:'componente-html-isolado'};
}
function prepararHTMLImportado({html='',css='',js='',nome='',largura=640,altura=400,online=false}={}) {
  if(typeof html!=='string'||!html.trim())throw new Error('Cole o HTML do artefato.');
  if(typeof css!=='string'||typeof js!=='string')throw new Error('CSS e JavaScript devem ser texto.');
  if(new TextEncoder().encode(html+css+js).length>2*1024*1024)throw new Error('O código deve ter até 2 MB.');
  const dimensao=v=>{const n=Number(v);if(!Number.isFinite(n)||n<80||n>4000)throw new Error('Largura e altura devem ficar entre 80 e 4000 px.');return Math.round(n);};
  return {nome:(String(nome).trim()||analisarHTMLImportado(html).titulo||'Artefato HTML').slice(0,100),largura:dimensao(largura),altura:dimensao(altura),codigo:{html,css,js,isolado:true,recursosExternos:online===true,formato:'hefestus-html',versao:1,analise:analisarHTMLImportado(html)}};
}

/** Autocontido: o iframe recebe o documento inteiro, incluindo scripts inline e estilos. */
function documentoHTMLImportado(codigo,{executar=false}={}) {
  const online=executar&&codigo.recursosExternos===true;
  const remoto=online?' https:':'';
  const csp=`default-src 'none'; script-src ${executar?"'unsafe-inline'"+remoto:"'none'"}; style-src 'unsafe-inline'${remoto}; img-src data: blob:${remoto}; font-src data:${remoto}; connect-src ${online?'https: wss:':"'none'"}; media-src data: blob:${remoto}; frame-src 'self' about: blob: data:; object-src 'none'; base-uri 'none'; form-action 'none'`;
  const css=String(codigo.css??'').replace(/<\/style/gi,'<\\/style');
  const js=String(codigo.js??'').replace(/<\/script/gi,'<\\/script');
  const ponte=`document.addEventListener('click',()=>parent.postMessage({tipo:'hefestus:html-evento',evento:'onClick'},'*'),true);document.addEventListener('change',()=>parent.postMessage({tipo:'hefestus:html-evento',evento:'onChange'},'*'));document.addEventListener('focusin',()=>parent.postMessage({tipo:'hefestus:html-evento',evento:'onFocus'},'*'));document.addEventListener('hefestus:sinal',e=>{if(typeof e.detail?.sinal==='string')parent.postMessage({tipo:'hefestus:html-sinal',sinal:e.detail.sinal},'*');});`;
  const fundo = codigo.preservarFundoPagina === true ? '' : '<style data-hefestus-fundo>html,body{background:transparent!important;background-image:none!important}</style>';
  return '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="'+csp+'"><style>html,body{margin:0;min-height:100%;box-sizing:border-box}'+css+'</style>'+(executar?'<script>'+ponte+'<\/script>':'')+String(codigo.html??'')+fundo+(executar&&js?'\n<script>const raiz=document.body;\n'+js+'\n<\/script>':'');
}
export { analisarHTMLImportado, prepararHTMLImportado, documentoHTMLImportado };
