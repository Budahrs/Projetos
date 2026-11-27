/** Preferências de apresentação não podem impedir a abertura do documento. */
export function listaPreferenciaUI(bruto,limite=500){try{const valor=typeof bruto==='string'?JSON.parse(bruto):bruto;if(!Array.isArray(valor))return [];return [...new Set(valor.filter(x=>typeof x==='string'&&x.length<=200))].slice(0,limite);}catch{return [];}}
