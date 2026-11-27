import { test } from "node:test";
import assert from "node:assert/strict";
import { organizarFaixa, auditarFaixa, formatarComandos, padraoRecomendado } from "../js/ui/orquestrador.js";
import { auditar } from "../js/nucleo/auditoria.js";
import { Nucleo } from "../js/nucleo/nucleo.js";
const comandos = Array.from({length:9}, (_,i) => ({id:`c${i}`,rotulo:`Ação ${i}`,acao:()=>i}));
const abas = [{id:"inicio", rotulo:"Início",grupos:[{nome:"Editar",cmds:comandos}]}, {id:"inserir",rotulo:"Inserir",grupos:[]}];
test("compactação mantém ações, estados e catálogo imutável",()=>{
 const organizado=organizarFaixa(abas);
 const cmds=organizado[0].grupos[0].cmds;
 assert.equal(cmds.length,6);
 assert.deepEqual([...cmds.slice(0,-1),...cmds.at(-1).flyout].map(c=>c.id),comandos.map(c=>c.id));
 assert.equal(cmds.at(-1).flyout[0].acao(),5);
 assert.equal(abas[0].grupos[0].cmds.length,9);
 assert.equal(organizarFaixa(organizado)[0].grupos[0].cmds.length,6);
 assert.equal(organizarFaixa(abas,{organizar:false})[0].grupos[0].cmds.length,9);
 assert.ok(auditarFaixa(abas).length);
});
test("perfil ordena sem perder abas e suporta configuração inválida",()=>{
 assert.equal(organizarFaixa(abas,{perfil:"criacao"})[0].id,"inicio");
 assert.equal(organizarFaixa(abas,{perfil:"desconhecido",limite:NaN}).length,2);
});
test("auditoria não modifica arrays congelados",()=>{
 assert.deepEqual(auditar(Object.freeze([])),[]);
});
test("texto é corrigido com desfazer, preservando conteúdo editorial",()=>{
 const n=new Nucleo(); const id=n.criar("botao",20,20);const t=n.criar("texto",20,100);
 n.definir(id,{rotulo:"  Salvar   projeto ","estilo.tamanhoFonte":9});
 n.definir(t,{texto:"Linha 1\nLinha 2"});
 const itens=n.auditar().filter(i=>i.regra.startsWith("texto-"));
 assert.ok(itens.length>=2);n.corrigirAuditoria(itens);
 assert.equal(n.elemento(id).rotulo,"Salvar projeto");
 assert.equal(n.elemento(t).texto,"Linha 1\nLinha 2");
 n.desfazer();assert.equal(n.elemento(id).rotulo,"  Salvar   projeto ");
});

test("grupos com submenus preservam acesso às galerias",()=>{
 const especial=[{id:"arquivo",rotulo:"Arquivo",grupos:[{nome:"Exportar",cmds:[...comandos,{id:"sub",rotulo:"Formatos",flyout:[{id:"html",rotulo:"HTML",acao:()=>1}]}]}]}];
 assert.equal(organizarFaixa(especial)[0].grupos[0].cmds.length,10);
});

test("autoformatação mantém ações e estados, destaca apenas um botão e preserva controles ricos",()=>{
 const acao=()=>42, desabilitado=()=>true;
 const fonte=[{id:"sel-painel",rotulo:"Painel de seleção (lista de objetos)",tam:"grande",acao,desabilitado},{id:"segundo",rotulo:"Segundo",tam:"grande",acao},{id:"spinner",tipo:"spinner",valor:()=>12}];
 const formatado=formatarComandos(fonte);
 assert.equal(formatado[0].rotulo,"Painel de seleção");assert.equal(formatado[0].titulo,fonte[0].rotulo);
 assert.equal(formatado[0].acao(),42);assert.equal(formatado[0].desabilitado(),true);
 assert.equal(formatado[1].tam,"pequeno");assert.equal(formatado[2].tipo,"spinner");
 assert.equal(fonte[1].tam,"grande");assert.deepEqual(formatarComandos(formatado),formatado);
 assert.deepEqual(padraoRecomendado({perfil:"revisao",limite:10}),{perfil:"revisao",limite:6,organizar:true,autoformatar:true});
});

test("artefato livre formata controles e layout, preserva eventos e desfaz em um passo",()=>{
 const n=new Nucleo();const c=n.criar("container",0,0);const b=n.criar("botao",10,10);
 Object.assign(n.doc.elementos[b],{pai:c,altura:20,rotulo:"  Tocar   rádio ",eventos:[{tipo:"onClick",dispara:"radio_play"}]});
 n.doc.elementos[c].layout.modo="livre";
 n.definir(c,{"layout.espaco":19});const antes=n.historico().itens.length;
 const r=n.autoformatarArtefato([c]);assert.equal(r.ok,true);
 assert.equal(n.elemento(b).rotulo,"Tocar rádio");assert.equal(n.elemento(b).eventos[0].dispara,"radio_play");
 assert.equal(n.historico().itens.length,antes+1);assert.match(n.html(),/radio_play/);
 n.desfazer();assert.equal(n.elemento(b).rotulo,"  Tocar   rádio ");
});
test("formatação do construtor persiste na fonte e na regeneração, sem alterar sinais",()=>{
 const n=new Nucleo();n.adicionarItemConstrutor("ribbon");const item=n.construtor().itens[0];
 const raiz=n.elementos().find(e=>e.construtor===item.id);assert.ok(raiz);
 const sinal=item.abas[0].grupos[0].itens[0].sinal;
 const r=n.autoformatarArtefato([raiz.id]);assert.equal(r.ok,true);
 assert.equal(n.construtor().itens[0].abas[0].grupos[0].itens[0].sinal,sinal);
 assert.match(n.html(),new RegExp(sinal));n.desfazer();
 assert.deepEqual(n.construtor().itens[0],item);
});
