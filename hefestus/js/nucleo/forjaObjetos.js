export function sincronizarObjetosForja(doc) {
  if (!doc?.elementos) return;
  const els=Object.entries(doc.elementos).filter(([id,e])=>!id.startsWith("__") && e && typeof e==="object");
  if (!els.length && !doc.elementos.__script) return;
  const s=doc.elementos.__script ??= {versao:1,grafos:[{id:"principal",nome:"Principal",nos:[],ligacoes:[],grupos:[],notas:[]}],variaveis:[]};
  s.grafos ??= [];
  let g=s.grafos.find(g=>g.origem==="designer");
  if (!g) {g={id:"designer-objetos",nome:"Objetos do Designer",origem:"designer",nos:[],ligacoes:[],grupos:[],notas:[]};s.grafos.push(g);}
  g.nos ??=[];g.ligacoes ??=[];g.grupos ??=[];g.notas ??=[];
  const vivos=new Set(els.map(([id])=>id)), anteriores=new Map(g.nos.filter(n=>n.origem==="designer").map(n=>[n.id,n]));
  g.nos=g.nos.filter(n=>n.origem!=="designer" || vivos.has(n.id));
  for (let i=0;i<els.length;i++) {
    const [id,e]=els[i]; let n=anteriores.get(id);
    if (!n) {n={id,tipo:"ui.objeto",origem:"designer",x:(i%4)*330,y:Math.floor(i/4)*250,v:{alvo:id}};g.nos.push(n);}
    n.titulo=e.nome||id;n.v={...n.v,alvo:id};n.objetoPai=e.pai||null;n.modelo=e.construtor||null;
  }
  const ids=new Set(g.nos.map(n=>n.id));
  g.ligacoes=g.ligacoes.filter(l=>!l.hierarquia && ids.has(l.de) && ids.has(l.para));
  for (const [id,e] of els) if (vivos.has(e.pai) && e.pai!==id)
    g.ligacoes.push({id:"hierarquia:"+id,de:e.pai,sp:"r",para:id,ep:"pai",hierarquia:true});
}
