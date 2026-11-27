import { CATALOGO_TEMAS } from "./temasCompartilhados.js";
// Contrato portátil e geradores declarativos. Código importado nunca é executado no editor.
const clone=v=>JSON.parse(JSON.stringify(v));
const escapar=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const REFERENCIAS_PROJETOS=[
 {nome:'ArtCraft / FigCraft',url:'https://github.com/storytold/figcraft',uso:'Modelo persistente, comandos compartilhados, componentes e instâncias.'},
 {nome:'ArtCraft / ecossistema',url:'https://getartcraft.com/apps',uso:'Ferramentas por domínio e automação local.'},
 {nome:'Apache Superset',url:'https://superset.apache.org/',uso:'Separar fonte, indicador e visualização.'},
 {nome:'Metabase',url:'https://www.metabase.com/',uso:'Consulta guiada e indicadores reutilizáveis.'},
 {nome:'Redash',url:'https://redash.io/',uso:'Filtros e visualização sobre resultados.'},
 {nome:'Lightdash',url:'https://github.com/lightdash/lightdash',uso:'Definições de métricas reutilizáveis.'},
 {nome:'Panthera',url:'https://github.com/Ashishkumar201/panthera-fullstack',uso:'Organização de filtros e navegação de dashboard; referência, sem código incorporado.'},
 {nome:'Microsoft Office / Ribbon',url:'https://learn.microsoft.com/en-us/windows/win32/uxguide/cmd-ribbons',uso:'Guias por tarefa, acesso rápido, contexto e compactação.'},
 {nome:'Visual Studio Code',url:'https://code.visualstudio.com/docs/configure/profiles',uso:'Perfis portáveis e separação entre configuração e documento.'},
 {nome:'WPF',url:'https://learn.microsoft.com/en-us/dotnet/desktop/wpf/',uso:'Projeto Windows com layout e eventos declarados.'},
 {nome:'PWA / MDN',url:'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable',uso:'Interface responsiva e manifesto; instalação depende do navegador e HTTPS.'}
];
const FERRAMENTAS_FUTURAS=[
 {id:'notas',nome:'Bloco de notas',pedido:'P20',descricao:'Texto persistido no navegador, exportação e recuperação pelo arquivo.',tipo:'notas'},
 {id:'pedidos',nome:'Quadro de pendências',pedido:'P01/P32/P33',descricao:'Tarefas com estado, próxima ação e persistência local.',tipo:'tarefas'},
 {id:'formulario',nome:'Formulário acessível',pedido:'P17/P30',descricao:'Campos rotulados, validação obrigatória e exportação JSON.',tipo:'formulario'},
 {id:'calculadora',nome:'Calculadora de métricas',pedido:'P30/P31/P43',descricao:'Taxa de sucesso com numerador e denominador explícitos.',tipo:'calculadora'},
 {id:'componentes',nome:'Catálogo de componentes',pedido:'P14/P17/P44',descricao:'Cartões pesquisáveis, versão, licença e origem.',tipo:'catalogo'}
];
function novoProjetoFuturo(tipo='notas') {
 const t=FERRAMENTAS_FUTURAS.find(t=>t.tipo===tipo);if(!t)throw Error('Modelo desconhecido.');
 return {formato:'hefestus.projeto',versao:1,id:'projeto-'+Date.now(),nome:t.nome,tipo,tema:'automatico',versaoComponente:'1.0.0',origem:{autor:'Usuário',licenca:'A definir',referencias:REFERENCIAS_PROJETOS},tokens:{fundo:'#252932',painel:'#303641',texto:'#e7eaf0',acento:'#8cbaff'},campos:[{id:'titulo',rotulo:'Título',obrigatorio:true},{id:'descricao',rotulo:'Descrição',obrigatorio:false}],itens:[],svg:{viewBox:'0 0 24 24',paths:['M4 4H20V20H4Z']},controlador:{versao:1,eventos:['salvar','exportar','restaurar'],estadoInicial:{}}};
}
function validarProjetoFuturo(p) {
 if(!p||p.formato!=='hefestus.projeto'||p.versao!==1)throw Error('Contrato incompatível.');
 if(!FERRAMENTAS_FUTURAS.some(t=>t.tipo===p.tipo))throw Error('Tipo não suportado.');
 if(typeof p.id!=='string'||!/^[-\w]{1,120}$/.test(p.id)||typeof p.nome!=='string'||p.nome.length>160)throw Error('ID ou nome inválido.');
 if(!/^\d+\.\d+\.\d+$/.test(p.versaoComponente||''))throw Error('Use versão numérica x.y.z.');
 if(p.tema!=null&&!['automatico',...Object.keys(CATALOGO_TEMAS)].includes(p.tema))throw Error('Tema não suportado.');
 if(!p.origem||typeof p.origem.licenca!=='string'||typeof p.origem.autor!=='string')throw Error('Registre autor e licença.');
 if(!p.tokens||['fundo','painel','texto','acento'].some(k=>!/^#[0-9a-f]{6}$/i.test(p.tokens[k])))throw Error('Tokens precisam de cores hexadecimais.');
 if(!Array.isArray(p.campos)||p.campos.length>40||p.campos.some(c=>!/^[-\w]{1,60}$/.test(c.id)||typeof c.rotulo!=='string'||c.rotulo.length>160))throw Error('Campos inválidos.');
 if(new Set(p.campos.map(c=>c.id)).size!==p.campos.length)throw Error('Identificador de campo repetido.');
 if(!Array.isArray(p.itens)||p.itens.length>1000)throw Error('Máximo de 1000 itens.');
 if(!p.svg||!/^[-\d.\s]+$/.test(p.svg.viewBox)||!Array.isArray(p.svg.paths)||p.svg.paths.length>40||p.svg.paths.some(d=>typeof d!=='string'||d.length>20000||!/^[MmLlHhVvCcSsQqTtAaZz\d.,+\s-]+$/.test(d)))throw Error('Vetor inválido. Use caminhos SVG sem scripts.');
 return clone(p);
}
function importarProjetoHTML(html) {
 const m=html.match(/<script type="application\/json" id="hefestus-projeto">([\s\S]*?)<\/script>/);if(!m)throw Error('HTML sem contrato Hefestus. Código arbitrário não pode ser traduzido automaticamente.');
 return validarProjetoFuturo(JSON.parse(m[1]));
}
function atualizarComponente(instancia,nova) {
 validarProjetoFuturo(nova);if(instancia.base.id!==nova.id)throw Error('IDs de componente diferentes.');
 const conflitos=Object.keys(instancia.sobrescritas||{}).filter(k=>JSON.stringify(instancia.base[k])!==JSON.stringify(nova[k]));
 if(conflitos.length)return {conflitos,instancia:clone(instancia)};
 return {conflitos:[],instancia:{base:clone(nova),sobrescritas:clone(instancia.sobrescritas||{})}};
}
function gerarProjetoWeb(valor) {
 const p=validarProjetoFuturo(valor),dados=JSON.stringify(p).replace(/</g,'\\u003c');
 return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapar(p.nome)}</title><link rel="manifest" href="manifest.webmanifest"><style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:var(--fundo,${p.tokens.fundo});color:var(--texto,${p.tokens.texto});font:16px system-ui}main{max-width:960px;margin:auto;padding:24px}section{background:var(--painel,${p.tokens.painel});padding:20px;border-radius:12px}button,input,textarea,select{font:inherit;padding:10px;border:1px solid #78808c;border-radius:6px;background:var(--fundo,${p.tokens.fundo});color:inherit}button{cursor:pointer;margin:4px}button:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid ${p.tokens.acento}}textarea{width:100%;min-height:280px}label{display:block;margin:12px 0}input{max-width:100%}li{padding:8px}nav{display:flex;flex-wrap:wrap;gap:4px}.linha{display:flex;gap:12px;flex-wrap:wrap}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}</style><main><h1>${escapar(p.nome)}</h1><nav><button id="exportar">Exportar dados</button><label>Importar dados <input id="importar" type="file" accept=".json"></label></nav><p id="estado" role="status" aria-live="polite"></p><section id="conteudo"></section></main><script type="application/json" id="hefestus-projeto">${dados}<\/script><script>
const p=JSON.parse(document.getElementById('hefestus-projeto').textContent),key='hefestus.app.'+p.id,root=document.getElementById('conteudo'),status=document.getElementById('estado');
const temas=${JSON.stringify(CATALOGO_TEMAS)};function aplicarTema(){const id=p.tema==='automatico'?(matchMedia('(forced-colors: active)').matches?'highContrast':matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p.tema;const t=temas[id];if(!t)return;for(const [k,v]of Object.entries({fundo:t.tokens.interface,painel:t.tokens.painel,texto:t.tokens.texto}))document.documentElement.style.setProperty('--'+k,v);document.documentElement.style.colorScheme=t.modo;}aplicarTema();for(const q of ['(prefers-color-scheme: dark)','(forced-colors: active)'])matchMedia(q).addEventListener('change',aplicarTema);
let dados={texto:'',tarefas:[],registros:[]};try{dados=Object.assign(dados,JSON.parse(localStorage.getItem(key)||'{}'));}catch{status.textContent='Dados anteriores não puderam ser lidos. Importe um backup.';}
const el=(tag,text)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;};
const salvar=()=>{try{localStorage.setItem(key,JSON.stringify(dados));status.textContent='Salvo neste navegador às '+new Date().toLocaleTimeString();}catch{status.textContent='Não foi possível salvar. Exporte os dados para não perder alterações.';}};
function render(){root.replaceChildren();if(p.tipo==='notas'){const t=el('textarea');t.setAttribute('aria-label','Nota');t.value=dados.texto;t.oninput=()=>{dados.texto=t.value;salvar();};root.append(t);}
if(p.tipo==='tarefas'){const entrada=el('input');entrada.placeholder='Nova tarefa';entrada.setAttribute('aria-label','Nova tarefa');const add=el('button','Adicionar'),ul=el('ul');add.onclick=()=>{if(!entrada.value.trim())return;dados.tarefas.push({id:Date.now(),titulo:entrada.value.trim(),estado:'pendente',proximaAcao:''});salvar();render();};root.append(entrada,add,ul);for(const t of dados.tarefas){const li=el('li'),s=el('select');s.setAttribute('aria-label','Estado de '+t.titulo);for(const v of ['pendente','em andamento','pausada','concluída']){const o=el('option',v);o.value=v;s.append(o);}s.value=t.estado;s.onchange=()=>{t.estado=s.value;salvar();};const n=el('input');n.placeholder='Próxima ação';n.setAttribute('aria-label','Próxima ação de '+t.titulo);n.value=t.proximaAcao;n.onchange=()=>{t.proximaAcao=n.value;salvar();};const remover=el('button','Excluir');remover.onclick=()=>{dados.tarefas=dados.tarefas.filter(x=>x!==t);salvar();render();};li.append(el('span',t.titulo+' '),s,n,remover);ul.append(li);}}
if(p.tipo==='formulario'){const form=el('form');for(const c of p.campos){const l=el('label',c.rotulo+' '),i=el('input');i.name=c.id;i.required=!!c.obrigatorio;l.append(i);form.append(l);}const b=el('button','Salvar registro');b.type='submit';form.append(b);form.onsubmit=e=>{e.preventDefault();dados.registros.push(Object.fromEntries(new FormData(form)));salvar();form.reset();status.textContent+=' · '+dados.registros.length+' registros';};root.append(form);}
if(p.tipo==='calculadora'){const a=el('input'),b=el('input'),out=el('output');a.type=b.type='number';a.min=b.min='0';a.placeholder='Sucessos';b.placeholder='Total';a.setAttribute('aria-label','Sucessos');b.setAttribute('aria-label','Total');const calcular=()=>{const x=Number(a.value),y=Number(b.value);out.textContent=y>0&&x>=0&&x<=y?'Taxa de sucesso: '+(100*x/y).toFixed(2)+'% ('+x+'/'+y+')':'Informe total maior que zero e sucessos entre zero e o total.';};a.oninput=b.oninput=calcular;root.append(a,b,out);}
if(p.tipo==='catalogo'){const q=el('input'),lista=el('ul');q.placeholder='Buscar componentes';q.setAttribute('aria-label','Buscar componentes');const atualizar=()=>{lista.replaceChildren();for(const i of p.itens.filter(x=>JSON.stringify(x).toLowerCase().includes(q.value.toLowerCase()))){lista.append(el('li',typeof i==='string'?i:JSON.stringify(i)));}};q.oninput=atualizar;root.append(q,lista);atualizar();}}
document.getElementById('exportar').onclick=()=>{const blob=new Blob([JSON.stringify({formato:'hefestus.dados',versao:1,projeto:p.id,dados},null,2)],{type:'application/json'}),a=el('a');a.href=URL.createObjectURL(blob);a.download=p.id+'-dados.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
document.getElementById('importar').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>5000000)throw Error('Máximo de 5 MB.');const v=JSON.parse(await f.text());if(v.formato!=='hefestus.dados'||v.projeto!==p.id||v.versao!==1||typeof v.dados?.texto!=='string'||!Array.isArray(v.dados.tarefas)||!Array.isArray(v.dados.registros)||v.dados.tarefas.some(t=>!t||typeof t.titulo!=='string'||typeof t.proximaAcao!=='string'))throw Error('Dados incompatíveis.');dados=v.dados;salvar();render();}catch(err){status.textContent=err.message;}};render();
if(location.protocol==='https:'||location.hostname==='localhost')navigator.serviceWorker?.register('./sw.js').catch(()=>{});
<\/script></html>`;
}
function gerarArquivosProjeto(valor) {
 const p=validarProjetoFuturo(valor),icon=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${p.svg.viewBox}"><rect width="24" height="24" fill="${p.tokens.fundo}"/>${p.svg.paths.map(d=>`<path d="${d}" fill="none" stroke="${p.tokens.acento}"/>`).join('')}</svg>`;
 const arquivos={'index.html':gerarProjetoWeb(p),'projeto.hefestus.json':JSON.stringify(p,null,2),'icone.svg':icon,'manifest.webmanifest':JSON.stringify({id:'./',name:p.nome,short_name:p.nome.slice(0,24),start_url:'./index.html',scope:'./',display:'standalone',background_color:p.tokens.fundo,theme_color:p.tokens.painel,icons:[{src:'icone.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]},null,2),'sw.js':`const CACHE=${JSON.stringify(p.id+'-'+p.versaoComponente)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./index.html','./manifest.webmanifest','./icone.svg']))));self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&new URL(e.request.url).origin===self.location.origin)e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});`};
 arquivos['LEIA-ME.md']='# '+p.nome+'\n\nAbra index.html para uso local. Para instalação como PWA e cache offline, sirva esta pasta por HTTPS ou localhost. Compatibilidade depende do navegador; não é um APK/iOS nativo. Não foram executados testes ou builds. Dados ficam no navegador; exporte backups. Licença: '+p.origem.licenca;
 return {formato:'hefestus.arquivos',versao:1,projeto:p.id,arquivos};
}
export { REFERENCIAS_PROJETOS, FERRAMENTAS_FUTURAS, novoProjetoFuturo, validarProjetoFuturo, importarProjetoHTML, atualizarComponente, gerarProjetoWeb, gerarArquivosProjeto };
