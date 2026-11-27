import {analisarHTMLNativo} from '../nucleo/htmlNativo.js';
import {sincronizarObjetosForja} from '../nucleo/forjaObjetos.js';
import {elementoHTMLNativo} from './elementosHTML.js';
const copiar=o=>JSON.parse(JSON.stringify(o));
const igual=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const erro=(codigo,msg)=>Object.assign(new Error(msg),{codigo});
const ler=(o,p)=>p.split('.').reduce((x,k)=>x?.[k],o);
function folhas(o,p='',out={}){for(const [k,v]of Object.entries(o)){const c=p?p+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))folhas(v,c,out);else out[c]=v;}return out;}
function escrever(o,p,v){const ks=p.split('.');if(ks.some(k=>['__proto__','prototype','constructor'].includes(k)))throw erro('CAMINHO_RESERVADO','Propriedade reservada na reimportação.');let a=o;for(const k of ks.slice(0,-1))a=a[k]??={};a[ks.at(-1)]=copiar(v);}
export function prepararReimportacaoHTML(n,raiz,html){
 const origem=n.elemento(raiz)?.importacaoNativa;
 if(!origem)throw erro('SEM_ORIGEM','Selecione a raiz de uma importação HTML nativa.');
 const opcoes={nome:origem.base.nome,largura:origem.base.largura,altura:origem.base.altura},novo=analisarHTMLNativo(html,opcoes);
 const antes=new Map(origem.base.elementos.map(e=>[e.chave,e])),depois=new Map(novo.elementos.map(e=>[e.chave,e]));
 const adicionados=novo.elementos.filter(e=>!antes.has(e.chave)),retirados=origem.base.elementos.filter(e=>!depois.has(e.chave));
 if(adicionados.length||retirados.length){
  const anterior=analisarHTMLNativo(origem.fonte,opcoes),explicitos=new Map(anterior.elementos.map(e=>[e.chave,e.identidadeExplicita]));
  if(origem.base.elementos.some(e=>!(e.identidadeExplicita??explicitos.get(e.chave)))||novo.elementos.some(e=>!e.identidadeExplicita))
   throw erro('IDENTIDADE_ESTRUTURAL','Adições e remoções exigem id ou data-hefestus-id explícito em todos os elementos das duas fontes.');
 }
 for(const base of origem.base.elementos){const id=origem.mapa[base.chave],el=n.elemento(id);if(!el||el.origemHTML?.raiz!==raiz||el.origemHTML?.chave!==base.chave)throw erro('IDENTIDADE_ALTERADA','O objeto importado foi removido ou sua identidade mudou: '+base.chave);if(depois.has(base.chave)&&base.tipo!==depois.get(base.chave).tipo)throw erro('TIPO_ALTERADO','A fonte muda o tipo de '+base.chave+'. Importe em nova composição.');}
 const mapa=Object.fromEntries(novo.elementos.filter(e=>antes.has(e.chave)).map(e=>[e.chave,origem.mapa[e.chave]])),temporario=copiar(n.doc);
 const adicoes=adicionados.map(item=>{const id=n.novoIdEm(temporario,item.tipo).id;temporario.elementos[id]={};mapa[item.chave]=id;return {chave:item.chave,id,tipo:item.tipo,nome:item.props.nome};});
 const remocoes=retirados.map(item=>({chave:item.chave,id:origem.mapa[item.chave],tipo:item.tipo,nome:n.elemento(origem.mapa[item.chave]).nome}));
 const alteracoes=[],conflitos=[];
 for(const item of novo.elementos){if(!antes.has(item.chave))continue;const base=antes.get(item.chave),id=mapa[item.chave],el=n.elemento(id),b=folhas({...base.props,pai:base.pai?origem.mapa[base.pai]:raiz}),s=folhas({...item.props,pai:item.pai?mapa[item.pai]:raiz});
  for(const [campo,valor]of Object.entries(s)){if(igual(b[campo],valor))continue;const local=ler(el,campo),chave=item.chave+'|'+campo,delta={chave,id,campo,base:b[campo],local,fonte:valor};if(!igual(local,b[campo])&&!igual(local,valor))conflitos.push(delta);else alteracoes.push(delta);}
 }
 for(const r of remocoes)conflitos.push({chave:r.chave+'|@remover',id:r.id,campo:'remoção',tipo:'remocao',base:'Presente na fonte anterior',local:'Manter objeto local e desvincular da fonte',fonte:'Remover objeto',motivo:'A nova fonte não contém '+r.chave+'. A remoção exige escolha explícita e não pode romper referências autorais.'});
 return {raiz,revisao:n.revisao,html,novo,mapa,adicoes,remocoes,alteracoes,conflitos};
}
function validarHierarquia(doc){
 for(const [id,el]of Object.entries(doc.elementos)){if(id.startsWith('__')||!el?.tipo)continue;const vistos=new Set([id]);let pai=el.pai;while(pai){if(!doc.elementos[pai]||vistos.has(pai))throw erro('HIERARQUIA_INVALIDA','A atualização deixa uma hierarquia ausente ou circular em '+id+'. Mova ou mantenha o objeto antes de atualizar.');vistos.add(pai);pai=doc.elementos[pai].pai;}}
}
export function referenciasRemanescentes(doc,removidos){
 const refs=[],padroes=[...removidos].map(id=>[id,new RegExp('(^|[^a-zA-Z0-9_-])'+id.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&')+'(?=$|[^a-zA-Z0-9_-])')]);
 const buscar=(valor,caminho)=>{if(refs.length>=8)return;if(typeof valor==='string'){for(const [id,regex]of padroes){if(refs.length>=8)break;if(regex.test(valor))refs.push(caminho+' → '+id);}return;}if(Array.isArray(valor)){valor.forEach((x,i)=>buscar(x,caminho+'['+i+']'));return;}if(valor&&typeof valor==='object')for(const [k,v]of Object.entries(valor)){if(['importacaoNativa','origemHTML','origemHTMLAnterior'].includes(k))continue;if(removidos.has(k))refs.push(caminho+'.'+k+' → '+k);buscar(v,caminho+'.'+k);}};
 for(const [id,el]of Object.entries(doc.elementos)){
  if(id==='__script'){
   const script=copiar(el);for(const g of script.grafos??[]){g.nos=(g.nos??[]).filter(no=>!(no.origem==='designer'&&removidos.has(no.id)));g.ligacoes=(g.ligacoes??[]).filter(l=>!l.hierarquia);}buscar(script,'elementos.__script');
  }else buscar(el,'elementos.'+id);
 }
 for(const [k,v]of Object.entries(doc))if(k!=='elementos')buscar(v,k);
 return refs;
}
export function aplicarReimportacaoHTML(n,original,resolucoes={}){
 if(original.revisao!==n.revisao)throw erro('REVISAO_OBSOLETA','O documento mudou desde a comparação. Compare novamente.');
 const plano=prepararReimportacaoHTML(n,original.raiz,original.html);
 if(!resolucoes||typeof resolucoes!=='object'||Array.isArray(resolucoes)||Object.entries(resolucoes).some(([k,v])=>!plano.conflitos.some(c=>c.chave===k)||!['local','fonte'].includes(v)))throw erro('RESOLUCAO_INVALIDA','Use apenas as chaves dos conflitos e valores local ou fonte.');
 if(plano.conflitos.some(c=>!['local','fonte'].includes(resolucoes[c.chave])))throw erro('CONFLITO','Escolha Local ou Fonte para cada conflito, inclusive remoções. Nenhuma edição foi aplicada.');
 const candidato=copiar(n.doc),deltas=[...plano.alteracoes,...plano.conflitos.filter(c=>c.tipo!=='remocao'&&resolucoes[c.chave]==='fonte')];
 let z=Math.max(0,...n.elementos().map(e=>e.z||0));
 for(const a of plano.adicoes){const item=plano.novo.elementos.find(e=>e.chave===a.chave);candidato.elementos[a.id]=elementoHTMLNativo(item,plano.mapa,plano.raiz,++z);}
 for(const delta of deltas)escrever(candidato.elementos[delta.id],delta.campo,delta.fonte);
 const removidos=new Set();
 for(const r of plano.remocoes){if(resolucoes[r.chave+'|@remover']==='fonte'){removidos.add(r.id);delete candidato.elementos[r.id];}else{const el=candidato.elementos[r.id];el.origemHTMLAnterior={...el.origemHTML,motivo:'Removido da fonte; mantido localmente.'};delete el.origemHTML;}}
 const meta=candidato.elementos[plano.raiz].importacaoNativa;meta.fonte=plano.html;meta.base=plano.novo;meta.mapa=plano.mapa;
 if(removidos.size){const refs=referenciasRemanescentes(candidato,removidos);if(refs.length)throw erro('ELEMENTO_REFERENCIADO','Remoção recusada: referências remanescentes em '+refs.join('; ')+'. Mantenha local ou ajuste os vínculos e compare novamente.');}
 validarHierarquia(candidato);sincronizarObjetosForja(candidato);
 const alvos=[...new Set([plano.raiz,'__script',...deltas.map(c=>c.id),...plano.adicoes.map(a=>a.id),...plano.remocoes.map(r=>r.id)])];
 return n.comando({texto:'Atualizar HTML por comparação de três versões',alvos,propriedades:['*'],revisaoEsperada:plano.revisao,...(removidos.size?{tipo:'remover'}:{})},d=>{d.elementos=candidato.elementos;});
}
