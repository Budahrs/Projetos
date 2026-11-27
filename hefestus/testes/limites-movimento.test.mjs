import {test} from 'node:test';import assert from 'node:assert/strict';
import {motorMenus} from '../js/nucleo/motorMenus.js';
import {preferenciaMovimento,animarMenu} from '../js/ui/movimentoMenus.js';
import {CATEGORIAS_COMPORTAMENTOS,COMPORTAMENTOS} from '../js/nucleo/comportamentos.js';
import {REGRAS_MENUS} from '../js/nucleo/expertiseMenus.js';
import {dadosRuntime} from '../js/nucleo/runtime.js';
import {ACOES} from '../js/nucleo/catalogo.js';

test('menu nunca excede a janela, inclusive com tamanho extremo e zoom',()=>{
 for(const [w,h]of [[390,640],[768,300],[1440,900],[120,80],[1,1],[0,0]]){
   for(const [x,y]of [[0,0],[w,h],[w*2,-100]]){
     const estilo={},win={innerWidth:w,innerHeight:h,visualViewport:{width:w,height:h,offsetLeft:30,offsetTop:20}},el={style:estilo,offsetWidth:2000,offsetHeight:3000,ownerDocument:{defaultView:win}};
     const p=motorMenus().limitarPainel(el,{left:x,right:x+100,top:y,bottom:y+40});
     assert.ok(p.x>=0&&p.y>=0);assert.ok(p.x+p.largura<=w+.01);assert.ok(p.y+p.altura<=h+.01);
     assert.ok(parseFloat(estilo.maxWidth)<=w);assert.ok(parseFloat(estilo.maxHeight)<=h);assert.equal(estilo.overflow,'auto');assert.equal(parseFloat(estilo.left),p.x+30);
   }
 }
});
test('animação tem opção desligada e movimento reduzido anula todos os efeitos',()=>{
 assert.equal(preferenciaMovimento({animacaoMenus:'nenhuma'}).duracao,0);assert.equal(preferenciaMovimento({animacaoMenus:'revelar'},true).duracao,0);
 assert.equal(preferenciaMovimento({animacaoMenus:'revelar',duracaoMenus:9999}).duracao,400);
 let chamadas=0,quadros;const el={ownerDocument:{defaultView:{matchMedia:()=>({matches:false})}},animate:(q)=>{chamadas++;quadros=q;return {};}};
 animarMenu(el,{animacaoMenus:'nenhuma'});assert.equal(chamadas,0);animarMenu(el,{animacaoMenus:'revelar'});assert.equal(chamadas,1);assert.equal(quadros[0].clipPath,'inset(0 0 100% 0)');
 animarMenu(el,{animacaoMenus:'revelar'},true);assert.equal(quadros[1].opacity,0);
});
test('categorias cobrem todos os comportamentos sem duplicar e modo estreito impede push',()=>{
 const ids=CATEGORIAS_COMPORTAMENTOS.flatMap(c=>c.itens);assert.equal(ids.length,new Set(ids).size);assert.deepEqual([...ids].sort(),Object.keys(COMPORTAMENTOS).sort());
 const s=motorMenus().sidebar(390,{modo:'open',aberto:true});assert.equal(s.modo,'minimal');assert.equal(s.overlay,true);assert.equal(s.deslocamento,0);
 assert.ok(REGRAS_MENUS.some(r=>r.id==='limite-tela'));
});
test('evento animar chega ao runtime com efeito e duração; respeita movimento reduzido',()=>{
 assert.ok(ACOES.some(([id])=>id==='animar'));
 const d=dadosRuntime([{id:'gatilho',tipo:'botao',eventos:[{tipo:'onClick',acao:'animar',alvo:'alvo',animacao:{tipo:'pulsar',duracao:350}}]}]);assert.deepEqual(d.regras[0].animacao,{tipo:'pulsar',duracao:350});
 let chamada;const el={ownerDocument:{defaultView:{matchMedia:()=>({matches:false})}},animate:(quadros,opcoes)=>{chamada={quadros,opcoes};return {cancel(){}};}};
 motorMenus().animar(el,d.regras[0].animacao);assert.equal(chamada.opcoes.duration,350);assert.equal(chamada.quadros.length,3);
 el.ownerDocument.defaultView.matchMedia=()=>({matches:true});assert.equal(motorMenus().animar(el),null);
});
