import { adaptarMenuWeb, criarModeloMenuAlternativo, criarModeloRibbonBlocos, eventosComandoMenu, validarComportamentosMenu } from './menuComportamentos.js';
import { CATALOGO_TEMAS, pacoteTemas, validarTemaCompartilhado } from "./temasCompartilhados.js";
// Contrato e geração de menus. Funções puras; nenhum código manual é executado.
function validarMenu(p) {
 const erros=[...validarComportamentosMenu(p)], ids=new Set();
 if(p?.formato!=='hefestus.menu'||p.versao!==1)erros.push('Use o formato hefestus.menu versão 1.');
 const abas=p?.designer?.abas;
 if(!Array.isArray(abas)||!abas.length)return [...erros,'Inclua pelo menos uma aba.'];
 const id=(v,t)=>{if(typeof v!=='string'||!/^[a-zA-Z0-9_-]+$/.test(v))erros.push(`Identificador inválido: ${t}`);else if(ids.has(v))erros.push(`Identificador repetido: ${v}`);else ids.add(v);};
 for(const a of abas){id(a.id,'aba');if((typeof a.nome!=='string'||!a.nome.trim()))erros.push('Aba sem nome.');if(!Array.isArray(a.grupos)||!a.grupos.length){erros.push(`Aba sem grupos: ${a.nome}`);continue;}
  for(const g of a.grupos){id(g.id,'grupo');if((typeof g.nome!=='string'||!g.nome.trim()))erros.push('Grupo sem nome.');if(!Array.isArray(g.comandos)){erros.push(`Comandos inválidos: ${g.nome}`);continue;}
   if(!g.comandos.length)erros.push(`Grupo sem comandos: ${g.nome}.`);
   if(g.comandos.filter(c=>c.destaque).length>1)erros.push(`Mais de um destaque em ${g.nome}.`);
   for(const c of g.comandos){id(c.id,'comando');if((typeof c.rotulo!=='string'||!c.rotulo.trim()))erros.push(`Comando sem rótulo: ${c.ferramentaId||c.id}`);}
  }
 }
 if(p.bancoFerramentas){
  if(!Array.isArray(p.bancoFerramentas))erros.push('Banco de ferramentas inválido.');
  else {const banco=new Set();for(const t of p.bancoFerramentas){if(typeof t?.id!=='string'||!/^[a-zA-Z0-9_.-]+$/.test(t.id))erros.push('Identificador de ferramenta inválido.');else if(banco.has(t.id))erros.push('Ferramenta repetida no banco: '+t.id);else banco.add(t.id);}const templates=new Set((p.catalogoTemplates||[]).map(t=>t.id));
   for(const a of abas)for(const g of a.grupos||[])for(const c of g.comandos||[]){if(!banco.has(c.ferramentaId))erros.push(`Ferramenta inexistente: ${c.ferramentaId||c.id}`);if(templates.size&&!templates.has(c.templateId))erros.push(`Template inexistente: ${c.templateId}`);}
  }
 }
 if(p.temas){if(p.temas.formato!=="hefestus.temas"||p.temas.versao!==1||!Array.isArray(p.temas.temas))erros.push("Catálogo de temas inválido.");else for(const t of p.temas.temas)erros.push(...validarTemaCompartilhado(t));}
 return erros;
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function metricasMenu(p) {
 const abas=p.designer.abas,grupos=abas.flatMap(a=>a.grupos),cmds=grupos.flatMap(g=>g.comandos),limite=Math.max(2,Math.min(6,Number(p.designer.limiteVisivel)||3));
 const banco=new Set((p.bancoFerramentas||[]).map(t=>t.id)),templates=new Set((p.catalogoTemplates||[]).map(t=>t.id));
 return {abas:abas.length,grupos:grupos.length,comandos:cmds.length,limiteVisivel:limite,maximoPorGrupo:Math.max(0,...grupos.map(g=>g.comandos.length)),comandosEmMais:grupos.reduce((n,g)=>n+Math.max(0,g.comandos.length-limite),0),alvoMinimo:32,vinculosValidos:banco.size?cmds.filter(c=>banco.has(c.ferramentaId)).length:null,reusoTemplatesPercentual:templates.size?100*cmds.filter(c=>templates.has(c.templateId)).length/Math.max(1,cmds.length):null};
}
function runtimeMenuGerado(){
 const root=document.documentElement,estado=document.querySelector('#estado');
 const pacote=JSON.parse(document.querySelector('#temas-compartilhados').textContent);let tema='automatico';
 const media=q=>typeof matchMedia==='function'?matchMedia(q):null;
 function aplicar(){const id=tema==='automatico'?(media('(forced-colors: active)')?.matches?'highContrast':media('(prefers-color-scheme: dark)')?.matches?'dark':'light'):tema;const t=pacote.temas.find(t=>t.id===id)||pacote.temas[0];for(const [k,v] of Object.entries(t.tokens))root.style.setProperty('--'+k,v);root.dataset.tema=id;}
 aplicar();for(const q of ['(prefers-color-scheme: dark)','(forced-colors: active)'])media(q)?.addEventListener?.('change',aplicar);
 document.addEventListener('hefestus:tema',e=>{tema=e.detail?.id||'automatico';aplicar();});
 document.addEventListener('click',e=>{
  const t=e.target.closest('[data-tab]');if(t){document.querySelectorAll('[role=tab]').forEach(b=>b.setAttribute('aria-selected',String(b===t)));document.querySelectorAll('[role=tabpanel]').forEach(p=>p.hidden=p.id!==t.dataset.tab);}
  const a=e.target.closest('[data-expand]');if(a){const grupo=a.closest('.grupo'),abrir=grupo.classList.contains('recolhido');if(abrir)grupo.parentElement.querySelectorAll('.grupo').forEach(g=>{if(g!==grupo&&g.dataset.fixado!=='true'){g.classList.add('recolhido');g.querySelector('[data-expand]')?.setAttribute('aria-expanded','false');}});grupo.classList.toggle('recolhido',!abrir);a.setAttribute('aria-expanded',String(abrir));}

 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('details[open]').forEach(d=>d.open=false);}const tab=e.target.closest('[role=tab]');if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){const tabs=[...document.querySelectorAll('[role=tab]')],i=tabs.indexOf(tab),n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;e.preventDefault();tabs[n].focus();tabs[n].click();}});
}
function gerarWeb(p){
 const tabs=p.designer.abas,limite=Math.max(2,Math.min(6,Number(p.designer.limiteVisivel)||3));
 const temas=p.temas||pacoteTemas(Object.values(CATALOGO_TEMAS));
 const dados=JSON.stringify(temas).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 const comando=c=>`<button data-controle="${esc(c.id)}" class="${c.destaque?'destaque':''}" data-command="${esc(c.ferramentaId||c.id)}" title="${esc(c.descricao||c.rotulo)}">${esc(c.rotulo)}</button>`;
 return adaptarMenuWeb(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(p.nome)}</title><style>
 :root{--interface:#DEE1E5;--painel:#E8EAED;--area:#C4C8CD;--texto:#202932;--secundario:#4D5965;--borda:#929BA5;--acento:#225A88;--selecao:#C8D9E6;--cabecalho:#D3D8DE;--textoCabecalho:#202932}body{margin:0;font:14px system-ui;background:var(--area);color:var(--texto)}button,summary{min-height:36px;padding:8px 12px;border:1px solid var(--borda);border-radius:5px;background:var(--painel);color:inherit;cursor:pointer}button:focus-visible,summary:focus-visible{outline:3px solid var(--acento);outline-offset:2px}.abas{display:flex;gap:4px;flex-wrap:wrap;padding:8px;background:var(--cabecalho);color:var(--textoCabecalho)}.abas button[aria-selected=true]{background:var(--selecao);color:var(--texto)}.painel{display:flex;gap:12px;overflow-x:auto;padding:12px;background:var(--painel)}.painel[hidden]{display:none}.grupo{border-right:1px solid var(--borda);padding-right:12px;min-width:90px;max-width:400px}.acoes{display:flex;flex-wrap:wrap;gap:4px}.ancora{font-weight:600;margin-bottom:8px}.grupo.recolhido .acoes,.grupo.recolhido h2{display:none}.destaque{font-weight:700;background:var(--selecao)}h2{font-size:12px;color:var(--secundario);margin:8px 0}details[open]>.overflow{display:grid;gap:5px;padding:6px}#estado{padding:16px}</style>
 <nav class="abas" role="tablist" aria-label="Áreas">${tabs.map((a,i)=>`<button role="tab" aria-selected="${i===0}" data-tab="${esc(a.id)}" aria-controls="${esc(a.id)}">${esc(a.nome)}</button>`).join('')}</nav>
 ${tabs.map((a,i)=>`<section class="painel" role="tabpanel" id="${esc(a.id)}" ${i?'hidden':''}>${a.grupos.map(g=>`<section class="grupo" data-grupo="${esc(g.id)}" data-fixado="${g.fixado===true}"><button class="ancora" data-expand="${esc(g.id)}" aria-expanded="true" title="Expandir ou recolher ${esc(g.nome)}">${esc(g.nome)}</button><div class="acoes">${g.comandos.slice(0,limite).map(comando).join('')}${g.comandos.length>limite?`<details><summary>Mais (${g.comandos.length-limite})</summary><div class="overflow">${g.comandos.slice(limite).map(comando).join('')}</div></details>`:''}</div><h2>${esc(g.nome)}</h2></section>`).join('')}</section>`).join('')}
 <p id="estado" role="status">Prévia da interface. A execução das ferramentas depende do programa de destino.</p><script type="application/json" id="temas-compartilhados">${dados}<\/script><script>(${runtimeMenuGerado.toString()})();<\/script></html>`,p);
}
function gerarWpf(p) {
 return `<TabControl xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation">\n${p.designer.abas.map(a=>` <TabItem Header="${esc(a.nome)}"><WrapPanel>${a.grupos.map(g=>`<GroupBox Header="${esc(g.nome)}" Margin="4"><WrapPanel>${g.comandos.map(c=>`<Button Content="${esc(c.rotulo)}" Tag="${esc(c.ferramentaId||c.id)}" MinHeight="36" Padding="12,8" Margin="2"/>`).join('')}</WrapPanel></GroupBox>`).join('')}</WrapPanel></TabItem>`).join('\n')}\n</TabControl>`;
}
function sincronizarMenu(p,designer=p.designer) {
 const next=JSON.parse(JSON.stringify({...p,designer}));const erros=validarMenu(next);if(erros.length)throw Error(erros.join('\n'));
 next.temas??=pacoteTemas(Object.values(CATALOGO_TEMAS));
 next.codigos={...(p.codigos??{})};
 for(const [alvo,texto] of [['web',gerarWeb(next)],['desktopWpf',gerarWpf(next)]]) {
  const anterior=next.codigos[alvo];next.codigos[alvo]=anterior?.origem==='manual'?{...anterior,estado:'revisar após alteração do designer'}:{origem:'gerado',estado:alvo==='web'?'executável':'fragmento: conectar comandos ao host',texto};
 }
 next.codigos.mobile??={origem:'não disponível',estado:'adaptador ainda não implementado'};
 next.metricas=metricasMenu(next);return next;
}
function criarModeloMenu(p,pecas) {
 return p.designer.tipoInterface&&p.designer.tipoInterface!=='ribbon'?criarModeloMenuAlternativo(p,pecas):criarModeloRibbonBlocos(p,pecas);
}

export { validarMenu, metricasMenu, gerarWeb, gerarWpf, sincronizarMenu, criarModeloMenu };
