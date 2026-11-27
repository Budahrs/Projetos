// Complemento de execução: código e estilo extras que acompanham um documento (ex.: o modelo de rádios).
// Roda no HTML exportado e na Prévia do editor; na Prévia, tudo é desfeito ao sair (ouvintes, áudio, estilo).
export function ligarComplemento(comp, raiz) {
  if (!comp) return () => {};
  const desfazer = [];
  const temporizadores = new Set(), intervalos = new Set(), quadros = new Set();
  desfazer.push(() => { temporizadores.forEach(id => window.clearTimeout(id)); intervalos.forEach(id => window.clearInterval(id)); quadros.forEach(id => window.cancelAnimationFrame(id)); temporizadores.clear(); intervalos.clear(); quadros.clear(); });
  let encerrado = false;
  const limpar = () => { encerrado = true; while (desfazer.length) { try { desfazer.pop()(); } catch { /* recurso já removido */ } } };
  const reg = (alvo, real) => new Proxy(alvo, {
    get(t, k) {
      if (k === "addEventListener") return (tipo, f, o) => { const destino = raiz && real === document ? raiz : real; destino.addEventListener(tipo, f, o); desfazer.push(() => destino.removeEventListener(tipo, f, o)); };
      if (k === "createElement") return (...a) => { const e = real.createElement(...a); if (/^(audio|video)$/i.test(a[0])) desfazer.push(() => { try { e.pause(); e.removeAttribute("src"); e.load(); } catch { /* sem áudio */ } }); return e; };
      if (k === "getElementById" && raiz && t === document) return id => raiz.querySelector("#" + CSS.escape(id));
      if ((k === "body" || k === "head" || k === "documentElement") && raiz && real === document) return raiz;
      if (k === "querySelector" && raiz && real === document) return seletor => raiz.matches(seletor) ? raiz : raiz.querySelector(seletor);
      if (k === "querySelectorAll" && raiz && real === document) return seletor => raiz.querySelectorAll(seletor);
      if (k === "document" && real === window) return doc;
      if (k === "setTimeout" && real === window) return agendar;
      if (k === "setInterval" && real === window) return repetir;
      if (k === "requestAnimationFrame" && real === window) return quadro;
      if (k === "RADIOS_EMBUTIDAS") return comp.emissoras ?? [];
      const v = real[k];
      return typeof v === "function" ? v.bind(real) : v;
    },
    set(t, k, v) { real[k] = v; return true; },
  });
  const AC = window.AudioContext || window.webkitAudioContext;
  const Ctx = AC ? class extends AC { constructor(...a) { super(...a); desfazer.push(() => { try { this.close(); } catch { /* já fechado */ } }); } } : undefined;
  let estilo = null;
  if (comp.css) { estilo = document.createElement("style"); estilo.textContent = comp.css; (raiz?.parentNode ?? document.head).appendChild(estilo); desfazer.push(() => estilo.remove()); }
  const doc = reg(document, document), win = reg(window, window);
  const agendar = (fn, atraso, ...args) => {
    if (encerrado) return 0;
    const id = window.setTimeout(() => { temporizadores.delete(id); if (!encerrado) fn(...args); }, atraso);
    temporizadores.add(id); return id;
  };
  const repetir = (fn, atraso, ...args) => {
    if (encerrado) return 0;
    const id = window.setInterval(() => { if (!encerrado) fn(...args); }, atraso);
    intervalos.add(id); return id;
  };
  const quadro = fn => {
    if (encerrado) return 0;
    const id = window.requestAnimationFrame(t => { quadros.delete(id); if (!encerrado) fn(t); });
    quadros.add(id); return id;
  };
  try { if (comp.js) new Function("document", "window", "AudioContext", "webkitAudioContext", "setTimeout", "setInterval", "requestAnimationFrame", comp.js)(doc, win, Ctx, Ctx, agendar, repetir, quadro); }
  catch (e) { limpar(); console.error("complemento:", e); raiz?.dispatchEvent(new CustomEvent("hefestus:erro-complemento", { detail: { mensagem: e.message } })); }
  return limpar;
}
