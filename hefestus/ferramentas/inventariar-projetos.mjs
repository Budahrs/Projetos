// Inventário somente leitura. Não abre dados privados nem modifica projetos analisados.
import {readdirSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const base=resolve(process.argv[2]||join(raiz,'..'));
const ignoradas=new Set(['node_modules','.git','target','bin','obj','dist','build','vendor','terceiros','modelos','.private','__pycache__','distribuicoes']);
const projetos=[];
for(const pasta of readdirSync(base,{withFileTypes:true}).filter(d=>d.isDirectory()&&!d.name.startsWith('_'))){
  const r={projeto:pasta.name,manifestos:[],pastas:[],erros:[]}, origem=join(base,pasta.name);
  function ler(dir,n=0){
    try {for(const e of readdirSync(dir,{withFileTypes:true})){
      if(e.isSymbolicLink())continue;
      if(e.isDirectory()){
        if(!n)r.pastas.push(e.name);
        if(n<5&&!ignoradas.has(e.name)&&!e.name.startsWith('.venv')&&e.name!=='venv')ler(join(dir,e.name),n+1);
      }else if(/^(package\.json|Cargo\.toml|Directory\.Build\.props|pyproject\.toml|tauri\.conf\.json|AGENTS\.md|README\.md)$|\.(sln|csproj)$/.test(e.name)&&r.manifestos.length<80){
        const arquivo=join(dir,e.name);r.manifestos.push({arquivo:relative(origem,arquivo).replaceAll('\\','/'),conteudo:readFileSync(arquivo,'utf8').slice(0,8000)});
      }
    }}catch(e){r.erros.push({pasta:relative(origem,dir).replaceAll('\\','/'),erro:e.code});}
  }
  ler(origem);projetos.push(r);
}
const destino=join(raiz,'documentos/arquitetura');mkdirSync(destino,{recursive:true});
writeFileSync(join(destino,'inventario-projetos.json'),JSON.stringify({geradoEm:new Date().toISOString(),escopo:'Manifestos e diretórios até seis níveis. Artefatos, repositórios de cópia e conteúdo privado excluídos. Inventário estrutural não equivale a revisão completa do código.',projetos},null,2));
const resumo=projetos.map(r=>{
  const texto=r.manifestos.filter(m=>!/\.md$/.test(m.arquivo)).map(m=>m.conteudo).join('\n');
  const tecnologias=[/\btauri\b/i.test(texto)&&'Tauri/Rust',/\breact\b/i.test(texto)&&'React',/\bUseWPF\b/.test(texto)&&'WPF/.NET',/pyproject|python/i.test(texto)&&'Python',/"type":\s*"module"/.test(texto)&&'JavaScript modular'].filter(Boolean);
  return {projeto:r.projeto,manifestos:r.manifestos.length,tecnologias,acessosPendentes:r.erros};
});
writeFileSync(join(destino,'resumo.json'),JSON.stringify(resumo,null,2));console.log(JSON.stringify(resumo,null,2));
