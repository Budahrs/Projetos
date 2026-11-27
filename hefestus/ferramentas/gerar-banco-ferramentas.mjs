// Copia contratos E implementação para o banco. Não guarda apenas caminhos do programa de origem.
import {readFileSync,writeFileSync,readdirSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,relative,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Armazem,MeioMemoria,canonico,hashTexto} from '../js/nucleo/armazem.js';
import {compararVersoes,proximaVersao} from '../js/nucleo/versoes.js';
import {Nucleo} from '../js/nucleo/nucleo.js';
import {criarFerramentas} from '../js/agente/ferramentas.js';

const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pdf=resolve(process.argv[2]||join(raiz,'..','PDF-Studio'));
const destino=join(raiz,'banco','ferramentas.hefestus.json');
const banco=await new Armazem(new MeioMemoria()).abrir();
if(existsSync(destino))await banco.importar(JSON.parse(readFileSync(destino,'utf8')));
function fontes(base,pastas){
 const arquivos={};
 const ler=p=>{if(!existsSync(p))return;for(const f of readdirSync(p,{withFileTypes:true})){const arq=join(p,f.name);if(f.isDirectory()){if(!['node_modules','target','bin','obj','.git'].includes(f.name))ler(arq);}else if(/\.(js|mjs|ts|rs|cs|csproj|xaml|json|css|md|toml|props|cpp|h|c|txt)$/.test(f.name)&&f.name!=='bancoFerramentasDados.js')arquivos[relative(base,arq).replaceAll('\\','/')]=readFileSync(arq,'utf8');}};
 for(const pasta of pastas){const p=join(base,pasta);if(!existsSync(p))continue;if(readdirOuArquivo(p))ler(p);else arquivos[pasta]=readFileSync(p,'utf8');}
 if(base===raiz)arquivos['js/nucleo/bancoFerramentasDados.js']='export const BANCO_FERRAMENTAS_INICIAL = null;\n';
 return {formato:'hefestus.fontes-ferramentas',versao:1,arquivos};
}
function readdirOuArquivo(p){try{readdirSync(p);return true;}catch{return false;}}
async function guardar(programa,id,tipo,conteudo,runtime,contrato=null){
 const ultima=banco.listar({programa,id,tipo}).sort((a,b)=>compararVersoes(a.versao,b.versao)).at(-1);
 const hash=await hashTexto(canonico(conteudo));
 const versao=ultima?(ultima.hash===hash?ultima.versao:proximaVersao(ultima.versao,'correcao')):'0.47.0';
 const r=await banco.guardar({programa,id,tipo,versao,conteudo,runtime,contrato,origem:{descricao:'Cópia integral para reuso e correção sem consultar a pasta original.'}});
 return `${tipo}/${programa}/${id}@${r.entrada.versao}`;
}
const fonteHef=await guardar('hefestus','fontes','compartilhado',fontes(raiz,['js','ferramentas','src-tauri','css','testes','licencas','build.mjs','AGENTS.md','THIRD-PARTY-NOTICES.md','package.json','package-lock.json']),'dados');
const n=new Nucleo();n.novo(false);
for(const t of criarFerramentas(n,{}))await guardar('hefestus',t.name,'ferramenta',{nome:t.name,descricao:t.description,implementacao:{fontes:fonteHef,arquivo:'js/agente/ferramentas.js',entrada:t.name},uso:'Criar e corrigir projetos pelas ferramentas validadas do núcleo.'},'hefestus',t.inputSchema);
if(existsSync(join(pdf,'Interface/banco-ferramentas.json'))){
 const fontePdf=await guardar('pdf-studio','fontes','compartilhado',fontes(pdf,['src','Interface','THIRD-PARTY-NOTICES.md','Directory.Build.props','AGENTS.md']),'dados');
 for(const t of JSON.parse(readFileSync(join(pdf,'Interface/banco-ferramentas.json'),'utf8')))await guardar('pdf-studio',t.id,'ferramenta',{...t,implementacao:{fontes:fontePdf,contratos:'src/PdfTool.Core/Contracts.cs',composicao:'src/PdfTool.App/App.xaml.cs',interface:'src/PdfTool.App',ponte:'src/PdfTool.Automation/Program.cs'},runtimeNecessario:'Windows; host nativo compilado e dependências declaradas no pacote. A presença no banco não torna um contrato executável no navegador.'},'nativo',{entrada:t.entrada,saida:t.saida});
 const projeto=join(pdf,'Interface/pdf-studio-tauri.hefestus');
 if(existsSync(projeto))await guardar('pdf-studio','projeto','modelo',{formato:'hefestus.projeto-reutilizavel',texto:readFileSync(projeto,'utf8')},'dados');
}
const pacote=await banco.exportar();mkdirSync(dirname(destino),{recursive:true});writeFileSync(destino,JSON.stringify(pacote));
writeFileSync(join(raiz,'js/nucleo/bancoFerramentasDados.js'),'// Gerado por ferramentas/gerar-banco-ferramentas.mjs\nexport const BANCO_FERRAMENTAS_INICIAL = '+JSON.stringify(JSON.stringify(pacote))+';\n');
console.log(JSON.stringify({arquivo:destino,...banco.estatisticas()}));
