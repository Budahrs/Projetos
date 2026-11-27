// Formatação de artefatos: mantém IDs, sinais, ações, cores e ordem dos comandos.
function formatarSpec(item) {
 const limpar = lista => { for (const c of lista ?? []) {
  if (typeof c.rotulo === "string") c.rotulo = c.rotulo.normalize("NFC").replace(/\s+/g," ").trim();
  limpar(c.submenu);
 }};
 if (item.tipo === "ribbon") item.padraoFormatacao = true;
 if (item.tipo === "ribbon") for (const aba of item.abas ?? []) for (const g of aba.grupos ?? []) {
  limpar(g.itens); const n=g.itens?.length ?? 0;
  g.tamanho=n>2 ? "pequeno" : "grande";
  g.organizacao=n>3 ? "grade" : n>2 ? "coluna" : "linha";
 }
 if (item.tipo === "menu") { limpar(item.itens); item.largura=Math.max(260,item.largura ?? 0); }
 return item;
}
function planoFormatacao(elementos, selecionados) {
 const porId=new Map(elementos.map(e=>[e.id,e])); const escopo=new Set();
 const incluir=id=> { if(escopo.has(id))return;escopo.add(id); for(const e of elementos)if(e.pai===id)incluir(e.id); };
 selecionados.forEach(incluir);
 const bloqueado=e=> { const vistos=new Set();while(e){if(e.travado)return true;if(vistos.has(e.id))return true;vistos.add(e.id);e=porId.get(e.pai);}return false; };
 const mapa={};
 for (const id of escopo) {
  const e=porId.get(id);if(!e || e.construtor || bloqueado(e))continue;
  const patch={};
  if (e.tipo==="container" && ["linha","coluna"].includes(e.layout?.modo)) {
   patch["layout.espaco"]=8;patch["layout.margem"]=8;
   if(e.layout.modo==="linha"){patch["layout.quebrar"]=true;patch["layout.empilharAbaixo"]=480;}
  }
  if (["botao","campo","toggle","menu"].includes(e.tipo)) {
   patch.altura=Math.max(32,e.altura);patch["estilo.tamanhoFonte"]=Math.max(12,e.estilo?.tamanhoFonte ?? 14);
   if(typeof e.rotulo==="string")patch.rotulo=e.rotulo.normalize("NFC").replace(/\s+/g," ").trim();
  }
  if(Object.keys(patch).length)mapa[id]=patch;
 }
 return mapa;
}
export { formatarSpec, planoFormatacao };
