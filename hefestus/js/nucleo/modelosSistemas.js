import { HEFESTUS_MENU_SPEC } from "./hefestusMenuSpec.js";
import { criarFaixaAxiom } from "./axiomFaixa.js";

/** Peças nativas: menus funcionam na prévia; comandos publicam sinais editáveis. */
export function criarModelosSistemas(h) {
  const {cont,botao,texto,ev,comAbertura}=h;
  const c={fundo:'#0b1120',painel:'#182133',linha:'#33415f',cor:'#e3e8f2',acento:'#38bdf8'};
  const grupo=(x,y,w,a,nome,ref,filhos,p={})=>cont(x,y,w,a,{}, {ref,grupo:true,'estilo.fundo':c.painel,...p},nome,filhos);
  const fechado=(extra={})=>comAbertura({iniciaFechado:true,fecharEsc:true,fecharFora:true,animacao:'nenhuma',...extra});
  const bt=(x,y,w,a,r,eventos,p={})=>botao(x,y,w,a,r,'transparent',c.cor,'transparent',{'estilo.raio':5,'estilo.tamanhoFonte':12,'estados.hover.fundo':'#123048','estados.ativo.fundo':'#123048',eventos,...p});
  const msg=grupo(300,210,440,100,'Retorno do comando','retorno',[
    texto(16,14,408,40,'Comando acionado. Configure o sinal no formulário de eventos.',c.cor,14),
    bt(300,64,120,28,'Fechar',[ev('onClick','fechar','retorno','hf|retorno|fechar')])
  ],{...fechado(),'estilo.borda':c.linha,'estilo.larguraBorda':1,'estilo.raio':8});
  const abas=HEFESTUS_MENU_SPEC;
  let x=10;
  const gatilhos=abas.map((a,i)=>{const w=a.nome.length*7+28;const e=bt(x,44,w,36,a.nome,[ev('onClick','mostrarSo',`aba_${i}`,`hf|aba|${a.id}`)],{'acessibilidade.role':'tab'});x+=w;return e;});
  // Faixa no estilo do editor: comandos grandes (ícone em cima) e pequenos (3 por coluna), grupos com divisor e nome embaixo.
  const GRANDE_L=78, PEQ_L=178, ALT_CMD=78, ALT_PEQ=26, ALT_GRUPO=118;
  const cmdGrande=(cmd,x,y,evs,sub)=>cont(x,y,GRANDE_L,ALT_CMD,{},{grupo:true,'estilo.raio':5,'estados.hover.fundo':'#123048','acessibilidade.role':'button','acessibilidade.ariaLabel':cmd.nome,eventos:evs},`Comando ${cmd.nome}`,[
    h.icone(17,6,34,cmd.icone||'estrela',c.acento),
    texto(2,44,GRANDE_L-4,32,cmd.nome+(cmd.sub?' ▾':''),c.cor,11,{'estilo.alinhamento':'centro'},`Rótulo ${cmd.nome}`)]);
  const cmdPequeno=(cmd,x,y,evs)=>cont(x,y,PEQ_L,ALT_PEQ,{},{grupo:true,'estilo.raio':4,'estados.hover.fundo':'#123048','acessibilidade.role':'button','acessibilidade.ariaLabel':cmd.nome,eventos:evs},`Comando ${cmd.nome}`,[
    h.icone(6,5,16,cmd.icone||'estrela',c.acento),
    texto(28,4,PEQ_L-(cmd.sub?46:34)-(cmd.atalho?0:0),18,cmd.nome,c.cor,12,{},`Rótulo ${cmd.nome}`),
    ...(cmd.sub?[texto(PEQ_L-16,4,12,18,'▾',c.cor,11,{},'Seta')]:[])]);
  const submenus=[];
  const paineis=abas.map((a,i)=>{
    let gx=12, gy=6, linhaH=ALT_GRUPO;
    const grupos=[];
    a.grupos.forEach((g,j)=>{
      const grandes=g.comandos.filter(k=>k.tam==='grande'), pequenos=g.comandos.filter(k=>k.tam!=='grande');
      const colP=Math.ceil(pequenos.length/3);
      const w=Math.max(grandes.length*(GRANDE_L+4)+colP*(PEQ_L+4), 60+g.nome.length*5);
      if (gx+w+14>1150 && gx>12) { gx=12; gy+=ALT_GRUPO+8; }
      const itens=[]; let cx=2;
      const evDe=cmd=>cmd.sub?[ev('onClick','alternar',`sub_${i}_${j}_${cmd.id}`,`hf|menu|${cmd.id}`)]:[ev('onClick','abrir','retorno',`hf|comando|${cmd.id}`)];
      const pos=(cmd,x,y,gxAbs,gyAbs,altura)=>{
        if(!cmd.sub) return;
        const n=cmd.sub.length;
        submenus.push(grupo(10+gxAbs+x,82+gyAbs+y+altura+2,224,n*28+10,`Submenu ${cmd.nome}`,`sub_${i}_${j}_${cmd.id}`,
          cmd.sub.map((sm,q)=>cont(6,5+q*28,212,26,{},{grupo:true,'estilo.raio':4,'estados.hover.fundo':'#123048',eventos:[ev('onClick','abrir','retorno',`hf|comando|${cmd.id}|${q}`)]},`Item ${sm.nome}`,[h.icone(6,5,16,sm.icone||'estrela',c.acento),texto(28,4,180,18,sm.nome,c.cor,12,{},`Rótulo ${sm.nome}`)])),
          {...fechado({fecharAoEscolher:true}),'estilo.borda':c.linha,'estilo.larguraBorda':1,'estilo.raio':8,'estilo.sombra':'media','acessibilidade.role':'menu'}));
      };
      grandes.forEach(cmd=>{itens.push(cmdGrande(cmd,cx,4,evDe(cmd)));pos(cmd,cx,4,gx,gy,ALT_CMD);cx+=GRANDE_L+4;});
      pequenos.forEach((cmd,k)=>{const x=cx+Math.floor(k/3)*(PEQ_L+4),y=4+(k%3)*(ALT_PEQ+0);itens.push(cmdPequeno(cmd,x,y,evDe(cmd)));pos(cmd,x,y,gx,gy,ALT_PEQ);});
      grupos.push(cont(gx,gy,w+4,ALT_GRUPO,{},{grupo:true,'estilo.borda':'transparent'},`Grupo ${g.nome}`,[
        ...itens,
        texto(0,ALT_GRUPO-22,w+4,16,g.nome,c.acento,11,{'estilo.alinhamento':'centro'},`Nome do grupo ${g.nome}`),
        ...(j<a.grupos.length-1?[h.linha(w+10,8,1,ALT_GRUPO-24,c.linha,'Divisor')]:[])]));
      gx+=w+16;
    });
    return cont(10,82,1160,gy+ALT_GRUPO+8,{},{ref:`aba_${i}`,'estilo.fundo':c.painel,'estilo.borda':c.linha,'estilo.larguraBorda':1,'acessibilidade.role':'tabpanel',...(i===0?comAbertura({iniciaFechado:false,fecharEsc:false,fecharFora:false,fecharAoEscolher:false,animacao:'nenhuma'}):fechado({fecharAoEscolher:false,fecharFora:false}))},`Faixa ${a.nome}`,grupos);
  });
  const menu={id:'menuHefestus',nome:'Menu do Hefestus — faixa editável',cat:'Sistemas',desc:'As abas do menu real do editor, grupos e comandos editáveis; menus fecham por Esc e clique fora; comandos emitem sinais hf|comando|id',tags:['hefestus','menu','ribbon','sistema'],raiz:grupo(0,0,1180,720,'Menu do Hefestus','hefestus',[
    texto(16,8,230,28,'⚒ HEFESTUS',c.acento,17),texto(350,8,420,28,'Projeto sem título — Hefestus',c.cor,13),
    bt(860,6,96,30,'Designer',[ev('onClick','mostrarSo','modo_designer','hf|modo|designer')]),
    bt(964,6,80,30,'Forja',[ev('onClick','mostrarSo','modo_forja','hf|modo|forja')]),
    bt(1052,6,112,30,'Camadas ▾',[ev('onClick','alternar','camadas','hf|camadas')]),
    grupo(0,80,1180,640,'Áreas de modo','modos',[
      grupo(0,0,1180,640,'Área Designer','modo_designer',[texto(24,470,900,30,'Designer · desenhe e organize os elementos do projeto',c.cor,15)]),
      grupo(0,0,1180,640,'Área Forja','modo_forja',[texto(24,470,900,30,'Forja · configure aparência, efeitos, comportamento e código',c.cor,15)],{...fechado({fecharEsc:false,fecharFora:false})})
    ]),...gatilhos,...paineis,...submenus,
    grupo(920,42,240,120,'Lista de camadas','camadas',['Cabeçalho','Faixas de opções','Área de trabalho'].map((r,i)=>bt(8,8+i*34,224,30,r,[ev('onClick','destacar','modos',`hf|camada|${i}`)])),{...fechado({fecharAoEscolher:true}),'acessibilidade.role':'menu'}),msg
  ],{'estilo.fundo':c.fundo})};

  const criarJanela=(grande)=>{
    const w=grande?1160:960,a=grande?680:540,ref=grande?'janela_ampla':'janela_normal';
    return grupo(grande?0:100,grande?0:70,w,a,grande?'Janela maximizada':'Janela de teste',ref,[
      texto(20,12,w-200,32,'◉ Testar interface',c.cor,20),
      bt(w-150,10,42,32,'—',[ev('onClick','mostrarSo','janela_minima','teste|minimizar')]),
      bt(w-104,10,42,32,'□',[ev('onClick','mostrarSo',grande?'janela_normal':'janela_ampla','teste|restaurar_tamanho')]),
      bt(w-58,10,42,32,'×',[ev('onClick','mostrarSo','janela_fechada','teste|fechar')]),
      grupo(18,58,w-36,a-124,'Conteúdo editável',`${ref}_conteudo`,[
        bt(80,60,120,48,'Botão',[ev('onClick','abrir','teste_retorno','teste|botao')],{'estilo.fundo':'#2563eb','estilo.cor':'#ffffff'})
      ],{'estilo.fundo':c.fundo}),
      texto(20,a-48,w-260,30,'Prévia interativa do projeto',c.cor,12),
      bt(w-220,a-50,200,34,'Voltar ao projeto',[ev('onClick','mostrarSo','janela_fechada','teste|voltar')])
    ],{'estilo.borda':c.linha,'estilo.larguraBorda':1,'estilo.raio':12,...(grande?fechado({fecharEsc:false,fecharFora:false}):comAbertura({iniciaFechado:false,fecharEsc:false,fecharFora:false}))});
  };
  const janela={id:'janelaTesteHefestus',nome:'Janela de teste — minimizar e maximizar',cat:'Sistemas',desc:'Mockup nativo com minimizar, restaurar, maximizar, fechar e reabrir; conteúdo editável e botão com retorno',tags:['janela','teste','mockup','hefestus'],raiz:grupo(0,0,1160,680,'Modelo da janela de teste','modelo_teste',[
    grupo(0,0,1160,680,'Estados da janela','janelas',[
      criarJanela(false),criarJanela(true),
      grupo(820,620,330,48,'Janela minimizada','janela_minima',[bt(0,0,330,48,'Restaurar teste da interface',[ev('onClick','mostrarSo','janela_normal','teste|restaurar')])],fechado({fecharEsc:false,fecharFora:false})),
      grupo(380,280,400,100,'Janela fechada','janela_fechada',[bt(20,20,360,48,'Abrir teste da interface',[ev('onClick','mostrarSo','janela_normal','teste|abrir')])],fechado({fecharEsc:false,fecharFora:false}))
    ]),
    grupo(350,240,440,130,'Retorno do botão','teste_retorno',[texto(20,18,400,38,'O comportamento do botão está funcionando.',c.cor,16),bt(290,76,130,34,'Fechar',[ev('onClick','fechar','teste_retorno','teste|retorno|fechar')])],{...fechado(),'estilo.borda':c.acento,'estilo.larguraBorda':1})
  ],{'estilo.fundo':'#0e1422'})};
  const axiom=criarFaixaAxiom(h);
  // Separar as barras dos painéis evita que a quebra das abas cubra os controles.
  axiom.raiz.largura = 2200; axiom.raiz.altura = 320;
  axiom.raiz.p.layout = { modo: 'livre', margem: 0, abracar: false };
  axiom.raiz.filhos.forEach((parte, i) => {
    parte.x = 0; parte.y = i < 2 ? 0 : 44;
    parte.largura = 2200; parte.altura = i === 0 ? 80 : i === 1 ? 40 : 180;
    parte.p.layout = { ...parte.p.layout, quebrar: false, abracar: false };
  });
  axiom.raiz.p["codigo.js"] = `// Comportamento padrão do modelo; edite na aba Código da Forja.
const arte = raiz.closest('.hf-arte');
const aplicar = perfil => {
  raiz.dataset.perfil = perfil;
  raiz.querySelectorAll('[data-perfis]').forEach(el => {
    const ocultar = !el.dataset.perfis.split(',').map(v => v.trim()).includes(perfil);
    if (ocultar && el.dataset.modeloPerfilAntes === undefined) { el.dataset.modeloPerfilAntes = el.hidden ? '1' : '0'; el.hidden = true; }
    else if (!ocultar && el.dataset.modeloPerfilAntes !== undefined) { el.hidden = el.dataset.modeloPerfilAntes === '1'; delete el.dataset.modeloPerfilAntes; }
  });
};
aplicar('avancado');
arte?.addEventListener('hefestus:sinal', e => {
  if (!raiz.contains(document.getElementById(e.detail.origem))) return;
  if (e.detail.sinal === 'ax|modo|easy') aplicar('simples');
  if (e.detail.sinal === 'ex|modo|adv') aplicar('avancado');
});`;

  const comandos = [["copiar","Copiar","duplicar"],["recortar","Recortar","recortar"],["colar","Colar","colar"],["duplicar","Duplicar","duplicar"],["agrupar","Agrupar","modelo"],["desagrupar","Desagrupar","selTudo"],["frente","Trazer para frente","frente"],["tras","Enviar para trás","tras"]];
  const compacto = { id: 'menuContextoCompacto', nome: 'Menu do mouse — compacto com busca', cat: 'Sistemas', desc: 'Busca de funções, ícones de edição e agrupamento, camadas e opções sem espaçamentos excessivos. Sinais editáveis nos eventos.', tags: ['contexto','mouse','compacto','busca'], raiz: grupo(0,0,540,340,'Menu do mouse compacto','modelo_contexto',[
    grupo(12,12,250,300,'Menu compacto','compacto',[
      h.el('campo',8,8,234,30,{placeholder:'Pesquisar função…','acessibilidade.ariaLabel':'Pesquisar função','estilo.fundo':c.fundo,'estilo.cor':c.cor},'Pesquisar função'),
      ...comandos.map(([id,nome,ic],i)=>grupo(8+(i%4)*59,44+Math.floor(i/4)*34,56,30,nome,`atalho_${id}`,[h.icone(19,6,18,ic,c.cor)],{'acessibilidade.role':'button','acessibilidade.ariaLabel':nome,'estados.hover.fundo':'#123048',eventos:[ev('onClick','abrir','retorno_compacto',`contexto|${id}`)]})),
      ...['Duplicar elemento','Excluir elemento','Editar forma','Selecionar tudo'].map((r,i)=>bt(8,118+i*30,234,28,r,[ev('onClick','abrir','retorno_compacto',`contexto|funcao|${i}`)],{'acessibilidade.role':'menuitem'}))
    ],{'estilo.raio':8,'estilo.borda':c.linha,'estilo.larguraBorda':1,'acessibilidade.ariaLabel':'Menu compacto'}),
    grupo(280,40,250,160,'Retorno do comando','retorno_compacto',[texto(12,12,226,72,'Comando acionado. Edite o sinal para conectar à função do seu projeto.',c.cor,13),bt(118,110,120,32,'Fechar',[ev('onClick','fechar','retorno_compacto','contexto|fechar')])],{...fechado(),'estilo.raio':8})
  ],{'estilo.fundo':c.fundo,'codigo.js': `// Busca local, editável na Forja.
const entrada = raiz.querySelector('input');
const menu = raiz.querySelector('[aria-label="Menu compacto"]');
const opcoes = [...menu.querySelectorAll('[role="button"], [role="menuitem"]')];
const normalizar = t => t.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();
entrada?.addEventListener('input', () => {
  const termo = normalizar(entrada.value);
  opcoes.forEach(el => { el.hidden = !!termo && !normalizar(el.getAttribute('aria-label') || el.textContent).includes(termo); });
});`}) };
  return [compacto,menu,janela,{...axiom,id:'menuAxiom',nome:'Menu do Axiom Studio — completo',cat:'Sistemas',desc:'Menu nativo baseado na estrutura disponível do Axiom: perfis simples, avançado e código, abas exclusivas e dropdowns; comandos emitem sinais ax| e ex| para integração.'}];
}
