export function preferenciaMovimento(ui={},reduzido=false) {
  const tipo=['nenhuma','suave','revelar'].includes(ui.animacaoMenus)?ui.animacaoMenus:'suave';
  return {tipo:reduzido?'nenhuma':tipo,duracao:reduzido||tipo==='nenhuma'?0:Math.max(80,Math.min(400,Number(ui.duracaoMenus)||180))};
}
export function animarMenu(el,ui,saindo=false) {
  const p=preferenciaMovimento(ui,el.ownerDocument.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  if(!p.duracao||!el.animate)return null;
  const inicio={opacity:0,...(p.tipo==='revelar'?{clipPath:'inset(0 0 100% 0)'}:{})},fim={opacity:1,...(p.tipo==='revelar'?{clipPath:'inset(0 0 0 0)'}:{})};
  return el.animate(saindo?[fim,inicio]:[inicio,fim],{duration:p.duracao,easing:'cubic-bezier(.2,.7,.2,1)'});
}
