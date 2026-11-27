// Motor local de tabelas: sem SQL arbitrário ou conexão com bancos externos.
function lerCSV(texto){
 if(typeof texto!=='string'||texto.length>10000000)throw Error('CSV limitado a 10 MB.');
 texto=texto.replace(/^\uFEFF/,'');const primeira=texto.split(/\r?\n/)[0],sep=(primeira.match(/;/g)||[]).length>(primeira.match(/,/g)||[]).length?';':',';
 const linhas=[];let linha=[],campo='',aspas=false;
 for(let i=0;i<texto.length;i++){const c=texto[i];if(c==='"'){if(aspas&&texto[i+1]==='"'){campo+='"';i++;}else if(aspas||campo==='')aspas=!aspas;else throw Error('Aspas em posição inválida.');}
 else if(c===sep&&!aspas){linha.push(campo);campo='';}else if((c==='\n'||c==='\r')&&!aspas){if(c==='\r'&&texto[i+1]==='\n')i++;linha.push(campo);if(linha.some(x=>x!==''))linhas.push(linha);linha=[];campo='';}else campo+=c;
 if(linhas.length>20001||linha.length>100)throw Error('Limite de 20 mil linhas e 100 colunas.');}
 if(aspas)throw Error('Campo entre aspas não foi fechado.');linha.push(campo);if(linha.some(x=>x!==''))linhas.push(linha);
 const cab=linhas.shift()?.map(x=>x.trim());if(!cab?.length||cab.some(x=>!x)||new Set(cab).size!==cab.length)throw Error('Cabeçalhos vazios ou repetidos.');
 if(cab.length>100)throw Error('Máximo de 100 colunas.');return linhas.map((l,i)=>{if(l.length!==cab.length)throw Error('Número de colunas divergente na linha '+(i+2));return Object.fromEntries(cab.map((k,j)=>[k,l[j]]));});
}
function validarTabela(linhas){if(!Array.isArray(linhas)||linhas.length>20000||linhas.some(x=>!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length>100||Object.values(x).some(v=>v!=null&&!['string','number','boolean'].includes(typeof v))))throw Error('Use uma lista de até 20 mil registros com valores simples.');return linhas;}
function calcularIndicador(linhas,coluna,operacao='contagem'){
 validarTabela(linhas);if(!['contagem','soma','media','minimo','maximo'].includes(operacao))throw Error('Operação inválida.');
 const valores=linhas.map(l=>l[coluna]).filter(v=>v!==''&&v!=null).map(v=>typeof v==='number'?v:Number(String(v).replace(',','.'))).filter(Number.isFinite);
 let valor=null;if(operacao==='contagem')valor=linhas.length;else if(valores.length){if(operacao==='soma'||operacao==='media'){valor=valores.reduce((a,b)=>a+b,0);if(operacao==='media')valor/=valores.length;}else valor=valores.reduce((a,b)=>operacao==='minimo'?Math.min(a,b):Math.max(a,b));}
 return {valor,operacao,coluna,linhas:linhas.length,amostrasNumericas:valores.length,calculadoEm:new Date().toISOString()};
}
function agruparIndicador(linhas,grupo,coluna,operacao){const grupos=new Map();for(const l of linhas){const k=String(l[grupo]??'(vazio)');if(!grupos.has(k))grupos.set(k,[]);grupos.get(k).push(l);}if(grupos.size>1000)throw Error('Agrupamento limitado a mil categorias.');return [...grupos].map(([nome,lista])=>({grupo:nome,...calcularIndicador(lista,coluna,operacao)}));}
function exportarCSV(linhas){validarTabela(linhas);const cab=[...new Set(linhas.flatMap(Object.keys))],celula=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return '\uFEFF'+[cab.map(celula).join(';'),...linhas.map(l=>cab.map(k=>celula(l[k])).join(';'))].join('\r\n');}
export { lerCSV, validarTabela, calcularIndicador, agruparIndicador, exportarCSV };
