import { CATALOGO_TEMAS } from "../nucleo/temasCompartilhados.js";
import { gerarProjetoWindows } from "../nucleo/geradorWindows.js";
import { h, avisar } from "./dom.js";
import { FERRAMENTAS_FUTURAS, REFERENCIAS_PROJETOS, novoProjetoFuturo, validarProjetoFuturo, importarProjetoHTML, gerarProjetoWeb, gerarArquivosProjeto, atualizarComponente } from "../nucleo/projetosFuturos.js";
function abrirOficinaProjetos(app){
 let p=novoProjetoFuturo(),anterior=null,manual=null;
 const msg=h('p',{role:'status','aria-live':'polite'}),editor=h('textarea',{class:'oficina-json','aria-label':'Contrato do componente',rows:16}),preview=h('iframe',{title:'Prévia funcional do projeto',sandbox:'allow-scripts',class:'oficina-preview'});
 const tipo=h('select',{'aria-label':'Modelo de projeto'},FERRAMENTAS_FUTURAS.map(t=>h('option',{value:t.tipo},t.nome+' · '+t.pedido)));
 const codigo=h('textarea',{class:'oficina-json','aria-label':'HTML editável',rows:12});
 const banco=()=>app.ui.componentesFuturos??{};
 const lista=h('select',{'aria-label':'Componentes versionados'});
 function listar(){lista.replaceChildren(...Object.entries(banco()).map(([id,v])=>h('option',{value:id},v.nome+' · '+v.versaoComponente)));}
 const aplicar=()=>{const novo=validarProjetoFuturo(JSON.parse(editor.value));anterior=p;p=novo;render();};
 function render(){editor.value=JSON.stringify(p,null,2);const gerado=gerarProjetoWeb(p);codigo.value=manual??gerado;preview.srcdoc=gerado;msg.textContent=manual?'Código manual preservado separadamente. Prévia mostra o contrato; exportação HTML usa o código manual.':'Prévia gerada do contrato. Persistência da prévia isolada pode ser bloqueada pelo navegador.';}
 const acao=(nome,fn)=>h('button',{type:'button',class:'bt',onclick:()=>{try{fn();}catch(e){msg.textContent=e.message;avisar(e.message,'alerta');}}},nome);
 tipo.onchange=()=>{anterior=p;p=novoProjetoFuturo(tipo.value);manual=null;render();};
 const arquivo=h('input',{type:'file',accept:'.json,.html','aria-label':'Importar contrato ou HTML',onchange:async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>5000000)throw Error('Limite de 5 MB.');const texto=await f.text();anterior=p;const html=/\.html?$/i.test(f.name);p=html?importarProjetoHTML(texto):validarProjetoFuturo(JSON.parse(texto));manual=html?texto:null;tipo.value=p.tipo;render();}catch(err){msg.textContent=err.message;}}});
 const importarPacote=h('input',{type:'file',accept:'.json','aria-label':'Importar biblioteca',onchange:async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>5000000)throw Error('Limite de 5 MB.');const v=JSON.parse(await f.text());if(v.formato!=='hefestus.biblioteca'||v.versao!==1||!Array.isArray(v.componentes)||v.componentes.length>100)throw Error('Biblioteca incompatível.');const lote=v.componentes.map(validarProjetoFuturo),copia={...banco()};for(const c of lote){const chave=c.id+"@"+c.versaoComponente;if(copia[chave]&&JSON.stringify(copia[chave])!==JSON.stringify(c))throw Error('Conflito no componente '+c.id+'. Importe individualmente para revisar.');copia[chave]=c;}app.ui.componentesFuturos=copia;app.salvarUI();listar();msg.textContent='Biblioteca importada.';}catch(err){msg.textContent=err.message;}}});
 const tema=h('select',{'aria-label':'Tema compartilhado do projeto'},['automatico',...Object.keys(CATALOGO_TEMAS)].map(id=>h('option',{value:id},id==='automatico'?'System / Auto':CATALOGO_TEMAS[id].nome)));
 tema.onchange=()=>{anterior=p;const t=CATALOGO_TEMAS[tema.value]??CATALOGO_TEMAS.dark;p={...p,tema:tema.value,tokens:{fundo:t.tokens.interface,painel:t.tokens.painel,texto:t.tokens.texto,acento:t.tokens.acento}};render();};
 const acoes=h('div' ,{class:'oficina-acoes'},
 acao('Aplicar contrato',aplicar),acao('Desfazer contrato',()=>{if(anterior){const t=p;p=anterior;anterior=t;render();}}),
 acao('Salvar versão na biblioteca',()=>{aplicar();const chave=p.id+'@'+p.versaoComponente;const existente=banco()[chave];if(existente&&JSON.stringify(existente)!==JSON.stringify(p))throw Error('Versão já publicada. Aumente a versão antes de alterar.');app.ui.componentesFuturos={...banco(),[chave]:p};app.salvarUI();listar();msg.textContent='Versão salva no navegador.';}),
 acao('Carregar selecionado',()=>{const v=banco()[lista.value];if(v){anterior=p;p=validarProjetoFuturo(v);manual=null;tipo.value=p.tipo;render();}}),
 acao('Instanciar selecionado',()=>{const v=banco()[lista.value];if(!v)throw Error('Selecione um componente salvo.');app.ui.instanciasFuturas??=[];app.ui.instanciasFuturas.push({id:'instancia-'+Date.now(),base:v,sobrescritas:{}});app.salvarUI();msg.textContent='Instância criada. Exporte ou atualize pela biblioteca.';}),
 acao('Atualizar instâncias para este contrato',()=>{aplicar();const anteriores=app.ui.instanciasFuturas||[],conflitos=[];const novas=anteriores.map(i=>{if(i.base.id!==p.id)return i;const r=atualizarComponente(i,p);if(r.conflitos.length){conflitos.push({id:i.id,campos:r.conflitos});return i;}return {...i,...r.instancia};});if(conflitos.length){app.baixarJSON({conflitos},'conflitos-componentes.json');throw Error('Atualização não aplicada. Revise os conflitos exportados.');}app.ui.instanciasFuturasAntes=anteriores;app.ui.instanciasFuturas=novas;app.salvarUI();msg.textContent='Instâncias atualizadas, sobrescritas preservadas.';}),
 acao('Reverter atualização de instâncias',()=>{if(app.ui.instanciasFuturasAntes){const atual=app.ui.instanciasFuturas;app.ui.instanciasFuturas=app.ui.instanciasFuturasAntes;app.ui.instanciasFuturasAntes=atual;app.salvarUI();msg.textContent='Atualização revertida.';}}),
 acao('Exportar instâncias',()=>app.baixarJSON({formato:'hefestus.instancias',versao:1,instancias:app.ui.instanciasFuturas||[]},'instancias.json')),
 acao('Exportar biblioteca',()=>app.baixarJSON({formato:'hefestus.biblioteca',versao:1,componentes:Object.values(banco())},'hefestus-biblioteca.json')),
 acao('Exportar contrato',()=>{aplicar();app.baixarJSON(p,p.id+'.json');}),
 acao('Guardar HTML manual',()=>{manual=codigo.value;msg.textContent='Código preservado; mudanças no contrato não sobrescrevem este HTML.';}),
 acao('Voltar ao HTML gerado',()=>{manual=null;render();}),
 acao('Importar contrato do HTML editado',()=>{const novo=importarProjetoHTML(codigo.value);anterior=p;p=novo;manual=codigo.value;render();}),
 acao('Exportar HTML',()=>app.n.baixar(p.id+'.html',manual??gerarProjetoWeb(p),'text/html')),
 acao('Exportar projeto Windows',()=>{aplicar();app.baixarJSON(gerarProjetoWindows(p),p.id+'.windows.arquivos.json');}),
 acao('Exportar projeto web/PWA',()=>{aplicar();if(manual)throw Error('Exporte o HTML manual separadamente ou volte ao gerado antes de empacotar.');app.baixarJSON(gerarArquivosProjeto(p),p.id+'.arquivos.json');}));
 const grupos=[['Editar e revisar',[]],['Biblioteca e instâncias',[]],['Gerar e exportar',[]]];
 for(const b of [...acoes.children]){const t=b.textContent;const i=/Exportar/.test(t)?2:/biblioteca|selecionado|instâncias/.test(t)?1:0;grupos[i][1].push(b);}
 acoes.replaceChildren(...grupos.map(([titulo,botoes])=>h('details',{open:titulo==='Editar e revisar'},h('summary',{},titulo),h('div',{class:'oficina-acoes'},botoes))));
 listar();render();
 app.dialogo({titulo:'Oficina de projetos e componentes',icone:'ferramentas',texto:'Interfaces funcionais que iniciam diretamente no programa, com biblioteca versionada e geração web responsiva. Importar HTML recupera o contrato incorporado; código arbitrário fica preservado, sem tradução automática.',corpo:h('div',{class:'oficina-menus'},tipo,tema,lista,acoes,msg,h('div',{class:'oficina-grid'},editor,preview),h('details',{},h('summary',{},'Código e importação'),codigo,arquivo,h('label',{},'Importar biblioteca ',importarPacote)),h('details',{},h('summary',{},'Referências usadas'),REFERENCIAS_PROJETOS.map(r=>h('p',{},h('a',{href:r.url,target:'_blank',rel:'noopener'},r.nome),': '+r.uso)))),opcoes:[{id:'fechar',rotulo:'Fechar',fazer:()=>{}}]});
}
export { abrirOficinaProjetos };
