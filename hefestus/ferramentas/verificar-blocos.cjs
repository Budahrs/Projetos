const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:950}}),erros=[];
  page.on('pageerror',e=>erros.push(e.message));
  await page.route('https://**/*',r=>r.abort());
  await page.goto(pathToFileURL(path.resolve(__dirname,'../dist/hefestus.html')).href);
  await page.waitForFunction(()=>globalThis.hefestus);
  await page.evaluate(()=>{hefestus.n.novo(false);hefestus.n.criar('botao');hefestus.setModo('forja');});
  await page.getByRole('button',{name:'Modelos de menus',exact:true}).click();
  await page.waitForFunction(()=>Blockly.getMainWorkspace()?.getAllBlocks(false).length>10);
  const dados=await page.evaluate(()=>({blocos:Blockly.getMainWorkspace().getAllBlocks(false).length,tipo:Blockly.getMainWorkspace().getTopBlocks()[0].type,flutuante:!!document.querySelector('.oficina-blockly').closest('.overlay-dialogo'),area:getComputedStyle(document.querySelector('.area')).display}));
  assert.equal(dados.tipo,'hf_menu');assert.equal(dados.flutuante,false);assert.equal(dados.area,'none');
  const antes=await page.evaluate(()=>JSON.parse(localStorage.getItem('hefestus.oficina-menu.v1')||'null'));
  await page.evaluate(()=>{Blockly.getMainWorkspace().getTopBlocks().find(b=>b.type==='hf_menu').setFieldValue('Menu teste por encaixes','NOME');});
  await page.getByRole('button',{name:'Aplicar blocos',exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('hefestus.oficina-menu.v1')||'null')?.nome==='Menu teste por encaixes');
  await page.evaluate(()=>{const w=Blockly.getMainWorkspace(),b=w.newBlock('hf_aba');b.initSvg();b.render();b.moveBy(700,80);});
  await page.getByRole('button',{name:'Aplicar blocos',exact:true}).click();
  assert.match(await page.locator('.oficina-blockly>[role=status]').innerText(),/encaixe/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hefestus.oficina-menu.v1')).nome),'Menu teste por encaixes');
  await page.getByRole('button',{name:'Recarregar projeto',exact:true}).click();
  for(const width of [1440,1024,768,390]){
   await page.setViewportSize({width,height:900});
   await page.waitForTimeout(100);
   const bounds=await page.locator('.blockly-superficie').boundingBox();
   assert.ok(bounds.width>100&&bounds.x>=0&&bounds.x+bounds.width<=width+2,JSON.stringify({width,bounds}));
  }
  await page.setViewportSize({width:1440,height:950});
  const saida=path.resolve(__dirname,'../documentos/validacao');fs.mkdirSync(saida,{recursive:true});
  await page.screenshot({path:path.join(saida,'hefestus-oficina-blocos.png')});
  assert.deepEqual(erros,[]);
  console.log(`OK: ${dados.blocos} blocos tipados, tela inteira, aplicação atômica e encaixes incompletos recusados; 1440/1024/768/390 px.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
