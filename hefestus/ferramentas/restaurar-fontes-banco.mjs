import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,dirname,relative,isAbsolute,parse} from 'node:path';
import {Armazem,MeioMemoria} from '../js/nucleo/armazem.js';
const [arquivo,ref,destino,...opcoes]=process.argv.slice(2);
if(!arquivo||!ref||!destino)throw Error('Uso: node ferramentas/restaurar-fontes-banco.mjs banco.json compartilhado/programa/fontes pasta-destino [--substituir]');
const raiz=resolve(destino);if(raiz===parse(raiz).root)throw Error('Escolha uma pasta de projeto.');
const banco=await new Armazem(new MeioMemoria()).abrir();
await banco.importar(JSON.parse(readFileSync(resolve(arquivo),'utf8')));
const {dados}=await banco.resolver(ref);
if(dados?.formato!=='hefestus.fontes-ferramentas')throw Error('A referência não contém fontes de ferramentas.');
const arquivos=Object.entries(dados.arquivos).map(([nome,texto])=>{
 const caminho=resolve(raiz,nome),rel=relative(raiz,caminho);
 if(!rel||rel.startsWith('..')||isAbsolute(rel)||typeof texto!=='string')throw Error('Caminho de fonte inválido: '+nome);
 if(existsSync(caminho)&&!opcoes.includes('--substituir'))throw Error('O arquivo já existe: '+nome+'. Use uma pasta vazia ou --substituir.');
 return {caminho,texto};
});
for(const {caminho,texto}of arquivos){mkdirSync(dirname(caminho),{recursive:true});writeFileSync(caminho,texto);}
console.log(JSON.stringify({ok:true,ref,pasta:raiz,arquivos:arquivos.length}));
