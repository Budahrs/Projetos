import { DocumentoAtivo } from '../aplicacao/documentoAtivo.js';
import { h, botaoIcone } from './dom.js';
import { analisarHTMLImportado, prepararHTMLImportado, documentoHTMLImportado } from '../nucleo/importarHTML.js';

export function abrirImportacaoHTML(app) {
  if(app._importacaoHTML?.isConnected){app._importacaoHTML.querySelector('textarea')?.focus();return;}
  const draft=app._rascunhoHTML??{html:'',css:'',js:'',nome:'',largura:640,altura:400,online:false},anterior=document.activeElement;
  const documento=new DocumentoAtivo(app.n);
  const raizAtual=app.n.selecionados().find(id=>app.n.elemento(id)?.importacaoNativa);
  const modo=h('select',{'aria-label':'Modo de importação'},h('option',{value:'isolado'},'Artefato HTML isolado'),h('option',{value:'nativo'},'Objetos nativos — HTML inline'),h('option',{value:'atualizar',disabled:!raizAtual},'Atualizar composição nativa selecionada'));
  const nome=h('input',{type:'text',value:draft.nome,placeholder:'Nome do artefato','aria-label':'Nome do artefato'});
  const largura=h('input',{type:'number',value:draft.largura,min:80,max:4000,'aria-label':'Largura'}),altura=h('input',{type:'number',value:draft.altura,min:80,max:4000,'aria-label':'Altura'});
  const origens=app.n.selecionados().slice(),combinar=h('input',{type:'checkbox',disabled:!origens.length});
  const online=h('input',{type:'checkbox',checked:draft.online}),biblioteca=h('input',{type:'checkbox'}),status=h('p',{role:'status'}),resumo=h('p',{class:'painel-vazio'}),preview=h('iframe',{sandbox:'',title:'Visualização estática do HTML',tabindex:-1,referrerpolicy:'no-referrer'});
  const campos=Object.fromEntries(['html','css','js'].map(k=>[k,h('textarea',{rows:k==='html'?12:5,spellcheck:false,'aria-label':k==='html'?'Cole o HTML completo':k.toUpperCase()+' adicional',placeholder:k==='html'?'Cole aqui o HTML completo com Ctrl+V, incluindo <style> e <script>.':'Opcional: '+k.toUpperCase()+' separado'},draft[k])]));
  const dados=()=>({nome:nome.value||analisarHTMLImportado(campos.html.value).titulo||'Artefato HTML',html:campos.html.value,css:campos.css.value,js:campos.js.value,largura:Number(largura.value),altura:Number(altura.value),online:online.checked});
  let timer=0,fechada=false;
  const atualizar=()=>{const a=analisarHTMLImportado(campos.html.value);resumo.textContent=campos.html.value?`${a.titulo||'HTML'} · ${a.botoes} botão(ões), ${a.menus} menu(s), ${a.links} link(s), ${a.svg} SVG · eventos: ${a.eventos.join(', ')||'não identificados'}${a.recursosExternos.length?' · contém referências externas':''}`:(modo.value==='isolado'?'O HTML será preservado como componente. O código interno continua editável no Visual Script.':'Serão criados objetos individuais; estilos e comportamentos não convertidos terão diagnóstico.');preview.srcdoc=documentoHTMLImportado({...dados(),recursosExternos:false},{executar:false});};
  const agendar=()=>{clearTimeout(timer);timer=setTimeout(atualizar,200);};
  for(const campo of Object.values(campos))campo.addEventListener('input',agendar);
  const fechar=()=>{if(fechada)return;fechada=true;app._rascunhoHTML=dados();clearTimeout(timer);preview.srcdoc='';veu.remove();document.removeEventListener('keydown',tecla,true);app._importacaoHTML=null;anterior?.isConnected&&anterior.focus();};
  const tecla=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();fechar();}else if(e.key==='Tab'){const itens=[...veu.querySelectorAll('button,input,textarea,summary')].filter(el=>el.getClientRects().length&&!el.disabled);const i=itens.indexOf(document.activeElement);if((e.shiftKey&&i<=0)||(!e.shiftKey&&i===itens.length-1)){e.preventDefault();(e.shiftKey?itens.at(-1):itens[0])?.focus();}}};
  const concluirNativa=(resultado,testar)=>{if(!resultado.aplicado){status.textContent='Não aplicada: '+(resultado.resultado?.motivo||'o documento manteve a decisão protegida.');return;}fechar();app._rascunhoHTML=null;app.setModo(testar?'previa':'designer');app.n.selecionar(resultado.raiz||raizAtual);app.mensagem('Importação nativa concluída. '+resultado.avisos.length+' aviso(s) de fidelidade; a fonte original está preservada.');if(biblioteca.checked)app.salvarModelo();};
  const criar=(testar=false)=>{try{const entrada=dados();if(modo.value!=='isolado'){
    if(entrada.css.trim()||entrada.js.trim())throw Error('O modo nativo converte o HTML com estilos inline. Para CSS/JS adicionais use Artefato HTML isolado; nenhum código foi descartado.');
    if(modo.value==='nativo'){concluirNativa(documento.comandos.executar('projeto.importar-html-nativo',entrada),testar);return;}
    const plano=documento.prepararReimportacao(raizAtual,entrada.html);
    if(plano.conflitos.length){const escolhas={},alerta=h('p',{role:'alert'});status.replaceChildren(h('strong',{},plano.adicoes.length+' adição(ões) · '+plano.remocoes.length+' ausência(s) na fonte. Escolha como resolver os conflitos.'),...plano.conflitos.map(c=>{const remocao=c.tipo==='remocao',escolha=h('select',{'aria-label':c.chave},h('option',{value:''},'Escolher…'),h('option',{value:'local'},remocao?'Manter objeto local':'Manter local'),h('option',{value:'fonte'},remocao?'Remover objeto':'Usar nova fonte'));escolha.onchange=()=>escolhas[c.chave]=escolha.value;return h('label',{class:'eng-conflito'},h('span',{},c.id+' · '+c.campo,remocao?h('small',{},c.motivo):null),escolha);}),alerta,h('button',{type:'button',class:'bt',onclick:()=>{try{if(campos.html.value!==plano.html)throw Error('O HTML mudou desde a comparação. Clique Recriar artefato para comparar novamente.');const r=documento.comandos.executar('projeto.reimportar-html',plano,escolhas);concluirNativa({aplicado:r.acao==='aplicado',resultado:r,raiz:raizAtual,avisos:plano.novo.avisos},testar);}catch(e){alerta.textContent=e.message;}}},'Aplicar escolhas'));return;}

    const r=documento.comandos.executar('projeto.reimportar-html',plano,{});concluirNativa({aplicado:r.acao==='aplicado',resultado:r,raiz:raizAtual,avisos:plano.novo.avisos},testar);return;
  }prepararHTMLImportado(entrada);const id=combinar.checked?app.n.comporHTMLComSelecao(entrada,origens):app.n.importarHTML(entrada);if(!id){status.textContent='Não foi possível criar o artefato.';return;}fechar();app._rascunhoHTML=null;app.ui.dockAba='codigo';app.setModo(testar?'previa':'forja');app.n.selecionar(id);app.mensagem('Artefato HTML criado. Use Prévia interativa para testar e Modelos para reutilizar.');if(biblioteca.checked)app.salvarModelo();}catch(e){status.textContent=e.message;}};
  const veu=h('div',{class:'veu'},h('section',{class:'dialogo importar-html',role:'dialog','aria-modal':'true','aria-label':'Recriar artefato a partir de HTML'},
    h('header',{},h('h2',{},'Colar HTML e recriar artefato'),botaoIcone('fechar','Fechar importação',fechar)),
    h('p',{},'Aceita uma página completa ou trecho HTML, com CSS e scripts embutidos. A visualização abaixo não executa scripts; a Prévia interativa testa o artefato isolado.'),
    h('label',{class:'importar-html-opcao'},'Converter como ',modo),h('p',{class:'painel-vazio'},'Objetos nativos: caixas, textos, botões e campos com estilos inline e posições fixas. Scripts e folhas CSS não viram lógica automaticamente. Atualização mantém IDs existentes; adições/remoções exigem IDs HTML explícitos. Ausências na fonte pedem uma escolha e vínculos autorais impedem remoção.'),h('div',{class:'importar-html-meta'},h('label',{},'Nome',nome),h('label',{},'Largura (px)',largura),h('label',{},'Altura (px)',altura)),
    h('div',{class:'importar-html-colunas'},h('div',{},h('label',{},'HTML completo',campos.html),h('details',{},h('summary',{},'CSS e JavaScript adicionais'),h('label',{},'CSS',campos.css),h('label',{},'JavaScript',campos.js))),h('div',{},h('strong',{},'Visualização estática'),h('p',{class:'painel-vazio'},'Para ver interações e animações, escolha Recriar e testar.'),resumo,preview)),
    h('label',{class:'importar-html-opcao'},online,' Permitir fontes, bibliotecas e outros recursos HTTPS externos na prévia/exportação'),
    h('label',{class:'importar-html-opcao'},combinar,' Combinar com a seleção atual para criar um novo artefato ('+origens.length+' selecionado(s))'),
    h('label',{class:'importar-html-opcao'},biblioteca,' Salvar também como artefato na biblioteca após criar'),status,
    h('div',{class:'acoes'},h('button',{type:'button',class:'bt',onclick:()=>criar(false)},'Recriar artefato'),h('button',{type:'button',class:'bt primario',onclick:()=>criar(true)},'Recriar e testar'))));
  modo.onchange=()=>{combinar.disabled=modo.value!=='isolado'||!origens.length;atualizar();if(modo.value==='atualizar'&&raizAtual){campos.html.value=app.n.elemento(raizAtual).importacaoNativa.fonte;agendar();}};
  app._importacaoHTML=veu;document.body.append(veu);document.addEventListener('keydown',tecla,true);atualizar();campos.html.focus();
}


