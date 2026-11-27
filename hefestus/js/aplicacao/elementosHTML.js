import {CATALOGO} from '../nucleo/catalogo.js';
const copiar=o=>JSON.parse(JSON.stringify(o));
export function elementoHTMLNativo(item,ids,raiz,z){
 const padrao=CATALOGO[item.tipo].padrao();
 return {...padrao,...copiar(item.props),tipo:item.tipo,z,pai:item.pai?ids[item.pai]:raiz,estilo:{...padrao.estilo,...copiar(item.props.estilo)},origemHTML:{raiz,chave:item.chave},...(item.tipo==='container'?{grupo:true,layout:{...padrao.layout,modo:'livre',abracar:false,margem:0}}:{})};
}
