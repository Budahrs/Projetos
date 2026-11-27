// Uso: node materializar-projeto.mjs pacote.arquivos.json pasta-nova
// Extrai somente arquivos de texto declarados; não executa o projeto.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative,dirname,isAbsolute} from 'node:path';
const [origem,destino]=process.argv.slice(2);
if(!origem||!destino)throw Error('Informe pacote.arquivos.json e uma pasta nova.');
const p=JSON.parse(readFileSync(origem,'utf8').replace(/^\uFEFF/,''));
if(p.formato!=='hefestus.arquivos'||p.versao!==1||!p.arquivos||Object.keys(p.arquivos).length>100)throw Error('Pacote inválido.');
const raiz=resolve(destino);if(existsSync(raiz))throw Error('A pasta de destino já existe. Escolha uma pasta nova.');
const arquivos=Object.entries(p.arquivos).map(([nome,texto])=>{const alvo=resolve(raiz,nome),r=relative(raiz,alvo);if(!r||r.startsWith('..')||isAbsolute(r)||typeof texto!=='string'||texto.length>5000000||/[<>:"|?*\x00-\x1f]/.test(nome)||/(^|[\\/])(con|prn|aux|nul|com[1-9]|lpt[1-9])([.]|$)/i.test(nome))throw Error('Arquivo não permitido: '+nome);return [alvo,texto];});
mkdirSync(raiz,{recursive:true});for(const [alvo,texto]of arquivos){mkdirSync(dirname(alvo),{recursive:true});writeFileSync(alvo,texto,'utf8');}console.log('Arquivos extraídos em '+raiz+'. Nenhum código executado.');
