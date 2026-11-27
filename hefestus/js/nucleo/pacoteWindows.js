import { gerarHTML } from './compilador.js';
import { criarZIP, crc32 } from './zip.js';
import { documentosProjeto } from './documentacaoProjeto.js';

export function validarAplicativo(opcoes={}) {
  const nome=String(opcoes.nome||'').trim(),versao=String(opcoes.versao||'1.0.0').trim(),autor=String(opcoes.autor||'').trim();
  if(nome.length<2||nome.length>80||/[\x00-\x1f<>:"/\\|?*]/.test(nome)||/[. ]$/.test(nome))throw new Error('Use um nome entre 2 e 80 caracteres, sem símbolos de caminho do Windows.');
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(nome))throw new Error('Esse nome é reservado pelo Windows.');
  if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(versao)||versao.split('.').some(n=>Number(n)>65535))throw new Error('Versão deve ter três números, como 1.0.0.');
  if(autor.length>100||/[\x00-\x1f]/.test(autor))throw new Error('Autor inválido.');
  let slug=nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!slug)throw new Error('O nome precisa conter letras ou números.');
  if(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(slug))slug='app-'+slug;
  return {nome,versao,autor,slug};
}
export function iconePadraoICO() {
  const tamanhos=[16,32,48,256],imagens=tamanhos.map(n=>{
    const maskRow=Math.ceil(n/32)*4,b=new Uint8Array(40+n*n*4+maskRow*n),v=new DataView(b.buffer);
    v.setUint32(0,40,true);v.setInt32(4,n,true);v.setInt32(8,n*2,true);v.setUint16(12,1,true);v.setUint16(14,32,true);v.setUint32(20,n*n*4+maskRow*n,true);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const u=x/n,w=y/n,i=40+((n-1-y)*n+x)*4;
      const dentro=u>.08&&u<.92&&w>.08&&w<.92,linha=dentro&&((u>.23&&u<.77&&(Math.abs(w-.27)<.025||Math.abs(w-.73)<.025))||(w>.27&&w<.73&&(Math.abs(u-.23)<.025||Math.abs(u-.77)<.025))||(w>.35&&w<.39&&u>.23&&u<.77));
      b[i]=linha?255:235;b[i+1]=linha?255:99;b[i+2]=linha?255:37;b[i+3]=dentro?255:0;
      if(!dentro)b[40+n*n*4+(n-1-y)*maskRow+(x>>3)]|=0x80>>(x%8);
    }return b;
  });
  const out=new Uint8Array(6+tamanhos.length*16+imagens.reduce((n,b)=>n+b.length,0)),v=new DataView(out.buffer);v.setUint16(2,1,true);v.setUint16(4,tamanhos.length,true);let pos=6+tamanhos.length*16;
  imagens.forEach((b,i)=>{const o=6+i*16;out[o]=out[o+1]=tamanhos[i]===256?0:tamanhos[i];v.setUint16(o+4,1,true);v.setUint16(o+6,32,true);v.setUint32(o+8,b.length,true);v.setUint32(o+12,pos,true);out.set(b,pos);pos+=b.length;});return out;
}
export function validarICO(bytes) {
  const b=new Uint8Array(bytes);if(b.length<22||b.length>4*1024*1024)throw new Error('Escolha um ICO válido de até 4 MB.');
  const v=new DataView(b.buffer,b.byteOffset,b.byteLength),n=v.getUint16(4,true);
  if(v.getUint16(0,true)!==0||v.getUint16(2,true)!==1||!n||n>32||6+n*16>b.length)throw new Error('Cabeçalho ICO inválido.');
  for(let i=0;i<n;i++){const o=6+i*16,size=v.getUint32(o+8,true),pos=v.getUint32(o+12,true);if(!size||pos<6+n*16||pos+size>b.length)throw new Error('Imagem ICO incompleta.');}return b;
}
export function pngParaICO(bytes) {
  const b=new Uint8Array(bytes),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(b.length<33||b.length>4*1024*1024||v.getUint32(0)!==0x89504e47||v.getUint32(4)!==0x0d0a1a0a)throw new Error('PNG inválido.');
  const w=v.getUint32(16),h=v.getUint32(20);if(w!==h||w<16||w>256)throw new Error('O PNG deve ser quadrado, entre 16 e 256 pixels.');
  let pos=8,imagem=false,fim=false;
  while(pos+12<=b.length){const n=v.getUint32(pos);if(pos+12+n>b.length)throw new Error('PNG truncado.');const tipo=String.fromCharCode(...b.subarray(pos+4,pos+8));if(crc32(b.subarray(pos+4,pos+8+n))!==v.getUint32(pos+8+n))throw new Error('PNG com dados corrompidos.');if(pos===8&&(tipo!=='IHDR'||n!==13))throw new Error('Cabeçalho PNG inválido.');if(tipo==='IDAT')imagem=true;if(tipo==='IEND'){fim=true;break;}pos+=12+n;}
  if(!imagem||!fim)throw new Error('PNG incompleto.');
  const out=new Uint8Array(22+b.length),d=new DataView(out.buffer);d.setUint16(2,1,true);d.setUint16(4,1,true);out[6]=out[7]=w===256?0:w;d.setUint16(10,1,true);d.setUint16(12,32,true);d.setUint32(14,b.length,true);d.setUint32(18,22,true);out.set(b,22);return out;
}
export function arquivosAplicativo(doc,opcoes={}) {
  if(!doc?.elementos||typeof doc.elementos!=='object')throw new Error('Abra um projeto antes de exportar o aplicativo.');
  const cfg=validarAplicativo(opcoes),icone=opcoes.icone?validarICO(opcoes.icone):iconePadraoICO();
  const pkg={name:cfg.slug,version:cfg.versao,description:cfg.nome,author:cfg.autor||'Autor do aplicativo',private:true,main:'main.cjs',scripts:{'instalador':'electron-builder --win nsis --x64','portatil':'electron-builder --win portable --x64'},devDependencies:{electron:'44.9.2','electron-builder':'26.17.0'},build:{appId:'br.hefestus.'+cfg.slug.replace(/-/g,'.'),productName:cfg.nome,asar:true,files:['main.cjs','app/**','assets/icon.ico','package.json'],directories:{output:'instaladores',buildResources:'assets'},win:{icon:'assets/icon.ico',target:['nsis'],artifactName:cfg.slug+'-Instalador-${version}.${ext}'},nsis:{oneClick:false,perMachine:false,allowElevation:false,allowToChangeInstallationDirectory:true,createDesktopShortcut:true,createStartMenuShortcut:true,shortcutName:cfg.nome,installerIcon:'assets/icon.ico',uninstallerIcon:'assets/icon.ico',deleteAppDataOnUninstall:false}}};
  const main=`const {app,BrowserWindow,protocol,dialog,shell}=require('electron');
const fs=require('node:fs/promises');const path=require('node:path');
protocol.registerSchemesAsPrivileged([{scheme:'hefestus-app',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
let janela;
async function externo(url){try{const u=new URL(url);if(!['https:','mailto:'].includes(u.protocol))return;const r=await dialog.showMessageBox(janela,{type:'question',message:'Abrir link no aplicativo padrão?',detail:u.href,buttons:['Cancelar','Abrir'],defaultId:0,cancelId:0});if(r.response===1)await shell.openExternal(u.href);}catch{}}
async function criar(){
 janela=new BrowserWindow({title:${JSON.stringify(cfg.nome)},width:1280,height:800,minWidth:360,minHeight:320,icon:path.join(__dirname,'assets/icon.ico'),autoHideMenuBar:true,show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,devTools:false}});
 janela.removeMenu();janela.webContents.setWindowOpenHandler(({url})=>{externo(url);return{action:'deny'};});
 janela.webContents.on('will-navigate',(e,url)=>{if(url!=='hefestus-app://app/index.html'){e.preventDefault();externo(url);}});
 janela.once('ready-to-show',()=>janela.show());await janela.loadURL('hefestus-app://app/index.html');
}
if(!app.requestSingleInstanceLock()){app.quit();}else{
 app.on('second-instance',()=>{if(janela){if(janela.isMinimized())janela.restore();janela.show();janela.focus();}});
 app.whenReady().then(async()=>{
  app.setAppUserModelId(${JSON.stringify(pkg.build.appId)});
  protocol.handle('hefestus-app',async request=>{
   const u=new URL(request.url);const arquivos={'/index.html':['app/index.html','text/html; charset=utf-8'],'/icon.ico':['assets/icon.ico','image/x-icon']};
   const item=u.host==='app'&&arquivos[u.pathname];if(!item)return new Response('Não encontrado',{status:404});
   return new Response(await fs.readFile(path.join(__dirname,item[0])),{headers:{'Content-Type':item[1],'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src https: wss:; media-src 'self' https: blob: data:; frame-src 'self' blob: data:; object-src 'none'"}});
  });
  const sessao=require('electron').session.defaultSession;sessao.setPermissionRequestHandler((_w,_p,cb)=>cb(false));sessao.setPermissionCheckHandler(()=>false);
  await criar();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)criar();});
 }).catch(err=>{dialog.showErrorBox('Não foi possível abrir',String(err.message));app.quit();});
 app.on('window-all-closed',()=>app.quit());
}
`;
  const montar=`const {spawnSync}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');
if(process.platform!=='win32')throw new Error('Gere o instalador em um computador Windows.');
if(Number(process.versions.node.split('.')[0])<22)throw new Error('Instale Node.js 22 ou superior em https://nodejs.org.');
process.chdir(__dirname);
function npm(comando){const r=spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c',comando],{cwd:__dirname,stdio:'inherit',windowsHide:true});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
npm(fs.existsSync(path.join(__dirname,'package-lock.json'))?'npm ci --no-audit --no-fund --registry=https://registry.npmjs.org':'npm install --no-audit --no-fund --registry=https://registry.npmjs.org');
npm(process.argv.includes('--portatil')?'npm run portatil':'npm run instalador');
console.log('Concluído. Consulte a pasta instaladores.');
`;
  const bat=`@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0"\r\nwhere node >nul 2>&1\r\nif errorlevel 1 (echo Instale Node.js 22 ou superior em https://nodejs.org & pause & exit /b 1)\r\nnode montar.cjs\r\nset "RESULTADO=%ERRORLEVEL%"\r\nif not "%RESULTADO%"=="0" echo A geracao falhou. Consulte a mensagem acima.\r\npause\r\nexit /b %RESULTADO%\r\n`;
  const html=gerarHTML(doc,{titulo:cfg.nome}).replace('</head>','<link rel="icon" href="hefestus-app://app/icon.ico">\n</head>');
  return {cfg,arquivos:{'package.json':JSON.stringify(pkg,null,2),'main.cjs':main,'montar.cjs':montar,'GERAR_INSTALADOR.bat':bat,'app/index.html':html,'assets/icon.ico':icone,'LEIA-ME.txt':`APLICATIVO: ${cfg.nome}\r\nVERSÃO: ${cfg.versao}\r\n\r\nExtraia todo o ZIP. Execute GERAR_INSTALADOR.bat em Windows com Node.js 22 ou superior e internet. A primeira geração baixa Electron, electron-builder e ferramentas de instalação dos fornecedores. O resultado fica em instaladores. Guarde package-lock.json para repetir a geração.\r\n\r\nO destinatário instala pelo EXE gerado, sem Node.js e sem o Hefestus. O instalador cria atalhos e permite desinstalação. O aplicativo abre em janela própria, sem o Designer e sem menus de edição do Hefestus.\r\n\r\nO pacote leva o HTML funcional do projeto e seus sinais; não inventa backend nem lógica de negócio. Recursos remotos continuam exigindo conexão. Arquivos externos não embutidos devem ser incorporados ao projeto antes da exportação.\r\n\r\nO EXE não tem assinatura digital: para distribuição assinada, configure seu próprio certificado. ASAR é empacotamento, não criptografia nem proteção absoluta do código. Não coloque segredos no aplicativo distribuído.\r\n\r\nEsta pasta é o material de geração, não o instalador pronto. Para gerar opção portátil: node montar.cjs --portatil.\r\n`}};
}
export function gerarPacoteWindows(doc,opcoes={}) {const {cfg,arquivos}=arquivosAplicativo(doc,opcoes);return {nome:cfg.slug+'-Windows.zip',bytes:criarZIP({...arquivos,...documentosProjeto(doc,{nucleo:arquivos['main.cjs']})})};}


