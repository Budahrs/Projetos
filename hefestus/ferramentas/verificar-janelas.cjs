// Requer Playwright disponível no ambiente (npm install --no-save playwright).
// Uso: node ferramentas/verificar-janelas.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    await page.route('https://**/*', r => r.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../dist/hefestus.html')).href);
    await page.waitForFunction(() => globalThis.hefestus);
    await page.evaluate(() => {
      hefestus.n.novo(false);
      hefestus.n.criar('botao', 100, 100);
      hefestus.setModo('forja');
      hefestus.ui.dockAba = 'principal'; hefestus.render();
      hefestus.ambiente.controlador.pagina = 'geometria'; hefestus.render();
    });
    await page.getByRole('spinbutton', { name: 'X', exact: true }).fill('123');
    await page.getByRole('spinbutton', { name: 'X', exact: true }).press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.labels[0].textContent.trim()), 'Y');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.labels[0].textContent.trim()), 'X');
    assert.equal(await page.evaluate(() => hefestus.n.selecionado().x), 123);

    // Download real, reabertura do arquivo gerado e exportação HTML.
    const download = page.waitForEvent('download');
    await page.evaluate(() => hefestus.n.salvarArquivo());
    const salvo = await download;
    const fs = require('node:fs');
    const conteudo = fs.readFileSync(await salvo.path(), 'utf8');
    await page.evaluate(texto => {
      hefestus.n.novo(false); hefestus.n.abrirTexto(texto);
    }, conteudo);
    assert.equal(await page.evaluate(() => Object.values(hefestus.n.doc.elementos).some(e => e.x === 123)), true);
    const exportado = page.waitForEvent('download');
    await page.evaluate(() => hefestus.n.exportarHTML());
    assert.match((await exportado).suggestedFilename(), /\.zip$/);

    for (const width of [1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 700 });
      await page.evaluate(() => hefestus.setModo('designer'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.evaluate(() => {
        globalThis.cancelamentos = 0;
        const corpo = document.createElement('div');
        corpo.textContent = 'Conteúdo extenso '.repeat(1200);
        hefestus.dialogo({ titulo: 'Janela de verificação', corpo,
          opcoes: [{ id: 'cancelar', rotulo: 'Cancelar prévia', fazer: () => cancelamentos++ }] });
      });
      const dialogo = page.getByRole('dialog', { name: 'Janela de verificação' });
      assert.equal(await dialogo.locator('.acoes button').count(), 0);
      const fechar = dialogo.getByRole('button', { name: 'Fechar Janela de verificação', exact: true });
      const bounds = await dialogo.boundingBox(), x = await fechar.boundingBox();
      assert(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= 701);
      assert(x.y < bounds.y + 70 && x.x > bounds.x + bounds.width / 2);
      await fechar.click();
      assert.equal(await page.evaluate(() => cancelamentos), 1);
      await page.evaluate(() => hefestus.exportarAplicativoWindows());
      const windows = page.getByRole('dialog', { name: 'Salvar como aplicativo Windows' });
      assert.equal(await windows.locator('.acoes').getByRole('button', { name: 'Fechar', exact: true }).count(), 0);
      await windows.getByRole('button', { name: 'Fechar exportação Windows', exact: true }).click();
    }
    await page.evaluate(() => hefestus.setModo('previa'));
    const teste = page.getByRole('dialog', { name: 'Testar interface' });
    assert.equal(await teste.locator('footer button').count(), 0);
    await teste.getByRole('button', { name: 'Fechar teste', exact: true }).click();
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      hefestus.setModo('designer'); hefestus.n.novo(false);
      hefestus.n.importarHTML({html:'<style>body{background:black}</style><button style="border:3px solid rgb(255, 0, 128)">Original</button>'});
    });
    const importado = page.locator('.hf-container').filter({has:page.locator('.hf-html-importado')}).first();
    await importado.hover();
    assert.equal(await importado.evaluate(el => getComputedStyle(el).borderWidth), '0px');
    assert.equal(await importado.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    const original = page.frameLocator('.hf-html-importado').getByRole('button', {name:'Original'});
    assert.equal(await original.evaluate(el => getComputedStyle(el).borderTopWidth), '3px');
    assert.equal(await original.evaluate(el => getComputedStyle(el.ownerDocument.body).backgroundColor), 'rgba(0, 0, 0, 0)');
    await page.evaluate(() => {
      hefestus.n.novo(false);
      globalThis.fundoSelecao = hefestus.n.criar('caixa',100,100,{largura:160,altura:160});
      globalThis.frenteSelecao = hefestus.n.criar('forma',100,100,{forma:'triangulo',largura:160,altura:160});
      hefestus.n.selecionar(null);
      hefestus.area.enquadrarConteudo();
    });
    const posicao = await page.evaluate(() => {
      const r = hefestus.area.no(frenteSelecao).getBoundingClientRect();
      return {x:r.x,y:r.y,w:r.width,h:r.height};
    });
    await page.mouse.click(posicao.x+posicao.w*.1,posicao.y+posicao.h*.1);
    assert.equal(await page.evaluate(() => hefestus.n.selecionados()[0] === fundoSelecao), true, JSON.stringify(await page.evaluate(({x,y,w,h})=>({selecionados:hefestus.n.selecionados(),esperado:fundoSelecao,frente:hefestus.n.elemento(frenteSelecao),hits:document.elementsFromPoint(x+w*.1,y+h*.1).slice(0,6).map(e=>({tag:e.tagName,id:e.id,cl:e.className})),alvo:hefestus.area.alvoNoPonto({clientX:x+w*.1,clientY:y+h*.1})?.dataset.hf,pos:{x,y,w,h}}),posicao)));
    await page.evaluate(() => hefestus.n.selecionar(null));
    await page.mouse.click(posicao.x+posicao.w*.5,posicao.y+posicao.h*.7);
    assert.equal(await page.evaluate(() => hefestus.n.selecionados()[0] === frenteSelecao), true);
    await page.evaluate(() => {hefestus.n.definir(frenteSelecao,{travado:true});hefestus.n.selecionar(null);});
    await page.mouse.click(posicao.x+posicao.w*.5,posicao.y+posicao.h*.7);
    assert.equal(await page.evaluate(() => hefestus.n.selecionados()[0] === fundoSelecao), true);
    assert.deepEqual(erros, []);
    console.log('OK: foco, Tab/Shift+Tab, salvar/reabrir/exportar, janelas e X em 1440/1024/768/390 px; HTML importado sem borda extra e com borda original preservada; nenhum erro de execução.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
