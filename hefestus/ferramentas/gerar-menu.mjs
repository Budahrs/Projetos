// Uso: node ferramentas/gerar-menu.mjs [pacote.json] [pasta-saida]
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {sincronizarMenu,criarModeloMenu} from '../js/nucleo/menuEngine.js';
import {MENU_PDF_PADRAO} from '../js/nucleo/menuPdfPadrao.js';
import {cont,texto,botao,achatar,assentar,evento,paraComponente} from '../js/nucleo/modelos.js';
const input=process.argv[2]?JSON.parse(readFileSync(resolve(process.argv[2]),'utf8')):MENU_PDF_PADRAO;
const out=resolve(process.argv[3]||'menu-gerado');mkdirSync(out,{recursive:true});
const p=sincronizarMenu(input),model=criarModeloMenu(p,{cont,texto,botao,achatar,assentar,evento});
for(const [name,content] of Object.entries({'pacote.hefestus.json':JSON.stringify(p,null,2),'componente.hefestus.json':JSON.stringify(paraComponente(model),null,2),'menu.html':p.codigos.web.texto,'menu.xaml':p.codigos.desktopWpf.texto,'menu-layout.json':JSON.stringify(p.designer.abas,null,2),'banco-ferramentas.json':JSON.stringify(p.bancoFerramentas||[],null,2)}))writeFileSync(resolve(out,name),content);
console.log(JSON.stringify({saida:out,metricas:p.metricas},null,2));
