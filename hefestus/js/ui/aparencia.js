// Seção "Aparência" do painel de estilo: preenchimentos em camadas (sólido e gradientes), traços,
// efeitos, cantos individuais e modo de mistura. Funciona com um ou vários elementos selecionados.
import { h, campo } from "./dom.js";
import { icone } from "./icones.js";
import {
  novoPreenchimento, novoTraco, novoEfeito, gradientePreset, PRESETS_GRADIENTE, MODOS_MISTURA, fundoCSS, temAvancado,
} from "../nucleo/estiloAvancado.js";

const TIPOS_FILL = [["solido", "Sólido"], ["linear", "Gradiente linear"], ["radial", "Gradiente radial"], ["conico", "Gradiente cônico"], ["imagem", "Imagem"]];
const TIPOS_EFEITO = [["sombra", "Sombra"], ["sombraInterna", "Sombra interna"], ["desfoque", "Desfoque da camada"], ["vidro", "Vidro fosco (fundo)"]];
export const TIPOS_AVANCADOS = ["caixa", "container", "forma", "elipse", "botao", "campo", "modal", "toast", "menu"];
const clone = v => structuredClone(v);

/**
 * Monta a seção. `ler(caminho)` lê do elemento principal; `gravar(caminho, valor, texto)` grava em todos os selecionados.
 * Devolve um array de nós.
 */
export function secaoAparencia({ el, ler, gravar }) {
  const s = el.estilo ?? {};
  const fills = clone(s.preenchimentos ?? []);
  const tracos = clone(s.tracos ?? []);
  const efeitos = clone(s.efeitos ?? []);

  const btn = (ic, titulo, f, extra = {}) => h("button", { type: "button", class: `bt-ic ${extra.class ?? ""}`, title: titulo, "aria-label": titulo, html: icone(ic, 14), onclick: f, disabled: extra.disabled });
  const mover = (lista, i, d, caminho, texto) => {
    const j = i + d; if (j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]]; gravar(caminho, lista, texto);
  };
  const cabeca = (titulo, aoAdicionar, extra) => h("div", { class: "sub ap-cab" }, h("span", {}, titulo),
    extra ?? null, btn("mais", `Adicionar: ${titulo}`, aoAdicionar));
  const linha = (...cs) => h("div", { class: "ap-linha" }, ...cs);
  const num = (rotulo, valor, aoMudar, o = {}) => h("label", { class: "ap-num" }, h("span", {}, rotulo),
    h("input", { type: "number", class: "cp-entrada num", value: valor ?? "", min: o.min, max: o.max, step: o.passo ?? 1, onchange: e => { const n = Number(e.target.value); if (!Number.isNaN(n)) aoMudar(n); } }));
  const sel = (valor, opcoes, aoMudar, rotulo) => h("select", { class: "cp-entrada", "aria-label": rotulo, onchange: e => aoMudar(e.target.value) },
    opcoes.map(([v, r]) => h("option", { value: v, selected: String(valor) === String(v) }, r)));
  const cor = (valor, aoMudar, rotulo) => campo({ rotulo, caminho: "ap", tipo: "cor" }, valor, aoMudar);
  const seletorCor = (valor, aoMudar, rotulo) => {
    const n = campo({ rotulo, caminho: "ap-cor", tipo: "cor" }, valor, aoMudar);
    n.classList.add("ap-cor"); return n;
  };

  // ---------------------------------------------------------------- preenchimentos
  const gravaFills = (texto) => gravar("estilo.preenchimentos", fills, texto);
  const cartaoFill = (f, i) => {
    const corpo = [];
    if (f.tipo === "solido") {
      corpo.push(seletorCor(f.cor, v => { f.cor = v; gravaFills("Cor do preenchimento"); }, "Cor"));
    } else if (f.tipo === "imagem") {
      corpo.push(h("input", { type: "text", class: "cp-entrada", placeholder: "URL ou data:image…", value: f.url ?? "", "aria-label": "Endereço da imagem", onchange: e => { f.url = e.target.value.trim(); gravaFills("Imagem do preenchimento"); } }));
      corpo.push(h("input", { type: "file", accept: "image/*", class: "ap-arquivo", "aria-label": "Escolher imagem", onchange: e => {
        const a = e.target.files?.[0]; if (!a) return;
        const r = new FileReader(); r.onload = () => { f.url = String(r.result); gravaFills("Imagem do preenchimento"); }; r.readAsDataURL(a);
      } }));
      corpo.push(sel(f.ajuste ?? "cobrir", [["cobrir", "Cobrir"], ["conter", "Conter"], ["esticar", "Esticar"], ["recortar", "Recortar (zoom e posição)"]], v => { f.ajuste = v; gravaFills("Ajuste da imagem"); }, "Ajuste"));
      if (f.ajuste === "recortar") corpo.push(linha(
        num("Zoom %", f.zoom ?? 100, v => { f.zoom = v; gravaFills("Zoom da imagem"); }, { min: 10, max: 500 }),
        num("X %", f.posX ?? 50, v => { f.posX = v; gravaFills("Posição da imagem"); }, { min: 0, max: 100 }),
        num("Y %", f.posY ?? 50, v => { f.posY = v; gravaFills("Posição da imagem"); }, { min: 0, max: 100 })));
    } else {
      corpo.push(h("div", { class: "ap-previa", style: `background:${fundoCSS([{ ...f, tipo: f.tipo === "conico" ? "conico" : f.tipo === "radial" ? "radial" : "linear", angulo: f.tipo === "linear" ? 90 : f.angulo }])}` }));
      corpo.push(linha(
        ...(f.tipo !== "radial" ? [num(f.tipo === "linear" ? "Ângulo" : "Início", f.angulo ?? 90, v => { f.angulo = v; gravaFills("Ângulo do gradiente"); }, { min: -360, max: 360 })] : []),
        ...(f.tipo !== "linear" ? [num("Centro X %", f.cx ?? 50, v => { f.cx = v; gravaFills("Centro do gradiente"); }, { min: 0, max: 100 }), num("Y %", f.cy ?? 50, v => { f.cy = v; gravaFills("Centro do gradiente"); }, { min: 0, max: 100 })] : []),
      ));
      corpo.push(h("div", { class: "ap-paradas" }, (f.paradas ?? []).map((p, k) => h("div", { class: "ap-parada" },
        num("%", p.pos, v => { p.pos = v; gravaFills("Parada do gradiente"); }, { min: 0, max: 100 }),
        seletorCor(p.cor, v => { p.cor = v; gravaFills("Cor da parada"); }, "Cor da parada"),
        num("α", p.alfa ?? 1, v => { p.alfa = v; gravaFills("Transparência da parada"); }, { min: 0, max: 1, passo: 0.05 }),
        btn("menos", "Remover parada", () => { f.paradas.splice(k, 1); gravaFills("Remover parada"); }, { disabled: f.paradas.length <= 2 })))));
      corpo.push(h("div", { class: "ap-acoes" },
        h("button", { type: "button", class: "bt-texto", onclick: () => { const ps = f.paradas; const a = ps[ps.length - 2] ?? ps[0], b = ps[ps.length - 1]; ps.splice(ps.length - 1, 0, { pos: Math.round((a.pos + b.pos) / 2), cor: b.cor, alfa: 1 }); gravaFills("Nova parada"); } }, "+ Parada"),
        h("button", { type: "button", class: "bt-texto", title: "Inverter a ordem das cores", onclick: () => { f.paradas = f.paradas.map(p => ({ ...p, pos: 100 - p.pos })).reverse(); gravaFills("Inverter gradiente"); } }, "⇄ Inverter"),
        h("select", { class: "cp-entrada", "aria-label": "Usar gradiente pronto", onchange: e => { if (!e.target.value) return; const g = gradientePreset(e.target.value, f.tipo); Object.assign(f, { paradas: g.paradas }); gravaFills(`Gradiente ${e.target.value}`); } },
          h("option", { value: "" }, "Gradiente pronto…"), Object.keys(PRESETS_GRADIENTE).map(k => h("option", { value: k }, k)))));
    }
    corpo.push(num("Opacidade da camada", f.opacidade ?? 1, v => { f.opacidade = v; gravaFills("Opacidade da camada"); }, { min: 0, max: 1, passo: 0.05 }));
    return h("div", { class: "ap-cartao" },
      h("div", { class: "ap-topo" },
        h("input", { type: "checkbox", class: "cp-check", checked: f.visivel !== false, "aria-label": "Camada visível", onchange: e => { f.visivel = e.target.checked; gravaFills("Mostrar/ocultar preenchimento"); } }),
        sel(f.tipo, TIPOS_FILL, v => {
          const novo = novoPreenchimento(v, f.cor ?? "#4472c4");
          if (v === "solido") fills[i] = { ...novo, cor: f.paradas?.[0]?.cor ?? f.cor ?? novo.cor };
          else fills[i] = { ...novo, cor: f.cor ?? novo.cor, paradas: f.paradas?.length ? f.paradas : novo.paradas };
          gravaFills("Tipo de preenchimento");
        }, "Tipo"),
        btn("setaCima", "Subir (fica por cima)", () => mover(fills, i, -1, "estilo.preenchimentos", "Ordem dos preenchimentos"), { disabled: i === 0 }),
        btn("setaBaixo", "Descer", () => mover(fills, i, 1, "estilo.preenchimentos", "Ordem dos preenchimentos"), { disabled: i === fills.length - 1 }),
        btn("excluir", "Remover preenchimento", () => { fills.splice(i, 1); gravaFills("Remover preenchimento"); })),
      ...corpo);
  };

  // ---------------------------------------------------------------- traços
  const gravaTracos = texto => gravar("estilo.tracos", tracos, texto);
  const cartaoTraco = (t, i) => h("div", { class: "ap-cartao" },
    h("div", { class: "ap-topo" },
      h("input", { type: "checkbox", class: "cp-check", checked: t.visivel !== false, "aria-label": "Traço visível", onchange: e => { t.visivel = e.target.checked; gravaTracos("Mostrar/ocultar traço"); } }),
      seletorCor(t.cor, v => { t.cor = v; gravaTracos("Cor do traço"); }, "Cor do traço"),
      num("Largura", t.largura, v => { t.largura = v; gravaTracos("Largura do traço"); }, { min: 0, max: 200, passo: 0.5 }),
      btn("setaCima", "Subir", () => mover(tracos, i, -1, "estilo.tracos", "Ordem dos traços"), { disabled: i === 0 }),
      btn("excluir", "Remover traço", () => { tracos.splice(i, 1); gravaTracos("Remover traço"); })),
    linha(
      sel(t.posicao ?? "dentro", [["dentro", "Dentro"], ["centro", "Centro"], ["fora", "Fora"]], v => { t.posicao = v; gravaTracos("Posição do traço"); }, "Posição"),
      sel(t.estilo ?? "solido", [["solido", "Sólido"], ["tracejado", "Tracejado"], ["pontilhado", "Pontilhado"]], v => { t.estilo = v; gravaTracos("Estilo do traço"); }, "Estilo")),
    linha(
      sel(t.ponta ?? "reta", [["reta", "Ponta reta"], ["redonda", "Ponta redonda"], ["quadrada", "Ponta quadrada"]], v => { t.ponta = v; gravaTracos("Ponta do traço"); }, "Ponta"),
      sel(t.juncao ?? "reta", [["reta", "Junção reta"], ["redonda", "Junção redonda"], ["chanfrada", "Junção chanfrada"]], v => { t.juncao = v; gravaTracos("Junção do traço"); }, "Junção")));

  // ---------------------------------------------------------------- efeitos
  const gravaEfeitos = texto => gravar("estilo.efeitos", efeitos, texto);
  const cartaoEfeito = (e, i) => {
    const sombra = e.tipo === "sombra" || e.tipo === "sombraInterna";
    return h("div", { class: "ap-cartao" },
      h("div", { class: "ap-topo" },
        h("input", { type: "checkbox", class: "cp-check", checked: e.visivel !== false, "aria-label": "Efeito visível", onchange: ev => { e.visivel = ev.target.checked; gravaEfeitos("Mostrar/ocultar efeito"); } }),
        sel(e.tipo, TIPOS_EFEITO, v => { efeitos[i] = { ...novoEfeito(v), cor: e.cor ?? "#00000040" }; gravaEfeitos("Tipo de efeito"); }, "Tipo de efeito"),
        btn("excluir", "Remover efeito", () => { efeitos.splice(i, 1); gravaEfeitos("Remover efeito"); })),
      linha(...(sombra ? [num("X", e.x, v => { e.x = v; gravaEfeitos("Sombra X"); }, { min: -200, max: 200 }), num("Y", e.y, v => { e.y = v; gravaEfeitos("Sombra Y"); }, { min: -200, max: 200 })] : []),
        num("Desfoque", e.blur, v => { e.blur = v; gravaEfeitos("Desfoque do efeito"); }, { min: 0, max: 200 }),
        ...(sombra ? [num("Espalhar", e.espalhar, v => { e.espalhar = v; gravaEfeitos("Espalhar sombra"); }, { min: -100, max: 100 })] : [])),
      ...(sombra ? [seletorCor(e.cor, v => { e.cor = v; gravaEfeitos("Cor do efeito"); }, "Cor (aceita rgba)")] : []));
  };

  // ---------------------------------------------------------------- cantos e mistura
  const cantos = Array.isArray(s.cantos) && s.cantos.length === 4 ? s.cantos : null;
  const unico = !cantos;
  const bloco = [
    h("div", { class: "sub ap-cab" }, h("span", {}, "Cantos"),
      h("label", { class: "ap-ind" }, h("input", { type: "checkbox", class: "cp-check", checked: !unico, onchange: e => gravar("estilo.cantos", e.target.checked ? [s.raio ?? 0, s.raio ?? 0, s.raio ?? 0, s.raio ?? 0] : undefined, e.target.checked ? "Cantos individuais" : "Cantos iguais") }), " Individuais")),
    unico
      ? num("Raio", s.raio ?? 0, v => gravar("estilo.raio", v, "Raio dos cantos"), { min: 0, max: 400 })
      : linha(...["↖", "↗", "↘", "↙"].map((rot, k) => num(rot, cantos[k], v => { const c = [...cantos]; c[k] = v; gravar("estilo.cantos", c, "Raio de um canto"); }, { min: 0, max: 400 }))),
    h("div", { class: "sub" }, "Mistura"),
    sel(s.mistura ?? "normal", MODOS_MISTURA, v => gravar("estilo.mistura", v === "normal" ? undefined : v, `Mistura ${v}`), "Modo de mistura"),
  ];

  return [
    cabeca("Preenchimentos", () => { fills.unshift(novoPreenchimento("solido", fills.length ? "#ffffff" : (s.fundo?.startsWith("#") ? s.fundo : "#4472c4"))); gravaFills("Novo preenchimento"); },
      h("button", { type: "button", class: "bt-texto ap-mini", title: "Novo gradiente", onclick: () => { fills.unshift(gradientePreset("Oceano")); gravaFills("Novo gradiente"); } }, "+ gradiente")),
    ...(fills.length ? fills.map(cartaoFill) : [h("p", { class: "painel-vazio" }, "Sem camadas: vale o campo Fundo. Adicione para usar gradientes e várias cores.")]),
    cabeca("Traços", () => { tracos.push(novoTraco(s.borda?.startsWith("#") ? s.borda : "#1f2937")); gravaTracos("Novo traço"); }),
    ...(tracos.length ? tracos.map(cartaoTraco) : [h("p", { class: "painel-vazio" }, "Sem traços: vale a Borda simples.")]),
    cabeca("Efeitos", () => { efeitos.push(novoEfeito("sombra")); gravaEfeitos("Nova sombra"); }),
    ...(efeitos.length ? efeitos.map(cartaoEfeito) : [h("p", { class: "painel-vazio" }, "Sombras (também internas), desfoque e vidro fosco, quantos quiser.")]),
    ...bloco,
  ];
}

export { temAvancado };
