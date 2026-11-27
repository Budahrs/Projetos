// Gera os arquivos da tela; não inicia o projeto.
import {readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gerarTelaProjeto} from '../js/nucleo/telaProjeto.js';
const [entrada,saida]=process.argv.slice(2);
if(!entrada||!saida)throw Error('Uso: node ferramentas/gerar-tela.mjs projeto.json pasta-nova');
const pacote=gerarTelaProjeto(JSON.parse(readFileSync(entrada,'utf8').replace(/^\uFEFF/,''))),destino=resolve(saida);
if(existsSync(destino))throw Error('A pasta de destino já existe. Escolha uma pasta nova.');
mkdirSync(destino,{recursive:true});for(const [nome,texto] of Object.entries(pacote.arquivos))writeFileSync(join(destino,nome),texto,'utf8');
console.log(JSON.stringify({output:destino,files:Object.keys(pacote.arquivos),executed:false}));
