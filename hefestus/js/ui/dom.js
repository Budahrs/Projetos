// Utilitários de DOM e campos de formulário dos painéis.
import { icone, iconeMenu } from "./icones.js";

/** Cria um elemento. attrs: class, html, on<evento>, data-*, demais atributos. */
export function h(tag, attrs = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (k in el && typeof v !== "string") el[k] = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat(Infinity)) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

/** Botão com ícone. */
export function botaoIcone(nomeIcone, titulo, aoClicar, extra = {}) {
  return h("button", { type: "button", class: `bt-ic ${extra.class ?? ""}`, title: titulo, "aria-label": titulo, html: icone(nomeIcone, extra.tam ?? 18), onclick: aoClicar, ...extra.attrs });
}

let seqCampo = 0;
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Campo de formulário a partir de uma definição { rotulo, caminho, tipo, opcoes, min, max, passo, vazio }.
 * Chama aoMudar(valor) só no "change" (um evento no histórico por edição).
 */
export function campo(def, valor, aoMudar) {
  const id = `cp-${def.caminho.replace(/\W/g, "-")}-${++seqCampo}`;
  const preparar = raiz => {
    raiz.querySelectorAll('input,select,textarea').forEach((el, i) => { el.dataset.focoCampo = def.caminho + ':' + i; });
    raiz.addEventListener('keydown', e => {
      if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey) return;
      const itens = [...document.querySelectorAll('button,input,select,textarea,a[href],summary,[tabindex="0"]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      const seguinte = itens[itens.indexOf(e.target) + (e.shiftKey ? -1 : 1)];
      if (!seguinte) return;
      const resolver = capturarFoco(seguinte);
      e.preventDefault(); e.target.blur(); resolver();
    });
    return raiz;
  };
  const rotulo = h("label", { class: "cp-rotulo", for: id }, def.rotulo);
  let controle;

  switch (def.tipo) {
    case "check":
      controle = h("input", { id, type: "checkbox", role: "switch", class: "cp-check cp-interruptor", checked: !!valor, "aria-checked": String(!!valor), onchange: e => { e.target.setAttribute("aria-checked", String(e.target.checked)); aoMudar(e.target.checked); } });
      return preparar(h("div", { class: "cp cp-linha" }, controle, rotulo));

    case "numero":
      controle = h("input", {
        id, type: "number", class: "cp-entrada num", value: valor ?? "",
        min: def.min, max: def.max, step: def.passo ?? 1,
        onchange: e => { const n = Number(e.target.value); if (!Number.isNaN(n)) aoMudar(n); },
      });
      break;

    case "select":
      controle = h("select", { id, class: "cp-entrada", onchange: e => aoMudar(typeof valor === "number" ? Number(e.target.value) : e.target.value) },
        def.opcoes.map(([v, r]) => h("option", { value: v, selected: String(valor) === String(v) }, r)));
      break;

    case "area":
      controle = h("textarea", { id, class: "cp-entrada", rows: 3, onchange: e => aoMudar(e.target.value) }, valor ?? "");
      break;

    case "lista":
      controle = h("textarea", { id, class: "cp-entrada", rows: 4, onchange: e => aoMudar(e.target.value.split("\n").map(s => s.trim()).filter(Boolean)) }, (valor ?? []).join("\n"));
      break;

    case "cor": {
      const texto = h("input", {
        id, type: "text", class: "cp-entrada num", value: valor ?? "", placeholder: def.vazio ? "sem mudança" : "#rrggbb",
        spellcheck: false,
        onchange: e => aoMudar(e.target.value.trim()),
      });
      const amostra = h("input", {
        type: "color", class: "cp-amostra", value: HEX.test(valor ?? "") ? valor : "#ffffff", "aria-label": `${def.rotulo}: escolher cor`,
        onchange: e => { texto.value = e.target.value; aoMudar(e.target.value); },
      });
      if (!HEX.test(valor ?? "")) amostra.classList.add("vazia");
      controle = h("div", { class: "cp-cor" }, amostra, texto);
      break;
    }

    default:
      controle = h("input", { id, type: "text", class: "cp-entrada", value: valor ?? "", onchange: e => aoMudar(e.target.value) });
  }
  return preparar(h("div", { class: "cp" }, rotulo, controle));
}

/** Pequeno aviso que some sozinho. */
export function avisar(texto, tipo = "info") {
  let pilha = document.querySelector(".avisos");
  if (!pilha) document.body.append((pilha = h("div", { class: "avisos", role: "status", "aria-live": "polite" })));
  const a = h("div", { class: `aviso aviso-${tipo}` }, texto);
  pilha.append(a);
  setTimeout(() => a.classList.add("saindo"), 3200);
  setTimeout(() => a.remove(), 3600);
}

/** Copia texto; se o navegador recusar, devolve false. */
export async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

export const ler = (obj, caminho) => caminho.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);

/** Mantém o campo e a posição de edição quando o formulário é reconstruído. */
export function capturarFoco(alvo = document.activeElement) {
  const chave = alvo?.dataset?.focoCampo;
  if (!alvo || (!chave && !alvo.matches('button,input,select,textarea,a[href],summary'))) return () => {};
  const nome = alvo.getAttribute('aria-label') || alvo.getAttribute('title') || alvo.textContent;
  const seletor = chave ? '[data-foco-campo="' + CSS.escape(chave) + '"]' : alvo.tagName;
  const candidatos = () => [...document.querySelectorAll(seletor)].filter(el => chave ||
    (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent) === nome);
  const indice = candidatos().indexOf(alvo);
  const inicio = alvo.selectionStart, fim = alvo.selectionEnd;
  return () => {
    const novo = alvo.isConnected ? alvo : candidatos()[indice];
    if (!novo || !novo.getClientRects().length) return;
    novo.focus({preventScroll:true});
    if (typeof inicio === 'number' && novo.setSelectionRange) { try { novo.setSelectionRange(inicio, fim); } catch {} }
  };
}
