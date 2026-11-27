// Junta os dados do pdf.js (cmaps, fontes padrão e wasm) num arquivo só: dados-pdf.pack.
// Formato: 4 bytes (tamanho do índice, little-endian) + índice JSON { "cmaps/Nome.bcmap": [início, tamanho] } + dados.
// Uso: node ferramentas/vendor/empacotar-pdf.mjs <pasta do pdfjs-dist>
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const origem = process.argv[2];
const partes = [], indice = {};
let pos = 0;
for (const [pasta, prefixo, filtro] of [["cmaps", "cmaps/", /\.bcmap$/], ["standard_fonts", "fonts/", /\.(pfb|ttf|otf)$/i], ["wasm", "wasm/", /\.(wasm|js)$/]]) {
  for (const f of readdirSync(join(origem, pasta)).filter(f => filtro.test(f)).sort()) {
    const b = readFileSync(join(origem, pasta, f));
    indice[prefixo + f] = [pos, b.length]; partes.push(b); pos += b.length;
  }
}
const cab = Buffer.from(JSON.stringify(indice)), tam = Buffer.alloc(4);
tam.writeUInt32LE(cab.length);
const destino = join(dirname(fileURLToPath(import.meta.url)), "pdf", "dados-pdf.pack");
writeFileSync(destino, Buffer.concat([tam, cab, ...partes]));
console.log(Object.keys(indice).length, "arquivos em", destino);
