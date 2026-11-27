// Contrato portável de temas. Só dados de interface; não recolore documentos.
export const TOKENS_TEMA = ['interface','painel','area','texto','secundario','borda','acento','selecao','cabecalho','textoCabecalho'];
const tema=(id,nome,modo,cores)=>({id,nome,modo,estimulo:id==='highContrast'?'alto-contraste':'baixo',movimentoReduzido:true,tokens:Object.fromEntries(TOKENS_TEMA.map((k,i)=>[k,cores[i]])),documento:'#FFFFFF'});
export const CATALOGO_TEMAS = {
 light:tema('light','Light','light',['#DEE1E5','#E8EAED','#C4C8CD','#202932','#4D5965','#929BA5','#225A88','#C8D9E6','#D3D8DE','#202932']),
 dark:tema('dark','Dark','dark',['#20242A','#292E35','#171B20','#E3E8EE','#B9C3CE','#758292','#91BFE5','#334B61','#1D2935','#E3E8EE']),
 dim:tema('dim','Dim','dark',['#35383D','#40444B','#292D32','#E2E6EC','#C2CAD5','#8995A5','#ACC9E5','#475F77','#303944','#E2E6EC']),
 highContrast:tema('highContrast','High Contrast','dark',['#000000','#101010','#000000','#FFFFFF','#E5E5E5','#FFFFFF','#FFFF00','#333300','#000000','#FFFFFF'])
};
export function contrasteCores(a,b){
 const lum=h=>{const rgb=h.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
 const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function validarTemaCompartilhado(t){
 const erros=[];
 if(!t||!/^[-a-zA-Z0-9_]{1,80}$/.test(t.id||''))erros.push('Identificador de tema inválido.');
 if(typeof t?.nome!=='string'||!t.nome.trim()||t.nome.length>80)erros.push('Informe um nome de até 80 caracteres.');
 if(!['light','dark'].includes(t?.modo))erros.push('Modo de tema precisa ser light ou dark.');
 for(const k of TOKENS_TEMA)if(!/^#[\da-f]{6}$/i.test(t?.tokens?.[k]||''))erros.push(`Cor inválida: ${k}. Use #RRGGBB.`);
 for(const k of ['interface','painel','area','cabecalho'])if(t?.tokens?.[k]?.toUpperCase()==='#FFFFFF')erros.push('Branco puro fica reservado ao documento: '+k);
 if(!erros.length){
  for(const [fg,bg] of [['texto','painel'],['secundario','painel'],['texto','interface'],['texto','selecao'],['textoCabecalho','cabecalho']])
   if(contrasteCores(t.tokens[fg],t.tokens[bg])<4.5)erros.push(`Contraste de texto insuficiente: ${fg}/${bg}.`);
 }
 return erros;
}
export function resolverModoSistema({escuro=false,altoContraste=false}={}){return altoContraste?'highContrast':escuro?'dark':'light';}
export function pacoteTemas(temas){return {formato:'hefestus.temas',versao:1,padrao:'automatico',politica:{interfaceSemBrancoPuro:true,documentoPreservado:true,movimentoReduzido:true},temas:temas.map(t=>JSON.parse(JSON.stringify(t)))};}
