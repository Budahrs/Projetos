// Exporta o contrato do Hefestus para adaptadores de outros sistemas.
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {exportarTemas} from '../js/ui/temas.js';
const destino=resolve(process.argv[2]||'dist/temas-compartilhados.json');
mkdirSync(dirname(destino),{recursive:true});
writeFileSync(destino,JSON.stringify(exportarTemas(),null,2));
console.log(destino);
