import {BANCO_FERRAMENTAS_INICIAL} from './bancoFerramentasDados.js';
import {hashTexto} from './armazem.js';
export async function carregarBancoInicial(armazem) {
  await armazem.abrir();
  if(!BANCO_FERRAMENTAS_INICIAL)return;
  const texto=typeof BANCO_FERRAMENTAS_INICIAL==='string'?BANCO_FERRAMENTAS_INICIAL:JSON.stringify(BANCO_FERRAMENTAS_INICIAL);
  const hash=await hashTexto(texto);
  if(await armazem.config('banco-inicial-hash')===hash)return;
  // O primeiro desenho não espera a descompactação das cópias de código.
  await new Promise(resolve=>typeof requestIdleCallback==='function'?requestIdleCallback(resolve,{timeout:1500}):setTimeout(resolve,0));
  await armazem.importar(JSON.parse(texto));
  await armazem.definirConfig('banco-inicial-hash',hash);
}
