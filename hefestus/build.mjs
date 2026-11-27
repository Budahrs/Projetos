// Gera um arquivo único a partir dos módulos, para abrir com duplo clique (file://).
// Uso: node build.mjs   →   dist/hefestus.html  e  dist/hefestus-pagina.html
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, cpSync, linkSync, unlinkSync, existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const raiz = dirname(fileURLToPath(import.meta.url));
// Ordem dos módulos descoberta pelos próprios imports, a partir de js/app.js
// (dependências antes de quem as usa). Um arquivo novo entra sozinho.
const IMPORT = /^import\s*\{[^}]*\}\s*from\s*["'](.+?)["'];?\s*$/gm;
function ordenar(entrada) {
  const ordem = [];
  const visitando = new Set();
  const visitar = caminho => {
    if (ordem.includes(caminho)) return;
    if (visitando.has(caminho)) throw new Error(`import circular envolvendo ${caminho}`);
    visitando.add(caminho);
    const codigo = readFileSync(join(raiz, caminho), "utf8");
    for (const [, de] of codigo.matchAll(IMPORT)) visitar(normalize(join(dirname(caminho), de)).replaceAll("\\", "/"));
    visitando.delete(caminho);
    ordem.push(caminho);
  };
  visitar(entrada);
  return ordem;
}
const ORDEM = ordenar("js/app.js");

function empacotar(caminho) {
  let codigo = readFileSync(join(raiz, caminho), "utf8");
  const exportados = [];
  codigo = codigo.replace(/^import\s*\{([^}]*)\}\s*from\s*["'](.+?)["'];?\s*$/gm, (_, nomes, de) => {
    const alvo = normalize(join(dirname(caminho), de)).replaceAll("\\", "/");
    if (!ORDEM.includes(alvo)) throw new Error(`${caminho}: import desconhecido ${de}`);
    const lista = nomes.split(",").map(s => s.trim()).filter(Boolean).map(s => s.replace(/\s+as\s+/, ": "));
    return `const { ${lista.join(", ")} } = __m["${alvo}"];`;
  });
  codigo = codigo.replace(/^export\s*\{([^}]*)\};?\s*$/gm, (_, nomes) => {
    exportados.push(...nomes.split(",").map(s => s.trim()).filter(Boolean).map(s => s.replace(/^(\S+)\s+as\s+(\S+)$/, "$2: $1")));
    return "";
  });
  codigo = codigo.replace(/^export\s+(async\s+function|function|class|const|let)\s+([A-Za-z_$][\w$]*)/gm, (_, tipo, nome) => {
    exportados.push(nome);
    return `${tipo} ${nome}`;
  });
  if (/^\s*(import|export)\s/m.test(codigo)) throw new Error(`${caminho}: import/export não tratado`);
  return `__m["${caminho}"] = (() => {\n${codigo}\nreturn { ${[...new Set(exportados)].join(", ")} };\n})();\n`;
}

const blockly = readFileSync(join(raiz,'node_modules/blockly/blockly_compressed.js'),'utf8')+'\n'+readFileSync(join(raiz,'node_modules/blockly/msg/pt-br.js'),'utf8');
const js = `${blockly}\n"use strict";\nconst __m = {};\n${ORDEM.map(empacotar).join("\n")}`.replaceAll("</script", "<\\/script");
new Script(js, { filename: "hefestus-empacotado.js" });
const css = readFileSync(join(raiz, "css/hefestus.css"), "utf8");
const fontes = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" media="print" onload="this.media='all'">`;
// media="print" + onload: as fontes chegam em paralelo e não seguram a primeira pintura (sem internet, não travam nada).

mkdirSync(join(raiz, "dist"), { recursive: true });
for(const destino of [raiz,join(raiz,'dist')])cpSync(join(raiz,'node_modules/blockly/media'),join(destino,'blockly-media'),{recursive:true});
mkdirSync(join(raiz,'licencas'),{recursive:true});
copyFileSync(join(raiz,'node_modules/blockly/LICENSE'),join(raiz,'licencas/Blockly-Apache-2.0.txt'));

// Arquivo completo, para abrir no navegador.
writeFileSync(join(raiz, "dist/hefestus.html"), `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Hephaestus 2.1</title>
${fontes}
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<script>
${js}
</script>
</body>
</html>
`);

// Conteúdo de página (sem doctype/head/body), para publicar como Artifact.
writeFileSync(join(raiz, "dist/hefestus-pagina.html"), `<title>Hephaestus 2.1</title>
${fontes}
<style>
${css}
</style>
<div id="app"></div>
<script>
${js}
</script>
`);

// Aliases do mesmo build: hard links locais evitam cópias de 12 MB; fallback preserva portabilidade.
function aliasBuild(origem,destino){if(existsSync(destino))unlinkSync(destino);try{linkSync(origem,destino);}catch{copyFileSync(origem,destino);}}
aliasBuild(join(raiz,'dist/hefestus.html'),join(raiz,'hephaestus.html'));
aliasBuild(join(raiz,'dist/hefestus.html'),join(raiz,'dist/hephaestus.html'));
writeFileSync(join(raiz,'hefestus.html'), '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Hephaestus</title><meta http-equiv="refresh" content="0;url=hephaestus.html"><a href="hephaestus.html">Abrir Hephaestus</a></html>');
console.log('HTML e aliases atualizados: '+(Buffer.byteLength(js)/1024).toFixed(0)+' KB de script');
