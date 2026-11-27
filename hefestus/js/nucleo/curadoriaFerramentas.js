// Equivalência precisa de contrato funcional; nomes parecidos não autorizam mescla.
const copiar=v=>JSON.parse(JSON.stringify(v));
function estavel(v){const ordenar=x=>x&&typeof x==='object'?Array.isArray(x)?x.map(ordenar):Object.fromEntries(Object.keys(x).sort().filter(k=>x[k]!==undefined).map(k=>[k,ordenar(x[k])])):x??null;return JSON.stringify(ordenar(v));}
const estadoFuncional=p=>estavel({banco:p.bancoFerramentas,designer:p.designer,aliases:p.aliasesFerramentas||{}});
function assinaturaFerramenta(t){
 if(t.assinaturaFuncional)return estavel(t.assinaturaFuncional);
 if(t.entrada&&t.saida&&t.execucao)return estavel({entrada:t.entrada,saida:t.saida,execucao:t.execucao,efeitos:t.efeitos||[],parametros:t.parametros||{},contexto:t.contexto||{}});
 return null;
}
function compararFerramentas(a,b){
 if(a.id===b.id)return {classe:'id-repetido',motivo:'Identificador repetido precisa ser corrigido antes da composição.'};
 if(a.varianteDe===b.id||b.varianteDe===a.id||(a.familia&&a.familia===b.familia))return {classe:'variantes',motivo:'Família declarada; preservar opções e contratos distintos.'};
 const x=assinaturaFerramenta(a),y=assinaturaFerramenta(b);
 if(x&&x===y){const mesmo=estavel(a.execucao||null)===estavel(b.execucao||null)&&estavel(a.codigo||null)===estavel(b.codigo||null);return {classe:mesmo?'identicas':'equivalentes-candidatas',motivo:mesmo?'Mesmo contrato e executor declarados.':'Mesmo contrato declarado, implementações diferentes: comparar testes, efeitos e desempenho.'};}
 if(a.nome?.trim().toLowerCase()===b.nome?.trim().toLowerCase())return {classe:'revisar',motivo:'Nomes iguais não comprovam equivalência funcional.'};
 return {classe:'distintas',motivo:'Contratos diferentes ou insuficientes para equivalência.'};
}
function analisarCuradoria(ferramentas){
 if(!Array.isArray(ferramentas)||ferramentas.length>500)throw Error('Analise um lote de até 500 ferramentas.');
 const candidatos=[];
 for(let i=0;i<ferramentas.length;i++)for(let j=i+1;j<ferramentas.length;j++){const resultado=compararFerramentas(ferramentas[i],ferramentas[j]);if(resultado.classe!=='distintas')candidatos.push({a:ferramentas[i].id,b:ferramentas[j].id,...resultado});}
 return {formato:'hefestus.curadoria',versao:1,total:ferramentas.length,candidatos,limite:'Comparação declarativa. Não executa código nem comprova equivalência de algoritmos.'};
}
function aplicarCuradoria(p,decisao){
 if(decisao.aprovada!==true||!decisao.justificativa?.trim()||!Array.isArray(decisao.evidencias)||!decisao.evidencias.length)throw Error('Registre revisão, justificativa e evidências antes de unificar ferramentas.');
 const a=p.bancoFerramentas.find(t=>t.id===decisao.manter),b=p.bancoFerramentas.find(t=>t.id===decisao.substituir);
 if(!a||!b)throw Error('Selecione duas ferramentas existentes.');
 const comparacao=compararFerramentas(a,b);
 if(!['identicas','equivalentes-candidatas'].includes(comparacao.classe))throw Error('Não unificar variantes, contratos distintos ou equivalência não demonstrada.');
 const next=copiar(p);next.bancoFerramentas=next.bancoFerramentas.filter(t=>t.id!==b.id);
 for(const aba of next.designer.abas)for(const grupo of aba.grupos)for(const cmd of grupo.comandos)if(cmd.ferramentaId===b.id)cmd.ferramentaId=a.id;
 next.aliasesFerramentas={...next.aliasesFerramentas,[b.id]:a.id};
 for(const [alias,id] of Object.entries(next.aliasesFerramentas))if(id===b.id)next.aliasesFerramentas[alias]=a.id;
 next.historicoCuradoria=[...(next.historicoCuradoria||[]),{id:'curadoria_'+Date.now()+'_'+(next.historicoCuradoria?.length||0),acao:'unificar',manter:a.id,substituir:b.id,justificativa:decisao.justificativa,evidencias:copiar(decisao.evidencias),antes:copiar(p),depois:estadoFuncional(next)}];
 return next;
}
function reverterCuradoria(p){
 const evento=[...(p.historicoCuradoria||[])].reverse().find(x=>x.acao==='unificar'&&x.antes&&!p.historicoCuradoria.some(y=>y.acao==='reverter'&&y.decisao===x.id));
 if(!evento)throw Error('Nenhuma unificação disponível para reverter.');
 if(estadoFuncional(p)!==evento.depois)throw Error('O banco ou layout mudou após a curadoria; revise os conflitos antes de reverter.');
 const next=copiar(p);next.bancoFerramentas=copiar(evento.antes.bancoFerramentas);next.designer=copiar(evento.antes.designer);next.aliasesFerramentas=copiar(evento.antes.aliasesFerramentas||{});next.historicoCuradoria=[...copiar(p.historicoCuradoria),{acao:'reverter',decisao:evento.id,em:new Date().toISOString()}];return next;
}
export { assinaturaFerramenta, compararFerramentas, analisarCuradoria, aplicarCuradoria, reverterCuradoria };
