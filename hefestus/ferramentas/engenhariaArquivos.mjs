// Persistência de Engenharia compartilhada por CLI e MCP; domínio em DocumentoAtivo.
import {readFileSync,writeFileSync,renameSync,unlinkSync,realpathSync,statSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {DocumentoAtivo} from '../js/aplicacao/documentoAtivo.js';
import {nucleoSemEditor} from './motor-projetos.mjs';
import {textoDoProjeto} from '../js/nucleo/arquivoProjeto.js';
export const LIMITES_ENGENHARIA=Object.freeze({projeto:64*1024*1024,html:2*1024*1024,resolucoes:1024*1024});
export const erroEngenharia=(codigo,msg)=>Object.assign(new Error(msg),{codigo});
export const hashConteudo=conteudo=>createHash('sha256').update(conteudo).digest('hex');
export function lerTextoLimitado(caminho,limite){
 if(statSync(caminho).size>limite)throw erroEngenharia('ARQUIVO_GRANDE','Arquivo excede o limite de leitura: '+limite+' bytes.');
 const bytes=readFileSync(caminho);
 if(bytes.length>limite)throw erroEngenharia('ARQUIVO_GRANDE','Arquivo excede o limite de leitura: '+limite+' bytes.');
 return bytes.toString('utf8');
}
export function carregarProjetoEngenharia(caminho){
 const real=realpathSync(caminho);
 if(statSync(real).size>LIMITES_ENGENHARIA.projeto)throw erroEngenharia('PROJETO_GRANDE','Projeto excede 64 MB.');
 const bytes=readFileSync(real);
 if(bytes.length>LIMITES_ENGENHARIA.projeto)throw erroEngenharia('PROJETO_GRANDE','Projeto excede 64 MB.');
 const texto=bytes.toString('utf8').replace(/^\uFEFF/,''),n=nucleoSemEditor(dirname(real)),d=new DocumentoAtivo(n);
 d.abrir(texto);
 return {caminho:real,n,d,envelope:JSON.parse(texto),revisaoArquivo:hashConteudo(bytes)};
}
export function conferirRevisaoArquivo(ctx,esperada){
 if(ctx.n.originalRecuperacao)throw erroEngenharia('RECUPERACAO_NECESSARIA','O projeto precisa de recuperação. Abra e revise no editor antes de aplicar alterações.');
 if(typeof esperada!=='string'||!/^[a-f0-9]{64}$/.test(esperada))throw erroEngenharia('REVISAO_NECESSARIA','Obtenha revisaoArquivo ao verificar ou comparar o projeto.');
 if(ctx.revisaoArquivo!==esperada)throw erroEngenharia('REVISAO_OBSOLETA','O arquivo mudou. Verifique ou compare novamente; nenhuma alteração foi salva.');
}
export function validarFonteHTML(html){
 if(typeof html!=='string'||!html.trim())throw erroEngenharia('HTML_INVALIDO','Informe a fonte HTML como texto.');
 if(Buffer.byteLength(html,'utf8')>LIMITES_ENGENHARIA.html)throw erroEngenharia('HTML_GRANDE','HTML excede 2 MB em UTF-8.');
 return html;
}
export function validarResolucoesReimportacao(plano,resolucoes={}){
 if(!resolucoes||typeof resolucoes!=='object'||Array.isArray(resolucoes)||Object.entries(resolucoes).some(([k,v])=>!plano.conflitos.some(x=>x.chave===k)||!['local','fonte'].includes(v)))
  throw erroEngenharia('RESOLUCAO_INVALIDA','Use apenas as chaves dos conflitos e valores local ou fonte.');
 return resolucoes;
}
export function textoProjetoEngenharia(n,envelope={}){
 const atual=n.serializar();
 return textoDoProjeto({...envelope,...atual,memoria:{...envelope.memoria,...atual.memoria},historico:{...envelope.historico,...atual.historico}});
}
export function salvarProjetoEngenharia(ctx,validarCaminho=realpathSync){
 const temp=ctx.caminho+'.'+randomUUID()+'.tmp';
 try{
  writeFileSync(temp,textoProjetoEngenharia(ctx.n,ctx.envelope),{encoding:'utf8',flag:'wx'});
  if(validarCaminho(ctx.caminho)!==ctx.caminho||hashConteudo(readFileSync(ctx.caminho))!==ctx.revisaoArquivo)
   throw erroEngenharia('REVISAO_OBSOLETA','O arquivo mudou antes de salvar. Compare novamente.');
  renameSync(temp,ctx.caminho);
  return hashConteudo(readFileSync(ctx.caminho));
 }finally{try{unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')throw e;}}
}
