import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validarMenu,sincronizarMenu,criarModeloMenu,metricasMenu} from '../js/nucleo/menuEngine.js';
import {MENU_PDF_PADRAO} from '../js/nucleo/menuPdfPadrao.js';
import {cont,texto,botao,achatar,assentar,evento,paraComponente,deComponente} from '../js/nucleo/modelos.js';
const clone=()=>JSON.parse(JSON.stringify(MENU_PDF_PADRAO));
test('contrato contém 66 comandos únicos organizados em 6 abas e 16 grupos',()=>{
 assert.deepEqual(validarMenu(clone()),[]);const m=metricasMenu(clone());assert.equal(m.comandos,66);assert.equal(m.abas,6);assert.equal(m.grupos,16);
});
test('identificadores repetidos e destaque ambíguo são rejeitados',()=>{
 const p=clone(),g=p.designer.abas[0].grupos[0];g.comandos[1].id=g.comandos[0].id;g.comandos[1].destaque=true;
 assert(validarMenu(p).some(e=>e.includes('repetido')));assert(validarMenu(p).some(e=>e.includes('destaque')));
});
test('alteração visual propaga rótulo ao HTML e ao XAML',()=>{
 const p=clone();p.designer.abas[0].grupos[0].comandos[0].rotulo='Criar documento agora';const n=sincronizarMenu(p);
 assert(n.codigos.web.texto.includes('Criar documento agora'));assert(n.codigos.desktopWpf.texto.includes('Criar documento agora'));
});
test('código manual é preservado e marcado para revisão',()=>{
 const p=clone();p.codigos={web:{origem:'manual',texto:'Minha personalização'}};const n=sincronizarMenu(p);
 assert.equal(n.codigos.web.texto,'Minha personalização');assert.match(n.codigos.web.estado,/revisar/);assert.equal(n.codigos.mobile.origem,'não disponível');
});
test('geração não altera o pacote original',()=>{
 const p=clone(),antes=JSON.stringify(p);sincronizarMenu(p);assert.equal(JSON.stringify(p),antes);
});
test('rótulos são escapados nas duas saídas',()=>{
 const p=clone();p.designer.abas[0].nome='A <script>alert(1)</script> & "B"';const n=sincronizarMenu(p);
 assert(!n.codigos.web.texto.includes('<script>alert(1)'));assert(n.codigos.desktopWpf.texto.includes('&lt;script&gt;'));
});
test('pacote inválido não gera saídas',()=>{
 const p=clone();p.designer.abas=[];assert.throws(()=>sincronizarMenu(p));
});
test('vínculos inexistentes são rejeitados e reuso é mensurável',()=>{
 const p=clone();assert.equal(metricasMenu(p).vinculosValidos,66);assert.equal(metricasMenu(p).reusoTemplatesPercentual,100);
 p.designer.abas[0].grupos[0].comandos[0].ferramentaId='nao-existe';assert(validarMenu(p).some(e=>e.includes('Ferramenta inexistente')));
});
test('identidade visual pode mudar sem perder a ferramenta vinculada',()=>{
 const p=clone();p.designer.abas[0].grupos[0].comandos[0].id='novo-botao';const n=sincronizarMenu(p);
 assert(n.codigos.desktopWpf.texto.includes('Tag="new"'));assert(n.codigos.web.texto.includes('data-command="new"'));
});
test('modelo real Hefestus preserva comandos, grupos e troca de abas',()=>{
 const m=criarModeloMenu(clone(),{cont,texto,botao,achatar,assentar,evento});const n=deComponente(paraComponente(m));
 const events=n.elementos.flatMap(e=>e.el.eventos||[]);assert.equal(events.filter(e=>e.dispara?.startsWith('pdf|')).length,66);assert.equal(events.filter(e=>e.acao==='mostrarSo').length,6);
 assert(n.elementos.filter(e=>e.el.tipo==='container').length>=16);assert.equal(n.comportamento.bancoFerramentas.length,66);assert.deepEqual(n.comportamento.pacote.designer,MENU_PDF_PADRAO.designer);assert.deepEqual(n.comportamento.pacote.codigos,MENU_PDF_PADRAO.codigos);
});

 test('modelo salvo pelo usuário prevalece sobre o modelo padrão',async()=>{const {Aparencia}=await import('../js/app/aparencia.js');const custom={id:'pdf-studio-profissional',nome:'Minha versão'};assert.equal(Aparencia.prototype.acharModelo.call({modelosUsuario:()=>[custom]},custom.id),custom);});
