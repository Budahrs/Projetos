import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CATALOGO_TEMAS,validarTemaCompartilhado,resolverModoSistema,contrasteCores} from '../js/nucleo/temasCompartilhados.js';
import {compararFerramentas,analisarCuradoria,aplicarCuradoria,reverterCuradoria} from '../js/nucleo/curadoriaFerramentas.js';
import {TEMAS_UI,aplicarTemaUI,salvarTemaUsuario,exportarTemas} from '../js/ui/temas.js';
const clone=v=>JSON.parse(JSON.stringify(v));
test('temas canônicos preservam contraste e superfícies sem branco puro',()=>{for(const t of Object.values(CATALOGO_TEMAS)){assert.deepEqual(validarTemaCompartilhado(t),[],t.id);assert.equal(t.documento,'#FFFFFF');}assert(contrasteCores('#000000','#FFFFFF')>20);});
test('cores injetadas, branco em painel e contraste insuficiente são rejeitados',()=>{const t=clone(CATALOGO_TEMAS.light);t.tokens.painel='#FFFFFF';assert(validarTemaCompartilhado(t).length);t.tokens.painel='url(javascript:alert(1))';assert(validarTemaCompartilhado(t).length);t.tokens.painel=t.tokens.texto;assert(validarTemaCompartilhado(t).length);});
test('System respeita modo do SO, alto contraste e mudança de preferência',()=>{
 const values=new Map(),handlers=new Map(),props=new Map();let dark=false;
 globalThis.document={documentElement:{style:{setProperty:(k,v)=>props.set(k,v),removeProperty:k=>props.delete(k)},dataset:{}}};
 globalThis.matchMedia=q=>({matches:q.includes('color-scheme')?dark:false,addEventListener:(_,f)=>handlers.set(q,f),removeEventListener:(_,f)=>{if(handlers.get(q)===f)handlers.delete(q);}});
 aplicarTemaUI('automatico');assert.equal(document.documentElement.dataset.temaResolvido,'light');dark=true;handlers.get('(prefers-color-scheme: dark)')();assert.equal(document.documentElement.dataset.temaResolvido,'dark');
 aplicarTemaUI('dim');assert.equal(handlers.size,0);assert.equal(document.documentElement.dataset.temaResolvido,'dim');assert.equal(resolverModoSistema({altoContraste:true,escuro:false}),'highContrast');
});
test('tema equivalente é reaproveitado e exportação tem contrato portátil',()=>{
 const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
 const same={...clone(CATALOGO_TEMAS.light),id:'user_same',nome:'Outro nome'};assert.equal(salvarTemaUsuario(same),'light');
 const custom={...clone(CATALOGO_TEMAS.light),id:'user_test',nome:'Meu tema',tokens:{...CATALOGO_TEMAS.light.tokens,acento:'#235C87'}};assert.equal(salvarTemaUsuario(custom),'user_test');assert(TEMAS_UI.user_test);assert.equal(exportarTemas().formato,'hefestus.temas');
});
const a={id:'a',nome:'Exportar',entrada:{tipo:'documento'},saida:{tipo:'pdf'},execucao:{host:'pdf',comando:'exportar'}};
const b={...clone(a),id:'b'};
const pacote=()=>({bancoFerramentas:[clone(a),clone(b)],designer:{abas:[{id:'inicio',grupos:[{id:'saida',comandos:[{id:'cmd_b',ferramentaId:'b'}]}]}]},nome:'Original'});
test('nomes iguais não provam equivalência e variantes são mantidas',()=>{assert.equal(compararFerramentas({id:'x',nome:'Teste'},{id:'y',nome:'Teste'}).classe,'revisar');assert.equal(compararFerramentas(a,{...b,varianteDe:'a'}).classe,'variantes');assert.equal(analisarCuradoria([a,b]).candidatos.length,1);});
test('unificação exige revisão e mantém aliases, comandos e fonte original',()=>{
 const p=pacote(),before=JSON.stringify(p);assert.throws(()=>aplicarCuradoria(p,{manter:'a',substituir:'b'}));
 const n=aplicarCuradoria(p,{manter:'a',substituir:'b',aprovada:true,justificativa:'Revisão do cenário de teste',evidencias:['teste de contrato fixture']});assert.equal(n.bancoFerramentas.length,1);assert.equal(n.aliasesFerramentas.b,'a');assert.equal(n.designer.abas[0].grupos[0].comandos[0].ferramentaId,'a');assert.equal(JSON.stringify(p),before);
 n.nome='Nome editado depois';const restored=reverterCuradoria(n);assert.equal(restored.bancoFerramentas.length,2);assert.equal(restored.nome,n.nome);assert.equal(restored.historicoCuradoria.at(-1).acao,'reverter');
});
test('reversão não sobrescreve alterações posteriores de layout',()=>{
 const n=aplicarCuradoria(pacote(),{manter:'a',substituir:'b',aprovada:true,justificativa:'fixture',evidencias:['fixture']});n.designer.abas[0].id='alterado';assert.throws(()=>reverterCuradoria(n),/mudou/);
});
