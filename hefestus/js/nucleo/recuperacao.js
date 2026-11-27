// Recuperação usa o mesmo documento que o histórico de Voltar. Nunca confunde
// false, zero ou texto vazio com ausência. O original fica disponível para exportação.
import { CATALOGO } from "./catalogo.js";

const copiar = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const objeto = v => v !== null && typeof v === "object" && !Array.isArray(v);
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const tipoConhecido = tipo => typeof tipo === 'string' && Object.hasOwn(CATALOGO, tipo);

export function examinarDocumento(documento, referencia) {
  if (!objeto(documento) || !objeto(documento.elementos)) throw new Error("O projeto não contém um mapa de elementos válido.");
  const doc = copiar(documento), problemas = [];
  const registrar = (id, campo, antes, depois, motivo) => {
    problemas.push({ id, campo, antes: copiar(antes), depois: copiar(depois), motivo });
    return copiar(depois);
  };
  const ref = objeto(referencia?.elementos) ? referencia.elementos : {};
  if (!objeto(doc.elementos.__canvas)) doc.elementos.__canvas = registrar("__canvas", "*", doc.elementos.__canvas,
    ref.__canvas ?? { nome: "Projeto recuperado", largura: 1280, altura: 800, fundo: "#ffffff" }, "Tela ausente ou inválida");
  const tela = doc.elementos.__canvas;
  for (const k of ["largura", "altura"]) if (!Number.isFinite(tela[k]) || tela[k] <= 0)
    tela[k] = registrar("__canvas", k, tela[k], Number.isFinite(ref.__canvas?.[k]) && ref.__canvas[k] > 0 ? ref.__canvas[k] : k === "largura" ? 1280 : 800, "Dimensão da tela inválida");
  if (typeof tela.nome !== "string") tela.nome = registrar("__canvas", "nome", tela.nome, "Projeto recuperado", "Nome da tela inválido");
  const spec = doc.elementos.__construtor;
  if (spec !== undefined && (!objeto(spec) || !Array.isArray(spec.itens) || spec.itens.some(i => !objeto(i) || typeof i.id !== "string" || typeof i.tipo !== "string")))
    doc.elementos.__construtor = registrar("__construtor", "*", spec, ref.__construtor ?? { itens: [] }, "Formulário inválido preservado no original");
  const conversa = doc.elementos.__conversa;
  if (conversa !== undefined && (!objeto(conversa) || !Array.isArray(conversa.mensagens)))
    doc.elementos.__conversa = registrar("__conversa", "*", conversa, ref.__conversa ?? { mensagens: [] }, "Conversa inválida preservada no original");
  for (const [id, original] of Object.entries(doc.elementos)) {
    if (id.startsWith("__")) continue;
    let el = original;
    if (!objeto(el) || !tipoConhecido(el.tipo)) {
      const antigo = ref[id];
      el = doc.elementos[id] = registrar(id, "*", original, antigo && tipoConhecido(antigo.tipo) ? antigo : {
        ...CATALOGO.caixa.padrao(), tipo: "caixa", nome: `Recuperar ${id}`, x: 20, y: 20,
        largura: 160, altura: 60, recuperacao: { original: copiar(original), motivo: "Tipo de elemento desconhecido" },
      }, "Elemento indisponível: preservado como objeto provisório");
    }
    const padrao = CATALOGO[el.tipo].padrao();
    const validarEstrutura = (obj, base, anterior, prefixo) => {
      for (const [k, v] of Object.entries(base ?? {})) {
        const caminho = prefixo ? `${prefixo}.${k}` : k;
        if (obj[k] === undefined) continue;
        if (objeto(v)) {
          if (!objeto(obj[k])) obj[k] = registrar(id, caminho, obj[k], objeto(anterior?.[k]) ? anterior[k] : v, "Configuração interna inválida");
          validarEstrutura(obj[k], v, anterior?.[k], caminho);
        } else if (typeof v === "number" && (obj[k] === null || !Number.isFinite(Number(obj[k]))))
          obj[k] = registrar(id, caminho, obj[k], typeof anterior?.[k] === "number" && Number.isFinite(anterior[k]) ? anterior[k] : v, "Valor numérico inválido");
      }
    };
    for (const k of ["x", "y", "largura", "altura", "z", "rotacao"]) {
      if (k === "z" || k === "rotacao") { if (el[k] === undefined) continue; }
      if (!Number.isFinite(el[k]) || ((k === "largura" || k === "altura") && el[k] <= 0)) {
        const r = ref[id]?.[k];
        const valor = Number.isFinite(r) && (!['largura', 'altura'].includes(k) || r > 0) ? r : (padrao[k] ?? 0);
        el[k] = registrar(id, k, el[k], valor, "Geometria inválida");
      }
    }
    if (typeof el.nome !== "string") el.nome = registrar(id, "nome", el.nome, ref[id]?.nome ?? CATALOGO[el.tipo].nome, "Nome inválido");
    // Objetos usados diretamente pelos painéis e pelo compilador.
    for (const k of ["estilo", "estados", "layout", "abertura", "acessibilidade", "restricoes", "transicao", "responsivo", "dimensao"])
      if ((el[k] !== undefined && !objeto(el[k])) || (padrao[k] && el[k] === undefined))
        el[k] = registrar(id, k, el[k], objeto(ref[id]?.[k]) ? ref[id][k] : padrao[k] ?? {}, "Configuração ausente ou inválida");
    for (const k of ["estilo", "estados", "layout", "abertura", "acessibilidade", "transicao"]) if (objeto(el[k])) validarEstrutura(el[k], padrao[k], ref[id]?.[k], k);
    if (el.eventos !== undefined && !Array.isArray(el.eventos)) el.eventos = registrar(id, "eventos", el.eventos, Array.isArray(ref[id]?.eventos) ? ref[id].eventos : [], "Lista de eventos inválida");
    if (Array.isArray(el.eventos)) {
      const seguros = el.eventos.filter(ev => objeto(ev) && typeof ev.tipo === "string");
      if (!igual(seguros, el.eventos)) el.eventos = registrar(id, "eventos", el.eventos, seguros, "Eventos incompletos suspensos");
    }
    if (el.codigo !== undefined && (!objeto(el.codigo) || ["html", "css", "js"].some(k => el.codigo[k] !== undefined && typeof el.codigo[k] !== "string")))
      el.codigo = registrar(id, "codigo", el.codigo, ref[id]?.codigo ?? {}, "Código inválido preservado no original");
  }
  // Relações estruturais e comportamentais são verificadas separadamente.
  for (const [id, el] of Object.entries(doc.elementos)) {
    if (id.startsWith("__")) continue;
    if (el.pai !== undefined && el.pai !== null && el.pai !== '') {
      const vistos = new Set([id]);
      let atual = el.pai, invalido = false;
      while (atual) {
        const pai = Object.hasOwn(doc.elementos, atual) ? doc.elementos[atual] : undefined;
        if (vistos.has(atual) || !pai || pai.tipo !== "container") { invalido = true; break; }
        vistos.add(atual); atual = pai.pai;
      }
      if (invalido) { registrar(id, "pai", el.pai, undefined, "Composição órfã ou circular desvinculada"); delete el.pai; }
    }
    for (const ev of el.eventos ?? []) if (ev.alvo && !Object.hasOwn(doc.elementos, ev.alvo) && !ev.suspenso) {
      const antes = copiar(el.eventos);
      ev.suspenso = true;
      registrar(id, "eventos", antes, el.eventos, `Ação suspensa: alvo ${ev.alvo} ausente`);
    }
  }
  return { doc, problemas, valido: problemas.length === 0 };
}

/** Último estado íntegro até o cursor. Nunca usa o futuro de Refazer. */
export function ultimoEstadoValido(projeto) {
  const candidatos = projeto.historico.slice(0, projeto.cursor).reverse().map(e => ({ doc: e.docDepois, evento: e.id, texto: e.pedido }));
  if (projeto.historico.length) candidatos.push({ doc: projeto.historico[0].docAntes, evento: null, texto: "Estado inicial" });
  for (const c of candidatos) { try { if (examinarDocumento(c.doc).valido) return copiar(c); } catch { /* próxima versão */ } }
  return null;
}

/** Diferença sem truncar valores nem omitir ordem, tela ou metadados do projeto. */
export function compararEstados(atual, referencia) {
  const out = [];
  const visitar = (a, b, caminho, id) => {
    if (igual(a, b)) return;
    if (objeto(a) && objeto(b)) {
      for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) visitar(a[k], b[k], caminho ? `${caminho}.${k}` : k, id);
    } else out.push({ id, campo: caminho || "*", atual: copiar(a), anterior: copiar(b) });
  };
  const a = atual?.elementos ?? {}, b = referencia?.elementos ?? {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) visitar(a[id], b[id], "", id);
  const { elementos: _a, ...ra } = atual ?? {}, { elementos: _b, ...rb } = referencia ?? {};
  visitar(ra, rb, "", "__projeto");
  return out;
}

export function normalizarTitulo(texto) {
  const s = String(texto).trim().replace(/\s+/g, " ");
  // Só a mistura irregular de caixa é normalizada; nomes de marca e siglas têm exceção explícita.
  const especiais = { html: "HTML", css: "CSS", javascript: "JavaScript", api: "API", svg: "SVG", json: "JSON", ui: "UI", iphone: "iPhone" };
  return s.split(" ").map((p, i) => {
    const k = p.toLocaleLowerCase("pt-BR");
    if (especiais[k]) return especiais[k];
    if (i && ["de", "da", "do", "das", "dos", "e", "em", "para", "com"].includes(k)) return k;
    return k.charAt(0).toLocaleUpperCase("pt-BR") + k.slice(1);
  }).join(" ");
}
