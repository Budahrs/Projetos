// Sons de interface sintetizados na hora (Web Audio), curtos e baixos.
// Desenho próprio: um "tique" ao aproximar do ímã, um clique seco de encaixe e um
// duplo tom ascendente ao entrar num container. Nada de arquivos de áudio.

let ctx = null;
let ligado = true;

export function ligarSons(v) { ligado = !!v; }

function audio() {
  if (!ligado) return null;
  try {
    ctx ??= new (globalThis.AudioContext ?? globalThis.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch { return null; }
}

/** Tom curto com envelope rápido. */
function tom(c, { freq, freqFim = freq, ini = 0, dur = 0.06, vol = 0.05, tipo = "sine" }) {
  const t = c.currentTime + ini;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, freqFim), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Estalo de ruído filtrado (a "batida" do clique). */
function estalo(c, { ini = 0, dur = 0.012, vol = 0.06, corte = 3200 }) {
  const t = c.currentTime + ini;
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = corte;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

export const sons = {
  /** Aproximou de uma linha de ímã. */
  aproximar() {
    const c = audio();
    if (!c) return;
    tom(c, { freq: 2300, freqFim: 1900, dur: 0.025, vol: 0.018 });
  },
  /** Soltou encaixado numa linha. */
  encaixar() {
    const c = audio();
    if (!c) return;
    estalo(c, { vol: 0.05 });
    tom(c, { freq: 1350, freqFim: 900, dur: 0.05, vol: 0.05, tipo: "triangle" });
    tom(c, { freq: 1800, freqFim: 1500, ini: 0.045, dur: 0.035, vol: 0.022 });
  },
  /** Entrou num container. */
  entrar() {
    const c = audio();
    if (!c) return;
    estalo(c, { vol: 0.04, corte: 2600 });
    tom(c, { freq: 660, freqFim: 700, dur: 0.07, vol: 0.045, tipo: "triangle" });
    tom(c, { freq: 990, freqFim: 1040, ini: 0.07, dur: 0.09, vol: 0.04, tipo: "triangle" });
  },
  /** Saiu de um container. */
  sair() {
    const c = audio();
    if (!c) return;
    tom(c, { freq: 880, freqFim: 620, dur: 0.08, vol: 0.035, tipo: "triangle" });
  },
};
