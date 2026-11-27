/** Fotografia independente. Referências em código autoral permanecem literais. */
export function capturarFormatacao(elemento,comportamentos=false) {
  if(!elemento?.estilo)throw new Error('Selecione um elemento com formatação.');
  return structuredClone({origem:elemento.id,estilo:elemento.estilo,estados:elemento.estados??{},...(comportamentos?{eventos:elemento.eventos??[],vinculos:elemento.vinculos??[],abertura:elemento.abertura??{},transicao:elemento.transicao??{},codigo:elemento.codigo??{}}:{})});
}
export function aplicarFormatacao(nucleo,formato,ids,opcoes={visual:true,efeitos:true,interacoes:false,codigo:false}) {
  const mapa={};
  for(const id of new Set(ids)) {
    const e=nucleo.elemento(id);
    if(!e||id.startsWith('__')||e.travado||!e.estilo)continue;
    const v={};
    if(opcoes.visual){v.estilo=structuredClone(formato.estilo);v.estados=structuredClone(formato.estados);if(!opcoes.efeitos){for(const k of ['efeitos','sombra','desfoque','vidro']){if(e.estilo[k]!==undefined)v.estilo[k]=structuredClone(e.estilo[k]);else delete v.estilo[k];}}}
    else if(opcoes.efeitos)v.estilo={...structuredClone(e.estilo),efeitos:structuredClone(formato.estilo.efeitos??[]),sombra:formato.estilo.sombra??'nenhuma',desfoque:formato.estilo.desfoque??0,vidro:formato.estilo.vidro??0};
    if(opcoes.interacoes&&formato.eventos){v.eventos=structuredClone(formato.eventos).map(ev=>({...ev,...(ev.alvo===formato.origem?{alvo:id}:{})}));v.vinculos=structuredClone(formato.vinculos);v.abertura=structuredClone(formato.abertura);v.transicao=structuredClone(formato.transicao);}
    if(opcoes.codigo&&formato.codigo)v.codigo=structuredClone(formato.codigo);
    if(Object.keys(v).length)mapa[id]=v;
  }
  if(!Object.keys(mapa).length)return {acao:'ignorado'};
  return nucleo.definirVarios(mapa,'Aplicar pincel de formatação');
}
