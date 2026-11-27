import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {guiaConstrucao} from '../js/nucleo/guiaConstrucao.js';
import {textoDoProjeto,lerProjeto} from '../js/nucleo/arquivoProjeto.js';
test('guia usa identificadores reais e distingue evento visual de motor pendente',()=>{
 const n=new Nucleo();n.autosalvar=()=>{};n.novo(false);const id=n.criar('botao');
 const guia=guiaConstrucao(n.doc);assert.equal(guia.componentes[0].id,id);assert.match(guia.componentes[0].eventos[0].implementacao,/verificar/);assert.deepEqual(guia.referencias,[]);
});
test('referências e requisitos autorais acompanham documentação e pacote ao salvar',()=>{
 const n=new Nucleo();n.autosalvar=()=>{};n.novo(false);n.criar('botao');
 n.definir('__canvas',{especificacaoSoftware:{produto:{objetivo:'Criar outros programas'},referencias:[{origem:'imagem-oficina.png',estado:'observado',observacoes:['Categorias por cor']}],requisitos:['RF01: gerar o motor e a interface']}});
 const p=lerProjeto(textoDoProjeto(n.serializar())),g=JSON.parse(p.pacote.arquivos['documentos/guia-construcao.json']);
 assert.equal(g.referencias[0].estado,'observado');assert.equal(g.requisitos[0],'RF01: gerar o motor e a interface');assert.match(p.documentacao.arquivos['documentos/01-produto-PRD.md'],/Criar outros programas/);
 const eventos=JSON.parse(p.documentacao.arquivos['documentos/inventario-comandos.json']);assert.equal(eventos[0].elemento,n.elementos()[0].id);
});
