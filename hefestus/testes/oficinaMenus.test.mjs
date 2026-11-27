import {test} from 'node:test';
import assert from 'node:assert/strict';
class Element {
 constructor(tag,text=''){this.tagName=tag.toUpperCase();this.textContent=text;this.children=[];this.attrs={};this.classList={add(){}};}
 append(...items){this.children.push(...items);for(const c of items)c.parent=this;}
 replaceChildren(...items){this.children=[];this.append(...items);}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='value')this._value=String(v);}
 addEventListener(k,fn){this['on'+k]=fn;}
 get value(){return this._value??this.children.find(c=>c.attrs?.selected!==undefined)?.value??this.children[0]?.value??'';}
 set value(v){this._value=String(v);}
 closest(){return {classList:{add(){}}};}
 click(){this.onclick?.({target:this});}
}
globalThis.Node=Element;globalThis.document={createElement:t=>new Element(t),createTextNode:t=>new Element('#text',t)};
globalThis.Blockly={Blocks:{hf_menu:{}}};globalThis.ResizeObserver=class{observe(){}};globalThis.requestAnimationFrame=()=>{};
globalThis.localStorage={getItem:()=>null,setItem(){}};
const {abrirOficinaMenus}=await import('../js/ui/oficinaMenus.js');
function setup(){let saved,inserted;const app={modelosUsuario:()=>[],guardarModelosUsuario:v=>{saved=v;return true;},inserirModelo:m=>inserted=m};const corpo=abrirOficinaMenus(app,{embutida:true});const nodes=()=>{const out=[];const visit=n=>{out.push(n);for(const c of n.children||[])visit(c);};visit(corpo);return out;};return {nodes,get saved(){return saved;},get inserted(){return inserted;}};}
const text=n=>(n.textContent||'')+(n.children||[]).map(text).join('');
test('oficina altera rótulo visual e atualiza a prévia gerada',()=>{
 const ui=setup(),input=ui.nodes().find(n=>n.attrs['aria-label']==='Rótulo do comando');input.value='Documento de teste';input.onchange({target:input});
 assert(ui.nodes().find(n=>n.tagName==='IFRAME'&&n.attrs.title==='Prévia do menu gerado').srcdoc.includes('Documento de teste'));
});
test('oficina salva modelo com comportamento e insere no designer',()=>{
 const ui=setup();ui.nodes().find(n=>n.tagName==='BUTTON'&&text(n)==='Salvar na biblioteca').click();assert.equal(ui.saved[0].comportamento.bancoFerramentas.length,66);
 ui.nodes().find(n=>n.tagName==='BUTTON'&&text(n)==='Inserir no designer').click();assert.equal(ui.inserted.id,'pdf-studio-profissional');
});
test('vincular ferramenta do banco muda o comando emitido',()=>{
 const ui=setup(),select=ui.nodes().find(n=>n.attrs['aria-label']==='Ferramenta vinculada');select.value='print';select.onchange({target:select});
 assert(ui.nodes().find(n=>n.tagName==='IFRAME'&&n.attrs.title==='Prévia do menu gerado').srcdoc.includes('data-command="print"'));
});

test('abrir a oficina leva à Forja em tela inteira sem diálogo',()=>{let modo;const app={ui:{},setModo:v=>modo=v,dialogo:()=>{throw Error('não deve abrir diálogo');}};abrirOficinaMenus(app);assert.equal(modo,'forja');assert.equal(app.ui.dockAba,'blocos');});
