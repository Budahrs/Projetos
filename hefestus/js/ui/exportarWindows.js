import { h, botaoIcone } from './dom.js';
import { gerarPacoteWindows, validarAplicativo, validarICO, pngParaICO, iconePadraoICO } from '../nucleo/pacoteWindows.js';

export function exportarWindows(app) {
  const cfg=app.ui.exportacaoWindows||{},anterior=document.activeElement;
  const nome=h('input',{type:'text',value:app.n.nome||'Meu aplicativo',maxlength:80,required:true});
  const versao=h('input',{type:'text',value:cfg.versao||'1.0.0',required:true});
  const autor=h('input',{type:'text',value:cfg.autor||'',maxlength:100});
  const arquivo=h('input',{type:'file',accept:'.ico,.png'});
  const estado=h('p',{role:'status','aria-live':'polite'},'Ícone padrão do aplicativo em quatro resoluções.');
  const erro=h('p',{role:'alert',class:'export-erro'});
  const gerar=h('button',{type:'submit',class:'bt primario'},'Salvar pacote Windows (.zip)');
  let iconeBytes=null,lendo=false,fechado=false,leitura=0,previewURL=null;
  const preview=h('img',{alt:'Ícone do aplicativo',width:64,height:64,style:'object-fit:contain;border:1px solid #8886;border-radius:8px'});
  const atualizarPreview=()=>{if(previewURL)URL.revokeObjectURL(previewURL);previewURL=URL.createObjectURL(new Blob([iconeBytes||iconePadraoICO()],{type:'image/x-icon'}));preview.src=previewURL;};
  atualizarPreview();
  const validar=()=>{
    try {validarAplicativo({nome:nome.value,versao:versao.value,autor:autor.value});erro.textContent='';gerar.disabled=lendo;}
    catch(e){erro.textContent=e.message;gerar.disabled=true;}
  };
  for(const entrada of [nome,versao,autor])entrada.addEventListener('input',validar);
  arquivo.addEventListener('change',async()=>{
    const file=arquivo.files?.[0];if(!file)return;const token=++leitura;lendo=true;gerar.disabled=true;
    try {
      if(file.size>4*1024*1024)throw new Error('Escolha um ícone de até 4 MB.');
      const bytes=new Uint8Array(await file.arrayBuffer());if(fechado||token!==leitura)return;
      iconeBytes=/\.png$/i.test(file.name)?pngParaICO(bytes):validarICO(bytes);
      atualizarPreview();estado.textContent='Ícone selecionado: '+file.name;
    }catch(e){if(token===leitura&&!fechado){iconeBytes=null;atualizarPreview();arquivo.value='';estado.textContent='Ícone padrão mantido. '+e.message;}}
    finally{if(token===leitura){lendo=false;if(!fechado)validar();}}
  });
  const fechar=()=>{fechado=true;if(previewURL)URL.revokeObjectURL(previewURL);veu.remove();document.removeEventListener('keydown',tecla,true);anterior?.focus?.();};
  const formulario=h('form',{class:'export-windows',onsubmit:async e=>{
    e.preventDefault();if(lendo||gerar.disabled)return;gerar.disabled=true;
    try{
      const opcoes={nome:nome.value,versao:versao.value,autor:autor.value,icone:iconeBytes};
      const pacote=gerarPacoteWindows(app.n.doc,opcoes);
      const r=await app.n.baixar(pacote.nome,pacote.bytes,'application/zip');if(fechado)return;
      if(r==='indisponivel'||r==='recusado')throw new Error('O download não foi concluído.');
      app.ui.exportacaoWindows={versao:versao.value,autor:autor.value};app.salvarUI();
      estado.textContent='Pacote salvo. Extraia o ZIP e abra GERAR_INSTALADOR.bat. O EXE ficará na pasta instaladores.';
      app.mensagem('Pacote Windows salvo; o instalador será gerado na etapa seguinte.');
    }catch(e){if(!fechado)erro.textContent=e.message;}finally{if(!fechado)validar();}
  }},h('label',{},'Nome do aplicativo',nome),h('label',{},'Versão (ex.: 1.0.0)',versao),h('label',{},'Autor ou empresa',autor),
    preview,h('label',{},'Ícone (.ico ou PNG quadrado entre 16 e 256 px)',arquivo),
    h('button',{type:'button',class:'bt-texto',onclick:()=>{leitura++;lendo=false;iconeBytes=null;atualizarPreview();arquivo.value='';estado.textContent='Ícone padrão selecionado.';validar();}},'Usar ícone padrão'),estado,erro,
    h('p',{},'O aplicativo final abre sem o Designer. Para gerar o instalador: Windows, Node.js 22 ou superior e internet. Quem instala o EXE não precisa do Hefestus nem do Node.js.'),
    h('div',{class:'acoes'},gerar));
  const id='exportar-windows-'+Date.now();
  const veu=h('div',{class:'veu'},h('div',{class:'dialogo',role:'dialog','aria-modal':'true','aria-labelledby':id},h('header',{class:'dialogo-cabecalho'},h('h2',{id},'Salvar como aplicativo Windows'),botaoIcone('fechar','Fechar exportação Windows',fechar)),h('div',{class:'dialogo-conteudo'},formulario)));
  const tecla=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();fechar();}else if(e.key==='Tab'){
    const itens=[...veu.querySelectorAll('input,button')].filter(b=>!b.disabled),i=itens.indexOf(document.activeElement);
    if((e.shiftKey&&i<=0)||(!e.shiftKey&&i===itens.length-1)){e.preventDefault();(e.shiftKey?itens.at(-1):itens[0])?.focus();}
  }};
  document.body.append(veu);document.addEventListener('keydown',tecla,true);nome.focus();validar();
}
