import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {MENU_PDF_PADRAO} from '../js/nucleo/menuPdfPadrao.js';
import {sincronizarMenu,criarModeloMenu,validarMenu,gerarWeb} from '../js/nucleo/menuEngine.js';
import {editarBlocosMenu,localizarBloco} from '../js/nucleo/blocosMenu.js';
import {cont,texto,botao,achatar,assentar,evento} from '../js/nucleo/modelos.js';
import {Nucleo} from '../js/nucleo/nucleo.js';
const pecas={cont,texto,botao,achatar,assentar,evento};
const base=()=>sincronizarMenu(MENU_PDF_PADRAO);

test('blocos criam estrutura válida sem alterar a original',()=>{
 const p=base(),antes=JSON.stringify(p),r=editarBlocosMenu(p,{acao:'adicionar',tipo:'aba'});
 assert.equal(JSON.stringify(p),antes);assert.equal(r.pacote.designer.abas.length,p.designer.abas.length+1);
 assert.deepEqual(validarMenu(r.pacote),[]);assert.equal(localizarBloco(r.pacote,r.selecionado).tipo,'aba');
});
test('encaixes incompatíveis e remoção de último comando são atômicos',()=>{
 const p=editarBlocosMenu(base(),{acao:'adicionar',tipo:'aba'}).pacote,a=p.designer.abas.at(-1),antes=JSON.stringify(p);
 assert.throws(()=>editarBlocosMenu(p,{acao:'mover',id:a.grupos[0].id,pai:a.grupos[0].id}),/aba/);
 assert.throws(()=>editarBlocosMenu(p,{acao:'remover',id:a.grupos[0].comandos[0].id}),/sem comandos/);
 assert.equal(JSON.stringify(p),antes);
});
test('mover comando entre grupos mantém identidade, vínculo e código manual',()=>{
 const p=base(),a=p.designer.abas[0],c=a.grupos[0].comandos[0],destino=a.grupos[1];
 p.codigos.web={origem:'manual',texto:'código autoral'};
 const r=editarBlocosMenu(p,{acao:'mover',id:c.id,pai:destino.id});
 assert.equal(localizarBloco(r.pacote,c.id).pai.id,destino.id);
 assert.equal(localizarBloco(r.pacote,c.id).bloco.ferramentaId,c.ferramentaId);
 assert.equal(r.pacote.codigos.web.texto,'código autoral');
});
test('comportamentos múltiplos são independentes e os desligados não entram no runtime',()=>{
 const p=base(),c=p.designer.abas[0].grupos[0].comandos[0];
 c.comportamentos=[{evento:'onClick',acao:'ferramenta',ativo:true},{evento:'onHover',acao:'destacar',alvo:c.id,ativo:true},{evento:'onContext',acao:'ferramenta',ativo:false}];
 const m=criarModeloMenu(sincronizarMenu(p),pecas),n=new Nucleo();n.novo(false);const ids=n.inserirModelo(m);
 const alvo=ids.map(id=>n.elemento(id)).find(e=>e.rotulo===c.rotulo&&e.eventos?.some(e=>e.tipo==='onHover'));
 assert.ok(alvo);assert.equal(alvo.eventos.length,2);assert.equal(alvo.eventos[1].alvo,ids.find(id=>n.elemento(id)===alvo));
 const antes=structuredClone(alvo.eventos);n.definir(ids.find(id=>n.elemento(id)===alvo),{'estilo.fundo':'#ff0000'});
 assert.deepEqual(alvo.eventos,antes);
});
test('Ribbon, lateral, contextual e janela geram HTML válido e objetos nativos',()=>{
 for(const tipo of ['ribbon','lateral','contextual','janela']){
  const p=editarBlocosMenu(base(),{acao:'apresentacao',tipoInterface:tipo}).pacote,html=gerarWeb(p);
  for(const [,script]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Script(script);
  const modelo=criarModeloMenu(p,pecas);assert.ok(modelo.elementos.some(x=>x.el.tipo==='botao'));
  assert.ok(!modelo.elementos.some(x=>x.el.codigo?.isolado));
  const n=new Nucleo();n.novo(false);assert.ok(n.inserirModelo(modelo).length>1);
  if(tipo!=='ribbon')assert.ok(modelo.elementos.some(x=>x.el.rotulo==='×'));
 }
});
test('ferramenta inexistente ou ação desconhecida não é salva',()=>{
 const p=base(),c=p.designer.abas[0].grupos[0].comandos[0];
 assert.throws(()=>editarBlocosMenu(p,{acao:'editar',id:c.id,valores:{comportamentos:[{evento:'onClick',acao:'ferramenta',ferramentaId:'inexistente'}]}}),/Ferramenta/);
 assert.throws(()=>editarBlocosMenu(p,{acao:'editar',id:c.id,valores:{comportamentos:[{evento:'onClick',acao:'eval'}]}}),/inválido/);
});
