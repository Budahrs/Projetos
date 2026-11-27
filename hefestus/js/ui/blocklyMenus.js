import {h,avisar} from './dom.js';
import {sincronizarMenu} from '../nucleo/menuEngine.js';
import {comportamentosComando} from '../nucleo/menuComportamentos.js';

/** Blocos tipados → contrato existente de menus. Não avalia JavaScript dos blocos. */
export function criarBlocklyMenus({ler,alterar,status}) {
  const B=globalThis.Blockly;
  if(!B)throw Error('Blockly não foi incluído nesta distribuição. Recompile o Hefestus.');
  let buscaFerramenta='';
  if(!B.Blocks.hf_menu)B.common.defineBlocksWithJsonArray([
    {type:'hf_menu',message0:'interface %1 nome %2',args0:[{type:'field_dropdown',name:'TIPO',options:[['Ribbon','ribbon'],['Menu lateral','lateral'],['Botão direito','contextual'],['Janela','janela']]},{type:'field_input',name:'NOME',text:'Meu programa'}],message1:'abas / seções %1',args1:[{type:'input_statement',name:'ABAS',check:'HfAba'}],colour:'#2389e8',tooltip:'Comece aqui. Encaixe abas, grupos e comandos.'},
    {type:'hf_aba',message0:'aba / seção %1',args0:[{type:'field_input',name:'NOME',text:'Nova aba'}],message1:'grupos %1',args1:[{type:'input_statement',name:'GRUPOS',check:'HfGrupo'}],previousStatement:'HfAba',nextStatement:'HfAba',colour:'#2389e8'},
    {type:'hf_grupo',message0:'grupo %1',args0:[{type:'field_input',name:'NOME',text:'Novo grupo'}],message1:'comandos %1',args1:[{type:'input_statement',name:'COMANDOS',check:'HfComando'}],previousStatement:'HfGrupo',nextStatement:'HfGrupo',colour:'#d99913'},
    {type:'hf_comando',message0:'comando %1 ferramenta %2 principal %3',args0:[{type:'field_input',name:'NOME',text:'Novo comando'},{type:'field_input',name:'FERRAMENTA',text:''},{type:'field_checkbox',name:'PRINCIPAL',checked:false}],message1:'comportamentos %1',args1:[{type:'input_statement',name:'REGRAS',check:'HfRegra'}],previousStatement:'HfComando',nextStatement:'HfComando',colour:'#0c9e7c'},
    {type:'hf_regra',message0:'quando %1 ligado %2',args0:[{type:'field_dropdown',name:'EVENTO',options:[['clicar','onClick'],['botão direito','onContext'],['entrar com mouse','onHover'],['sair com mouse','onLeave'],['receber foco','onFocus'],['alterar','onChange']]},{type:'field_checkbox',name:'LIGADO',checked:true}],message1:'fazer %1 destino %2',args1:[{type:'field_dropdown',name:'ACAO',options:[['executar ferramenta','ferramenta'],['mostrar','abrir'],['ocultar','fechar'],['alternar','alternar'],['mostrar só este','mostrarSo'],['destacar','destacar']]},{type:'field_input',name:'DESTINO',text:''}],previousStatement:'HfRegra',nextStatement:'HfRegra',colour:'#9c40d6'},
  ]);
  const area=h('div',{class:'blockly-superficie','aria-label':'Área de montagem com encaixes'}),preview=h('iframe',{class:'blockly-previa',title:'Prévia ao vivo do menu',sandbox:'allow-scripts'});
  const mensagem=h('p',{role:'status','aria-live':'polite'});
  let workspace=null,ultimaOrigem='',resize=null;
  const raiz=h('section',{class:'oficina-blockly'},h('div',{class:'blockly-comandos'},h('strong',{},'Encaixe os blocos para construir'),h('button',{type:'button',class:'bt',onclick:()=>aplicar()},'Aplicar blocos'),h('button',{type:'button',class:'bt',onclick:()=>carregar(true)},'Recarregar projeto'),h('button',{type:'button',class:'bt',onclick:()=>workspace?.undo(false)},'Desfazer'),h('button',{type:'button',class:'bt',onclick:()=>workspace?.undo(true)},'Refazer')),mensagem,h('div',{class:'blockly-paineis'},area,h('aside',{class:'blockly-inspecao'},h('h3',{},'Prévia'),h('p',{},'1. Escolha uma categoria. 2. Arraste ao encaixe. 3. Edite os campos e aplique.'),preview,h('h3',{},'Ferramentas disponíveis'),h('input',{type:'search',placeholder:'Pesquisar ferramenta…','aria-label':'Pesquisar ferramenta da Oficina',oninput:e=>{buscaFerramenta=e.target.value;listarFerramentas();}}),h('div',{class:'blockly-lista-ferramentas'}))));
  const nota=t=>{mensagem.textContent=t;};
  const assinatura=p=>JSON.stringify({nome:p.nome,tipo:p.designer.tipoInterface||'ribbon',abas:p.designer.abas});
  const json=b=>{try{return JSON.parse(b.data||'{}');}catch{return {};}};
  const sequencia=(raiz,fn)=>{const saida=[];for(let b=raiz;b;b=b.getNextBlock())saida.push(fn(b));return saida;};
  function aplicar(){try{
    if(!workspace)return;
    const roots=workspace.getTopBlocks(true),r=roots.find(b=>b.type==='hf_menu');
    if(!r||roots.length!==1)throw Error('Mantenha uma interface principal e encaixe nela todos os blocos antes de aplicar.');
    let seq=0;const preservados=new Set();const usados=new Set(ler().designer.abas.flatMap(a=>[a.id,...a.grupos.flatMap(g=>[g.id,...g.comandos.map(c=>c.id)])]));
    const identidade=(b,t)=>{const atual=json(b);if(atual.id&&!preservados.has(atual.id)){preservados.add(atual.id);return atual.id;}let id;do{id='bloco_'+t+'_'+(++seq);}while(usados.has(id));usados.add(id);b.data=JSON.stringify({...atual,id});return id;};
    const abas=sequencia(r.getInputTargetBlock('ABAS'),a=>({...json(a),id:identidade(a,'aba'),nome:a.getFieldValue('NOME'),grupos:sequencia(a.getInputTargetBlock('GRUPOS'),g=>({...json(g),id:identidade(g,'grupo'),nome:g.getFieldValue('NOME'),comandos:sequencia(g.getInputTargetBlock('COMANDOS'),c=>({...json(c),id:identidade(c,'comando'),rotulo:c.getFieldValue('NOME'),ferramentaId:c.getFieldValue('FERRAMENTA'),templateId:json(c).templateId||'acao-secundaria',destaque:c.getFieldValue('PRINCIPAL')==='TRUE',comportamentos:sequencia(c.getInputTargetBlock('REGRAS'),b=>{const acao=b.getFieldValue('ACAO'),destino=b.getFieldValue('DESTINO');return {...json(b),evento:b.getFieldValue('EVENTO'),ativo:b.getFieldValue('LIGADO')==='TRUE',acao,...(acao==='ferramenta'?{ferramentaId:destino||c.getFieldValue('FERRAMENTA')}:{alvo:destino})};})}))}))}));
    const p=sincronizarMenu({...ler(),nome:r.getFieldValue('NOME'),designer:{...ler().designer,tipoInterface:r.getFieldValue('TIPO'),abas}});
    p.designer.oficinaBlockly={origem:assinatura(p),estado:B.serialization.workspaces.save(workspace)};
    alterar(p);ultimaOrigem='';carregar(true);nota('Blocos aplicados. A prévia, o modelo e o código usam esta estrutura.');
  }catch(e){nota(e.message);avisar(e.message,'alerta');}}
  function carregar(forcar=false){
    if(!workspace)return;
    const p=ler(),origem=JSON.stringify(p.designer);if(!forcar&&origem===ultimaOrigem)return;
    B.Events.disable();workspace.setResizesEnabled(false);try{
      workspace.clear();
      const novo=(tipo,dados,campos)=>{const b=workspace.newBlock(tipo);const {grupos,comandos,comportamentos,...meta}=dados||{};b.data=JSON.stringify(meta);for(const [nome,v]of Object.entries(campos))b.setFieldValue(String(v),nome);b.initSvg();b.render();return b;};
      const encaixar=(pai,input,filhos)=>{let conexao=pai.getInput(input).connection;for(const b of filhos){conexao.connect(b.previousConnection);conexao=b.nextConnection;}};
      const salvo=p.designer.oficinaBlockly;
      if(salvo?.origem===assinatura(p)){B.serialization.workspaces.load(salvo.estado,workspace);}else{
      const root=novo('hf_menu',{}, {TIPO:p.designer.tipoInterface||'ribbon',NOME:p.nome});root.moveBy(35,30);
      encaixar(root,'ABAS',p.designer.abas.map(a=>{const ba=novo('hf_aba',a,{NOME:a.nome});encaixar(ba,'GRUPOS',a.grupos.map(g=>{const bg=novo('hf_grupo',g,{NOME:g.nome});encaixar(bg,'COMANDOS',g.comandos.map(c=>{const bc=novo('hf_comando',c,{NOME:c.rotulo,FERRAMENTA:c.ferramentaId||'',PRINCIPAL:c.destaque?'TRUE':'FALSE'});encaixar(bc,'REGRAS',comportamentosComando(c).map(ev=>novo('hf_regra',ev,{EVENTO:ev.evento,LIGADO:ev.ativo===false?'FALSE':'TRUE',ACAO:ev.acao,DESTINO:ev.acao==='ferramenta'?ev.ferramentaId||c.ferramentaId:ev.alvo||''})));return bc;}));return bg;}));if(p.designer.abas.indexOf(a)>0)ba.setCollapsed(true);return ba;}));
      }
      workspace.clearUndo();ultimaOrigem=origem;preview.srcdoc=sincronizarMenu({...p,codigos:{}}).codigos.web.texto;
      workspace.updateToolbox(toolbox());listarFerramentas();
      nota('Interface carregada. As cores distinguem estrutura, comandos e comportamentos.');
    }finally{workspace.setResizesEnabled(true);B.Events.enable();}B.svgResize(workspace);
  }
  function toolbox(){
    const contents=[['Estrutura','#2389e8',['hf_menu','hf_aba','hf_grupo']],['Comandos','#0c9e7c',['hf_comando']],['Eventos e ações','#9c40d6',['hf_regra']]].map(([name,colour,blocks])=>({kind:'category',name,colour,contents:blocks.map(type=>({kind:'block',type}))}));
    contents.push({kind:'category',name:'Ferramentas',colour:'#0c9e7c',contents:(ler().bancoFerramentas||[]).map(t=>({kind:'block',type:'hf_comando',fields:{NOME:t.nome||t.id,FERRAMENTA:t.id},inputs:{REGRAS:{block:{type:'hf_regra',fields:{DESTINO:t.id}}}}}))});
    return {kind:'categoryToolbox',contents};
  }
  function listarFerramentas(){
    const q=buscaFerramenta.toLocaleLowerCase('pt-BR');
    raiz.querySelector('.blockly-lista-ferramentas').replaceChildren(...(ler().bancoFerramentas||[]).filter(t=>`${t.nome} ${t.id}`.toLocaleLowerCase('pt-BR').includes(q)).map(t=>h('button',{type:'button',class:'bt',title:'Conectar ao bloco selecionado',onclick:()=>{
      const b=B.common.getSelected();
      if(b?.type==='hf_comando'){b.setFieldValue(t.id,'FERRAMENTA');b.setFieldValue(t.nome||t.id,'NOME');for(let r=b.getInputTargetBlock('REGRAS');r;r=r.getNextBlock())if(r.getFieldValue('ACAO')==='ferramenta')r.setFieldValue(t.id,'DESTINO');}
      else if(b?.type==='hf_regra'){b.setFieldValue('ferramenta','ACAO');b.setFieldValue(t.id,'DESTINO');}
      else nota('Selecione um comando ou comportamento para conectar a ferramenta. Você também pode arrastá-la da categoria Ferramentas.');
    }},h('strong',{},t.nome||t.id),h('code',{},t.id))));
  }
  function montar(){
    if(!raiz.isConnected)return;
    if(!workspace){workspace=B.inject(area,{renderer:'zelos',media:'blockly-media/',sounds:false,trashcan:true,grid:{spacing:24,length:2,colour:'#495261',snap:true},zoom:{controls:true,wheel:true,startScale:.7,minScale:.2,maxScale:1.5},move:{scrollbars:true,drag:true,wheel:true},toolbox:toolbox()});workspace.addChangeListener(e=>{if(e.type===B.Events.BLOCK_CHANGE||e.type===B.Events.BLOCK_MOVE||e.type===B.Events.BLOCK_CREATE||e.type===B.Events.BLOCK_DELETE)mensagem.textContent='Alterações nos blocos aguardando Aplicar blocos.';});carregar(true);}
    B.svgResize(workspace);
  }
  resize=new ResizeObserver(()=>montar());resize.observe(area);
  requestAnimationFrame(montar);
  return {raiz,render:()=>{requestAnimationFrame(()=>{montar();carregar();});},workspace:()=>workspace};
}
