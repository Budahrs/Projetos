import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const programa=resolve(process.argv[2]||join(raiz,'../PDF-Studio/Aplicativo-Tauri'));
const exe=join(programa,'src-tauri/motores/pdf-studio/Antares.PdfBridge.exe');
const saida=join(raiz,'documentos/validacao/pdf-studio');mkdirSync(saida,{recursive:true});
const verificacoes=[];
function executar(contrato){
 const arq=join(saida,'contrato-teste.json');writeFileSync(arq,JSON.stringify(contrato));
 const linhas=execFileSync(exe,[arq],{encoding:'utf8',windowsHide:true,timeout:120000}).trim().split(/\r?\n/);
 const resposta=JSON.parse(linhas.at(-1));assert.equal(resposta.ok,true);return resposta.result||resposta;
}
const novo=join(saida,'novo.pdf'),editado=join(saida,'editado.pdf'),juntado=join(saida,'juntado.pdf'),extraido=join(saida,'extraido.pdf');
const saude=executar({operation:'health'});assert.equal(saude.protocol,1);verificacoes.push('Saúde e protocolo JSON do motor distribuído');
executar({operation:'create',text:'PDF Studio - teste do motor',output:novo,overwrite:true});
assert.equal(executar({operation:'inspect',input:novo}).Pages.length,1);verificacoes.push('Criar, gravar e inspecionar PDF');
executar({operation:'edit',kind:'text',input:novo,text:'Texto coordenado',x:123,y:177,width:250,height:35,fontSize:20,color:'#165c31',output:editado,overwrite:true});
assert.match(executar({operation:'text',input:editado}).text,/Texto coordenado/);verificacoes.push('Editar com parâmetros e extrair texto do PDF resultante');
executar({operation:'merge',input:novo,inputs:[editado],output:juntado,overwrite:true});assert.equal(executar({operation:'inspect',input:juntado}).Pages.length,2);verificacoes.push('Juntar dois documentos');
executar({operation:'extract',input:juntado,pages:['2'],output:extraido,overwrite:true});assert.equal(executar({operation:'inspect',input:extraido}).Pages.length,1);verificacoes.push('Extrair página por contrato');
const config=JSON.parse(readFileSync(join(programa,'src-tauri/tauri.conf.json'),'utf8'));
assert.ok(config.bundle.resources['motores/pdf-studio/']);
assert.ok(existsSync(join(programa,'src-tauri/target/release/pdf-studio.exe')));
const instalador=join(programa,'src-tauri/target/release/bundle/nsis/PDF Studio_0.7.0_x64-setup.exe');assert.ok(existsSync(instalador));verificacoes.push('Aplicativo Tauri compilado, motor incluído como recurso e instalador NSIS gerado');
const relatorio={executadoEm:new Date().toISOString(),plataforma:process.platform,verificacoes,limites:['Instalador produzido; instalação em computador limpo não foi executada por este teste.','Este teste não valida OCR, scanner, Office, IA, assinaturas ou conformidade de PDF.','A lista de ligações pendentes permanece em LIGACOES.md.']};
writeFileSync(join(saida,'relatorio.json'),JSON.stringify(relatorio,null,2));console.log(JSON.stringify(relatorio,null,2));
