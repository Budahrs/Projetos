// Modelos nativos derivados das referências visuais do usuário. Cada peça,
// estilo e vínculo é editável; nenhuma referência é inserida como screenshot.
export function criarModelosReferencia({ cont, botao, texto, icone, el, formas }) {
  const azul = "#4472c4", claro = "#738bd5", laranja = "#ed7d31";
  const ev = (tipo, acao, alvo, dispara, estilo) => ({ tipo, acao, alvo, dispara, ...(estilo ? { estilo } : {}) });
  const fechar = { iniciaFechado: true, fecharEsc: true, fecharFora: true, animacao: "nenhuma" };
  const grupo = (x,y,w,h,nome,ref,filhos,props={}) => cont(x,y,w,h,{}, { ref, grupo: true, ...props },nome,filhos);
  const b = (x,y,w,h,r,p={}) => botao(x,y,w,h,r,azul,"#ffffff",azul,{ "estilo.raio": 0, ...p });
  const painel = (x,y,w,h,nome,ref,filhos,props={}) => grupo(x,y,w,h,nome,ref,filhos,{ abertura:fechar,"estilo.fundo":"#ffffff","estilo.borda":"#cccccc","estilo.larguraBorda":1,"estilo.sombra":"media",...props });
  const cores = ["#ffffff","#000000","#e7e6e6","#44546a",azul,laranja,"#a5a5a5","#ffc000","#5b9bd5","#70ad47"];
  const tonalidade = (hex, nivel) => nivel === 0 ? hex : "#" + hex.slice(1).match(/../g).map(c => Math.round(parseInt(c,16) * (nivel === 1 ? 0.65 : 0.6) + (nivel === 1 ? 255*0.35 : 0)).toString(16).padStart(2,"0")).join("");
  const modelos=[];
  for(const [i,nome] of ["Separado com contorno","Separado plano","Conectado","Conectado arredondado","Abas coloridas","Abas coloridas arredondadas"].entries()) {
    const redondo=i===3||i===5, colorido=i>=4, conectado=i>=2;
    const abas=[0,1,2].map(j=>b(j*166,0,158,56,`Aba ${j+1}`,{
      ref:`aba${j}`,"estilo.fundo":colorido?[azul,claro,laranja][j]:j?claro:azul,
      "estilo.borda":i===0||i===1?"#305496":"transparent","estilo.larguraBorda":i===0?2:0,
      "estilo.raio":redondo?22:0,"estilo.cantos":redondo?[22,22,0,0]:[0,0,0,0],
      "estilo.tamanhoFonte":24,"estados.ativo.fundo":azul,"estados.ativo.cor":"#ffffff",
      "acessibilidade.role":"tab", eventos:[ev("onClick","mostrarSo",`corpo${j}`,`aba_${j+1}`)]
    }));
    const corpos=[0,1,2].map(j=>grupo(0,0,580,142,`Ribbon da aba ${j+1}`,`corpo${j}`,[
      texto(20,18,540,42,`Ribbon · Aba ${j+1}`,"#ffffff",26,{"estilo.alinhamento":"centro"}),
      ...["Comando 1","Comando 2","Comando 3"].map((r,k)=>b(20+k*180,82,168,40,r,{"estilo.fundo":"#ffffff22",eventos:[ev("onClick","","",`aba_${j+1}_comando_${k+1}`)]}))
    ],{ abertura:{iniciaFechado:j!==0,animacao:"nenhuma"},"estilo.fundo":azul,"estilo.raio":redondo?22:0 }));
    modelos.push({id:`ref-ribbon-${i+1}`,nome:`Ribbon — ${nome}`,cat:"Referências visuais",desc:"Três abas exclusivas, comandos e estados ativos editáveis",tags:["ribbon","abas","referência","funcional"],raiz:grupo(0,0,580,conectado?198:206,nome,"raiz",[
      grupo(0,0,580,56,"Abas","abas",abas,{"acessibilidade.role":"tablist"}),
      grupo(0,conectado?56:64,580,142,"Painéis do ribbon","paineis",corpos)
    ])});
  }
  // Mini barra + menu contextual e galerias editáveis. Tema claro e escuro.
  for(const escuro of [false,true]) {
    const fundo=escuro?"#252525":"#ffffff",cor=escuro?"#ffffff":"#202020",separador=escuro?"#666666":"#d9d9d9";
    const item=(y,r,sinal,p={})=>b(8,y,260,30,r,{"estilo.fundo":fundo,"estilo.cor":cor,"estilo.borda":"transparent","estados.hover.fundo":escuro?"#46556b":"#e7eef9",eventos:[ev("onClick","","",sinal)],...p});
    const comando=(x,r,alvo)=>b(x,6,100,52,r,{"estilo.fundo":fundo,"estilo.cor":cor,"estilo.borda":separador,"estilo.larguraBorda":1,eventos:[ev("onClick","alternar",alvo,`abrir_${alvo}`)]});
    const paleta=(ref,titulo,propriedade,x,y)=>painel(x,y,330,246,titulo,ref,[
      texto(10,8,310,24,titulo,cor,14),
      ...cores.flatMap((c,k)=>[0,1,2].map(l=>b(10+k*31,42+l*34,26,28,"",{
        "estilo.fundo":tonalidade(c,l),"estilo.opacidade":1,"estilo.borda":separador,"estilo.larguraBorda":1,
        "acessibilidade.ariaLabel":`${titulo} ${c} variação ${l+1}`,
        eventos:[ev("onClick","aplicarEstilo","amostra",`aplicar_${ref}`,{[propriedade]:tonalidade(c,l)})]
      }))),
      b(10,154,306,30,propriedade==="fundo"?"Sem preenchimento":"Sem contorno",{"estilo.fundo":fundo,"estilo.cor":cor,eventos:[ev("onClick","aplicarEstilo","amostra","remover_cor",{[propriedade]:"transparent"})]}),
      texto(10,196,306,34,"Cores, bordas e opções editáveis na Forja",cor,12)
    ],{"estilo.fundo":fundo,"acessibilidade.role":"menu","abertura.fecharAoEscolher":true});
    const estilos=painel(410,84,400,268,"Galeria de estilos","estilos",[
      texto(12,10,376,26,"Estilos de tema",cor,16),
      ...[azul,laranja,"#a5a5a5","#ffc000","#5b9bd5","#70ad47"].flatMap((c,k)=>[0,1,2].map(l=>b(12+k*64,52+l*64,56,54,"Abc",{
        "estilo.fundo":l===0?fundo:c,"estilo.cor":l===0?cor:"#ffffff","estilo.borda":c,"estilo.larguraBorda":l===2?0:2,"estilo.raio":10,
        eventos:[ev("onClick","aplicarEstilo","amostra","estilo_aplicado",{fundo:l===0?fundo:c,cor:l===0?cor:"#ffffff",borda:c,larguraBorda:l===2?0:2,raio:10})]
      })))
    ],{"estilo.fundo":fundo,"acessibilidade.role":"menu","abertura.fecharAoEscolher":true});
    const menu=painel(100,238,276,280,"Menu contextual","contexto",[
      item(6,"Recortar","recortar"),item(38,"Copiar","copiar"),
      texto(12,72,250,24,"Opções de colagem",cor,14),
      ...["Formato","Imagem","Texto"].map((r,k)=>b(10+k*86,102,80,34,r,{"estilo.fundo":fundo,"estilo.cor":cor,"estilo.borda":separador,eventos:[ev("onClick","","",`colar_${r.toLowerCase()}`)]})),
      item(144,"Editar forma ▸","formas",{eventos:[ev("onClick","alternar","formas","abrir_formas")]}),
      item(176,"Trazer para a frente","trazer_frente"),item(208,"Enviar para trás","enviar_tras"),item(240,"Formatar forma…","formatar_forma")
    ],{"estilo.fundo":fundo,"acessibilidade.role":"menu"});
    const formas=painel(410,84,330,260,"Galeria de formas","formas",[
      texto(12,10,306,30,"Alterar forma",cor,16),
      ...["Reta","Arredondada","Circular"].map((r,k)=>b(12+k*102,62,92,64,r,{
        "estilo.fundo":azul,"estilo.raio":k===0?0:k===1?16:32,
        eventos:[ev("onClick","aplicarEstilo","amostra","forma_aplicada",{raio:k===0?0:k===1?16:60})]
      })),
      texto(12,156,306,74,"Galeria de formatos do objeto. Edite pontos e formas vetoriais no Designer.",cor,13)
    ],{"estilo.fundo":fundo,"acessibilidade.role":"menu","abertura.fecharAoEscolher":true});
    modelos.push({id:`ref-contexto-${escuro?"escuro":"claro"}`,nome:`Menu contextual e galerias — ${escuro?"Escuro":"Claro"}`,cat:"Referências visuais",desc:"Botão direito, mini barra, estilos, preenchimento, contorno e formatos funcionais",tags:["contexto","paleta","galeria","office"],raiz:grupo(0,0,850,550,"Menu contextual completo","raiz",[
      b(16,90,180,120,"Objeto de exemplo",{ref:"amostra",eventos:[ev("onContext","abrir","contexto","menu_contextual")]}),
      texto(16,218,360,32,"Clique com o botão direito no objeto",cor,13),
      grupo(210,10,324,64,"Mini barra de formatação","mini",[comando(6,"Estilo ▾","estilos"),comando(112,"Preencher ▾","preenchimento"),comando(218,"Contorno ▾","contorno")],{"estilo.fundo":fundo,"estilo.sombra":"media"}),
      menu,estilos,paleta("preenchimento","Cores de preenchimento","fundo",410,84),paleta("contorno","Cores de contorno","borda",410,84),formas
    ],{"estilo.fundo":escuro?"#111111":"#f5f5f5"})});
  }
  modelos.push({id:"ref-lateral-expansivel",nome:"Barra lateral com painéis exclusivos",cat:"Referências visuais",desc:"Seis atalhos arredondados abrem painéis; Esc e clique fora fecham",tags:["lateral","painel","atalhos"],raiz:grupo(0,0,600,650,"Barra lateral expansível","raiz",[
    grupo(0,0,100,650,"Atalhos laterais","atalhos",[0,1,2,3,4,5].map(j=>b(14,14+j*105,72,90,`◈ ${j+1}`,{
      "estilo.raio":18,"estilo.borda":"#ffffff","estilo.larguraBorda":2,"estados.ativo.fundo":"#305496",
      eventos:[ev("onClick","mostrarSo",`lateral${j}`,`ferramenta_${j+1}`)]
    })),{"estilo.fundo":azul,"estilo.raio":22,"estilo.borda":"#ffffff","estilo.larguraBorda":2}),
    grupo(100,0,500,650,"Painéis laterais","paineis",[0,1,2,3,4,5].map(j=>painel(0,0,500,650,`Painel da ferramenta ${j+1}`,`lateral${j}`,[
      texto(24,20,400,46,`Ferramenta ${j+1}`,"#ffffff",26),
      b(436,14,44,36,"×",{eventos:[ev("onClick","fechar",`lateral${j}`,"fechar_painel")]}),
      texto(24,90,440,64,"Adicione opções e controles editáveis neste painel.","#ffffff",17)
    ],{"estilo.fundo":"#365fa3","estilo.raio":22,"estilo.borda":"transparent"})))
  ])});
  modelos.push({id:"ref-controles-flutuantes",nome:"Controles flutuantes — modos e opções",cat:"Referências visuais",desc:"Botões em cápsula, modos exclusivos, camadas e opções recolhíveis",tags:["flutuante","modos","camadas","opções"],raiz:grupo(0,0,760,370,"Controles flutuantes","raiz",[
    grupo(0,90,700,240,"Conteúdo dos modos","modos",["Designer","Fábrica"].map((r,j)=>grupo(0,0,700,240,`Área ${r}`,`modo${j}`,[texto(24,24,640,64,`Modo ${r}`,"#ffffff",26)],{abertura:{iniciaFechado:j!==0},"estilo.fundo":"#363343","estilo.raio":22}))),
    grupo(0,0,440,56,"Seletor de modo","seletor",["Designer","Fábrica"].map((r,j)=>b(j*154,0,144,48,r,{"estilo.fundo":"#403c4b","estilo.raio":26,"estilo.sombra":"media","estados.ativo.fundo":"#625b75",eventos:[ev("onClick","mostrarSo",`modo${j}`,`modo_${j}`)]}))),
    b(310,0,154,48,"Camadas ▾",{"estilo.fundo":"#403c4b","estilo.raio":26,eventos:[ev("onClick","alternar","camadas","abrir_camadas")]}),
    b(480,0,260,48,"Apresentação | Opções ▾ ⚙",{"estilo.fundo":"#403c4b","estilo.raio":26,eventos:[ev("onClick","alternar","opcoes","abrir_opcoes")]}),
    painel(310,56,220,120,"Lista de camadas","camadas",["Ribbon (grupo)","Barra lateral (grupo)","Menu (grupo)"].map((r,j)=>b(8,8+j*34,204,30,r,{eventos:[ev("onClick","","",`selecionar_camada_${j}`)]})),{"acessibilidade.role":"menu","abertura.fecharAoEscolher":true}),
    painel(480,56,210,120,"Opções de apresentação","opcoes",[b(10,10,190,38,"Recolher opções",{eventos:[ev("onClick","fechar","opcoes","recolher_opcoes")]}),b(10,60,190,38,"Configurações",{eventos:[ev("onClick","","","configuracoes")]})],{"acessibilidade.role":"menu"})
  ])});
  const entradas = Object.entries(formas);
  const alturaGaleria = 48 + Math.ceil(entradas.length / 10) * 44;
  modelos.push({id:"ref-galeria-formas",nome:"Galeria de formas — categorias Office",cat:"Referências visuais",desc:"Formas vetoriais editáveis com escolha aplicada ao objeto de exemplo",tags:["formas","galeria","vetor","office"],raiz:grupo(0,0,800,Math.max(260,alturaGaleria+80),"Galeria de formas","raiz",[
    el("forma",12,70,170,130,{ref:"amostra",forma:"retangulo",texto:"Objeto de exemplo","estilo.fundo":azul,"estilo.cor":"#ffffff","estilo.borda":"#305496","estilo.larguraBorda":2},"Forma de exemplo"),
    b(210,12,230,42,"Alterar forma ▾",{eventos:[ev("onClick","alternar","galeria","abrir_galeria_formas")]}),
    painel(210,60,570,alturaGaleria,"Formas disponíveis","galeria",[
      texto(12,8,546,28,"Retângulos · Básicas · Setas · Fluxograma · Estrelas", "#333333",13),
      ...entradas.map(([id,f],k)=>el("forma",16+(k%10)*54,46+Math.floor(k/10)*44,36,30,{forma:id,"estilo.fundo":"#ffffff","estilo.borda":"#586174","estilo.larguraBorda":1,"acessibilidade.ariaLabel":f.nome,eventos:[{...ev("onClick","aplicarForma","amostra","forma_escolhida"),forma:id}]},f.nome))
    ],{"acessibilidade.role":"menu","abertura.fecharAoEscolher":true})
  ])});
  return modelos;
}
