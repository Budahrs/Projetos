// Métricas locais de interação; nunca armazenam texto do documento.
function registrarMetricaRibbon(ui,id,ok,ms){
 const banco=ui.metricasRibbon??={};const antes=banco[id]||{chamadas:0,sucessos:0,falhas:0,totalMs:0};
 banco[id]={chamadas:antes.chamadas+1,sucessos:antes.sucessos+(ok?1:0),falhas:antes.falhas+(ok?0:1),totalMs:antes.totalMs+Math.max(0,ms),ultimaEm:Date.now()};
 const ids=Object.keys(banco);if(ids.length>200)for(const k of ids.sort((a,b)=>banco[a].ultimaEm-banco[b].ultimaEm).slice(0,ids.length-200))delete banco[k];
 return banco[id];
}
function medirAcaoRibbon(acao,registrar,relogio=()=>globalThis.performance?.now?.()??Date.now()){
 const inicio=relogio();let resultado;
 try{resultado=acao();}catch(err){registrar(false,relogio()-inicio);throw err;}
 if(resultado&&typeof resultado.then==='function')return Promise.resolve(resultado).then(value=>{registrar(true,relogio()-inicio);return value;},err=>{registrar(false,relogio()-inicio);throw err;});
 registrar(true,relogio()-inicio);return resultado;
}
function exportarMetricasRibbon(ui){return {formato:'hefestus.metricas-ribbon',versao:1,exportadoEm:new Date().toISOString(),escopo:'Chamadas e retorno dos handlers de interface; não comprova resultado de uma operação externa. Sem conteúdo de documentos.',interacoes:JSON.parse(JSON.stringify(ui.interacoesFaixa||{})),comandos:JSON.parse(JSON.stringify(ui.metricasRibbon||{}))};}
export { registrarMetricaRibbon, medirAcaoRibbon, exportarMetricasRibbon };
