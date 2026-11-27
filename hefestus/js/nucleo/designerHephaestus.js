import { listar, esc } from './exportar.js';
import { contornosDoElemento } from './vetorElemento.js';
import { escreverCaminho } from './vetor.js';
import { corSegura } from './estiloAvancado.js';
export function gerarSVGDesigner(doc) {
 const t=doc.elementos.__canvas||{},defs=[],avisos=[];
 const corpo=listar(doc).filter(e=>e.visivel!==false).map((e,i)=>{
  if(e.codigo?.html)avisos.push(e.id);
  const st=e.estilo||{},f=(st.preenchimentos||[]).find(f=>f.visivel!==false),imagem=e.imagem;
  let fill=corSegura(f?.cor||st.fundo||'transparent','none');
  if(f && ['linear','radial'].includes(f.tipo)) {
   const id='grad-'+i,rad=f.tipo==='radial',ang=Number(f.angulo)||0;
   defs.push(`<${rad?'radialGradient':'linearGradient'} id="${id}" ${rad?'':`gradientTransform="rotate(${ang},0.5,0.5)"`} >${(f.paradas||[]).map(p=>`<stop offset="${Math.max(0,Math.min(100,Number(p.pos)||0))}%" stop-color="${esc(corSegura(p.cor))}" stop-opacity="${Number(p.alfa??1)}"/>`).join('')}</${rad?'radialGradient':'linearGradient'}>`);fill=`url(#${id})`;
  }
  const op=Math.max(0,Math.min(1,Number(st.opacidade??1))),stroke=corSegura(st.borda||'transparent'),sw=Number(st.larguraBorda)||0;
  const atr=`id="${esc(e.id)}" data-nome="${esc(e.nome||e.id)}" opacity="${op}" style="mix-blend-mode:${/^[a-z-]+$/.test(st.mistura||'')?st.mistura:'normal'}"`;
  if(imagem && /^data:image\/(png|jpeg|webp|gif);base64,/i.test(imagem.url))return `<image ${atr} x="${e.x}" y="${e.y}" width="${e.largura}" height="${e.altura}" href="${esc(imagem.url)}" preserveAspectRatio="xMidYMid meet"/>`;
  const cs=contornosDoElemento(e),p=cs?`<path d="${esc(escreverCaminho(cs))}" fill="${esc(fill)}" fill-rule="evenodd" stroke="${esc(stroke)}" stroke-width="${sw}"/>`:'';
  const texto=e.texto??e.rotulo??e.placeholder??'';
  const font=Number(st.tamanhoFonte)||16;
  const txt=texto?`<text x="${e.x+8}" y="${e.y+font+4}" font-family="${esc(st.fonte==='serifa'?'serif':'Arial, sans-serif')}" font-size="${font}" font-weight="${Number(st.peso)||400}" fill="${esc(corSegura(st.cor||'#1f2937'))}">${String(texto).split('\n').map((l,j)=>`<tspan x="${e.x+8}" dy="${j?font*1.3:0}">${esc(l)}</tspan>`).join('')}</text>`:'';
  if(!p&&!txt)avisos.push(e.id);
  return `<g ${atr}>${p}${txt}</g>`;
 }).join('\n');
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${t.largura||1280}" height="${t.altura||800}" viewBox="0 0 ${t.largura||1280} ${t.altura||800}"><title>${esc(t.nome||'Hephaestus')}</title><defs>${defs.join('')}</defs><rect width="100%" height="100%" fill="${esc(corSegura(t.fundo||'#ffffff'))}"/>${corpo}</svg>`,avisos};
}
export function contextoSelecao(n,visual=false) {
 const ids=n.selecionados();if(!ids.length)return visual?'Visual Script · Objetos vinculados ao Designer':'Designer · Selecione um objeto';
 if(ids.length>1)return `${ids.length} objetos selecionados`;
 const e=n.selecionado(),s=e.estilo||{};
 if(e.imagem)return `${e.nome} · ${e.imagem.largura} × ${e.imagem.altura} px · Incorporada`;
 if(e.tipo==='texto')return `${e.nome} · ${s.fonte||'Sistema'} · ${s.tamanhoFonte||16} px`;
 const cs=contornosDoElemento(e);if(cs)return `${e.nome} · ${cs.reduce((q,c)=>q+c.nos.length,0)} pontos · ${cs.every(c=>c.fechado)?'Caminho fechado':'Caminho aberto'}`;
 return `${e.nome} · ${e.tipo}`;
}
