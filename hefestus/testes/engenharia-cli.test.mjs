import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,statSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {abrirProjeto,gravarProjeto} from '../ferramentas/motor-projetos.mjs';
import {DocumentoAtivo} from '../js/aplicacao/documentoAtivo.js';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..'),script=join(raiz,'ferramentas/engenharia.mjs');
const html=(texto='Antes',x=20)=>'<button id="salvar" style="position:absolute;left:'+x+'px;top:10px;width:140px;height:40px">'+texto+'</button>';
function contexto(t){
 const pasta=mkdtempSync(join(tmpdir(),'heph cli ')),fonte=join(pasta,'fonte inicial.html'),arquivo=join(pasta,'projeto atual.hefestus');
 t.after(()=>rmSync(pasta,{recursive:true,force:true}));writeFileSync(fonte,html());
 const cli=(...args)=>{const r=spawnSync(process.execPath,[script,...args],{cwd:pasta,windowsHide:true,encoding:'utf8',timeout:10000});assert.equal(r.signal,null,r.error?.message);const texto=r.status===0?r.stdout:r.stderr;assert.ok(texto.trim(),r.error?.message);return {status:r.status,dados:JSON.parse(texto)};};
 const sucesso=(...args)=>{const r=cli(...args);assert.equal(r.status,0,JSON.stringify(r.dados));return r.dados;};
 const imp=sucesso('importar-html',fonte,arquivo);
 const comparar=()=>sucesso('comparar-html',arquivo,imp.raiz,fonte);
 const atualizar=(p,...op)=>cli('atualizar-html',arquivo,imp.raiz,fonte,'--revisao-arquivo',p.revisaoArquivo,'--revisao-fonte',p.revisaoFonte,...op);
 return {pasta,fonte,arquivo,cli,sucesso,imp,comparar,atualizar};
}
test('CLI mantém importar/resumo/verificar e não sobrescreve saída sem opção explícita',t=>{
 const e=contexto(t),antes=readFileSync(e.arquivo,'utf8'),v=e.sucesso('verificar',e.arquivo),r=e.sucesso('resumo',e.arquivo);
 assert.equal(v.revisaoArquivo,r.revisaoArquivo);assert.equal(readFileSync(e.arquivo,'utf8'),antes);assert.equal(r.elementos,2);assert.ok(JSON.parse(antes).pacote);assert.ok(JSON.parse(antes).documentacao);
 const erro=e.cli('importar-html',e.fonte,e.arquivo);assert.equal(erro.dados.codigo,'SAIDA_EXISTENTE');assert.equal(readFileSync(e.arquivo,'utf8'),antes);
 writeFileSync(e.fonte,html('Substituído'));e.sucesso('importar-html',e.fonte,e.arquivo,'--substituir');assert.equal(abrirProjeto(e.arquivo,e.pasta).elemento(e.imp.ids.salvar).rotulo,'Substituído');assert.ok(!readdirSync(e.pasta).some(f=>f.endsWith('.tmp')));
});
test('comparar-html retorna deltas e hashes sem gravar o projeto nem alterar a fonte',t=>{
 const e=contexto(t);writeFileSync(e.fonte,html('Depois',40));const antes=readFileSync(e.arquivo,'utf8'),st=statSync(e.arquivo).mtimeMs,fonte=readFileSync(e.fonte,'utf8'),p=e.comparar();
 assert.match(p.revisaoArquivo,/^[a-f0-9]{64}$/);assert.match(p.revisaoFonte,/^[a-f0-9]{64}$/);assert.equal(p.conflitos.length,0);assert.ok(p.alteracoes.some(x=>x.campo==='rotulo'));assert.ok(p.alteracoes.some(x=>x.campo==='x'));
 assert.equal(readFileSync(e.arquivo,'utf8'),antes);assert.equal(statSync(e.arquivo).mtimeMs,st);assert.equal(readFileSync(e.fonte,'utf8'),fonte);
});
test('atualizar-html equivale ao domínio e conserva metadados, IDs, overrides e histórico reaberto',t=>{
 const e=contexto(t),n=abrirProjeto(e.arquivo,e.pasta);n.definir(e.imp.ids.salvar,{'estilo.raio':17},'Raio local');gravarProjeto(n,e.arquivo);
 const bruto=JSON.parse(readFileSync(e.arquivo,'utf8'));bruto.extensaoFutura={versao:9};bruto.memoria.futuro={ativo:true};writeFileSync(e.arquivo,JSON.stringify(bruto));writeFileSync(e.fonte,html('Atualizado'));
 const direto=abrirProjeto(e.arquivo,e.pasta),d=new DocumentoAtivo(direto),plano=d.prepararReimportacao(e.imp.raiz,html('Atualizado'));d.aplicarReimportacao(plano);
 const p=e.comparar(),r=e.atualizar(p);assert.equal(r.status,0,JSON.stringify(r.dados));const salvo=abrirProjeto(e.arquivo,e.pasta);assert.deepEqual(salvo.doc,direto.doc);assert.equal(salvo.elemento(e.imp.ids.salvar).estilo.raio,17);assert.deepEqual(JSON.parse(readFileSync(e.arquivo,'utf8')).extensaoFutura,{versao:9});assert.deepEqual(JSON.parse(readFileSync(e.arquivo,'utf8')).memoria.futuro,{ativo:true});
 assert.equal(salvo.projeto.historico.at(-1).pedido,'Atualizar HTML por comparação de três versões');salvo.desfazer();assert.equal(salvo.elemento(e.imp.ids.salvar).rotulo,'Antes');salvo.refazer();assert.equal(salvo.elemento(e.imp.ids.salvar).rotulo,'Atualizado');assert.equal(salvo.elemento(e.imp.raiz).importacaoNativa.fonte,html('Atualizado'));
});
test('conflitos pela CLI exigem escolha explícita e aceitam fonte ou local sem perda',t=>{
 const e=contexto(t);let n=abrirProjeto(e.arquivo,e.pasta);n.definir(e.imp.ids.salvar,{rotulo:'Meu botão'},'Nome local');gravarProjeto(n,e.arquivo);writeFileSync(e.fonte,html('Da fonte'));let p=e.comparar();assert.equal(p.conflitos.length,1);const antes=readFileSync(e.arquivo,'utf8');assert.equal(e.atualizar(p).dados.codigo,'CONFLITO');assert.equal(readFileSync(e.arquivo,'utf8'),antes);
 const escolhas=join(e.pasta,'escolhas.json');writeFileSync(escolhas,JSON.stringify({[p.conflitos[0].chave]:'fonte'}));assert.equal(e.atualizar(p,'--resolucoes',escolhas).status,0);assert.equal(abrirProjeto(e.arquivo,e.pasta).elemento(e.imp.ids.salvar).rotulo,'Da fonte');
 n=abrirProjeto(e.arquivo,e.pasta);n.definir(e.imp.ids.salvar,{rotulo:'Outra escolha'},'Nome local');gravarProjeto(n,e.arquivo);writeFileSync(e.fonte,html('Fonte seguinte'));p=e.comparar();writeFileSync(escolhas,JSON.stringify({[p.conflitos[0].chave]:'local'}));assert.equal(e.atualizar(p,'--resolucoes',escolhas).status,0);n=abrirProjeto(e.arquivo,e.pasta);assert.equal(n.elemento(e.imp.ids.salvar).rotulo,'Outra escolha');assert.equal(n.elemento(e.imp.raiz).importacaoNativa.fonte,html('Fonte seguinte'));
});
test('CLI recusa hashes obsoletos de projeto e fonte, sem salvar parcialmente',t=>{
 const e=contexto(t);writeFileSync(e.fonte,html('Novo'));let p=e.comparar();writeFileSync(e.fonte,html('Mudou depois'));const antes=readFileSync(e.arquivo,'utf8');assert.equal(e.atualizar(p).dados.codigo,'FONTE_OBSOLETA');assert.equal(readFileSync(e.arquivo,'utf8'),antes);
 p=e.comparar();writeFileSync(e.arquivo,antes+'\n');const alterado=readFileSync(e.arquivo,'utf8');assert.equal(e.atualizar(p).dados.codigo,'REVISAO_OBSOLETA');assert.equal(readFileSync(e.arquivo,'utf8'),alterado);
 assert.equal(e.cli('atualizar-html',e.arquivo,e.imp.raiz,e.fonte).dados.codigo,'REVISAO_NECESSARIA');p=e.comparar();assert.equal(e.cli('atualizar-html',e.arquivo,e.imp.raiz,e.fonte,'--revisao-arquivo',p.revisaoArquivo).dados.codigo,'REVISAO_FONTE_NECESSARIA');
});
test('CLI rejeita resoluções inválidas, opções repetidas e estrutura sem IDs sem alterar o arquivo',t=>{
 const e=contexto(t);writeFileSync(e.fonte,html('Novo'));const p=e.comparar(),antes=readFileSync(e.arquivo,'utf8'),escolhas=join(e.pasta,'invalido.json');
 for(const valor of ['[]','null','{"inventado":"fonte"}','{quebrado']){writeFileSync(escolhas,valor);assert.equal(e.atualizar(p,'--resolucoes',escolhas).status,1);assert.equal(readFileSync(e.arquivo,'utf8'),antes);}
 assert.equal(e.atualizar(p,'--revisao-fonte',p.revisaoFonte).dados.codigo,'ARGUMENTOS_INVALIDOS');assert.equal(e.cli('verificar',e.arquivo,'--substituir').dados.codigo,'ARGUMENTOS_INVALIDOS');
 writeFileSync(e.fonte,html('Novo')+'<p>Extra</p>');assert.equal(e.cli('comparar-html',e.arquivo,e.imp.raiz,e.fonte).dados.codigo,'IDENTIDADE_ESTRUTURAL');assert.equal(readFileSync(e.arquivo,'utf8'),antes);
});
test('CLI informa limite de fonte, formato futuro e recuperação necessária sem regravar',t=>{
 const e=contexto(t),antes=readFileSync(e.arquivo,'utf8');writeFileSync(e.fonte,'á'.repeat(1024*1024+1));assert.equal(e.cli('comparar-html',e.arquivo,e.imp.raiz,e.fonte).status,1);assert.equal(readFileSync(e.arquivo,'utf8'),antes);writeFileSync(e.fonte,html('Novo'));
 const bruto=JSON.parse(antes);bruto.documento.elementos.__canvas.largura=-9;writeFileSync(e.arquivo,JSON.stringify(bruto));const corrompido=readFileSync(e.arquivo,'utf8'),p=e.comparar();assert.equal(p.recuperacaoNecessaria,true);assert.equal(e.atualizar(p).dados.codigo,'RECUPERACAO_NECESSARIA');assert.equal(readFileSync(e.arquivo,'utf8'),corrompido);
 writeFileSync(e.arquivo,'{"formato":"hefestus","versao":99}');assert.equal(e.cli('verificar',e.arquivo).dados.codigo,'FORMATO_FUTURO');assert.equal(readFileSync(e.arquivo,'utf8'),'{"formato":"hefestus","versao":99}');
});

test('CLI compara adição/remoção explícitas e aplica a troca como uma transação',t=>{
 const e=contexto(t);writeFileSync(e.fonte,'<button id="novo" style="position:absolute;left:30px;top:40px;width:150px;height:40px">Novo</button>');const p=e.comparar();assert.equal(p.adicoes.length,1);assert.equal(p.remocoes.length,1);assert.notEqual(p.adicoes[0].id,e.imp.ids.salvar);const resolucoes=join(e.pasta,'estrutura.json');writeFileSync(resolucoes,JSON.stringify({[p.conflitos[0].chave]:'fonte'}));const r=e.atualizar(p,'--resolucoes',resolucoes);assert.equal(r.status,0,JSON.stringify(r.dados));const n=abrirProjeto(e.arquivo,e.pasta);assert.equal(n.elemento(e.imp.ids.salvar),undefined);assert.equal(n.elemento(p.adicoes[0].id).rotulo,'Novo');n.desfazer();assert.equal(n.elemento(e.imp.ids.salvar).rotulo,'Antes');assert.equal(n.elemento(p.adicoes[0].id),undefined);
});
