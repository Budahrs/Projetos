import { test } from "node:test";
import assert from "node:assert/strict";
import { Projeto, SkillMelhoriaExecucao } from "../js/nucleo/protecao.js";

const AZUL = "#3b82f6";

/** Projeto base: botão azul no canto direito (decisões do usuário) e um card. */
function projetoBase(recalcular?: (d) => void) {
  const p = new Projeto(
    "landing",
    {
      elementos: {
        btn_enviar: { cor: AZUL, posicao: "canto_direito", raio: 8, estilo: { texto: { cor: "#fff", peso: 400 } } },
        btn_cancelar: { cor: "#6b7280" },
        btn_ajuda: { cor: "#6b7280" },
        card: { padding: 16 },
        titulo: { cor: "#111827", tamanho: 32 },
        secao_precos: { visivel: true },
      },
    },
    recalcular
  );
  const m = p.memoria;
  m.registrar("btn_enviar", "cor", AZUL, "usuario", "deixa ele azul");
  m.registrar("btn_enviar", "posicao", "canto_direito", "usuario", "no canto direito");
  m.registrar("btn_enviar", "estilo.texto.cor", "#fff", "usuario", "texto branco");
  m.registrar("btn_enviar", "raio", 8, "agente");
  m.aliases["botão"] = ["btn_enviar", "btn_cancelar", "btn_ajuda"];
  m.aliases["botão de enviar"] = ["btn_enviar"];
  m.aliases["card"] = ["card"];
  m.aliases["seção de preços"] = ["secao_precos"];
  return p;
}

const skill = new SkillMelhoriaExecucao();

test("1. pedido explícito: aplica sem perguntar e undo volta", () => {
  const p = projetoBase();
  const r = skill.executar(
    p,
    { texto: "muda a cor do botão de enviar para vermelho", referencias: ["botão de enviar"], propriedades: ["cor"] },
    d => { d.elementos.btn_enviar.cor = "#ef4444"; }
  );
  assert.equal(r.acao, "aplicado");
  assert.equal(r.pergunta, undefined);
  assert.equal(p.doc.elementos.btn_enviar.cor, "#ef4444");
  assert.equal(p.memoria.protegida("btn_enviar", "cor")?.valor, "#ef4444");
  p.desfazer();
  assert.equal(p.doc.elementos.btn_enviar.cor, AZUL);
  assert.equal(p.memoria.protegida("btn_enviar", "cor")?.valor, AZUL);
});

test("2. regressão no documento é detectada e corrigida sozinha", () => {
  const p = projetoBase();
  const r = skill.executar(
    p,
    { texto: "aumenta o padding do card", referencias: ["card"], propriedades: ["padding"] },
    d => {
      d.elementos.card.padding = 24;
      d.elementos.btn_enviar.posicao = "centro"; // efeito colateral (bug do agente)
    }
  );
  assert.equal(r.acao, "aplicado");
  assert.equal(r.regressoesCorrigidas.length, 1);
  assert.equal(r.regressoesCorrigidas[0].propriedade, "posicao");
  assert.equal(p.doc.elementos.card.padding, 24);
  assert.equal(p.doc.elementos.btn_enviar.posicao, "canto_direito");
});

test("2b. undo depois de correção automática desfaz o pedido inteiro em um passo", () => {
  const p = projetoBase();
  skill.executar(
    p,
    { texto: "aumenta o padding do card", referencias: ["card"], propriedades: ["padding"] },
    d => { d.elementos.card.padding = 24; d.elementos.btn_enviar.posicao = "centro"; }
  );
  assert.equal(p.desfazer(), true);
  assert.equal(p.doc.elementos.card.padding, 16);
  assert.equal(p.doc.elementos.btn_enviar.posicao, "canto_direito");
  assert.equal(p.cursor, 0);
  p.refazer();
  assert.equal(p.doc.elementos.card.padding, 24);
  assert.equal(p.doc.elementos.btn_enviar.posicao, "canto_direito"); // a correção também volta
});

test("2c. propriedade aninhada protegida é restaurada", () => {
  const p = projetoBase();
  const r = skill.executar(
    p,
    { texto: "deixa o texto do botão em negrito", referencias: ["botão de enviar"], propriedades: ["estilo.texto.peso"] },
    d => {
      const t = (d.elementos.btn_enviar.estilo as any).texto;
      t.peso = 700;
      t.cor = "#000"; // regressão aninhada
    }
  );
  assert.equal(r.acao, "aplicado");
  const t = (p.doc.elementos.btn_enviar.estilo as any).texto;
  assert.equal(t.peso, 700);
  assert.equal(t.cor, "#fff");
});

test("3. referência ambígua: pergunta qual, sem aplicar nada", () => {
  const p = projetoBase();
  const aplicar = (d) => { d.elementos.btn_cancelar.cor = "#dc2626"; };
  const r = skill.executar(p, { texto: "muda o botão para vermelho", referencias: ["botão"], propriedades: ["cor"] }, aplicar);
  assert.equal(r.acao, "perguntado");
  assert.deepEqual(r.pergunta!.opcoes.map(o => o.id), ["btn_enviar", "btn_cancelar", "btn_ajuda", "cancelar"]);
  assert.equal(p.doc.elementos.btn_cancelar.cor, "#6b7280");
  const r2 = skill.responder(p, "btn_cancelar");
  assert.equal(r2.acao, "aplicado");
  assert.equal(p.doc.elementos.btn_cancelar.cor, "#dc2626");
});

test("4. pedido amplo: aplica no resto e pergunta só sobre o protegido", () => {
  const p = projetoBase();
  const temaEscuro = (d) => { for (const el of Object.values(d.elementos)) if ("cor" in el) el.cor = "#0f172a"; };
  const r = skill.executar(p, { texto: "aplica tema escuro em tudo", amplo: true, propriedades: ["cor"] }, temaEscuro);
  assert.equal(r.acao, "aplicado_parcial");
  assert.ok(r.pergunta);
  assert.equal(p.doc.elementos.titulo.cor, "#0f172a");
  assert.equal(p.doc.elementos.btn_enviar.cor, AZUL);

  const r2 = skill.responder(p, "aplicar");
  assert.equal(r2.acao, "aplicado");
  assert.equal(p.doc.elementos.btn_enviar.cor, "#0f172a");
});

test("4b. pergunta ignorada não é repetida", () => {
  const p = projetoBase();
  const temaEscuro = (d) => { for (const el of Object.values(d.elementos)) if ("cor" in el) el.cor = "#0f172a"; };
  const pedido = { texto: "aplica tema escuro em tudo", amplo: true, propriedades: ["cor"] };
  skill.executar(p, pedido, temaEscuro);
  // Usuário ignora a pergunta e faz outro pedido
  skill.executar(p, { texto: "aumenta o padding do card", referencias: ["card"], propriedades: ["padding"] }, d => { d.elementos.card.padding = 20; });
  assert.ok(p.perguntasIgnoradas.size === 1);
  const r = skill.executar(p, pedido, temaEscuro);
  assert.equal(r.acao, "aplicado");
  assert.equal(r.pergunta, undefined);
  assert.match(r.avisos.join(" "), /ignorada/);
  assert.equal(p.doc.elementos.btn_enviar.cor, AZUL);
});

test("5. ajuste em decisão implícita: aplica sem perguntar e vira protegida", () => {
  const p = projetoBase();
  const r = skill.executar(
    p,
    { texto: "deixa o botão de enviar mais arredondado", referencias: ["botão de enviar"], propriedades: ["raio"] },
    d => { d.elementos.btn_enviar.raio = 16; }
  );
  assert.equal(r.acao, "aplicado");
  assert.equal(r.pergunta, undefined);
  const dec = p.memoria.ativas("btn_enviar", "raio")[0];
  assert.equal(dec.valor, 16);
  assert.equal(dec.status, "protegida");
});

test("5b. mudança fora do escopo em algo não protegido é permitida e registrada como implícita", () => {
  const p = projetoBase();
  skill.executar(
    p,
    { texto: "aumenta o padding do card", referencias: ["card"], propriedades: ["padding"] },
    d => { d.elementos.card.padding = 24; d.elementos.titulo.tamanho = 28; }
  );
  assert.equal(p.doc.elementos.titulo.tamanho, 28);
  assert.equal(p.memoria.ativas("titulo", "tamanho")[0].status, "implicita");
});

test("6. remoção explícita: aplica, avisa undo, e undo traz de volta", () => {
  const p = projetoBase();
  p.memoria.registrar("secao_precos", "visivel", true, "usuario");
  const r = skill.executar(
    p,
    { texto: "apaga a seção de preços", referencias: ["seção de preços"], propriedades: [], tipo: "remover" },
    d => { delete d.elementos.secao_precos; }
  );
  assert.equal(r.acao, "aplicado");
  assert.equal(r.pergunta, undefined);
  assert.match(r.avisos.join(" "), /desfazer/);
  assert.equal(p.doc.elementos.secao_precos, undefined);
  assert.equal(p.memoria.ativas("secao_precos").length, 0);
  p.desfazer();
  assert.ok(p.doc.elementos.secao_precos);
});

test("6b. elemento protegido que some sem ter sido pedido é restaurado", () => {
  const p = projetoBase();
  const r = skill.executar(
    p,
    { texto: "aumenta o padding do card", referencias: ["card"], propriedades: ["padding"] },
    d => { d.elementos.card.padding = 24; delete d.elementos.btn_enviar; }
  );
  assert.equal(r.acao, "aplicado");
  assert.deepEqual(p.doc.elementos.btn_enviar.posicao, "canto_direito");
  assert.equal(p.doc.elementos.btn_enviar.raio, 8);
});

test("7. correção falha 2 vezes: nada é aplicado e o conflito vira pergunta", () => {
  // Restrição de layout: padding grande no card empurra o botão para o centro.
  const layout = (d) => {
    if ((d.elementos.card.padding as number) > 20) d.elementos.btn_enviar.posicao = "centro";
  };
  const p = projetoBase(layout);
  const aplicar = (d) => { d.elementos.card.padding = 24; };
  const r = skill.executar(p, { texto: "aumenta o padding do card", referencias: ["card"], propriedades: ["padding"] }, aplicar);
  assert.equal(r.acao, "perguntado");
  assert.match(r.pergunta!.contexto, /btn_enviar\.posicao/);
  assert.equal(p.doc.elementos.card.padding, 16); // rollback
  assert.equal(p.doc.elementos.btn_enviar.posicao, "canto_direito");
  assert.equal(p.historico.length, 0);

  const r2 = skill.responder(p, "aceitar");
  assert.equal(r2.acao, "aplicado");
  assert.equal(p.doc.elementos.card.padding, 24);
  assert.equal(p.doc.elementos.btn_enviar.posicao, "centro");
  assert.equal(p.memoria.protegida("btn_enviar", "posicao")?.valor, "centro");
});

test("8. memória por projeto: decisão no A não afeta o B", () => {
  const a = projetoBase();
  const b = projetoBase();
  skill.executar(a, { texto: "botão vermelho", referencias: ["botão de enviar"], propriedades: ["cor"] }, d => { d.elementos.btn_enviar.cor = "#ef4444"; });
  assert.equal(a.memoria.protegida("btn_enviar", "cor")?.valor, "#ef4444");
  assert.equal(b.memoria.protegida("btn_enviar", "cor")?.valor, AZUL);
  assert.equal(b.doc.elementos.btn_enviar.cor, AZUL);
});

test("extra: ação irreversível sempre pede confirmação", () => {
  const p = projetoBase();
  let publicou = false;
  const r = skill.executar(p, { texto: "publica o site", propriedades: [], irreversivel: true, alvos: [] }, () => { publicou = true; });
  assert.equal(r.acao, "perguntado");
  assert.equal(publicou, false);
  skill.responder(p, "confirmar");
  assert.equal(publicou, true);
});

test("extra: pedido contraditório pergunta qual leitura prevalece", () => {
  const p = projetoBase();
  const r = skill.executar(
    p,
    {
      texto: "deixa o card maior e mais compacto",
      propriedades: ["padding"],
      referencias: ["card"],
      alternativas: [
        { rotulo: "Maior (padding 24)", pedido: { texto: "card maior", referencias: ["card"], propriedades: ["padding"] } },
        { rotulo: "Mais compacto (padding 8)", pedido: { texto: "card compacto", referencias: ["card"], propriedades: ["padding"] } },
      ],
    },
    d => { d.elementos.card.padding = 8; }
  );
  assert.equal(r.acao, "perguntado");
  assert.equal(r.pergunta!.opcoes.length, 3);
  skill.responder(p, "alt_1");
  assert.equal(p.doc.elementos.card.padding, 8);
});
