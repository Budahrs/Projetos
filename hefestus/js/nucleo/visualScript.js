import { FORMAS } from "./formas.js";
import { caminhoDaForma } from "./estiloAvancado.js";
// Visual Script da Forja: grafos de nós (eventos → fluxo → ações) guardados no documento em
// `__script`. O editor usa NOS (portas, nomes, cores); a execução usa `executarScript`, que é
// embutida no HTML exportado via toString() e por isso não depende de nada de fora dela.

const TIPOS = {
  exec: { nome: "Execução", cor: "#e9edf5" },
  num: { nome: "Número", cor: "#5ed39a" },
  txt: { nome: "Texto", cor: "#f39fca" },
  bool: { nome: "Lógico", cor: "#ff7a6e" },
  el: { nome: "Elemento", cor: "#6cb4ff" },
  any: { nome: "Qualquer", cor: "#b9a6ff" },
  "*": { nome: "Desvio", cor: "#cfd6e4" },
};

const CATEGORIAS = {
  eventos: { nome: "Eventos", cor: "#e5534b", icone: "raio", dica: "Onde o fluxo começa" },
  fluxo: { nome: "Fluxo", cor: "#8f98ad", icone: "topologia", dica: "Decisões, esperas e repetições" },
  interface: { nome: "Função e conexões", cor: "#22b8cf", icone: "link", dica: "Abrir e fechar outros menus, textos, sinais, links: o que o objeto faz" },
  visual: { nome: "Visual e efeitos", cor: "#d94fd1", icone: "efeitos", dica: "Forma, cor, transições e efeitos especiais: como o objeto aparece" },
  variaveis: { nome: "Variáveis", cor: "#a371f7", icone: "etiqueta", dica: "Guardar e ler valores" },
  logica: { nome: "Lógica e matemática", cor: "#2ea86b", icone: "grade", dica: "Comparar, calcular, combinar" },
  texto: { nome: "Texto", cor: "#db61a2", icone: "texto", dica: "Montar e examinar textos" },
  depuracao: { nome: "Depuração", cor: "#e3a008", icone: "alerta", dica: "Registrar e investigar" },
};

const E = (id, nome, tipo, padrao, extra = {}) => ({ id, nome, tipo, padrao, ...extra });
const X = (id = "exec", nome = "") => E(id, nome, "exec");
const ALVO = E("alvo", "Elemento", "el", "", { prop: true });
const ALVO_P = E("alvo", "Elemento", "el", "");
const OPS = [["==", "é igual a"], ["!=", "é diferente de"], [">", "maior que"], ["<", "menor que"], [">=", "maior ou igual"], ["<=", "menor ou igual"]];
const ESTILOS = [["fundo", "Fundo"], ["cor", "Cor do texto"], ["borda", "Cor da borda"], ["opacidade", "Opacidade (0–1)"], ["raio", "Arredondamento (px)"], ["largura", "Largura (px)"], ["altura", "Altura (px)"], ["fonte", "Tamanho da fonte (px)"], ["sombra", "Sombra (CSS)"], ["transformar", "Transformação (CSS)"]];

const evEl = (nome, desc, extraSai = []) => ({ cat: "eventos", nome, desc, ent: [ALVO], sai: [X(), ...extraSai], evento: true });
const acEl = (nome, desc, ent = [], sai = []) => ({ cat: "interface", nome, desc, ent: [X(), ALVO_P, ...ent], sai: [X(), ...sai] });
const bin = (nome, desc, cat = "logica", t = "num", r = "num") => ({ cat, nome, desc, puro: true, ent: [E("a", "A", t, t === "num" ? 0 : ""), E("b", "B", t, t === "num" ? 0 : "")], sai: [E("r", "", r)] });

/** Biblioteca de nós. ent/sai: portas; `prop` = configuração do nó, sem fio. */
const NOS = {
  // ---------- eventos ----------
  "ev.iniciar": { cat: "eventos", nome: "Ao iniciar", desc: "Roda uma vez quando a interface abre.", ent: [], sai: [X()], evento: true },
  "ev.clique": evEl("Ao clicar", "Quando o elemento é clicado ou acionado pelo teclado.", [E("origem", "Elemento", "el")]),
  "ev.pressionar": evEl("Ao pressionar", "Dispara ao pressionar o ponteiro primário sobre o elemento.", [E("origem","Elemento","el")]),
  "ev.rolar": {cat:"eventos",nome:"Ao rolar página",desc:"Posição de rolagem da janela em pixels.",ent:[],sai:[X(),E("x","Rolagem X","num"),E("y","Rolagem Y","num")],evento:true},
  "ev.arrastar": evEl("Ao arrastar", "Dispara enquanto o ponteiro arrasta o objeto; fornece deslocamentos X e Y.", [E("x","Delta X","num"),E("y","Delta Y","num")]),
  "ev.duplo": evEl("Ao clicar duas vezes", "Clique duplo no elemento."),
  "ev.contexto": evEl("Ao clicar com o botão direito", "Menu de contexto sobre o elemento (o menu do navegador não aparece)."),
  "ev.entrar": evEl("Ao passar o mouse", "Quando o ponteiro entra no elemento."),
  "ev.sair": evEl("Ao tirar o mouse", "Quando o ponteiro sai do elemento."),
  "ev.foco": evEl("Ao receber foco", "Quando o elemento (ou algo dentro dele) recebe o foco do teclado."),
  "ev.mudar": evEl("Ao mudar valor", "Campos, seletores e interruptores: dispara a cada mudança.", [E("valor", "Valor", "txt")]),
  "ev.abrir": evEl("Ao abrir", "Quando o elemento aparece (por regra, script ou estado inicial)."),
  "ev.fechar": evEl("Ao fechar", "Quando o elemento é escondido."),
  "ev.tecla": { cat: "eventos", nome: "Ao pressionar tecla", desc: "Atalho de teclado em qualquer lugar da interface. Ex.: Enter, Esc, Ctrl+S, Shift+F2.", ent: [E("tecla", "Tecla", "txt", "Enter", { prop: true })], sai: [X()], evento: true },
  "ev.intervalo": { cat: "eventos", nome: "A cada intervalo", desc: "Repete enquanto a interface estiver aberta.", ent: [E("ms", "Intervalo (ms)", "num", 1000, { prop: true })], sai: [X(), E("contagem", "Contagem", "num")], evento: true },
  "ev.sinal": { cat: "eventos", nome: "Ao receber sinal", desc: "Sinais vêm dos comportamentos dos elementos e do nó Emitir sinal. Vazio = qualquer sinal.", ent: [E("nome", "Sinal", "txt", "", { prop: true })], sai: [X(), E("sinal", "Nome", "txt"), E("origem", "Origem", "el")], evento: true },
  "ev.redimensionar": { cat: "eventos", nome: "Ao mudar o tamanho da tela", desc: "Dispara quando a janela muda de tamanho (e, se marcado, também ao iniciar). Bom para layout responsivo.", ent: [E("inicio", "Também ao iniciar", "bool", true, { prop: true })], sai: [X(), E("largura", "Largura", "num"), E("altura", "Altura", "num")], evento: true },
  "ev.personalizado": { cat: "eventos", nome: "Evento personalizado", desc: "Um ponto de entrada com nome. Acione com Disparar evento, de qualquer grafo.", ent: [E("nome", "Nome", "txt", "meuEvento", { prop: true })], sai: [X(), E("dado", "Dado", "any")], evento: true },
  "ev.variavel": { cat: "eventos", nome: "Ao mudar variável", desc: "Reage sempre que a variável recebe um valor diferente.", ent: [E("variavel", "Variável", "var", "", { prop: true })], sai: [X(), E("valor", "Valor", "any")], evento: true },

  // ---------- fluxo ----------
  "fl.se": { cat: "fluxo", nome: "Se", desc: "Escolhe um caminho conforme a condição.", ent: [X(), E("condicao", "Condição", "bool", true)], sai: [X("verdadeiro", "Verdadeiro"), X("falso", "Falso")] },
  "fl.sequencia": { cat: "fluxo", nome: "Sequência", desc: "Executa as saídas em ordem, uma após a outra.", ent: [X()], sai: [X("s0", "Então 1"), X("s1", "Então 2"), X("s2", "Então 3")] },
  "fl.esperar": { cat: "fluxo", nome: "Esperar", desc: "Aguarda e depois continua.", ent: [X(), E("ms", "Tempo (ms)", "num", 500)], sai: [X("exec", "Concluído")] },
  "fl.umaVez": { cat: "fluxo", nome: "Só uma vez", desc: "Deixa passar só a primeira vez, até ser reiniciado.", ent: [X(), X("reiniciar", "Reiniciar")], sai: [X("exec", "Concluído")] },
  "fl.alternar": { cat: "fluxo", nome: "Alternar A/B", desc: "A cada passagem vai para A, depois B, depois A…", ent: [X()], sai: [X("a", "A"), X("b", "B"), E("ehA", "É A", "bool")] },
  "fl.repetir": { cat: "fluxo", nome: "Repetir", desc: "Executa o corpo para cada número do intervalo (fim não incluído).", ent: [X(), E("de", "De", "num", 0), E("ate", "Até", "num", 3)], sai: [X("corpo", "Corpo"), E("indice", "Índice", "num"), X("fim", "Concluído")] },
  "fl.portao": { cat: "fluxo", nome: "Portão", desc: "Deixa o fluxo passar só enquanto estiver aberto.", ent: [X("exec", "Entrar"), X("abrir", "Abrir"), X("fechar", "Fechar"), X("alternarP", "Alternar"), E("iniciaAberto", "Começa aberto", "bool", true, { prop: true })], sai: [X("exec", "Saída")] },
  "fl.limitar": { cat: "fluxo", nome: "Aguardar calmaria", desc: "Só continua depois que as chamadas param pelo tempo indicado (debounce).", ent: [X(), E("ms", "Tempo (ms)", "num", 300)], sai: [X("exec", "Concluído")] },
  "fl.disparar": { cat: "fluxo", nome: "Disparar evento", desc: "Aciona todos os nós Evento personalizado com este nome.", ent: [X(), E("nome", "Evento", "txt", "meuEvento", { prop: true }), E("dado", "Dado", "any", "")], sai: [X()] },

  // ---------- interface ----------
  "ui.abrir": acEl("Abrir", "Mostra o elemento com a animação configurada nele."),
  "ui.fechar": acEl("Fechar", "Esconde o elemento."),
  "ui.alternar": acEl("Alternar visibilidade", "Abre se estiver fechado; fecha se estiver aberto."),
  "ui.mostrarSo": acEl("Mostrar só este", "Mostra o elemento e esconde os irmãos que abrem e fecham (abas, acordeão)."),
  "ui.destacar": acEl("Destacar", "Pisca o elemento para chamar a atenção."),
  "ui.texto": acEl("Definir texto", "Troca o texto (ou o valor, em campos).", [E("texto", "Texto", "txt", "Novo texto")]),
  "ui.estilo": acEl("Definir estilo", "Muda uma propriedade visual.", [E("propriedade", "Propriedade", "sel", "fundo", { prop: true, opcoes: ESTILOS }), E("valor", "Valor", "txt", "#3d8bfd")]),
  "ui.scrollLock": {cat:"interface",nome:"Travar rolagem",desc:"Bloqueia a rolagem da página. Use o mesmo nome para bloquear e liberar; travas com nomes diferentes são independentes. Parar restaura o estilo original.",ent:[X(),E("ativo","Bloquear","bool",true),E("trava","Nome da trava","txt","pagina",{prop:true})],sai:[X()]},
  "ui.sticky": acEl("Cabeçalho fixo (Sticky)","Fixa o objeto no topo do seu container de rolagem. Exige espaço de rolagem e um pai compatível.",[E("ativo","Fixar","bool",true),E("topo","Distância do topo (px)","num",0)]),
  "ui.estado": acEl("Estado do componente","Define o atributo data-hp-state do componente e emite hephaestus:estado. Combine com classes/estilos ou CSS do objeto para criar variantes.",[E("estado","Estado","txt","padrao")]),
  "ui.classe": acEl("Classe CSS", "Adiciona, remove ou alterna uma classe CSS.", [E("modo", "Modo", "sel", "alternar", { prop: true, opcoes: [["alternar", "Alternar"], ["adicionar", "Adicionar"], ["remover", "Remover"]] }), E("classe", "Classe", "txt", "ativo")]),
  "ui.habilitar": acEl("Habilitar", "Liga ou desliga a interação com o elemento.", [E("ativo", "Ativo", "bool", true)]),
  "ui.focar": acEl("Focar", "Leva o foco do teclado para o elemento."),
  "ui.somarCampos": {cat:"interface",nome:"Somar campos (validado)",desc:"Soma dois campos numéricos. Vazio, texto inválido e resultado não finito seguem a saída Erro; aceita vírgula decimal.",ent:[X(),E("campoA","Primeiro campo","el",""),E("campoB","Segundo campo","el",""),ALVO_P],sai:[X("exec","Concluído"),X("erroExec","Erro"),E("resultado","Resultado","num"),E("erro","Mensagem","txt")]},
  "ui.aviso": { cat: "interface", nome: "Mostrar aviso", desc: "Mensagem rápida no canto da tela.", ent: [X(), E("texto", "Mensagem", "txt", "Feito!"), E("ms", "Duração (ms)", "num", 2500)], sai: [X()] },
  "ui.link": { cat: "interface", nome: "Abrir link", desc: "Navega para um endereço.", ent: [X(), E("url", "Endereço", "txt", "https://"), E("novaAba", "Nova aba", "bool", true)], sai: [X()] },
  "ui.sinal": { cat: "interface", nome: "Emitir sinal", desc: "Emite um sinal hefestus:sinal (o mesmo dos comportamentos).", ent: [X(), E("nome", "Sinal", "txt", "meuSinal")], sai: [X()] },
  "ui.obterTexto": { cat: "interface", nome: "Ler texto", desc: "Texto visível do elemento, ou o valor de um campo.", puro: true, ent: [ALVO_P], sai: [E("r", "Texto", "txt")] },
  "ui.obterValor": { cat: "interface", nome: "Ler valor", desc: "Valor de campo, seletor ou interruptor (ligado = verdadeiro).", puro: true, ent: [ALVO_P], sai: [E("r", "Valor", "any")] },
  "ui.visivel": { cat: "interface", nome: "Está visível?", desc: "Verdadeiro se o elemento está aberto.", puro: true, ent: [ALVO_P], sai: [E("r", "Visível", "bool")] },
  "ui.efeito": { cat: "visual", nome: "Efeito especial", desc: "Anima o objeto. Em seguida continua na hora; Ao terminar, depois do efeito.", ent: [X(), ALVO_P, E("efeito", "Efeito", "sel", "pulsar", { prop: true, opcoes: [["pulsar", "Pulsar"], ["saltar", "Saltar"], ["tremer", "Tremer"], ["balancar", "Balançar"], ["gelatina", "Gelatina"], ["girar", "Girar"], ["brilhar", "Brilhar"], ["piscar", "Piscar"], ["aparecer", "Aparecer"], ["deslizar", "Deslizar para dentro"], ["zoom", "Zoom para dentro"], ["sumir", "Sumir"], ["ondulacao", "✦ Ondulação"], ["faiscas", "✦ Faíscas"], ["confete", "✦ Confete"]] }), E("ms", "Duração (ms)", "num", 600), E("repetir", "Repetir", "num", 1)], sai: [X("exec", "Em seguida"), X("fim", "Ao terminar")] },
  "ui.transicao": { cat: "visual", nome: "Transição suave", desc: "Leva uma propriedade visual até o novo valor, animando.", ent: [X(), ALVO_P, E("propriedade", "Propriedade", "sel", "fundo", { prop: true, opcoes: [["fundo", "Fundo"], ["cor", "Cor do texto"], ["borda", "Cor da borda"], ["opacidade", "Opacidade (0–1)"], ["raio", "Arredondamento (px)"], ["largura", "Largura (px)"], ["altura", "Altura (px)"], ["fonte", "Tamanho da fonte (px)"], ["escala", "Escala (1 = normal)"], ["rotacao", "Rotação (graus)"], ["x", "Deslocar X (px)"], ["y", "Deslocar Y (px)"]] }), E("valor", "Valor", "txt", "#d94fd1"), E("ms", "Duração (ms)", "num", 400), E("curva", "Curva", "sel", "suave", { prop: true, opcoes: [["suave", "Suave"], ["linear", "Linear"], ["entrada", "Acelerando"], ["saida", "Desacelerando"], ["mola", "Mola"]] })], sai: [X("exec", "Em seguida"), X("fim", "Ao terminar")] },
  "ui.forma": { cat: "visual", nome: "Aplicar forma", desc: "Troca a forma de um objeto do tipo Forma.", ent: [X(), ALVO_P, E("forma", "Forma", "sel", "elipse", { prop: true, opcoes: Object.entries(FORMAS).filter(([, f]) => f.d).map(([k, f]) => [k, f.nome ?? k]) })], sai: [X()] },
  "ui.tela": { cat: "interface", nome: "Tamanho da tela", desc: "Largura e altura atuais da janela, em pixels.", puro: true, ent: [], sai: [E("largura", "Largura", "num"), E("altura", "Altura", "num")] },
  "ui.elemento": { cat: "interface", nome: "Elemento", desc: "Referência a um elemento da tela, para ligar em vários nós.", puro: true, ent: [ALVO], sai: [E("r", "", "el")] },

  "ui.objeto": { cat: "interface", nome: "Objeto do Designer", desc: "Mesmo objeto do Designer: propriedades ao vivo, eventos e ações conectáveis.", puro: true,
    ent: [ALVO, E("pai", "Pertence a", "any", ""), X("abrir", "Mostrar"), X("fechar", "Ocultar"), X("alternar", "Alternar")],
    sai: [E("r", "Objeto", "el"), E("texto", "Texto", "txt"), E("valor", "Valor", "any"), E("visivel", "Visível", "bool"), X("exec", "Ao clicar"), X("feito", "Após ação")] },
  // ---------- variáveis ----------
  "var.obter": { cat: "variaveis", nome: "Ler variável", desc: "Valor atual da variável.", puro: true, ent: [E("variavel", "Variável", "var", "", { prop: true })], sai: [E("r", "", "any")] },
  "var.definir": { cat: "variaveis", nome: "Definir variável", desc: "Guarda um novo valor.", ent: [X(), E("variavel", "Variável", "var", "", { prop: true }), E("valor", "Valor", "any", "")], sai: [X(), E("valor", "Valor", "any")] },
  "var.incrementar": { cat: "variaveis", nome: "Somar à variável", desc: "Soma (ou subtrai, com passo negativo) e guarda.", ent: [X(), E("variavel", "Variável", "var", "", { prop: true }), E("passo", "Passo", "num", 1)], sai: [X(), E("valor", "Novo valor", "num")] },
  "var.inverter": { cat: "variaveis", nome: "Inverter variável", desc: "Verdadeiro vira falso e vice-versa.", ent: [X(), E("variavel", "Variável", "var", "", { prop: true })], sai: [X(), E("valor", "Novo valor", "bool")] },

  // ---------- lógica e matemática ----------
  "l.comparar": { cat: "logica", nome: "Comparar", desc: "Compara dois valores.", puro: true, ent: [E("a", "A", "any", 0), E("op", "Operação", "sel", "==", { prop: true, opcoes: OPS }), E("b", "B", "any", 0)], sai: [E("r", "", "bool")] },
  "l.e": bin("E (todos)", "Verdadeiro se A e B forem verdadeiros.", "logica", "bool", "bool"),
  "l.ou": bin("OU (algum)", "Verdadeiro se A ou B for verdadeiro.", "logica", "bool", "bool"),
  "l.nao": { cat: "logica", nome: "NÃO", desc: "Inverte verdadeiro/falso.", puro: true, ent: [E("a", "", "bool", false)], sai: [E("r", "", "bool")] },
  "l.escolher": { cat: "logica", nome: "Escolher valor", desc: "Se a condição for verdadeira devolve Sim; senão, Não.", puro: true, ent: [E("cond", "Condição", "bool", true), E("sim", "Sim", "any", ""), E("nao", "Não", "any", "")], sai: [E("r", "", "any")] },
  "m.somar": bin("Somar", "A + B"),
  "m.subtrair": bin("Subtrair", "A − B"),
  "m.multiplicar": bin("Multiplicar", "A × B"),
  "m.dividir": bin("Dividir", "A ÷ B (divisão por zero dá 0)."),
  "m.resto": bin("Resto", "Resto da divisão de A por B."),
  "m.aleatorio": { cat: "logica", nome: "Número aleatório", desc: "Sorteia entre mínimo e máximo.", puro: true, ent: [E("min", "Mínimo", "num", 1), E("max", "Máximo", "num", 6), E("inteiro", "Inteiro", "bool", true)], sai: [E("r", "", "num")] },
  "m.arredondar": { cat: "logica", nome: "Arredondar", desc: "Arredonda com casas decimais.", puro: true, ent: [E("a", "Valor", "num", 0), E("casas", "Casas", "num", 0)], sai: [E("r", "", "num")] },
  "m.limitar": { cat: "logica", nome: "Limitar entre", desc: "Mantém o valor dentro de mínimo e máximo.", puro: true, ent: [E("a", "Valor", "num", 0), E("min", "Mínimo", "num", 0), E("max", "Máximo", "num", 100)], sai: [E("r", "", "num")] },
  "c.numero": { cat: "logica", nome: "Número", desc: "Valor fixo.", puro: true, ent: [E("valor", "", "num", 0, { prop: true })], sai: [E("r", "", "num")] },
  "c.logico": { cat: "logica", nome: "Verdadeiro/Falso", desc: "Valor fixo.", puro: true, ent: [E("valor", "", "bool", true, { prop: true })], sai: [E("r", "", "bool")] },

  // ---------- texto ----------
  "c.texto": { cat: "texto", nome: "Texto", desc: "Valor fixo.", puro: true, ent: [E("valor", "", "txt", "", { prop: true })], sai: [E("r", "", "txt")] },
  "t.juntar": bin("Juntar textos", "A seguido de B.", "texto", "any", "txt"),
  "t.formatar": { cat: "texto", nome: "Montar texto", desc: "Troca {0}, {1} e {2} pelos valores ligados. Ex.: Olá, {0}!", puro: true, ent: [E("modelo", "Modelo", "txt", "Valor: {0}"), E("a", "{0}", "any", ""), E("b", "{1}", "any", ""), E("c", "{2}", "any", "")], sai: [E("r", "", "txt")] },
  "t.contem": { cat: "texto", nome: "Contém", desc: "Verdadeiro se o texto contém o trecho (sem diferenciar maiúsculas).", puro: true, ent: [E("a", "Texto", "txt", ""), E("b", "Trecho", "txt", "")], sai: [E("r", "", "bool")] },
  "t.tamanho": { cat: "texto", nome: "Tamanho do texto", desc: "Quantidade de caracteres.", puro: true, ent: [E("a", "Texto", "txt", "")], sai: [E("r", "", "num")] },
  "t.caixa": { cat: "texto", nome: "Maiúsculas/minúsculas", desc: "Converte o texto.", puro: true, ent: [E("a", "Texto", "txt", ""), E("modo", "Modo", "sel", "maiusculas", { prop: true, opcoes: [["maiusculas", "MAIÚSCULAS"], ["minusculas", "minúsculas"], ["aparar", "Sem espaços nas pontas"]] })], sai: [E("r", "", "txt")] },
  "t.hora": { cat: "texto", nome: "Data e hora", desc: "Hora ou data atual, já formatada.", puro: true, ent: [E("formato", "Formato", "sel", "hm", { prop: true, opcoes: [["hm", "14:05"], ["hms", "14:05:09"], ["data", "26/10/2026"], ["completo", "seg., 26 de out. 14:05"]] })], sai: [E("r", "", "txt")] },
  "t.numero": { cat: "texto", nome: "Texto para número", desc: "Converte; texto inválido vira 0. Aceita vírgula decimal.", puro: true, ent: [E("a", "Texto", "txt", "0")], sai: [E("r", "", "num")] },

  // ---------- depuração ----------
  "d.log": { cat: "depuracao", nome: "Registrar", desc: "Escreve no Depurador (e no console do navegador).", ent: [X(), E("mensagem", "Mensagem", "any", "Passou aqui"), E("nivel", "Nível", "sel", "info", { prop: true, opcoes: [["info", "Informação"], ["alerta", "Alerta"], ["erro", "Erro"]] })], sai: [X()] },
  "rr": { cat: "depuracao", nome: "Desvio", desc: "Ponto de passagem para organizar fios (Alt+clique num fio).", ent: [E("in", "", "*")], sai: [E("out", "", "*")], desvio: true },
};

for (const t of ["ui.estilo", "ui.classe", "ui.destacar"]) NOS[t].cat = "visual";
/** Nós que cuidam da aparência (pastas Visual); o resto é função/conexão. */
const ehVisual = tipo => NOS[tipo]?.cat === "visual";

/** Variações que aparecem na busca com outro nome (sinônimos ajudam quem vem de outras ferramentas). */
const SINONIMOS = {
  "ev.iniciar": "start begin play awake load carregar começo", "ev.clique": "click on click pressionar botão tocar", "ev.tecla": "key keyboard atalho hotkey",
  "ev.intervalo": "timer tick update loop relógio", "fl.se": "if branch condição senão else", "fl.sequencia": "sequence ordem", "fl.esperar": "delay wait timeout atraso",
  "fl.umaVez": "do once once", "fl.alternar": "flip flop toggle", "fl.repetir": "for loop laço each", "fl.portao": "gate", "fl.limitar": "debounce throttle",
  "ui.alternar": "toggle visibility mostrar esconder", "ui.abrir": "show open mostrar exibir", "ui.fechar": "hide close esconder ocultar", "ui.aviso": "toast snackbar notificação mensagem alert",
  "var.definir": "set guardar atribuir", "var.obter": "get ler", "var.incrementar": "increment contador counter", "l.comparar": "compare equal igual maior menor",
  "d.log": "print console log debug", "ev.redimensionar": "resize responsivo largura mobile breakpoint", "ui.tela": "viewport largura altura width height tela", "t.hora": "relogio clock data time hora", "ui.efeito": "efeito especial animation animar pulse shake bounce confetti particles brilho", "ui.transicao": "tween transition animar cor tamanho lerp", "ui.forma": "shape forma morph", "t.formatar": "format template interpolar", "t.juntar": "concat append", "rr": "reroute knot",
};

let seq = 0;
const novoIdLocal = p => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;

function grafoVazio(nome = "Principal") {
  return { id: novoIdLocal("g"), nome, nos: [], ligacoes: [], grupos: [], notas: [] };
}
function scriptVazio() {
  return { versao: 1, grafos: [grafoVazio()], variaveis: [] };
}
/** Valores iniciais de um nó (as portas de dado sem fio usam estes valores). */
function valoresPadrao(tipo) {
  const d = NOS[tipo]; const v = {};
  for (const p of d?.ent ?? []) if (p.tipo !== "exec" && p.tipo !== "*") v[p.id] = p.padrao;
  return v;
}
/** Tipo efetivo de uma porta (o desvio assume o tipo do que está ligado nele). */
function tipoPorta(g, noId, porta, lado, vistos = new Set()) {
  const no = g.nos.find(n => n.id === noId); if (!no) return null;
  const d = NOS[no.tipo]; if (!d) return null;
  const p = (lado === "sai" ? d.sai : d.ent).find(x => x.id === porta); if (!p) return null;
  if (p.tipo !== "*") return p.tipo;
  if (vistos.has(noId)) return "*"; vistos.add(noId);
  for (const l of g.ligacoes) {
    if (l.para === noId) { const t = tipoPorta(g, l.de, l.sp, "sai", vistos); if (t && t !== "*") return t; }
    if (l.de === noId) { const t = tipoPorta(g, l.para, l.ep, "ent", vistos); if (t && t !== "*") return t; }
  }
  return "*";
}
const compativel = (a, b) => {
  if (a === "*" || b === "*") return true;
  if (a === "exec" || b === "exec") return a === b;
  if (a === "any" || b === "any") return true;
  if (a === b) return true;
  // conversões implícitas seguras
  return (b === "txt") || (a === "num" && b === "bool") || (a === "bool" && b === "num") || (a === "el" && b === "txt") || (a === "txt" && b === "el");
};


/** Diagnóstico estrutural: executável por UI, CLI, MCP e exportadores, sem DOM. */
function validarLigacoesScript(script){const erros=[],grafos=new Set();for(const g of script?.grafos??[]){const add=(codigo,msg,no,ligacao)=>erros.push({nivel:'erro',codigo,msg,grafo:g.id,no,ligacao});if(grafos.has(g.id))add('GRAFO_DUPLICADO','ID de grafo duplicado: '+g.id);grafos.add(g.id);const nos=new Map(),links=new Set(),entradas=new Set();for(const n of g.nos??[]){if(nos.has(n.id))add('NO_DUPLICADO','ID de nó duplicado: '+n.id,n.id);nos.set(n.id,n);}for(const l of g.ligacoes??[]){if(l.id!=null&&links.has(l.id))add('FIO_DUPLICADO','ID de fio duplicado: '+l.id,l.para,l.id);if(l.id!=null)links.add(l.id);const origem=nos.get(l.de),destino=nos.get(l.para);if(!origem||!destino){add('NO_AUSENTE','O fio referencia um nó inexistente.',l.para,l.id);continue;}const saida=NOS[origem.tipo]?.sai.find(p=>p.id===l.sp),entrada=NOS[destino.tipo]?.ent.find(p=>p.id===l.ep&&!p.prop);if(!saida||!entrada){add('PORTA_AUSENTE','O fio usa uma porta inexistente ou uma configuração sem entrada de fio.',l.para,l.id);continue;}const a=tipoPorta(g,l.de,l.sp,'sai'),b=tipoPorta(g,l.para,l.ep,'ent');if(!compativel(a,b))add('TIPOS_INCOMPATIVEIS','Tipos de porta incompatíveis: '+a+' → '+b,l.para,l.id);const chave=l.para+'|'+l.ep;if(b!=='exec'&&entradas.has(chave))add('ENTRADA_MULTIPLA','Uma entrada de dados recebe mais de um fio.',l.para,l.id);entradas.add(chave);}}return erros;}

/** Problemas do script: nós desconhecidos, elementos que não existem, entradas obrigatórias, variáveis apagadas. */
function validarScript(script, idsElementos) {
  const erros = validarLigacoesScript(script);
  const ids = new Set(idsElementos);
  const vars = new Set((script?.variaveis ?? []).map(v => v.id));
  const nomesEv = new Set();
  for (const g of script?.grafos ?? []) for (const n of g.nos) if (n.tipo === "ev.personalizado") nomesEv.add(String(n.v?.nome ?? ""));
  for (const g of script?.grafos ?? []) {
    const ligadas = new Set(g.ligacoes.map(l => `${l.para}|${l.ep}`));
    const saem = new Set(g.ligacoes.map(l => `${l.de}|${l.sp}`));
    for (const n of g.nos) {
      const d = NOS[n.tipo];
      const add = (nivel, msg) => erros.push({ nivel, msg, grafo: g.id, no: n.id });
      if (!d) { add("erro", `Tipo de nó desconhecido: ${n.tipo}`); continue; }
      for (const p of d.ent) {
        if (p.tipo === "el" && !ligadas.has(`${n.id}|${p.id}`)) {
          const v = n.v?.[p.id];
          if (!v) add("erro", `${d.nome}: escolha o elemento.`);
          else if (!ids.has(v)) add("erro", `${d.nome}: o elemento “${v}” não existe mais.`);
        }
        if (p.tipo === "var") { const v = n.v?.[p.id]; if (!v) add("erro", `${d.nome}: escolha a variável.`); else if (!vars.has(v)) add("erro", `${d.nome}: a variável foi apagada.`); }
      }
      if (n.tipo === "fl.disparar" && !nomesEv.has(String(n.v?.nome ?? ""))) add("alerta", `Disparar evento: nenhum Evento personalizado chamado “${n.v?.nome ?? ""}”.`);
      const temExecEnt = d.ent.some(p => p.tipo === "exec");
      if (temExecEnt && n.origem!=="designer" && !d.ent.filter(p => p.tipo === "exec").some(p => ligadas.has(`${n.id}|${p.id}`))) add("alerta", `${d.nome}: nada leva o fluxo até este nó.`);
      if (d.evento && !d.sai.filter(p => p.tipo === "exec").some(p => saem.has(`${n.id}|${p.id}`))) add("info", `${d.nome}: o evento não está ligado a nenhuma ação.`);
    }
  }
  return erros;
}

/** Só o que a execução precisa (sem posições, notas e grupos). */
function scriptParaRuntime(script) {
  if (!script?.grafos?.length) return null;
  const invalidas=validarLigacoesScript({...script,grafos:script.grafos.filter(g=>!g.desativado)});
  if(invalidas.length){const erro=new Error("Conexões inválidas no Visual Script: "+invalidas[0].msg);erro.codigo="SCRIPT_INVALIDO";erro.diagnosticos=invalidas;throw erro;}
  const grafos = script.grafos.filter(g => !g.desativado && g.nos.length).map(g => {
    const tipo = (no, porta, lado) => tipoPorta(g, no, porta, lado);
    return {
      id: g.id, nome: g.nome,
      nos: g.nos.filter(n => !n.desativado).map(n => ({ id: n.id, tipo: n.tipo, v: n.tipo === "ui.forma" ? { ...n.v, caminho: caminhoDaForma({ forma: n.v?.forma }, FORMAS).d } : n.v ?? {} })),
      ligacoes: g.ligacoes.filter(l=>g.nos.some(n=>n.id===l.de&&!n.desativado)&&g.nos.some(n=>n.id===l.para&&!n.desativado)).map(l => ({ de: l.de, sp: l.sp, para: l.para, ep: l.ep, exec: tipo(l.de, l.sp, "sai") === "exec" || tipo(l.para, l.ep, "ent") === "exec" })),
    };
  });
  if (!grafos.length) return null;
  return { grafos, variaveis: (script.variaveis ?? []).map(v => ({ id: v.id, nome: v.nome, valor: v.valor })) };
}

/** Ids dos elementos que o script abre/fecha (o runtime prepara estes como “flutuantes”). */
function alvosDoScript(script) {
  const s = new Set();
  for (const g of script?.grafos ?? []) for (const n of g.nos) if (["ui.abrir", "ui.fechar", "ui.alternar", "ui.mostrarSo"].includes(n.tipo) && n.v?.alvo) s.add(n.v.alvo);
  for (const g of script?.grafos ?? []) for (const l of g.ligacoes ?? []) {
    const destino=g.nos.find(n=>n.id===l.para), origem=g.nos.find(n=>n.id===l.de);
    if (destino?.tipo==="ui.objeto" && ["abrir","fechar","alternar"].includes(l.ep) && destino.v?.alvo) s.add(destino.v.alvo);
    if (["ui.abrir","ui.fechar","ui.alternar","ui.mostrarSo"].includes(destino?.tipo) && l.ep==="alvo" && ["ui.objeto","ui.elemento"].includes(origem?.tipo) && origem.v?.alvo) s.add(origem.v.alvo);
  }
  return s;
}

/**
 * Interpretador. Autocontido: vai para o HTML exportado via toString().
 * `raiz.__hf` (criado por ligarRuntime) dá acesso às ações com animação; sem ele, usa `hidden`.
 */
function executarScript(raiz, script, opcoes) {
  opcoes = opcoes || {};
  if (!raiz || !script || !script.grafos) return function () {};
  const timers = [], intervalos = [], desligar = [];
  const on = (alvo, tipo, f, op) => { alvo.addEventListener(tipo, f, op); desligar.push(() => alvo.removeEventListener(tipo, f, op)); };
  const $ = id => { if (!id || typeof id !== "string") return null; try { return raiz.querySelector("#" + CSS.escape(id)); } catch (e) { return null; } };
  const hf = () => raiz.__hf || null;
  const depurar = !!opcoes.depurar;
  let ativo = true;
  const avisar = d => {
    if (!ativo) return;
    d.t = Date.now();
    if (depurar && window.parent && window.parent !== window) { try { window.parent.postMessage({ hefestusVS: d }, "*"); } catch (e) { /* sem janela pai */ } }
    if (opcoes.aoDepurar) { try { opcoes.aoDepurar(d); } catch (e) { /* depurador fechado */ } }
  };
  const log = (nivel, msg, g, no) => {
    avisar({ tipo: "log", nivel, msg: String(msg), grafo: g && g.id, no });
    if (!depurar && !opcoes.aoDepurar) (nivel === "erro" ? console.warn : console.log)("[Visual Script]", String(msg));
  };
  // depuração: o valor que atravessa cada fio de dado (limitado para não inundar o depurador)
  const rastrear = depurar || !!opcoes.aoDepurar, ultDado = {};
  const rastrearDado = (g, f, id, porta, x) => {
    const k = g.id + "|" + f[0] + "|" + f[1] + "|" + id + "|" + porta, u = ultDado[k], agora = Date.now();
    if (u && u.x === x && agora - u.t < 250) return;
    ultDado[k] = { x, t: agora };
    avisar({ tipo: "dado", grafo: g.id, de: f[0], sp: f[1], para: id, ep: porta, valor: x !== null && typeof x === "object" ? JSON.stringify(x) : x });
  };
  const num = x => { if (typeof x === "string") x = x.replace(",", "."); const n = Number(x); return Number.isFinite(n) ? n : 0; };
  const txt = x => x == null ? "" : typeof x === "object" ? JSON.stringify(x) : String(x);
  const bool = x => x === true || (typeof x === "number" && x !== 0) || (typeof x === "string" && x !== "" && x !== "false" && x !== "0");
  const igual = (a, b) => (typeof a === "number" || typeof b === "number") ? num(a) === num(b) : (typeof a === "boolean" || typeof b === "boolean") ? bool(a) === bool(b) : txt(a) === txt(b);

  const vars = {}, nomesVar = {}, ouvintesVar = {};
  for (const v of script.variaveis || []) { vars[v.id] = v.valor; nomesVar[v.id] = v.nome; }
  const personalizados = {};

  const G = script.grafos.map(g => {
    const nos = {};
    for (const n of g.nos || []) nos[n.id] = n;
    const ent = {}, exec = {};
    for (const l of g.ligacoes || []) {
      if (!nos[l.de] || !nos[l.para]) continue;
      if (l.exec) (exec[l.de + "|" + l.sp] = exec[l.de + "|" + l.sp] || []).push([l.para, l.ep]);
      else ent[l.para + "|" + l.ep] = [l.de, l.sp];
    }
    return { id: g.id, nome: g.nome, nos, ent, exec, est: {} };
  });
  const est = (g, id) => g.est[id] || (g.est[id] = { out: {} });

  const valor = (g, id, porta, d) => {
    if ((d || 0) > 150) throw new Error("Ligação circular entre valores");
    const f = g.ent[id + "|" + porta];
    if (f) { const x = saida(g, f[0], f[1], (d || 0) + 1); if (rastrear) rastrearDado(g, f, id, porta, x); return x; }
    const n = g.nos[id];
    return n && n.v ? n.v[porta] : undefined;
  };
  const saida = (g, id, porta, d) => {
    const n = g.nos[id];
    if (!n) return undefined;
    const f = PURO[n.tipo];
    if (f) return f({ n, porta, v: p => valor(g, id, p, d) });
    return est(g, id).out[porta];
  };
  const seguir = (g, id, porta, prof) => {
    const lista = g.exec[id + "|" + porta];
    if (!lista) return;
    for (const [para, ep] of lista) { avisar({ tipo: "fio", grafo: g.id, de: id, sp: porta, para, ep }); rodar(g, para, ep, prof + 1); }
  };
  const rodar = (g, id, ep, prof) => {
    if (!ativo) return;
    const n = g.nos[id];
    if (!n) return;
    if (prof > 400) { log("erro", "Execução interrompida: mais de 400 passos seguidos (possível laço infinito).", g, id); return; }
    const f = ACAO[n.tipo];
    if (!f) { log("alerta", "Este nó não executa ações: " + n.tipo, g, id); return; }
    avisar({ tipo: "no", grafo: g.id, no: id });
    const s = est(g, id);
    const c = {
      n, ep, est: s, chave: g.id+":"+id,
      v: p => valor(g, id, p),
      saida: (k, x) => { s.out[k] = x; },
      ir: (p, novo) => seguir(g, id, p, novo ? 0 : prof),
      depois: (ms, fn) => { const t = setTimeout(() => { if (!ativo) return; try { fn(); } catch (e) { log("erro", e && e.message || String(e), g, id); } }, Math.max(0, Math.min(3600000, num(ms)))); timers.push(t); return t; },
      log: (nv, m) => log(nv, m, g, id),
    };
    try { f(c); } catch (e) { log("erro", (e && e.message) || String(e), g, id); }
  };
  const disparar = (g, id, out) => {
    if (!ativo) return;
    const s = est(g, id);
    if (out) Object.assign(s.out, out);
    avisar({ tipo: "no", grafo: g.id, no: id });
    seguir(g, id, "exec", 0);
  };

  // ---------- ajudantes de interface ----------
  const pegar = (c, porta) => {
    const id = c.v(porta || "alvo");
    const e = $(id);
    if (!e) c.log("alerta", id ? "Elemento “" + id + "” não existe nesta tela." : "Nenhum elemento escolhido.");
    return e;
  };
  const visivel = id => { const h = hf(); if (h && h.visivel) return h.visivel(id); const e = $(id); return !!e && !e.hidden; };
  const agir = (c, acao) => {
    const id = c.v("alvo");
    if (!pegar(c)) return;
    const h = hf();
    if (h && h.agir) { h.agir(acao, id, id, "vs"); return; }
    const e = $(id);
    if (acao === "abrir" || acao === "mostrarSo") e.hidden = false;
    else if (acao === "fechar") e.hidden = true;
    else if (acao === "alternar") e.hidden = !e.hidden;
    else if (acao === "destacar") { e.classList.remove("hf-destaque"); void e.offsetWidth; e.classList.add("hf-destaque"); }
  };
  const campoDe = e => e && (e.matches("input,textarea,select") ? e : e.querySelector("input,textarea,select"));
  const lerValor = e => {
    if (!e) return "";
    if (e.getAttribute("role") === "switch") return e.getAttribute("aria-checked") === "true";
    const f = campoDe(e);
    if (!f) return e.textContent.trim();
    if (f.type === "checkbox" || f.type === "radio") return f.checked;
    return f.value;
  };
  const definirVar = (id, x) => {
    if (!(id in vars)) return;
    const antes = vars[id];
    vars[id] = x;
    avisar({ tipo: "var", id, nome: nomesVar[id], valor: x });
    if (antes !== x) for (const [g, no] of ouvintesVar[id] || []) disparar(g, no, { valor: x });
  };
  let pilhaAvisos = null;
  const mostrarAviso = (texto, ms) => {
    if (!pilhaAvisos || !pilhaAvisos.isConnected) {
      pilhaAvisos = document.createElement("div");
      pilhaAvisos.setAttribute("role", "status");
      pilhaAvisos.setAttribute("aria-live", "polite");
      pilhaAvisos.style.cssText = "position:fixed;right:16px;bottom:16px;display:flex;flex-direction:column;gap:8px;z-index:2147483000;pointer-events:none;font:14px/1.35 system-ui,sans-serif";
      document.body.appendChild(pilhaAvisos);
    }
    const a = document.createElement("div");
    a.textContent = texto;
    a.style.cssText = "background:#1d2129;color:#f4f6fa;padding:10px 14px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.28);max-width:360px;opacity:0;transform:translateY(6px);transition:opacity .18s,transform .18s";
    pilhaAvisos.appendChild(a);
    requestAnimationFrame(() => { a.style.opacity = "1"; a.style.transform = "none"; });
    timers.push(setTimeout(() => { a.style.opacity = "0"; timers.push(setTimeout(() => a.remove(), 220)); }, Math.max(600, num(ms) || 2500)));
  };
  const emitirSinal = (nome, origem) => {
    const h = hf();
    if (h && h.sinal) h.sinal(nome, origem || "script", "script");
    else raiz.dispatchEvent(new CustomEvent("hefestus:sinal", { detail: { sinal: nome, origem: origem || "script", evento: "script" }, bubbles: true }));
  };
  const ESTILO = {
    fundo: (e, v) => { e.style.background = v; const f = e.querySelector(":scope > svg > path"); if (f) f.style.fill = v; },
    cor: (e, v) => { e.style.color = v; }, borda: (e, v) => { e.style.borderColor = v; if (!e.style.borderStyle) e.style.borderStyle = "solid"; },
    opacidade: (e, v) => { e.style.opacity = String(Math.max(0, Math.min(1, num(v)))); }, raio: (e, v) => { e.style.borderRadius = num(v) + "px"; },
    largura: (e, v) => { e.style.width = num(v) + "px"; }, altura: (e, v) => { e.style.height = num(v) + "px"; }, fonte: (e, v) => { e.style.fontSize = num(v) + "px"; },
    sombra: (e, v) => { e.style.boxShadow = v; }, transformar: (e, v) => { e.style.transform = v; },
  };

  const reduzMov = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const EFEITOS = {
    pulsar: [{ transform: "scale(1)" }, { transform: "scale(1.08)" }, { transform: "scale(1)" }],
    saltar: [{ transform: "translateY(0)" }, { transform: "translateY(-14px)", offset: 0.35 }, { transform: "translateY(0)", offset: 0.6 }, { transform: "translateY(-5px)", offset: 0.8 }, { transform: "translateY(0)" }],
    tremer: [{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }],
    balancar: [{ transform: "rotate(0)" }, { transform: "rotate(-8deg)" }, { transform: "rotate(7deg)" }, { transform: "rotate(-4deg)" }, { transform: "rotate(0)" }],
    gelatina: [{ transform: "scale(1,1)" }, { transform: "scale(1.16,.84)" }, { transform: "scale(.9,1.1)" }, { transform: "scale(1.05,.95)" }, { transform: "scale(1,1)" }],
    girar: [{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }],
    brilhar: [{ filter: "brightness(1)" }, { filter: "brightness(1.4) drop-shadow(0 0 14px rgba(255,214,120,.95))" }, { filter: "brightness(1)" }],
    piscar: [{ opacity: 1 }, { opacity: 0.15 }, { opacity: 1 }],
    aparecer: [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }],
    deslizar: [{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }],
    zoom: [{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1)" }],
    sumir: [{ opacity: 1 }, { opacity: 0 }],
  };
  /** Efeitos especiais: partículas numa camada fixa sobre a tela, a partir do centro do objeto. */
  const particulas = (e, dur, modo) => {
    const r = e.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const camada = document.createElement("div");
    camada.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483001;overflow:hidden";
    document.body.appendChild(camada);
    const cores = ["#ff5f6d", "#ffc371", "#7cf29c", "#5ec8ff", "#b28dff", "#ff8ad8"];
    if (modo === "ondulacao") {
      const t = Math.max(r.width, r.height);
      const o = document.createElement("span");
      o.style.cssText = `position:absolute;left:${cx - t / 2}px;top:${cy - t / 2}px;width:${t}px;height:${t}px;border-radius:50%;border:3px solid ${getComputedStyle(e).backgroundColor || "#5ec8ff"};box-shadow:0 0 18px rgba(94,200,255,.7)`;
      camada.appendChild(o);
      o.animate([{ transform: "scale(.3)", opacity: 0.9 }, { transform: "scale(2.2)", opacity: 0 }], { duration: dur, easing: "ease-out" });
    } else {
      const n = modo === "confete" ? 46 : 18;
      for (let i = 0; i < n; i++) {
        const p = document.createElement("span"), cor = cores[i % cores.length];
        const conf = modo === "confete";
        p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${conf ? 7 : 5}px;height:${conf ? 11 : 5}px;background:${conf ? cor : "#fff"};border-radius:${conf ? 2 : 50}%;${conf ? "" : `box-shadow:0 0 8px 2px ${cor}`}`;
        camada.appendChild(p);
        const ang = Math.random() * Math.PI * 2, dist = (conf ? 90 : 40) + Math.random() * (conf ? 160 : 70);
        const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist + (conf ? 140 : 0);
        p.animate([{ transform: "translate(-50%,-50%) rotate(0)", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }], { duration: dur * (0.7 + Math.random() * 0.6), easing: conf ? "cubic-bezier(.2,.7,.4,1)" : "ease-out", fill: "forwards" });
      }
    }
    timers.push(setTimeout(() => camada.remove(), dur * 1.4 + 50));
  };
  const CURVAS = { suave: "ease", linear: "linear", entrada: "ease-in", saida: "ease-out", mola: "cubic-bezier(.34,1.56,.64,1)" };
  const ACAO = {
    "rr": c => c.ir("out"),
    "ui.efeito": c => {
      const e = pegar(c), ef = c.v("efeito"), dur = Math.max(50, Math.min(20000, num(c.v("ms")) || 600)), rep = Math.max(1, Math.min(50, Math.trunc(num(c.v("repetir")) || 1)));
      let total = 0;
      if (e && !(reduzMov && ef !== "aparecer" && ef !== "sumir")) {
        if (ef === "ondulacao" || ef === "faiscas" || ef === "confete") { particulas(e, dur, ef); total = dur; }
        else if (EFEITOS[ef] && e.animate) { e.animate(EFEITOS[ef], { duration: dur, iterations: rep, easing: "ease-in-out", fill: ef === "sumir" ? "forwards" : "none" }); total = dur * rep; }
      }
      c.ir("exec");
      c.depois(total, () => c.ir("fim", true));
    },
    "ui.transicao": c => {
      const e = pegar(c), prop = c.v("propriedade"), val = txt(c.v("valor")), dur = Math.max(0, Math.min(20000, num(c.v("ms"))));
      if (e) {
        const antes = getComputedStyle(e), de = {}, para = {};
        if (prop === "escala" || prop === "rotacao" || prop === "x" || prop === "y") {
          const T = e._hfT || (e._hfT = { x: 0, y: 0, r: 0, s: 1 }), novo = Object.assign({}, T);
          novo[{ escala: "s", rotacao: "r", x: "x", y: "y" }[prop]] = num(val);
          const tf = t => "translate(" + t.x + "px, " + t.y + "px) rotate(" + t.r + "deg) scale(" + t.s + ")";
          de.transform = tf(T); para.transform = tf(novo); e._hfT = novo;
        } else {
          const css = { fundo: "backgroundColor", cor: "color", borda: "borderColor", opacidade: "opacity", raio: "borderRadius", largura: "width", altura: "height", fonte: "fontSize" }[prop];
          if (!css) { c.ir("exec"); return; }
          const v = prop === "opacidade" ? String(Math.max(0, Math.min(1, num(val)))) : ["raio", "largura", "altura", "fonte"].includes(prop) ? num(val) + "px" : val;
          if (["fundo", "cor", "borda"].includes(prop) && !(window.CSS && CSS.supports("color", v))) { c.log("alerta", "Transição: cor inválida “" + v + "”."); c.ir("exec"); return; }
          de[css] = antes[css]; para[css] = v;
          if (prop === "fundo") { const f = e.querySelector(":scope > svg > path"); if (f) f.style.fill = v; }
          if (prop === "borda" && !e.style.borderStyle) e.style.borderStyle = "solid";
        }
        if (e.animate && dur && !reduzMov) e.animate([de, para], { duration: dur, easing: CURVAS[c.v("curva")] || "ease" });
        Object.assign(e.style, para);
      }
      c.ir("exec");
      c.depois(dur, () => c.ir("fim", true));
    },
    "ui.forma": c => {
      const e = pegar(c), d = c.n.v && c.n.v.caminho;
      if (e && d) { const h = hf(); if (h && h.agir) h.agir("aplicarForma", c.v("alvo"), c.v("alvo"), "vs", undefined, d); else { const p = e.querySelector("svg > path"); if (p) p.setAttribute("d", d); } }
      c.ir("exec");
    },
    "fl.se": c => c.ir(bool(c.v("condicao")) ? "verdadeiro" : "falso"),
    "fl.sequencia": c => { c.ir("s0"); c.ir("s1"); c.ir("s2"); },
    "fl.esperar": c => { c.depois(c.v("ms"), () => c.ir("exec", true)); },
    "fl.umaVez": c => { if (c.ep === "reiniciar") { c.est.feito = false; return; } if (c.est.feito) return; c.est.feito = true; c.ir("exec"); },
    "fl.alternar": c => { c.est.a = !c.est.a; c.saida("ehA", c.est.a); c.ir(c.est.a ? "a" : "b"); },
    "fl.repetir": c => {
      const de = Math.trunc(num(c.v("de"))), ate = Math.trunc(num(c.v("ate")));
      if (ate - de > 10000) c.log("alerta", "Repetir: limitado a 10.000 voltas.");
      for (let i = de, k = 0; i < ate && k < 10000; i++, k++) { c.saida("indice", i); c.ir("corpo"); }
      c.ir("fim");
    },
    "fl.portao": c => {
      if (c.est.aberto === undefined) c.est.aberto = bool(c.n.v && c.n.v.iniciaAberto);
      if (c.ep === "abrir") c.est.aberto = true;
      else if (c.ep === "fechar") c.est.aberto = false;
      else if (c.ep === "alternarP") c.est.aberto = !c.est.aberto;
      else if (c.est.aberto) c.ir("exec");
    },
    "fl.limitar": c => { clearTimeout(c.est.t); c.est.t = c.depois(c.v("ms"), () => c.ir("exec", true)); },
    "fl.disparar": c => {
      const nome = txt(c.v("nome")), alvos = personalizados[nome] || [];
      if (!alvos.length) c.log("alerta", "Nenhum Evento personalizado chamado “" + nome + "”.");
      const dado = c.v("dado");
      for (const [g, id] of alvos) disparar(g, id, { dado });
      c.ir("exec");
    },
    "ui.abrir": c => { agir(c, "abrir"); c.ir("exec"); },
    "ui.fechar": c => { agir(c, "fechar"); c.ir("exec"); },
    "ui.alternar": c => { agir(c, "alternar"); c.ir("exec"); },
    "ui.mostrarSo": c => { agir(c, "mostrarSo"); c.ir("exec"); },
    "ui.destacar": c => { agir(c, "destacar"); c.ir("exec"); },
    "ui.somarCampos": c=>{
      const parse=(raw)=>{if(typeof raw!=='string'&&typeof raw!=='number')throw Error('Informe dois números válidos.');const s=String(raw).trim();if(!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(s))throw Error('Preencha os dois campos com números válidos.');const n=Number(s.replace(',','.'));if(!Number.isFinite(n))throw Error('O número excede o limite suportado.');return n;};
      const alvo=$(c.v('alvo'));try{const a=$(c.v('campoA')),b=$(c.v('campoB'));if(!a||!b||!alvo)throw Error('Um campo ou resultado não está disponível.');const total=parse(lerValor(a))+parse(lerValor(b));if(!Number.isFinite(total))throw Error('O resultado excede o limite suportado.');alvo.textContent=String(total);c.saida('resultado',total);c.saida('erro','');c.ir('exec');}catch(e){if(alvo)alvo.textContent=e.message;c.saida('resultado',null);c.saida('erro',e.message);c.log('erro',e.message);c.ir('erroExec');}
    },
    "ui.texto": c => {
      const e = pegar(c);
      if (e) {
        const t = txt(c.v("texto")), f = e.matches("input,textarea,select") ? e : null;
        if (f) { f.value = t; }
        else { const alvo = e.querySelector(".hf-forma-texto,.hf-modal-msg") || e; alvo.textContent = t; }
      }
      c.ir("exec");
    },
    "ui.estilo": c => { const e = pegar(c); const f = ESTILO[c.v("propriedade")]; if (e && f) f(e, txt(c.v("valor"))); c.ir("exec"); },
    "ui.scrollLock": c => {const travar=bool(c.v("ativo")),key=txt(c.v("trava"))||"pagina";
      if(travar&&!travasScroll.has(key)){if(!travasScroll.size){scrollOriginal=document.body.style.overflow;document.body.style.overflow='hidden';}travasScroll.add(key);}
      else if(!travar&&travasScroll.delete(key)&&!travasScroll.size)document.body.style.overflow=scrollOriginal;
      c.ir("exec");},
    "ui.sticky": c => {const e=pegar(c);if(e){if(!stickyOriginal.has(e))stickyOriginal.set(e,{position:e.style.position,top:e.style.top});if(bool(c.v('ativo'))){e.style.position='sticky';e.style.top=num(c.v('topo'))+'px';}else Object.assign(e.style,stickyOriginal.get(e));}c.ir('exec');},
    "ui.estado": c => {const e=pegar(c);if(e){const estado=txt(c.v('estado'));if(!estadosOriginais.has(e))estadosOriginais.set(e,e.getAttribute('data-hp-state'));e.setAttribute('data-hp-state',estado);e.dispatchEvent(new CustomEvent('hephaestus:estado',{bubbles:true,detail:{estado}}));}c.ir('exec');},
    "ui.classe": c => {
      const e = pegar(c), k = txt(c.v("classe")).trim().replace(/^\./, "");
      if (e && k && /^[\w-]+$/.test(k)) { const m = c.v("modo"); if (m === "adicionar") e.classList.add(k); else if (m === "remover") e.classList.remove(k); else e.classList.toggle(k); }
      c.ir("exec");
    },
    "ui.habilitar": c => {
      const e = pegar(c);
      if (e) { const a = bool(c.v("ativo")); const f = e.matches("button,input,select,textarea") ? e : campoDe(e); if (f) f.disabled = !a; e.setAttribute("aria-disabled", String(!a)); e.style.pointerEvents = a ? "" : "none"; e.style.opacity = a ? "" : "0.55"; }
      c.ir("exec");
    },
    "ui.focar": c => { const e = pegar(c); if (e) { if (!e.matches("button,input,select,textarea,a,[tabindex]")) e.setAttribute("tabindex", "-1"); e.focus(); } c.ir("exec"); },
    "ui.aviso": c => { mostrarAviso(txt(c.v("texto")), c.v("ms")); c.ir("exec"); },
    "ui.link": c => {
      const u = txt(c.v("url")).trim();
      if (/^(https?:|mailto:|tel:|#|\/)/i.test(u)) { if (bool(c.v("novaAba"))) window.open(u, "_blank", "noopener"); else location.href = u; }
      else c.log("alerta", "Abrir link: endereço inválido “" + u + "”.");
      c.ir("exec");
    },
    "ui.sinal": c => { emitirSinal(txt(c.v("nome"))); c.ir("exec"); },
    "var.definir": c => { const x = c.v("valor"), id = c.v("variavel"); definirVar(id, x); c.saida("valor", x); c.ir("exec"); },
    "var.incrementar": c => { const id = c.v("variavel"); const x = num(vars[id]) + num(c.v("passo")); definirVar(id, x); c.saida("valor", x); c.ir("exec"); },
    "var.inverter": c => { const id = c.v("variavel"); const x = !bool(vars[id]); definirVar(id, x); c.saida("valor", x); c.ir("exec"); },
    "d.log": c => { c.log(c.v("nivel") || "info", txt(c.v("mensagem"))); c.ir("exec"); },
  };
  ACAO["ui.objeto"] = c => {
    const tipo = {abrir:"ui.abrir",fechar:"ui.fechar",alternar:"ui.alternar"}[c.ep];
    if (tipo) ACAO[tipo]({...c, ir: () => c.ir("feito")});
  };
  const PURO = {
    "rr": c => c.v("in"),
    "ui.obterTexto": c => { const e = $(c.v("alvo")); if (!e) return ""; const f = e.matches("input,textarea,select") ? e : null; return f ? f.value : e.textContent.trim(); },
    "ui.obterValor": c => lerValor($(c.v("alvo"))),
    "ui.visivel": c => visivel(c.v("alvo")),
    "ui.objeto": c => c.porta === "texto" ? PURO["ui.obterTexto"](c) : c.porta === "valor" ? lerValor($(c.v("alvo"))) : c.porta === "visivel" ? visivel(c.v("alvo")) : c.v("alvo"),
    "ui.elemento": c => c.v("alvo"),
    "var.obter": c => vars[c.v("variavel")],
    "l.comparar": c => { const a = c.v("a"), b = c.v("b"), op = c.v("op"); if (op === "==") return igual(a, b); if (op === "!=") return !igual(a, b); const x = num(a), y = num(b); return op === ">" ? x > y : op === "<" ? x < y : op === ">=" ? x >= y : x <= y; },
    "l.e": c => bool(c.v("a")) && bool(c.v("b")),
    "l.ou": c => bool(c.v("a")) || bool(c.v("b")),
    "l.nao": c => !bool(c.v("a")),
    "l.escolher": c => bool(c.v("cond")) ? c.v("sim") : c.v("nao"),
    "m.somar": c => num(c.v("a")) + num(c.v("b")),
    "m.subtrair": c => num(c.v("a")) - num(c.v("b")),
    "m.multiplicar": c => num(c.v("a")) * num(c.v("b")),
    "m.dividir": c => { const b = num(c.v("b")); return b ? num(c.v("a")) / b : 0; },
    "m.resto": c => { const b = num(c.v("b")); return b ? num(c.v("a")) % b : 0; },
    "m.aleatorio": c => { const a = num(c.v("min")), b = num(c.v("max")); return bool(c.v("inteiro")) ? Math.floor(Math.min(a, b) + Math.random() * (Math.abs(b - a) + 1)) : a + Math.random() * (b - a); },
    "m.arredondar": c => { const k = Math.pow(10, Math.max(0, Math.min(8, Math.trunc(num(c.v("casas")))))); return Math.round(num(c.v("a")) * k) / k; },
    "m.limitar": c => Math.max(num(c.v("min")), Math.min(num(c.v("max")), num(c.v("a")))),
    "c.numero": c => num(c.v("valor")),
    "c.logico": c => bool(c.v("valor")),
    "c.texto": c => txt(c.v("valor")),
    "t.juntar": c => txt(c.v("a")) + txt(c.v("b")),
    "t.formatar": c => txt(c.v("modelo")).replace(/\{([0-2])\}/g, (m, i) => txt(c.v(["a", "b", "c"][i]))),
    "t.contem": c => txt(c.v("a")).toLowerCase().includes(txt(c.v("b")).toLowerCase()),
    "t.tamanho": c => txt(c.v("a")).length,
    "t.caixa": c => { const t = txt(c.v("a")), m = c.v("modo"); return m === "minusculas" ? t.toLowerCase() : m === "aparar" ? t.trim() : t.toUpperCase(); },
    "t.numero": c => num(c.v("a")),
    "ui.tela": c => c.porta === "altura" ? window.innerHeight : window.innerWidth,
    "t.hora": c => { const d = new Date(), f = c.v("formato"); if (f === "data") return d.toLocaleDateString("pt-BR"); if (f === "completo") return d.toLocaleString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); return d.toLocaleTimeString("pt-BR", f === "hms" ? { hour: "2-digit", minute: "2-digit", second: "2-digit" } : { hour: "2-digit", minute: "2-digit" }); },
  };

  // ---------- ligar os eventos ----------
  const travasScroll=new Set(),stickyOriginal=new Map(),estadosOriginais=new Map();let scrollOriginal;
  const DOM = { "ev.pressionar":"pointerdown", "ev.clique": "click", "ev.duplo": "dblclick", "ev.contexto": "contextmenu", "ev.entrar": "mouseenter", "ev.sair": "mouseleave", "ev.foco": "focusin" };
  const iniciais = [];
  const lerTecla = t => {
    const partes = String(t || "").split("+").map(x => x.trim().toLowerCase()).filter(Boolean);
    const alias = { esc: "escape", del: "delete", espaço: "space", espaco: "space", " ": "space", return: "enter", cima: "arrowup", baixo: "arrowdown", esquerda: "arrowleft", direita: "arrowright" };
    const k = partes.pop() || "";
    return { k: alias[k] || k, ctrl: partes.some(m => ["ctrl", "control", "cmd", "meta"].includes(m)), shift: partes.includes("shift"), alt: partes.includes("alt") };
  };
  for (const g of G) for (const id in g.nos) {
    const n = g.nos[id], v = n.v || {};
    if(n.tipo==='ev.rolar')on(window,'scroll',()=>disparar(g,id,{x:window.scrollX||0,y:window.scrollY||0}));
    if (n.tipo === "ui.objeto") { const el = $(v.alvo); if (el) on(el,"click",() => disparar(g,id,{origem:v.alvo})); }
    if(n.tipo==="ev.arrastar") {
      const el=$(v.alvo);let inicio=null;
      if(el)on(el,"pointerdown",ev=>{if(ev.button===0)inicio={id:ev.pointerId,x:ev.clientX,y:ev.clientY};});
      on(document,"pointermove",ev=>{if(inicio&&inicio.id===ev.pointerId)disparar(g,id,{x:ev.clientX-inicio.x,y:ev.clientY-inicio.y});});
      const fim=ev=>{if(inicio?.id===ev.pointerId)inicio=null;};on(document,"pointerup",fim);on(document,"pointercancel",fim);
    }
    if (DOM[n.tipo] || n.tipo === "ev.mudar" || n.tipo === "ev.abrir" || n.tipo === "ev.fechar") {
      const e = $(v.alvo);
      if (!e) { log("alerta", "Evento sem elemento na tela: " + (v.alvo || "(vazio)"), g, id); continue; }
      if (n.tipo === "ev.abrir" || n.tipo === "ev.fechar") {
        on(raiz, "hefestus:vis", ev => { const d = ev.detail || {}; if (d.id === v.alvo && d.evento === (n.tipo === "ev.abrir" ? "onOpen" : "onClose")) disparar(g, id); });
      } else if (n.tipo === "ev.mudar") {
        const f = (ev) => {
          const alvo = ev.target, texto = alvo && alvo.matches && alvo.matches("input:not([type=checkbox]):not([type=radio]),textarea");
          if (ev.type === "change" && texto) return;
          if (ev.type === "input" && !texto) return;
          disparar(g, id, { valor: lerValor(e) });
        };
        on(e, "input", f); on(e, "change", f);
        if (e.getAttribute("role") === "switch") on(e, "click", () => setTimeout(() => disparar(g, id, { valor: lerValor(e) }), 0));
      } else {
        on(e, DOM[n.tipo], ev => {
          if (n.tipo === "ev.contexto") ev.preventDefault();
          if(n.tipo === "ev.pressionar" && ev.button!==0)return;
          disparar(g, id, { origem: v.alvo });
        });
      }
    } else if (n.tipo === "ev.iniciar") iniciais.push([g, id]);
    else if (n.tipo === "ev.tecla") {
      const t = lerTecla(v.tecla);
      if (!t.k) continue;
      on(document, "keydown", ev => {
        const k = ev.key === " " ? "space" : String(ev.key).toLowerCase();
        if (k !== t.k || !!(ev.ctrlKey || ev.metaKey) !== t.ctrl || ev.shiftKey !== t.shift || ev.altKey !== t.alt) return;
        const digitando = ev.target && ev.target.closest && ev.target.closest("input,textarea,select,[contenteditable]");
        if (digitando && !t.ctrl && !t.alt && t.k.length === 1) return;
        if (t.ctrl || t.alt || t.k.length > 1) ev.preventDefault();
        disparar(g, id);
      });
    } else if (n.tipo === "ev.intervalo") {
      let k = 0;
      intervalos.push(setInterval(() => disparar(g, id, { contagem: ++k }), Math.max(16, num(v.ms) || 1000)));
    } else if (n.tipo === "ev.sinal") {
      on(raiz, "hefestus:sinal", ev => { const d = ev.detail || {}; if (!v.nome || d.sinal === v.nome) disparar(g, id, { sinal: d.sinal, origem: d.origem }); });
    } else if (n.tipo === "ev.redimensionar") {
      let t = null;
      const medir = () => ({ largura: window.innerWidth, altura: window.innerHeight });
      on(window, "resize", () => { clearTimeout(t); t = setTimeout(() => disparar(g, id, medir()), 120); timers.push(t); });
      if (v.inicio !== false) iniciais.push([g, id, medir]);
    } else if (n.tipo === "ev.personalizado") {
      (personalizados[txt(v.nome)] = personalizados[txt(v.nome)] || []).push([g, id]);
    } else if (n.tipo === "ev.variavel") {
      (ouvintesVar[v.variavel] = ouvintesVar[v.variavel] || []).push([g, id]);
    }
  }
  avisar({ tipo: "inicio", grafos: G.length });
  for (const [g, id, dados] of iniciais) disparar(g, id, dados ? dados() : undefined);
  return function () {
    ativo = false;
    timers.forEach(clearTimeout); intervalos.forEach(clearInterval); desligar.forEach(f => f());
    if(travasScroll.size){document.body.style.overflow=scrollOriginal;travasScroll.clear();}
    for(const [e,estilo] of stickyOriginal)Object.assign(e.style,estilo);
    for(const [e,valor] of estadosOriginais){if(valor===null)e.removeAttribute('data-hp-state');else e.setAttribute('data-hp-state',valor);}
    if (pilhaAvisos) pilhaAvisos.remove();
  };
}

export { ehVisual, NOS, TIPOS, CATEGORIAS, SINONIMOS, scriptVazio, grafoVazio, valoresPadrao, tipoPorta, compativel, validarLigacoesScript, validarScript, scriptParaRuntime, alvosDoScript, executarScript, novoIdLocal };
