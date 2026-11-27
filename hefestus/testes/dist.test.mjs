import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// O empacotador (build.mjs) já quebrou o app inteiro com um `export { a as b }`: confere a sintaxe do que vai ao navegador.
test("dist/hefestus.html: todos os scripts inline têm sintaxe válida", () => {
  const html = readFileSync(new URL("../dist/hefestus.html", import.meta.url), "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.trim());
  assert.ok(scripts.length > 0);
  for (const s of scripts) assert.doesNotThrow(() => new Function(s));
});
