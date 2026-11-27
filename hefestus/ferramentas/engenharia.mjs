// CLI de Engenharia Integrada: usa os mesmos casos de uso e persistência do MCP.
import {existsSync,mkdirSync,writeFileSync,renameSync,linkSync,unlinkSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {DocumentoAtivo} from '../js/aplicacao/documentoAtivo.js';
import {nucleoSemEditor} from './motor-projetos.mjs';
import {LIMITES_ENGENHARIA,lerTextoLimitado,carregarProjetoEngenharia,conferirRevisaoArquivo,validarFonteHTML,validarResolucoesReimportacao,salvarProjetoEngenharia,textoProjetoEngenharia,hashConteudo,erroEngenharia as erro} from './engenhariaArquivos.mjs';
const USO='Uso: engenharia.mjs verificar|resumo PROJETO.hefestus; importar-html FONTE.html SAIDA.hefestus [--substituir]; comparar-html PROJETO.hefestus RAIZ FONTE.html; atualizar-html PROJETO.hefestus RAIZ FONTE.html --revisao-arquivo SHA --revisao-fonte SHA [--resolucoes ESCOLHAS.json]';
function argumentos(args){
 const cmd=args.shift(),pos=[],op={};
 for(let i=0;i<args.length;i++){
  const a=args[i];
  if(!a.startsWith('--')){pos.push(a);continue;}
  const permitidas=cmd==='importar-html'?['--substituir']:cmd==='atualizar-html'?['--revisao-arquivo','--revisao-fonte','--resolucoes']:[];
  if(!permitidas.includes(a)||a in op)throw erro('ARGUMENTOS_INVALIDOS','Opção inválida ou repetida: '+a+'. '+USO);
  if(a==='--substituir')op[a]=true;
  else{if(!args[i+1]||args[i+1].startsWith('--'))throw erro('ARGUMENTOS_INVALIDOS','Falta o valor de '+a);op[a]=args[++i];}
 }
 const quantidades={verificar:1,resumo:1,'importar-html':2,'comparar-html':3,'atualizar-html':3};
 if(!(cmd in quantidades)||pos.length!==quantidades[cmd])throw erro('ARGUMENTOS_INVALIDOS',USO);
 return {cmd,pos,op};
}
const lerFonte=arquivo=>validarFonteHTML(lerTextoLimitado(arquivo,LIMITES_ENGENHARIA.html));
function projeto(arquivo){if(typeof arquivo!=='string'||!arquivo.toLowerCase().endsWith('.hefestus'))throw erro('EXTENSAO_INVALIDA','Informe um projeto .hefestus.');return carregarProjetoEngenharia(path.resolve(arquivo));}
function salvarNovo(n,destino,substituir){
 if(!destino.toLowerCase().endsWith('.hefestus'))throw erro('EXTENSAO_INVALIDA','Informe uma saída .hefestus.');
 const file=path.resolve(destino),existe=existsSync(file);
 if(existe&&!substituir)throw erro('SAIDA_EXISTENTE','A saída existe. Use outro caminho ou --substituir.');
 const revisaoAnterior=existe?hashConteudo(readFileSync(file)):null,temp=file+'.'+randomUUID()+'.tmp';
 mkdirSync(path.dirname(file),{recursive:true});
 try{
  const conteudo=textoProjetoEngenharia(n);writeFileSync(temp,conteudo,{encoding:'utf8',flag:'wx'});
  if(existe){if(hashConteudo(readFileSync(file))!==revisaoAnterior)throw erro('REVISAO_OBSOLETA','A saída mudou antes de salvar. Repita a operação.');renameSync(temp,file);}
  else{linkSync(temp,file);unlinkSync(temp);}
  return {arquivo:file,revisaoArquivo:hashConteudo(conteudo)};
 }finally{try{unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')throw e;}}
}
try{
 const {cmd,pos,op}=argumentos(process.argv.slice(2));let r;
 if(cmd==='verificar'||cmd==='resumo'){
  const c=projeto(pos[0]);r={...(cmd==='verificar'?c.d.diagnosticar():c.d.resumo()),revisaoArquivo:c.revisaoArquivo,recuperacaoNecessaria:!!c.n.originalRecuperacao,avisosRecuperacao:c.n.relatorioRecuperacao??[]};
 }else if(cmd==='importar-html'){
  const n=nucleoSemEditor(path.dirname(path.resolve(pos[1]))),doc=new DocumentoAtivo(n),resultado=doc.comandos.executar('projeto.importar-html-nativo',{html:lerFonte(pos[0]),nome:path.basename(pos[0])});
  if(!resultado.aplicado)throw erro('NAO_APLICADO','Importação não aplicada.');
  r={...resultado,...salvarNovo(n,pos[1],op['--substituir']),salvo:true};
 }else{
  const c=projeto(pos[0]),html=lerFonte(pos[2]),revisaoFonte=hashConteudo(html);
  if(cmd==='atualizar-html'){
   conferirRevisaoArquivo(c,op['--revisao-arquivo']);
   if(typeof op['--revisao-fonte']!=='string'||!/^[a-f0-9]{64}$/.test(op['--revisao-fonte']))throw erro('REVISAO_FONTE_NECESSARIA','Obtenha revisaoFonte com comparar-html antes de atualizar.');
   if(op['--revisao-fonte']!==revisaoFonte)throw erro('FONTE_OBSOLETA','A fonte HTML mudou. Compare novamente; nenhuma alteração foi salva.');
  }
  const plano=c.d.prepararReimportacao(pos[1],html);
  if(cmd==='comparar-html')r={arquivo:path.resolve(pos[0]),raiz:pos[1],revisaoArquivo:c.revisaoArquivo,revisaoFonte,adicoes:plano.adicoes,remocoes:plano.remocoes,alteracoes:plano.alteracoes,conflitos:plano.conflitos,avisos:plano.novo.avisos,fidelidade:plano.novo.fidelidade,recuperacaoNecessaria:!!c.n.originalRecuperacao};
  else{
   const resolucoes=op['--resolucoes']?JSON.parse(lerTextoLimitado(op['--resolucoes'],LIMITES_ENGENHARIA.resolucoes).replace(/^\uFEFF/,'')):{};
   validarResolucoesReimportacao(plano,resolucoes);
   const resultado=c.d.aplicarReimportacao(plano,resolucoes);
   if(resultado.acao!=='aplicado')throw erro('NAO_APLICADO','Atualização não aplicada; confira a proteção do projeto.');
   // Confere a fonte novamente antes de persistir, além da revisão de projeto no gravador.
   if(hashConteudo(lerFonte(pos[2]))!==revisaoFonte)throw erro('FONTE_OBSOLETA','A fonte HTML mudou antes de salvar. Compare novamente.');
   r={arquivo:path.resolve(pos[0]),raiz:pos[1],revisaoArquivo:salvarProjetoEngenharia(c),revisaoFonte,salvo:true,resultado};
  }
 }
 console.log(JSON.stringify({ok:true,...r}));
}catch(e){console.error(JSON.stringify({ok:false,salvo:false,codigo:e.codigo||'OPERACAO_FALHOU',erro:e.message}));process.exitCode=1;}
