import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,mkdirSync,statSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DocumentoAtivo} from '../js/aplicacao/documentoAtivo.js';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {novoProjeto,gravarProjeto,abrirProjeto} from '../ferramentas/motor-projetos.mjs';
import {ferramentasEngenhariaMcp} from '../ferramentas/engenhariaMcp.mjs';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=(t='Original')=>'<button id="enviar" style="position:absolute;left:20px;top:10px;width:120px;height:40px">'+t+'</button>';
async function ensaio(t){
 const pasta=mkdtempSync(join(tmpdir(),'heph-engenharia-mcp-')),caminho=join(pasta,'p.hefestus');
 const n=novoProjeto(pasta,{nome:'Engenharia'});gravarProjeto(n,caminho);
 const srv=spawn(process.execPath,[join(raiz,'ferramentas/hefestus-mcp.mjs'),pasta],{windowsHide:true,stdio:['pipe','pipe','pipe']});
 let id=0,buffer='';const pending=new Map();let erros='';srv.stderr.on('data',d=>erros+=d);
 srv.stdout.on('data',d=>{buffer+=d;let i;while((i=buffer.indexOf('\n'))>=0){const m=JSON.parse(buffer.slice(0,i));buffer=buffer.slice(i+1);pending.get(m.id)?.resolve(m);pending.delete(m.id);}});
 const rpc=(method,params)=>new Promise((resolve,reject)=>{const num=++id,timer=setTimeout(()=>{pending.delete(num);reject(Error('MCP não respondeu: '+erros));},5000);pending.set(num,{resolve:m=>{clearTimeout(timer);resolve(m);}});srv.stdin.write(JSON.stringify({jsonrpc:'2.0',id:num,method,params})+'\n');});
 t.after(()=>{srv.kill();rmSync(pasta,{recursive:true,force:true});});
 await rpc('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'engenharia-teste',version:'1'}});
 const chamar=async(name,args={})=>(await rpc('tools/call',{name:'hefestus_'+name,arguments:{arquivo:'p.hefestus',...args}})).result;
 const dados=async(name,args)=>{const r=await chamar(name,args);assert.ok(!r.isError,JSON.stringify(r));return r.structuredContent;};
 const importar=async()=>{const {revisaoArquivo}=await dados('verificar_projeto');return dados('importar_html_nativo',{html:html(),revisaoArquivo});};
 return {pasta,caminho,chamar,dados,importar};
}
test('MCP nativo equivale ao domínio, preserva fonte, campos futuros, histórico e IDs',async t=>{
 const e=await ensaio(t);const bruto=JSON.parse(readFileSync(e.caminho,'utf8'));bruto.metadadoFuturo={valor:42};bruto.memoria.futuro={ativo:true};bruto.documento.extensaoFutura={modo:9};writeFileSync(e.caminho,JSON.stringify(bruto));
 const bytes=readFileSync(e.caminho),mtime=statSync(e.caminho).mtimeMs,n=new Nucleo(),d=new DocumentoAtivo(n);d.abrir(bytes.toString());
 const ver=await e.dados('verificar_projeto');assert.equal(readFileSync(e.caminho,'utf8'),bytes.toString());assert.equal(statSync(e.caminho).mtimeMs,mtime);
 const esperado=d.importarHTML({html:html()}),r=await e.dados('importar_html_nativo',{html:html(),revisaoArquivo:ver.revisaoArquivo});assert.deepEqual(r.ids,esperado.ids);
 const salvo=abrirProjeto(e.caminho,e.pasta);assert.deepEqual(salvo.doc,n.doc);assert.equal(salvo.elemento(r.raiz).importacaoNativa.fonte,html());assert.deepEqual(JSON.parse(readFileSync(e.caminho,'utf8')).metadadoFuturo,{valor:42});assert.deepEqual(JSON.parse(readFileSync(e.caminho,'utf8')).memoria.futuro,{ativo:true});assert.deepEqual(salvo.doc.extensaoFutura,{modo:9});assert.equal(salvo.projeto.historico.at(-1).pedido,'Importar HTML como objetos nativos');
 assert.notEqual(r.revisaoArquivo,ver.revisaoArquivo);salvo.desfazer();assert.equal(salvo.elemento(r.raiz),undefined);salvo.refazer();assert.equal(salvo.elemento(r.ids.enviar).rotulo,'Original');
});
test('MCP recusa importação sem revisão atual e não grava alteração parcial',async t=>{
 const e=await ensaio(t),v=await e.dados('verificar_projeto');await e.importar();const antes=readFileSync(e.caminho,'utf8');
 for(const rev of [undefined,'invalida',v.revisaoArquivo]){const r=await e.chamar('importar_html_nativo',{html:html(),revisaoArquivo:rev});assert.equal(r.isError,true);assert.equal(r.structuredContent.salvo,false);assert.equal(readFileSync(e.caminho,'utf8'),antes);}
});
test('MCP compara sem gravar e aplica conflitos fonte/local no mesmo histórico',async t=>{
 const e=await ensaio(t),imp=await e.importar();const n=abrirProjeto(e.caminho,e.pasta);n.definir(imp.ids.enviar,{rotulo:'Local'},'Editar local');gravarProjeto(n,e.caminho);
 const antes=readFileSync(e.caminho,'utf8'),p=await e.dados('preparar_reimportacao_html',{raiz:imp.raiz,html:html('Fonte')});assert.equal(p.conflitos.length,1);assert.equal(readFileSync(e.caminho,'utf8'),antes);
 const sem=await e.chamar('aplicar_reimportacao_html',{token:p.token});assert.equal(sem.isError,true);assert.equal(sem.structuredContent.codigo,'CONFLITO');assert.equal(readFileSync(e.caminho,'utf8'),antes);
 const ruim=await e.chamar('aplicar_reimportacao_html',{token:p.token,resolucoes:{inventado:'fonte'}});assert.equal(ruim.structuredContent.codigo,'RESOLUCAO_INVALIDA');
 const resolucoes={[p.conflitos[0].chave]:'fonte'};await e.dados('aplicar_reimportacao_html',{token:p.token,resolucoes});let salvo=abrirProjeto(e.caminho,e.pasta);assert.equal(salvo.elemento(imp.ids.enviar).rotulo,'Fonte');salvo.desfazer();assert.equal(salvo.elemento(imp.ids.enviar).rotulo,'Local');
 const repetido=await e.chamar('aplicar_reimportacao_html',{token:p.token,resolucoes});assert.equal(repetido.structuredContent.codigo,'PLANO_INDISPONIVEL');
 salvo.definir(imp.ids.enviar,{rotulo:'Minha edição'},'Nome local');gravarProjeto(salvo,e.caminho);const p2=await e.dados('preparar_reimportacao_html',{raiz:imp.raiz,html:html('Outra fonte')});await e.dados('aplicar_reimportacao_html',{token:p2.token,resolucoes:{[p2.conflitos[0].chave]:'local'}});salvo=abrirProjeto(e.caminho,e.pasta);assert.equal(salvo.elemento(imp.ids.enviar).rotulo,'Minha edição');assert.equal(salvo.elemento(imp.raiz).importacaoNativa.fonte,html('Outra fonte'));
});
test('MCP token vincula arquivo e bytes, rejeita edição posterior e token inventado',async t=>{
 const e=await ensaio(t),imp=await e.importar(),p=await e.dados('preparar_reimportacao_html',{raiz:imp.raiz,html:html('Nova')});
 writeFileSync(join(e.pasta,'outro.hefestus'),readFileSync(e.caminho));assert.equal((await e.chamar('aplicar_reimportacao_html',{arquivo:'outro.hefestus',token:p.token})).structuredContent.codigo,'PLANO_ARQUIVO');
 writeFileSync(e.caminho,readFileSync(e.caminho,'utf8')+'\n');const antes=readFileSync(e.caminho,'utf8');assert.equal((await e.chamar('aplicar_reimportacao_html',{token:p.token})).structuredContent.codigo,'REVISAO_OBSOLETA');assert.equal(readFileSync(e.caminho,'utf8'),antes);
 assert.equal((await e.chamar('aplicar_reimportacao_html',{token:'inventado'})).structuredContent.codigo,'PLANO_INDISPONIVEL');
});
test('MCP rejeita HTML inválido, fonte grande e formato futuro sem regravar',async t=>{
 const e=await ensaio(t),v=await e.dados('verificar_projeto'),antes=readFileSync(e.caminho,'utf8');
 for(const fonte of ['<script>throw 1</script>',7,'<button id="x">A</button><button id="x">B</button>','á'.repeat(1024*1024+1)]){const r=await e.chamar('importar_html_nativo',{html:fonte,revisaoArquivo:v.revisaoArquivo});assert.equal(r.isError,true);assert.equal(readFileSync(e.caminho,'utf8'),antes);}
 const futuro=JSON.stringify({formato:'hefestus',versao:99});writeFileSync(e.caminho,futuro);assert.equal((await e.chamar('verificar_projeto')).structuredContent.codigo,'FORMATO_FUTURO');assert.equal(readFileSync(e.caminho,'utf8'),futuro);
});
test('MCP rejeita mudança estrutural sem identidade explícita e conserva o projeto',async t=>{
 const e=await ensaio(t),imp=await e.importar(),antes=readFileSync(e.caminho,'utf8');const r=await e.chamar('preparar_reimportacao_html',{raiz:imp.raiz,html:html()+'<p>Extra</p>'});assert.equal(r.structuredContent.codigo,'IDENTIDADE_ESTRUTURAL');assert.equal(readFileSync(e.caminho,'utf8'),antes);
});
test('MCP engenharia recusa escape de pasta, extensão e link para pasta externa',async t=>{
 const e=await ensaio(t);for(const arquivo of ['../fora.hefestus','notas.txt'])assert.equal((await e.chamar('verificar_projeto',{arquivo})).isError,true);
 const fora=mkdtempSync(join(tmpdir(),'heph-fora-mcp-'));t.after(()=>rmSync(fora,{recursive:true,force:true}));writeFileSync(join(fora,'fora.hefestus'),readFileSync(e.caminho));symlinkSync(fora,join(e.pasta,'link'),process.platform==='win32'?'junction':'dir');const r=await e.chamar('verificar_projeto',{arquivo:'link/fora.hefestus'});assert.equal(r.structuredContent.codigo,'CAMINHO_FORA');
});
test('comparações expiram em dez minutos e mantêm no máximo 32 tokens',()=>{
 const pasta=mkdtempSync(join(tmpdir(),'heph-planos-mcp-'));try{const caminho=join(pasta,'p.hefestus'),n=novoProjeto(pasta),d=new DocumentoAtivo(n),imp=d.importarHTML({html:html()});gravarProjeto(n,caminho);let clock=0;const ts=ferramentasEngenhariaMcp({pasta,projetoEm:f=>join(pasta,f),agora:()=>clock}),call=(name,args)=>ts.find(x=>x.name==='hefestus_'+name).executar({arquivo:'p.hefestus',...args});const criar=()=>call('preparar_reimportacao_html',{raiz:imp.raiz,html:html('Nova')});const primeiro=criar();assert.equal(primeiro.ok,true);for(let i=0;i<32;i++)assert.equal(criar().ok,true);assert.equal(call('aplicar_reimportacao_html',{token:primeiro.token}).codigo,'PLANO_INDISPONIVEL');const ultimo=criar();clock=600000;assert.equal(call('aplicar_reimportacao_html',{token:ultimo.token}).codigo,'PLANO_INDISPONIVEL');}finally{rmSync(pasta,{recursive:true,force:true});}
});

test('MCP não sobrescreve um projeto que exige recuperação de dados',async t=>{
 const e=await ensaio(t),dados=JSON.parse(readFileSync(e.caminho,'utf8'));dados.documento.elementos.__canvas.largura=-10;writeFileSync(e.caminho,JSON.stringify(dados));const antes=readFileSync(e.caminho,'utf8'),v=await e.dados('verificar_projeto');assert.equal(v.recuperacaoNecessaria,true);const r=await e.chamar('importar_html_nativo',{html:html(),revisaoArquivo:v.revisaoArquivo});assert.equal(r.structuredContent.codigo,'RECUPERACAO_NECESSARIA');assert.equal(readFileSync(e.caminho,'utf8'),antes);
});

test('MCP publica adições/remoções e preserva objeto local ao atualizar a estrutura',async t=>{
 const e=await ensaio(t),imp=await e.importar(),nova='<button id="novo" style="position:absolute;left:30px;top:40px;width:150px;height:40px">Novo</button>',p=await e.dados('preparar_reimportacao_html',{raiz:imp.raiz,html:nova});assert.equal(p.adicoes.length,1);assert.equal(p.remocoes.length,1);const antes=readFileSync(e.caminho,'utf8');assert.equal((await e.chamar('aplicar_reimportacao_html',{token:p.token})).structuredContent.codigo,'CONFLITO');assert.equal(readFileSync(e.caminho,'utf8'),antes);await e.dados('aplicar_reimportacao_html',{token:p.token,resolucoes:{[p.conflitos[0].chave]:'local'}});const n=abrirProjeto(e.caminho,e.pasta),id=p.adicoes[0].id;assert.equal(n.elemento(id).rotulo,'Novo');assert.equal(n.elemento(imp.ids.enviar).origemHTML,undefined);assert.equal(n.elemento(imp.raiz).importacaoNativa.mapa.novo,id);n.desfazer();assert.equal(n.elemento(id),undefined);assert.equal(n.elemento(imp.ids.enviar).origemHTML.chave,'enviar');
});
