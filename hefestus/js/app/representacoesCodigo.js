import {NOS} from '../nucleo/visualScript.js';
export const VISOES_CODIGO = ['blocos','grafo','fonte'];
export function normalizarVisaoCodigo(valor){return VISOES_CODIGO.includes(valor)?valor:'grafo';}
export function definirVisaoCodigo(ui,valor){ui.codigoVisao=normalizarVisaoCodigo(valor);return ui.codigoVisao;}
/** Projeção sem cópia autoral: cada bloco preserva identidade, tipo e todas as conexões. */
export function projetarBlocos(grafo){return (grafo?.nos??[]).map(no=>({no,entradas:(grafo.ligacoes??[]).filter(l=>l.para===no.id),saidas:(grafo.ligacoes??[]).filter(l=>l.de===no.id)}));}

export function aplicarValoresBloco(n,gid,nid,valores,revisaoEsperada){
 const no=n.doc.elementos.__script?.grafos.find(g=>g.id===gid)?.nos.find(x=>x.id===nid),def=NOS[no?.tipo];
 if(!no||!def)throw Error('O bloco não está disponível nesta revisão.');
 if(no.origem==='designer')throw Error('As referências deste objeto são mantidas pelo Designer.');
 for(const [k,v]of Object.entries(valores)){const p=def.ent.find(p=>p.id===k&&p.tipo!=='exec');if(!p)throw Error('Campo de bloco inválido: '+k);if(p.tipo==='num'&&(typeof v!=='number'||!Number.isFinite(v)))throw Error('Informe um número finito em '+(p.nome||k)+'.');if(p.tipo==='bool'&&typeof v!=='boolean')throw Error('Informe um valor lógico em '+k+'.');if(!['num','bool','any'].includes(p.tipo)&&typeof v!=='string')throw Error('Valor inválido em '+k+'.');}
 return n.comando({texto:'Editar bloco '+(no.titulo||def.nome),alvos:['__script'],propriedades:['*'],revisaoEsperada},doc=>{const alvo=doc.elementos.__script.grafos.find(g=>g.id===gid).nos.find(x=>x.id===nid);alvo.v={...alvo.v,...valores};});
}
