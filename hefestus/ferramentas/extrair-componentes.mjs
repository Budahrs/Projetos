// Extrai contratos declarativos de arquivos escolhidos, sem executar scripts.
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const [saida,...fontes]=process.argv.slice(2);
if(!saida||!fontes.length)throw Error('Uso: node extrair-componentes.mjs biblioteca-nova.json arquivo.json arquivo.html');
const componentes=[];
for(const fonte of fontes){const caminho=resolve(fonte);if(statSync(caminho).size>5000000)throw Error('Arquivo excede 5 MB: '+caminho);const texto=readFileSync(caminho,'utf8').replace(/^\uFEFF/,''),m=texto.match(/<script type="application\/json" id="hefestus-projeto">([\s\S]*?)<\/script>/);const p=JSON.parse(m?m[1]:texto);if(p.formato!=='hefestus.projeto'||p.versao!==1)throw Error('Arquivo sem contrato suportado: '+caminho);componentes.push({...p,extracao:{fonte:caminho,sha256:createHash('sha256').update(texto).digest('hex'),em:new Date().toISOString(),metodo:'Contrato incorporado; sem tradução de código arbitrário.'}});}
writeFileSync(resolve(saida),JSON.stringify({formato:'hefestus.biblioteca',versao:1,componentes},null,2),{encoding:'utf8',flag:'wx'});
console.log('Biblioteca criada com '+componentes.length+' contratos. Nenhum script importado foi executado.');
