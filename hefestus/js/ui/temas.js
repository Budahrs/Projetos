import { CATALOGO_TEMAS, TOKENS_TEMA, resolverModoSistema, validarTemaCompartilhado, pacoteTemas } from "../nucleo/temasCompartilhados.js";
// Temas da INTERFACE (menus, barras, painéis, área de trabalho). Nunca tocam no
// documento: o canvas e as cores dos elementos ficam exatamente como estão.
// Paletas dos ELEMENTOS são outra coisa e só mudam o documento quando pedidas.

const BASE_CLARA = {
  "--chrome": "#f2f3f6", "--chrome-2": "#e7e9ef", "--superficie": "#ffffff", "--area": "#d8dce4",
  "--linha": "#d2d6df", "--linha-forte": "#b9bfcc", "--texto": "#1c2130", "--texto-2": "#5a6274", "--texto-3": "#8a91a1",
  "--ok": "#2f7d4f", "--alerta": "#a35a00", "--erro": "#b42318",
  "--hover": "rgba(28, 33, 48, 0.06)", "--press": "rgba(28, 33, 48, 0.11)", "--sombra": "0 8px 24px rgba(20, 24, 36, 0.18)",
  "--aba-marca": "transparent", "color-scheme": "light",
};
const BASE_ESCURA = {
  "--chrome": "#1b1e25", "--chrome-2": "#15171d", "--superficie": "#20242c", "--area": "#0f1115",
  "--linha": "#2f343f", "--linha-forte": "#434957", "--texto": "#e6e8ee", "--texto-2": "#a0a7b5", "--texto-3": "#6f7686",
  "--ok": "#5fbf86", "--alerta": "#f0a63a", "--erro": "#f2867c",
  "--hover": "rgba(230, 232, 238, 0.07)", "--press": "rgba(230, 232, 238, 0.13)", "--sombra": "0 10px 28px rgba(0, 0, 0, 0.5)",
  "--aba-marca": "transparent", "color-scheme": "dark",
};

const TEMAS_LEGADOS = {
  automatico: { nome: "Automático", desc: "Segue o claro/escuro do sistema", previa: ["#8a4f0d", "#f2f3f6", "#2a231b"], vars: null },
  forja: {
    nome: "Forja", desc: "Bronze sobre claro", previa: ["#8a4f0d", "#ffffff", "#96570f"],
    vars: { ...BASE_CLARA, "--acento": "#96570f", "--acento-forte": "#774409", "--acento-suave": "#f4e7d6", "--sobre-acento": "#ffffff",
      "--banda": "#8a4f0d", "--banda-contexto": "#a8641a", "--banda-hover": "rgba(255, 255, 255, 0.16)", "--banda-linha": "rgba(255, 255, 255, 0.28)", "--sobre-banda": "#ffffff" },
  },
  escuro: {
    nome: "Forja escuro", desc: "Bronze sobre escuro", previa: ["#2a231b", "#20242c", "#e0a458"],
    vars: { ...BASE_ESCURA, "--acento": "#e0a458", "--acento-forte": "#f0ba72", "--acento-suave": "#3a2b18", "--sobre-acento": "#1b1e25",
      "--banda": "#2a231b", "--banda-contexto": "#3d2f1f", "--banda-hover": "rgba(240, 186, 114, 0.14)", "--banda-linha": "rgba(240, 186, 114, 0.25)", "--sobre-banda": "#f3d5ab" },
  },
  grafite: {
    nome: "Grafite", desc: "Cinza neutro de estúdio", previa: ["#333333", "#4f4f4f", "#6a9de0"],
    vars: { ...BASE_ESCURA,
      "--chrome": "#424242", "--chrome-2": "#393939", "--superficie": "#4c4c4c", "--area": "#575757",
      "--linha": "#333333", "--linha-forte": "#5f5f5f", "--texto": "#ececec", "--texto-2": "#c2c2c2", "--texto-3": "#929292",
      "--acento": "#6a9de0", "--acento-forte": "#93bbf0", "--acento-suave": "#45566e", "--sobre-acento": "#0f1622",
      "--hover": "rgba(255, 255, 255, 0.07)", "--press": "rgba(255, 255, 255, 0.13)",
      "--banda": "#333333", "--banda-contexto": "#3c4b60", "--banda-hover": "rgba(255, 255, 255, 0.09)", "--banda-linha": "rgba(255, 255, 255, 0.14)", "--sobre-banda": "#e4e4e4" },
  },
  claro: {
    nome: "Claro", desc: "Branco limpo, azul nos destaques", previa: ["#ffffff", "#f5f6f8", "#2563eb"],
    vars: { ...BASE_CLARA,
      "--chrome": "#f5f6f8", "--chrome-2": "#eceef2", "--area": "#e3e6eb", "--linha": "#dfe2e8", "--linha-forte": "#c5cad4",
      "--acento": "#2563eb", "--acento-forte": "#1d4ed8", "--acento-suave": "#e6eefc", "--sobre-acento": "#ffffff",
      "--banda": "#ffffff", "--banda-contexto": "#eaf1fd", "--banda-hover": "rgba(29, 36, 51, 0.06)", "--banda-linha": "#dfe2e8", "--sobre-banda": "#1d2433",
      "--aba-marca": "#2563eb" },
  },
  azul: {
    nome: "Azul", desc: "Faixa azul clássica", previa: ["#2b579a", "#ffffff", "#2b579a"],
    vars: { ...BASE_CLARA, "--acento": "#2b579a", "--acento-forte": "#1e3f73", "--acento-suave": "#dde7f5", "--sobre-acento": "#ffffff",
      "--banda": "#2b579a", "--banda-contexto": "#3f6db3", "--banda-hover": "rgba(255, 255, 255, 0.16)", "--banda-linha": "rgba(255, 255, 255, 0.3)", "--sobre-banda": "#ffffff" },
  },
  ambar: {
    nome: "Âmbar", desc: "Grafite escuro com dourado Hefestus", previa: ["#1a1c20", "#24272e", "#d4a359"],
    vars: { ...BASE_ESCURA,
      "--chrome": "#1a1c20", "--chrome-2": "#121316", "--superficie": "#24272e", "--area": "#121316",
      "--linha": "#2e323b", "--linha-forte": "#434957", "--texto": "#ededed", "--texto-2": "#8e95a2", "--texto-3": "#6a7080",
      "--acento": "#d4a359", "--acento-forte": "#e6b974", "--acento-suave": "#33291a", "--sobre-acento": "#17140e",
      "--hover": "#323742", "--press": "#3b4150", "--sombra": "0 4px 16px rgba(0, 0, 0, 0.4)",
      "--banda": "#1a1c20", "--banda-contexto": "#2d2619", "--banda-hover": "#323742", "--banda-linha": "#2e323b", "--sobre-banda": "#ededed" },
  },
  meiaNoite: {
    nome: "Meia-noite", desc: "Azul-marinho com ciano", previa: ["#0b1120", "#182133", "#38bdf8"],
    vars: { ...BASE_ESCURA,
      "--chrome": "#131a2a", "--chrome-2": "#0e1422", "--superficie": "#182133", "--area": "#0a0f1a",
      "--linha": "#243049", "--linha-forte": "#33415f", "--texto": "#e3e8f2", "--texto-2": "#9aa6bd", "--texto-3": "#66728a",
      "--acento": "#38bdf8", "--acento-forte": "#7dd3fc", "--acento-suave": "#123048", "--sobre-acento": "#06121c",
      "--banda": "#0b1120", "--banda-contexto": "#13253d", "--banda-hover": "rgba(56, 189, 248, 0.12)", "--banda-linha": "rgba(56, 189, 248, 0.22)", "--sobre-banda": "#cfe7f7" },
  },
};

/** Sinônimos aceitos pelo agente e pela busca. */
const ALIAS_TEMA_UI = {
  automatico: "automatico", sistema: "automatico", padrao: "automatico",
  forja: "forja", bronze: "forja",
  escuro: "escuro", escura: "escuro", noturno: "escuro",
  grafite: "grafite", cinza: "grafite", estudio: "grafite",
  claro: "claro", clara: "claro", branco: "claro", branca: "claro",
  azul: "azul", office: "azul",
  ambar: "ambar", ambarescuro: "ambar", dourado: "ambar", "meia-noite": "meiaNoite", "meia noite": "meiaNoite", meianoite: "meiaNoite", marinho: "meiaNoite",
};

const ESTILOS_MENU = {
  faixa: { nome: "Faixa de opções", desc: "Abas com grupos de botões, como no Office" },
  classico: { nome: "Barra de menus", desc: "Menus suspensos com submenus, como no Clip Studio" },
};

const FORMATOS = {
  quadrado: { nome: "Quadrado", desc: "Cantos retos, visual técnico" },
  arredondado: { nome: "Arredondado", desc: "Cantos suaves" },
  moderno: { nome: "Moderno", desc: "Cantos amplos, cartões flutuantes" },
};

/** Miniatura do tema: faixa, superfície e destaque. */
function miniaturaTema(chave, tam = 36) {
  const [banda, sup, acento] = (TEMAS_UI[chave] ?? TEMAS_UI.automatico).previa;
  if (chave === "automatico") {
    return `<svg width="${tam}" height="${Math.round(tam * 0.7)}" viewBox="0 0 36 25" aria-hidden="true"><rect x=".5" y=".5" width="35" height="24" rx="3" fill="#f2f3f6" stroke="#8884"/><path d="M36 0V25H0Z" fill="#20242c"/><rect x=".5" y=".5" width="35" height="7" rx="3" fill="#8a4f0d"/><rect x="5" y="13" width="12" height="3" rx="1.5" fill="#96570f"/><rect x="19" y="17" width="12" height="3" rx="1.5" fill="#e0a458"/></svg>`;
  }
  return `<svg width="${tam}" height="${Math.round(tam * 0.7)}" viewBox="0 0 36 25" aria-hidden="true"><rect x=".5" y=".5" width="35" height="24" rx="3" fill="${sup}" stroke="#8884"/><rect x=".5" y=".5" width="35" height="7" rx="3" fill="${banda}" stroke="#8884"/><rect x="5" y="13" width="14" height="3" rx="1.5" fill="${acento}"/><rect x="5" y="18" width="22" height="2" rx="1" fill="#8888"/></svg>`;
}

// ---------------- paletas dos elementos (mudam o documento) ----------------
const PALETAS = {
  claro: {
    nome: "Clara", tela: "#ffffff",
    tipos: {
      botao: ["#2563eb", "#ffffff", "#1d4ed8"], caixa: ["#f8fafc", "#1f2937", "#cbd5e1"], texto: ["transparent", "#1f2937", "transparent"],
      campo: ["#ffffff", "#1f2937", "#d1d5db"], toggle: ["#cbd5e1", "#ffffff", "transparent"], menu: ["#ffffff", "#1f2937", "#e5e7eb"],
      modal: ["#ffffff", "#1f2937", "#e5e7eb"], toast: ["#111827", "#f9fafb", "transparent"],
    },
  },
  escuro: {
    nome: "Escura", tela: "#0b1220",
    tipos: {
      botao: ["#3b82f6", "#ffffff", "#2563eb"], caixa: ["#111827", "#e5e7eb", "#1f2937"], texto: ["transparent", "#e5e7eb", "transparent"],
      campo: ["#0f172a", "#e5e7eb", "#334155"], toggle: ["#334155", "#e5e7eb", "transparent"], menu: ["#111827", "#e5e7eb", "#1f2937"],
      modal: ["#111827", "#e5e7eb", "#1f2937"], toast: ["#f9fafb", "#111827", "transparent"],
    },
  },
  forja: {
    nome: "Forja", tela: "#1c1917",
    tipos: {
      botao: ["#c2410c", "#fff7ed", "#9a3412"], caixa: ["#292524", "#f5f5f4", "#44403c"], texto: ["transparent", "#f5f5f4", "transparent"],
      campo: ["#1c1917", "#f5f5f4", "#57534e"], toggle: ["#57534e", "#fff7ed", "transparent"], menu: ["#292524", "#f5f5f4", "#44403c"],
      modal: ["#292524", "#f5f5f4", "#44403c"], toast: ["#fff7ed", "#1c1917", "transparent"],
    },
  },
};

// Paletas compartilhadas com PDF Studio; nomes próprios e origem declarada.
TEMAS_LEGADOS["studio_oficina"] = {nome:"Studio · Oficina",desc:"Hefestus · verde e superfícies claras",previa:["#123D38", "#136E61", "#FFFFFF"],vars:{...BASE_CLARA,...{"--chrome": "#F5F6F8", "--chrome-2": "#E7EBEE", "--superficie": "#FFFFFF", "--area": "#E7EBEE", "--texto": "#182B36", "--texto-2": "#4B6068", "--texto-3": "#4B6068", "--linha": "#87989F", "--linha-forte": "#87989F", "--acento": "#136E61", "--acento-forte": "#136E61", "--acento-suave": "#D8F88C", "--sobre-acento": "#ffffff", "--banda": "#123D38", "--banda-contexto": "#123D38", "--sobre-banda": "#FFFFFF"}}};
TEMAS_LEGADOS["studio_horizonte"] = {nome:"Studio · Horizonte",desc:"Windows / Fluent · azul",previa:["#123E72", "#075CB7", "#FFFFFF"],vars:{...BASE_CLARA,...{"--chrome": "#F3F6FA", "--chrome-2": "#E5ECF4", "--superficie": "#FFFFFF", "--area": "#E5ECF4", "--texto": "#192B40", "--texto-2": "#4A6078", "--texto-3": "#4A6078", "--linha": "#899EB5", "--linha-forte": "#899EB5", "--acento": "#075CB7", "--acento-forte": "#075CB7", "--acento-suave": "#D9EAFF", "--sobre-acento": "#ffffff", "--banda": "#123E72", "--banda-contexto": "#123E72", "--sobre-banda": "#FFFFFF"}}};
TEMAS_LEGADOS["studio_aurora"] = {nome:"Studio · Aurora",desc:"macOS · tons neutros e violeta",previa:["#443153", "#674199", "#FFFFFF"],vars:{...BASE_CLARA,...{"--chrome": "#F6F4FA", "--chrome-2": "#ECE8F2", "--superficie": "#FFFFFF", "--area": "#ECE8F2", "--texto": "#30263D", "--texto-2": "#65556F", "--texto-3": "#65556F", "--linha": "#A095AE", "--linha-forte": "#A095AE", "--acento": "#674199", "--acento-forte": "#674199", "--acento-suave": "#EBDFFF", "--sobre-acento": "#ffffff", "--banda": "#443153", "--banda-contexto": "#443153", "--sobre-banda": "#FFFFFF"}}};
TEMAS_LEGADOS["studio_rubi"] = {nome:"Studio · Rubi",desc:"Acrobat · acento vermelho",previa:["#762030", "#A12436", "#FFFFFF"],vars:{...BASE_CLARA,...{"--chrome": "#FAF5F5", "--chrome-2": "#F1E8E8", "--superficie": "#FFFFFF", "--area": "#F1E8E8", "--texto": "#382326", "--texto-2": "#6E5055", "--texto-3": "#6E5055", "--linha": "#AD9298", "--linha-forte": "#AD9298", "--acento": "#A12436", "--acento-forte": "#A12436", "--acento-suave": "#FFE0E5", "--sobre-acento": "#ffffff", "--banda": "#762030", "--banda-contexto": "#762030", "--sobre-banda": "#FFFFFF"}}};
TEMAS_LEGADOS["studio_cobalto"] = {nome:"Studio · Cobalto",desc:"PDF-XChange · azul de ferramentas",previa:["#163D5C", "#145A91", "#FFFFFF"],vars:{...BASE_CLARA,...{"--chrome": "#F2F6FA", "--chrome-2": "#DFE8F0", "--superficie": "#FFFFFF", "--area": "#DFE8F0", "--texto": "#172E41", "--texto-2": "#4D6175", "--texto-3": "#4D6175", "--linha": "#8399AD", "--linha-forte": "#8399AD", "--acento": "#145A91", "--acento-forte": "#145A91", "--acento-suave": "#D9EDFF", "--sobre-acento": "#ffffff", "--banda": "#163D5C", "--banda-contexto": "#163D5C", "--sobre-banda": "#FFFFFF"}}};
TEMAS_LEGADOS["studio_coral"] = {nome:"Studio · Coral",desc:"iLovePDF · cores quentes",previa:["#7C3022", "#A13C24", "#FFFFFF"],vars:{...BASE_CLARA,...{"--chrome": "#FFF7F4", "--chrome-2": "#F5E5DF", "--superficie": "#FFFFFF", "--area": "#F5E5DF", "--texto": "#432A24", "--texto-2": "#77554A", "--texto-3": "#77554A", "--linha": "#AF9489", "--linha-forte": "#AF9489", "--acento": "#A13C24", "--acento-forte": "#A13C24", "--acento-suave": "#FFE0D4", "--sobre-acento": "#ffffff", "--banda": "#7C3022", "--banda-contexto": "#7C3022", "--sobre-banda": "#FFFFFF"}}};
TEMAS_LEGADOS["studio_mosaico"] = {nome:"Studio · Mosaico",desc:"PDF Split and Merge · organização modular",previa:["#30365E", "#454CAC", "#FFFFFF"],vars:{...BASE_CLARA,...{"--chrome": "#F4F6FB", "--chrome-2": "#E5E9F4", "--superficie": "#FFFFFF", "--area": "#E5E9F4", "--texto": "#282D49", "--texto-2": "#555D7C", "--texto-3": "#555D7C", "--linha": "#969DB4", "--linha-forte": "#969DB4", "--acento": "#454CAC", "--acento-forte": "#454CAC", "--acento-suave": "#E1E3FF", "--sobre-acento": "#ffffff", "--banda": "#30365E", "--banda-contexto": "#30365E", "--sobre-banda": "#FFFFFF"}}};
TEMAS_LEGADOS["studio_caderno"] = {nome:"Studio · Caderno",desc:"Office / LibreOffice · superfície de trabalho",previa:["#28543A", "#2D6944", "#FFFFFF"],vars:{...BASE_CLARA,...{"--chrome": "#F5F7F4", "--chrome-2": "#E7ECE4", "--superficie": "#FFFFFF", "--area": "#E7ECE4", "--texto": "#26382B", "--texto-2": "#526657", "--texto-3": "#526657", "--linha": "#8E9E90", "--linha-forte": "#8E9E90", "--acento": "#2D6944", "--acento-forte": "#2D6944", "--acento-suave": "#DDEFE0", "--sobre-acento": "#ffffff", "--banda": "#28543A", "--banda-contexto": "#28543A", "--sobre-banda": "#FFFFFF"}}};
TEMAS_LEGADOS["studio_forja"] = {nome:"Studio · Forja",desc:"Axiom Studio · grafite e azul",previa:["#161D29", "#80BFFF", "#292F39"],vars:{...BASE_ESCURA,...{"--chrome": "#20252D", "--chrome-2": "#171B22", "--superficie": "#292F39", "--area": "#171B22", "--texto": "#F1F5FA", "--texto-2": "#BECADB", "--texto-3": "#BECADB", "--linha": "#77869B", "--linha-forte": "#77869B", "--acento": "#80BFFF", "--acento-forte": "#80BFFF", "--acento-suave": "#344F70", "--sobre-acento": "#111111", "--banda": "#161D29", "--banda-contexto": "#161D29", "--sobre-banda": "#F1F5FA"}}};
TEMAS_LEGADOS["studio_palco"] = {nome:"Studio · Palco",desc:"Anima Studio · ambiente de criação",previa:["#1C1528", "#C5A2FF", "#302A3C"],vars:{...BASE_ESCURA,...{"--chrome": "#24202D", "--chrome-2": "#19151F", "--superficie": "#302A3C", "--area": "#19151F", "--texto": "#F7F0FF", "--texto-2": "#CDBDDE", "--texto-3": "#CDBDDE", "--linha": "#9382AA", "--linha-forte": "#9382AA", "--acento": "#C5A2FF", "--acento-forte": "#C5A2FF", "--acento-suave": "#514064", "--sobre-acento": "#111111", "--banda": "#1C1528", "--banda-contexto": "#1C1528", "--sobre-banda": "#F7F0FF"}}};
TEMAS_LEGADOS["studio_terracota"] = {nome:"Studio · Terracota",desc:"Linux / Ubuntu · tons terrosos",previa:["#642E20", "#974321", "#FFFFFF"],vars:{...BASE_CLARA,...{"--chrome": "#FAF5F1", "--chrome-2": "#EEE3DC", "--superficie": "#FFFFFF", "--area": "#EEE3DC", "--texto": "#3F2926", "--texto-2": "#72594F", "--texto-3": "#72594F", "--linha": "#A68E81", "--linha-forte": "#A68E81", "--acento": "#974321", "--acento-forte": "#974321", "--acento-suave": "#F8DEC8", "--sobre-acento": "#ffffff", "--banda": "#642E20", "--banda-contexto": "#642E20", "--sobre-banda": "#FFFFFF"}}};
TEMAS_LEGADOS["studio_farol"] = {nome:"Studio · Farol",desc:"Alto contraste · leitura e foco",previa:["#000000", "#FFFF00", "#101010"],vars:{...BASE_ESCURA,...{"--chrome": "#000000", "--chrome-2": "#000000", "--superficie": "#101010", "--area": "#000000", "--texto": "#FFFFFF", "--texto-2": "#E5E5E5", "--texto-3": "#E5E5E5", "--linha": "#FFFFFF", "--linha-forte": "#FFFFFF", "--acento": "#FFFF00", "--acento-forte": "#FFFF00", "--acento-suave": "#333300", "--sobre-acento": "#111111", "--banda": "#000000", "--banda-contexto": "#000000", "--sobre-banda": "#FFFFFF"}}};

// Registry shared by the editor and exported theme packages.
const mapaTokens={interface:'--chrome',painel:'--superficie',area:'--area',texto:'--texto',secundario:'--texto-2',borda:'--linha',acento:'--acento',selecao:'--acento-suave',cabecalho:'--banda',textoCabecalho:'--sobre-banda'};
function temaInterface(t){
 const escuro=t.modo==='dark';const vars={...(escuro?BASE_ESCURA:BASE_CLARA)};
 for(const [k,v] of Object.entries(mapaTokens))vars[v]=t.tokens[k];
 Object.assign(vars,{'--chrome-2':t.tokens.area,'--linha-forte':t.tokens.borda,'--texto-3':t.tokens.secundario,'--acento-forte':t.tokens.acento,'--banda-contexto':t.tokens.cabecalho,'--sobre-acento':escuro?'#17212B':'#F0F2F4'});
 return {nome:t.nome,desc:'Tema de interface; documento preservado',previa:[t.tokens.cabecalho,t.tokens.painel,t.tokens.acento],vars,contrato:t};
}
const TEMAS_UI={automatico:{nome:'System / Auto',desc:'Acompanha o sistema; mantém superfícies confortáveis',previa:['#303944','#E8EAED','#225A88'],vars:null},...Object.fromEntries(Object.entries(CATALOGO_TEMAS).map(([k,v])=>[k,temaInterface(v)]))};
const variantes={forja:'Light · Bronze',escuro:'Dark · Bronze',grafite:'Dim · Graphite',azul:'Light · Blue',meiaNoite:'Dark · Midnight',studio_oficina:'Light · Green',studio_horizonte:'Light · Horizon',studio_aurora:'Light · Violet',studio_rubi:'Light · Red',studio_cobalto:'Light · Cobalt',studio_coral:'Light · Coral',studio_mosaico:'Light · Indigo',studio_caderno:'Light · Notebook',studio_forja:'Dark · Blue',studio_palco:'Dark · Violet',studio_terracota:'Light · Terracotta'};
for(const [id,nome] of Object.entries(variantes)){
 const old=TEMAS_LEGADOS[id],dark=old.vars['color-scheme']==='dark';const base=CATALOGO_TEMAS[dark?'dark':'light'];
 // Keep distinct accent variants; neutral surfaces/foregrounds follow the comfort contract.
 const t={...base,id,nome,tokens:{...base.tokens,acento:old.vars['--acento']},origem:'variante legada '+id};TEMAS_UI[id]=temaInterface(t);
}
Object.defineProperty(TEMAS_UI,'claro',{value:TEMAS_UI.light,enumerable:false});
Object.defineProperty(TEMAS_UI,'studio_farol',{value:TEMAS_UI.highContrast,enumerable:false});
ALIAS_TEMA_UI.light='light';ALIAS_TEMA_UI.dark='dark';ALIAS_TEMA_UI.dim='dim';ALIAS_TEMA_UI['high contrast']='highContrast';ALIAS_TEMA_UI.system='automatico';
const chaveTemasUsuario='hefestus.temas-usuario.v1';
function carregarTemasUsuario(){
 try{const lista=JSON.parse(globalThis.localStorage?.getItem(chaveTemasUsuario)||'[]');if(Array.isArray(lista))for(const t of lista){if(t.id?.startsWith('user_')&&!validarTemaCompartilhado(t).length)TEMAS_UI[t.id]=temaInterface(t);}}catch{}
}
carregarTemasUsuario();
function salvarTemaUsuario(t){
 const erros=validarTemaCompartilhado(t);if(erros.length)throw Error(erros.join('\n'));
 if(!t.id.startsWith('user_'))throw Error('Temas personalizados usam identificador user_.');
 for(const [id,existente] of Object.entries(TEMAS_UI))if(existente.contrato&&existente.contrato.modo===t.modo&&TOKENS_TEMA.every(k=>existente.contrato.tokens[k].toLowerCase()===t.tokens[k].toLowerCase()))return id;
 const antigos=JSON.parse(localStorage.getItem(chaveTemasUsuario)||'[]');if(!Array.isArray(antigos))throw Error('Catálogo local inválido; exporte antes de restaurar.');
 const copia=JSON.parse(JSON.stringify(t));localStorage.setItem(chaveTemasUsuario,JSON.stringify([...antigos.filter(x=>x.id!==t.id),copia]));TEMAS_UI[t.id]=temaInterface(copia);return t.id;
}
function importarTemasUsuario(pacote,origem='pacote importado'){
 if(pacote?.formato!=='hefestus.temas'||pacote.versao!==1||!Array.isArray(pacote.temas)||pacote.temas.length>100)throw Error('Importe até 100 temas em um pacote hefestus.temas versão 1.');
 const lote=pacote.temas.map((t,i)=>({...JSON.parse(JSON.stringify(t)),id:'user_'+Date.now()+'_'+i,origem}));
 const erros=lote.flatMap(t=>validarTemaCompartilhado(t));if(erros.length)throw Error(erros.join('\n'));
 const antigos=JSON.parse(localStorage.getItem(chaveTemasUsuario)||'[]');if(!Array.isArray(antigos))throw Error('Catálogo local inválido.');
 const existentes=Object.entries(TEMAS_UI).filter(([,t])=>t.contrato).map(([id,t])=>({id,contrato:t.contrato})),novos=[];
 for(const t of lote){const mesmo=[...existentes,...novos.map(t=>({id:t.id,contrato:t}))].some(x=>x.contrato.modo===t.modo&&TOKENS_TEMA.every(k=>x.contrato.tokens[k].toLowerCase()===t.tokens[k].toLowerCase()));if(!mesmo)novos.push(t);}
 localStorage.setItem(chaveTemasUsuario,JSON.stringify([...antigos,...novos]));for(const t of novos)TEMAS_UI[t.id]=temaInterface(t);
 return {conferidos:lote.length,adicionados:novos.length,reutilizados:lote.length-novos.length};
}
function exportarTemas(){return pacoteTemas(Object.values(TEMAS_UI).filter(t=>t.contrato).map(t=>t.contrato));}
let limparObservadoresTema=()=>{};
function aplicarTemaUI(chave,opcoes={}){
 limparObservadoresTema();const raiz=document.documentElement;let atual=chave;
 const aplicar=()=>{
  const sistema=!TEMAS_UI[atual]||atual==='automatico';
  const consulta=q=>typeof globalThis.matchMedia==='function'?globalThis.matchMedia(q).matches:false;
  const id=sistema?resolverModoSistema({escuro:consulta('(prefers-color-scheme: dark)'),altoContraste:consulta('(forced-colors: active)')||consulta('(prefers-contrast: more)')}):atual;
  const t=TEMAS_UI[id]||TEMAS_UI.light;
  for(const old of Object.values(TEMAS_LEGADOS))for(const k of Object.keys(old.vars||{}))raiz.style.removeProperty(k);
  for(const [k,v] of Object.entries(t.vars))raiz.style.setProperty(k,v);
  raiz.dataset.uiTema=sistema?'automatico':atual;raiz.dataset.temaResolvido=id;raiz.dataset.movimentoReduzido=String(opcoes.reduzirMovimento!==false||consulta('(prefers-reduced-motion: reduce)'));
 };
 aplicar();const listeners=[];
 if((!TEMAS_UI[chave]||chave==='automatico')&&typeof globalThis.matchMedia==='function')for(const q of ['(prefers-color-scheme: dark)','(forced-colors: active)','(prefers-contrast: more)']){const media=globalThis.matchMedia(q);media.addEventListener?.('change',aplicar);listeners.push(()=>media.removeEventListener?.('change',aplicar));}
 limparObservadoresTema=()=>listeners.forEach(fn=>fn());
}
export { ALIAS_TEMA_UI, ESTILOS_MENU, FORMATOS, miniaturaTema, PALETAS, TEMAS_UI, carregarTemasUsuario, salvarTemaUsuario, importarTemasUsuario, exportarTemas, aplicarTemaUI };
