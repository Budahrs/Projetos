// Abertura do Hephaestus: três marteladas na bigorna e a voz dizendo o nome.
// As marteladas são sintetizadas na hora (Web Audio), como os sons de js/ui/sons.js.
// A voz vem de js/ui/vozAbertura.js (gerada por ferramentas/gerar-voz-abertura.mjs).
// Se o navegador bloquear som sem gesto, a abertura espera um toque ("Toque para acender a forja").

import { VOZ_HEPHAESTUS } from "./vozAbertura.js";

const GOLPES = [0.35, 0.95, 1.55]; // segundos após o início; o CSS do martelo usa o mesmo ritmo
const VOZ = 2.0;
const FIM = 3.7;

function contexto() {
  try { return new (globalThis.AudioContext ?? globalThis.webkitAudioContext)(); } catch { return null; }
}

/** Sala da forja: reverberação curta feita de ruído com decaimento. */
function sala(c, dur = 1.8) {
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3.5;
  }
  const conv = c.createConvolver();
  conv.buffer = buf;
  return conv;
}

/** Martelo na bigorna: estalo do impacto, baque grave e o tinido (modos inarmônicos de uma barra de aço). */
function martelada(c, saida, t, forca = 1) {
  const n = Math.floor(c.sampleRate * 0.03), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 4;
  const estalo = c.createBufferSource();
  estalo.buffer = buf;
  const faixa = c.createBiquadFilter();
  faixa.type = "bandpass"; faixa.frequency.value = 3200; faixa.Q.value = 0.8;
  const ge = c.createGain();
  ge.gain.value = 0.9 * forca;
  estalo.connect(faixa).connect(ge).connect(saida);
  estalo.start(t);

  const baque = c.createOscillator(), gb = c.createGain();
  baque.frequency.setValueAtTime(140, t);
  baque.frequency.exponentialRampToValueAtTime(48, t + 0.18);
  gb.gain.setValueAtTime(0.0001, t);
  gb.gain.exponentialRampToValueAtTime(0.7 * forca, t + 0.003);
  gb.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  baque.connect(gb).connect(saida);
  baque.start(t); baque.stop(t + 0.25);

  const base = 612 * (0.98 + Math.random() * 0.04);
  for (const [razao, vol, dur] of [[1, 0.22, 1.4], [1.007, 0.12, 1.2], [2.76, 0.14, 0.9], [5.4, 0.08, 0.55], [8.93, 0.05, 0.35]]) {
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.value = base * razao;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * forca, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(saida);
    o.start(t); o.stop(t + dur + 0.05);
  }
}

function decodificarVoz(c) {
  const bin = atob(VOZ_HEPHAESTUS.slice(VOZ_HEPHAESTUS.indexOf(",") + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Promise((ok, erro) => c.decodeAudioData(bytes.buffer, ok, erro));
}

/** Agenda marteladas e voz a partir de agora. */
function tocarSons(c, voz) {
  const t0 = c.currentTime + 0.02;
  const mestre = c.createGain();
  mestre.gain.value = 0.55;
  const comp = c.createDynamicsCompressor();
  mestre.connect(comp).connect(c.destination);
  const eco = sala(c), molhado = c.createGain();
  molhado.gain.value = 0.35;
  eco.connect(molhado).connect(mestre);
  const seco = c.createGain();
  seco.connect(mestre);
  seco.connect(eco);
  GOLPES.forEach((s, i) => martelada(c, seco, t0 + s, i === GOLPES.length - 1 ? 1.15 : 0.85));
  voz.then(buf => {
    const fonte = c.createBufferSource();
    fonte.buffer = buf;
    fonte.playbackRate.value = 0.9; // um pouco mais grave
    const grave = c.createBiquadFilter();
    grave.type = "lowshelf"; grave.frequency.value = 220; grave.gain.value = 6;
    const g = c.createGain();
    g.gain.value = 1.3;
    fonte.connect(grave).connect(g).connect(seco);
    fonte.start(Math.max(c.currentTime, t0 + VOZ));
  }).catch(() => {});
}

const SVG = `<svg class="hp-ab-cena" viewBox="0 0 400 320" aria-hidden="true">
  <defs><linearGradient id="hp-ab-aco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6a356"/><stop offset="1" stop-color="#7a5424"/></linearGradient></defs>
  <ellipse class="hp-ab-brilho" cx="200" cy="122" rx="120" ry="34"/>
  <g transform="translate(95 120) scale(.6) translate(-780 -210)">
    <path fill="url(#hp-ab-aco)" stroke="#3b2812" stroke-width="3" d="M780 260 L1130 260 L1080 325 L995 345 L995 445 L1070 480 L1070 515 L830 515 L830 480 L900 445 L900 345 L850 325 Z M835 210 L1080 210 L1080 247 L835 247 Z"/>
  </g>
  <g class="hp-ab-faiscas"></g>
  <g class="hp-ab-martelo">
    <rect x="214" y="96" width="132" height="10" rx="4" fill="#5b3b1e"/>
    <rect x="172" y="80" width="52" height="38" rx="5" fill="#3d4650" stroke="#1b2026" stroke-width="2"/>
    <rect x="172" y="80" width="52" height="9" rx="3" fill="#6b7783"/>
  </g>
</svg>`;

function faiscas(raiz) {
  const g = raiz.querySelector(".hp-ab-faiscas");
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * (1.05 + Math.random() * 0.9), r = 40 + Math.random() * 70;
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", "200"); l.setAttribute("y1", "118"); l.setAttribute("x2", String(200 + Math.cos(a) * 7)); l.setAttribute("y2", String(118 + Math.sin(a) * 7));
    l.style.setProperty("--dx", `${Math.cos(a) * r}px`);
    l.style.setProperty("--dy", `${Math.sin(a) * r}px`);
    g.append(l);
    setTimeout(() => l.remove(), 700);
  }
}

/**
 * Mostra a abertura sobre a interface. Resolve quando ela some.
 * Toque ou Esc durante a animação pula; sem som liberado, espera um toque para começar.
 */
export function mostrarAbertura({ sons = true, reduzirMovimento = false } = {}) {
  if (globalThis.navigator?.webdriver || document.querySelector(".hp-abertura")) return Promise.resolve();
  const reduzir = reduzirMovimento || !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const raiz = document.createElement("div");
  raiz.className = "hp-abertura" + (reduzir ? " reduzir" : "");
  raiz.setAttribute("role", "status");
  raiz.setAttribute("aria-label", "Abrindo o Hephaestus");
  raiz.innerHTML = `${SVG}<div class="hp-ab-nome">HEPHAESTUS<small>2.1</small></div><div class="hp-ab-toque">Toque para acender a forja</div>`;
  document.body.append(raiz);

  return new Promise(fim => {
    const c = sons ? contexto() : null;
    const voz = c ? decodificarVoz(c) : null;
    const tempos = [];
    let estado = "preparando";
    const encerrar = () => {
      if (estado === "fim") return;
      estado = "fim";
      tempos.forEach(clearTimeout);
      removeEventListener("keydown", tecla, true);
      raiz.classList.add("saindo");
      setTimeout(() => { raiz.remove(); c?.close?.().catch(() => {}); fim(); }, reduzir ? 0 : 450);
    };
    const tocar = () => {
      estado = "tocando";
      raiz.classList.remove("aguardando");
      raiz.classList.add("tocando");
      c?.resume().then(() => { if (c.state === "running") tocarSons(c, voz); }).catch(() => {});
      GOLPES.forEach(s => tempos.push(setTimeout(() => {
        raiz.classList.remove("golpe"); void raiz.offsetWidth; raiz.classList.add("golpe");
        if (!reduzir) faiscas(raiz);
      }, s * 1000)));
      tempos.push(setTimeout(() => raiz.classList.add("nome"), VOZ * 1000));
      tempos.push(setTimeout(encerrar, FIM * 1000));
    };
    const liberar = () => tocar(); // tocar() chama resume() ainda dentro do gesto
    function tecla(e) {
      if (e.key === "Escape") { e.preventDefault(); encerrar(); }
      else if (estado === "aguardando" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); liberar(); }
    }
    addEventListener("keydown", tecla, true);
    raiz.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (estado === "aguardando") liberar();
      else if (estado === "tocando") encerrar();
    });
    if (!c) return tocar();
    Promise.race([c.resume().catch(() => {}), new Promise(r => setTimeout(r, 250))]).then(() => {
      if (estado !== "preparando") return;
      if (c.state === "running") return tocar();
      estado = "aguardando"; // o navegador só libera o som depois de um gesto
      raiz.classList.add("aguardando");
    });
  });
}
