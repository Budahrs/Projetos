import {test} from 'node:test';import assert from 'node:assert/strict';import {Script} from 'node:vm';
import {arquivosAplicativo,gerarPacoteWindows,validarAplicativo,iconePadraoICO,validarICO,pngParaICO} from '../js/nucleo/pacoteWindows.js';
import {criarZIP} from '../js/nucleo/zip.js';import {Nucleo} from '../js/nucleo/nucleo.js';
import {iconePorRotulo,iconeDe} from '../js/nucleo/iconesAuto.js';import {temIcone} from '../js/ui/icones.js';
import {iconeDoGrupo} from '../js/nucleo/construtor.js';
test('nome e versão seguros; identidade estável sem usar o rótulo em comandos shell',()=>{
 assert.equal(validarAplicativo({nome:'Meu Painel',versao:'1.2.3'}).slug,'meu-painel');
 for(const nome of ['..','../app','CON','aux.exe','App:teste','x'])assert.throws(()=>validarAplicativo({nome}));
 for(const versao of ['1','1.0','1.0.0 && whoami','-1.2.3','01.0.0','65536.0.0'])assert.throws(()=>validarAplicativo({nome:'Meu App',versao}));
});
test('ICO possui quatro tamanhos válidos e recusa dados truncados',()=>{
 const ico=iconePadraoICO(),v=new DataView(ico.buffer);assert.equal(v.getUint16(4,true),4);assert.equal(ico[6],16);assert.equal(ico[54],0);assert.deepEqual(validarICO(ico),ico);
 assert.throws(()=>validarICO(ico.subarray(0,40)));assert.throws(()=>pngParaICO(ico));
});
test('exporta somente o aplicativo; scripts compilam, sem o Designer ou projeto editável',()=>{
 const n=new Nucleo();n.novo(false);n.criar('botao',20,20);const antes=JSON.stringify(n.doc);
 const {arquivos}=arquivosAplicativo(n.doc,{nome:'Meu Painel',versao:'1.0.0'}),pkg=JSON.parse(arquivos['package.json']);
 assert.equal(pkg.build.asar,true);assert.equal(pkg.build.nsis.perMachine,false);assert.equal(pkg.build.nsis.deleteAppDataOnUninstall,false);
 assert.equal(pkg.build.win.icon,'assets/icon.ico');assert.equal(pkg.build.nsis.installerIcon,'assets/icon.ico');
 assert.ok(arquivos['app/index.html'].includes('hf-arte'));assert.ok(!arquivos['app/index.html'].includes('class Agente'));assert.ok(!Object.keys(arquivos).some(n=>n.endsWith('.hefestus.json')));
 new Script(arquivos['main.cjs']);new Script(arquivos['montar.cjs']);
 assert.ok(arquivos['main.cjs'].includes('contextIsolation:true,sandbox:true,webSecurity:true'));assert.ok(arquivos['main.cjs'].includes('nodeIntegration:false'));
 assert.ok(arquivos['main.cjs'].includes('hefestus-app'));assert.ok(arquivos['main.cjs'].includes("return{action:'deny'}"));
 assert.equal(JSON.stringify(n.doc),antes);assert.ok(gerarPacoteWindows(n.doc,{nome:'Meu Painel'}).bytes.length>1000);
});
test('ZIP armazena nomes e bytes e recusa caminhos fora da pasta',()=>{
 const zip=criarZIP({'olá.txt':'ação','assets/icon.ico':iconePadraoICO()});const v=new DataView(zip.buffer);
 assert.equal(v.getUint32(0,true),0x04034b50);assert.equal(v.getUint32(zip.length-22,true),0x06054b50);assert.equal(v.getUint16(zip.length-12,true),2);
 for(const nome of ['../escape','/absoluto','C:/absoluto','a\\b'])assert.throws(()=>criarZIP({[nome]:'x'}));
});
test('ícones seguem o comando em modo automático e preservam a escolha explícita',()=>{
 for(const [texto,esperado]of [['Instalador','instalador'],['Aplicativo Windows','aplicativo'],['Projetos','pasta'],['Painéis','grafico'],['Salvar','salvar']]){
  assert.equal(iconePorRotulo(texto),esperado);assert.equal(iconeDe({icone:'auto',rotulo:texto}),esperado);assert.ok(temIcone(esperado));
 }
 assert.equal(iconeDe({icone:'coracao',rotulo:'Salvar'}),'coracao');assert.equal(iconeDe({icone:'auto',rotulo:'XYZ'}),'caixa');
 assert.equal(iconeDoGrupo({iconePrincipal:'auto',itens:[{icone:'auto',rotulo:'Salvar'}]}),'salvar');
});
