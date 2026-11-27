import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {capturarFormatacao,aplicarFormatacao} from '../js/nucleo/pincelFormatacao.js';
import {Area} from '../js/ui/canvas.js';

test('pincel copia visual completo sem alterar texto, posição, tamanho ou ações; desfazer restaura',()=>{
 const n=new Nucleo();n.novo(false);const a=n.criar('botao',10,20),b=n.criar('texto',300,200);
 n.definir(a,{'estilo.fundo':'#cc0000','estilo.tamanhoFonte':24,'estilo.preenchimentos':[{tipo:'solido',cor:'#cc0000'}],'estados.hover.fundo':'#00cc00'},'Visual origem');
 const origem=JSON.parse(JSON.stringify(n.elemento(a))),antes=JSON.parse(JSON.stringify(n.elemento(b)));
 const r=aplicarFormatacao(n,capturarFormatacao(origem),[b]);assert.equal(r.acao,'aplicado');
 const depois=n.elemento(b);assert.deepEqual(depois.estilo,origem.estilo);assert.deepEqual(depois.estados,origem.estados);
 for(const k of ['x','y','largura','altura','texto','eventos','tipo','pai','rotacao'])assert.deepEqual(depois[k],antes[k]);
 n.desfazer();assert.deepEqual(n.elemento(b),antes);n.refazer();assert.deepEqual(n.elemento(b).estilo,origem.estilo);
});
test('fotografia independe de alterações na origem e não compartilha listas entre destinos',()=>{
 const n=new Nucleo();n.novo(false);const a=n.criar('caixa',0,0),b=n.criar('caixa',200,0),c=n.criar('caixa',400,0);
 const formato=capturarFormatacao(n.elemento(a));n.elemento(a).estilo.fundo='#112233';
 aplicarFormatacao(n,formato,[b,c]);assert.notEqual(n.elemento(b).estilo.fundo,'#112233');
 n.elemento(b).estilo.fundo='#abcdef';assert.notEqual(n.elemento(c).estilo.fundo,'#abcdef');
});
test('pincel ignora destinos travados, especiais ou removidos e limpa efeitos antigos',()=>{
 const n=new Nucleo();n.novo(false);const a=n.criar('caixa',0,0),b=n.criar('caixa',200,0);
 n.elemento(b).estilo.efeitos=[{tipo:'sombra'}];const f=capturarFormatacao(n.elemento(a));
 aplicarFormatacao(n,f,[b]);assert.equal(n.elemento(b).estilo.efeitos,undefined);
 n.definir(b,{travado:true},'Travar');assert.equal(aplicarFormatacao(n,f,[b,'ausente','__canvas']).acao,'ignorado');
 assert.throws(()=>capturarFormatacao(null));
});
test('clique com pincel chega ao destino no canvas mesmo em modo formulário; vazio não cria elementos',()=>{
 const destinos=[],area={alvoNoPonto:e=>e.target.closest('[data-hf]'),ui:{modo:'designer'},ferramenta:'pincel',ponto:()=>({x:0,y:0}),app:{ui:{hibrido:true,travaTela:true},pintarFormatacao:id=>destinos.push(id)}};
 let prevenido=0;const evento={button:0,preventDefault:()=>prevenido++,target:{closest:()=>({dataset:{hf:'destino'}})}};
 Area.prototype.iniciar.call(area,evento);assert.deepEqual(destinos,['destino']);assert.equal(prevenido,1);
 evento.target.closest=()=>null;Area.prototype.iniciar.call(area,evento);assert.equal(destinos.length,1);
});
test('pincel completo transfere vínculos com seus eventos, código e abertura; autorreferência aponta ao destino',()=>{
 const n=new Nucleo();n.novo(false);const a=n.criar('botao',0,0),b=n.criar('botao',200,0),externo=n.criar('caixa',400,0);
 const origem=n.elemento(a);origem.eventos=[{tipo:'onClick',acao:'alternar',alvo:a},{tipo:'onHover',acao:'abrir',alvo:externo},{tipo:'onClick',vinculoId:'v1',vinculo:'ferramenta/teste/acao@1.0.0',dispara:'executar'}];
 origem.vinculos=[{id:'v1',ref:'ferramenta/teste/acao@1.0.0',sinal:'executar',evento:'onClick',args:{valor:5}}];origem.codigo={js:'raiz.dataset.copiado="sim";',css:'.x {color:red}',html:'<b>Exemplo</b>'};origem.abertura={fecharEsc:true};
 const f=capturarFormatacao({...origem,id:a},true),antes=structuredClone(n.elemento(b));
 assert.equal(aplicarFormatacao(n,f,[b],{visual:true,efeitos:true,interacoes:true,codigo:true}).acao,'aplicado');
 const destino=n.elemento(b);assert.equal(destino.eventos[0].alvo,b);assert.equal(destino.eventos[1].alvo,externo);assert.deepEqual(destino.vinculos,origem.vinculos);assert.deepEqual(destino.codigo,origem.codigo);assert.deepEqual(destino.abertura,origem.abertura);
 n.desfazer();assert.deepEqual(n.elemento(b),antes);
});
test('opções isolam efeitos e código e preservam as categorias desmarcadas',()=>{
 const n=new Nucleo();n.novo(false);const a=n.criar('caixa',0,0),b=n.criar('caixa',200,0);n.elemento(a).estilo.sombra='forte';n.elemento(a).codigo={js:'raiz.title="novo";'};
 const f=capturarFormatacao({...n.elemento(a),id:a},true);n.elemento(b).estilo.fundo='#abcabc';const eventos=structuredClone(n.elemento(b).eventos);
 aplicarFormatacao(n,f,[b],{visual:false,efeitos:true,interacoes:false,codigo:true});assert.equal(n.elemento(b).estilo.fundo,'#abcabc');assert.equal(n.elemento(b).estilo.sombra,'forte');assert.deepEqual(n.elemento(b).eventos,eventos);assert.deepEqual(n.elemento(b).codigo,f.codigo);
 assert.equal(aplicarFormatacao(n,f,[b],{visual:false,efeitos:false,interacoes:false,codigo:false}).acao,'ignorado');
});
