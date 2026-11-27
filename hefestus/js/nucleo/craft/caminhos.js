// SPDX-License-Identifier: MIT
// Adapted to Hephaestus contours from VectorCraft edit.rs: add_anchor_points and smooth.
// Copyright (c) 2026 ArtCraft Team and the VectorCraft contributors.
// Upstream: storytold/vectorcraft @ e2a8280134a7c3c9b4e117ee668b9b3e7eb3e315.
// Original source and complete license: terceiros/vectorcraft/.
import { clonarContornos, inserirNo } from '../vetor.js';
export function adicionarPontosCraft(contornos) {
 const out=clonarContornos(contornos);
 for(const c of out)for(let i=(c.fechado?c.nos.length:c.nos.length-1)-1;i>=0;i--)inserirNo(c,i,0.5);
 return out;
}
export function suavizarCraft(contornos,intensidade=1) {
 const t=Math.max(0,Math.min(1,Number.isFinite(+intensidade)?+intensidade:1)),out=clonarContornos(contornos);
 for(const c of out){const orig=clonarContornos([c])[0].nos,n=orig.length;if(n<3)continue;
  for(let i=0;i<n;i++){
   if(!c.fechado&&(i===0||i===n-1))continue;
   const p=orig[i],prev=orig[(i+n-1)%n],next=orig[(i+1)%n],dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy);if(len<1e-12)continue;
   const tin=Math.hypot(p.x-prev.x,p.y-prev.y)/3,tout=Math.hypot(next.x-p.x,next.y-p.y)/3;
   const a=p.a||[p.x,p.y],b=p.b||[p.x,p.y];
   c.nos[i].a=[a[0]+(p.x-dx/len*tin-a[0])*t,a[1]+(p.y-dy/len*tin-a[1])*t];
   c.nos[i].b=[b[0]+(p.x+dx/len*tout-b[0])*t,b[1]+(p.y+dy/len*tout-b[1])*t];
  }
 }
 return out;
}
// Adaptation of the straight-segment branch of remove_redundant_points/merge_pair.
// Bézier joints are deliberately retained: no curve fitting is approximated here.
export function removerRedundantesCraft(contornos,tolerancia=0.5) {
 const tol=Math.max(1e-9,Number.isFinite(+tolerancia)?+tolerancia:0.5),out=clonarContornos(contornos);
 for(const c of out){let mudou=true;
  while(mudou&&c.nos.length>(c.fechado?3:2)) {mudou=false;
   for(let i=c.fechado?0:1;i<c.nos.length-(c.fechado?0:1);i++) {
    const ns=c.nos,n=ns.length,p=ns[i],a=ns[(i+n-1)%n],b=ns[(i+1)%n];
    if(a.b||p.a||p.b||b.a)continue;
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<1e-12)continue;
    const mx=p.x-a.x,my=p.y-a.y,along=(mx*dx+my*dy)/len,dist=Math.abs(mx*dy-my*dx)/len;
    if(dist<=tol&&along>=0&&along<=len){ns.splice(i,1);mudou=true;break;}
   }
  }
 }
 return out;
}

// Adapted from VectorCraft edit.rs::join. Nearest-endpoint ordering and handle ownership
// follow upstream. Inputs and all control handles are cloned before editing.
export function juntarCaminhosCraft(contornos,tolerancia=0.5) {
 const tol=Number.isFinite(+tolerancia)?Math.max(0,+tolerancia):0.5;
 const cs=clonarContornos(contornos),closed=[],open=[];
 for(const c of cs){if(c.fechado||c.nos.length<2){if(c.nos.length)closed.push(c);}else open.push(c);}
 const reverse=c=>{c.nos.reverse();for(const n of c.nos)[n.a,n.b]=[n.b,n.a];};
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 if(open.length===1){const c=open.pop(),ns=c.nos;
  if(ns.length>2&&dist(ns[0],ns.at(-1))<=tol){const last=ns.pop();ns[0].a=last.a;}
  else {ns[0].a=null;ns.at(-1).b=null;}
  c.fechado=true;return [...closed,c];
 }
 while(open.length>1){let best={d:Infinity};
  for(let i=0;i<(open.length>200?1:open.length);i++)for(let j=i+1;j<open.length;j++)for(const ei of [false,true])for(const ej of [false,true]){
   const a=open[i].nos,b=open[j].nos,d=dist(ei?a.at(-1):a[0],ej?b.at(-1):b[0]);if(d<best.d)best={d,i,j,ei,ej};
  }
  const {d,i,j,ei,ej}=best,b=open.splice(j,1)[0],a=open[i];if(!ei)reverse(a);if(ej)reverse(b);
  if(d<=tol){const first=b.nos.shift();a.nos.at(-1).b=first.b;}
  else {a.nos.at(-1).b=null;b.nos[0].a=null;}
  a.nos.push(...b.nos);
 }
 return [...closed,...open];
}
// Adapted from VectorCraft edit.rs::split_into_grid. One compound path is returned so
// the Designer object ID, graph reference, metadata and single Undo step are retained.
export function dividirGradeCraft(rect,linhas=2,colunas=2,gap=0) {
 const {x,y,largura,altura}=rect;
 if(![x,y,largura,altura,linhas,colunas,gap].every(Number.isFinite)||!Number.isInteger(linhas)||!Number.isInteger(colunas)||linhas<1||colunas<1||linhas*colunas>10000||gap<0)return [];
 const w=(largura-gap*(colunas-1))/colunas,h=(altura-gap*(linhas-1))/linhas;if(!(w>0&&h>0))return [];
 const out=[];for(let r=0;r<linhas;r++)for(let c=0;c<colunas;c++){const px=x+c*(w+gap),py=y+r*(h+gap);out.push({fechado:true,nos:[[px,py],[px+w,py],[px+w,py+h],[px,py+h]].map(([x,y])=>({x,y,a:null,b:null}))});}return out;
}
