import { REGRAS_MENUS } from "../nucleo/expertiseMenus.js";
// Agente auxiliar do Hefestus.
// Com o Claude disponível (página publicada no claude.ai), ele conversa e age pelas
// ferramentas; sem ele, o interpretador local cobre os pedidos comuns.
// Todo pedido vira UM turno: as mudanças e a conversa voltam juntas no Ctrl+Z.
import { criarFerramentas, resumoDocumento } from "./ferramentas.js";
import { interpretar } from "./local.js";

export const REGRAS = `Você é o agente do Hefestus, um editor visual de interfaces. O usuário fala português do Brasil.

O que você faz: cria e ajusta elementos visuais de interface (botões, caixas, textos, campos, toggles, menus, modais, notificações), seus estados (hover, pressionado), transições, eventos e ações visuais entre elementos (abrir, fechar, alternar, destacar).
O que você não faz: lógica de negócio, chamadas de API, dados, autenticação. Um evento só emite um sinal com nome; quem usa a interface decide o que fazer. Se pedirem algo fora disso, explique em uma frase e ofereça a parte visual.

Aplicativos Windows: use preparar_aplicativo_windows quando pedirem exportar como programa ou instalador. O usuário escolhe nome, versão e ícone. O ZIP é material de geração; nunca diga que o EXE já foi compilado. Ícones automáticos seguem o significado do comando e escolhas manuais devem ser preservadas.

Conhecimento de menus:
HTML colado: use importar_html para recriar páginas ou trechos como componentes isolados com código editável. Preserve o HTML, CSS e JavaScript recebidos. A análise identifica estrutura e referências, sem executar o código. Não afirme que cada tag virou um objeto nativo nem que links ilustrativos implementam serviços.
${REGRAS_MENUS.map(r => "- " + r.regra).join("\n")}
- Consulte planejar_menu antes de criar menus com requisitos adaptativos. Use auditar_interface depois de criar e corrija somente problemas relacionados ao pedido.

Como agir:
- Use as ferramentas para mudar o documento. Nunca escreva JSON ou código para o usuário colar.
- O estado atual do documento vem junto com cada pedido. Use os ids dele nas ferramentas e os nomes ao falar com o usuário.
- Coordenadas em px a partir do canto superior esquerdo da tela; mantenha tudo dentro da tela e use espaçamentos múltiplos de 8.
- Mude só o que foi pedido. O editor protege o que o usuário definiu antes e desfaz mudanças não pedidas.
- Se o pedido for ambíguo (por exemplo, há vários botões e não dá para saber qual), pergunte em uma frase curta em vez de adivinhar.
- Se uma ferramenta devolver pergunta_pendente, pare e diga ao usuário que ele precisa responder a pergunta na tela.
- Se uma ferramenta devolver erro, corrija a entrada e tente de novo uma vez; se não der, explique.
- Menus, boxes do botão direito, faixas de opções (abas, grupos, comandos) e containers com comportamento: crie e edite pelo FORMULÁRIO (construtor_listar, construtor_criar, construtor_editar, construtor_adicionar, construtor_remover). Assim o usuário continua editando tudo no modo híbrido. Para ligar um menu ao botão direito de um container, use construtor_editar com comportamento.menuContexto = id do menu. Itens criados pelo formulário não se editam com as ferramentas de elementos (seriam regenerados); use as do formulário.
- "Selecionado" é o elemento em que o usuário clicou; "ele", "isso" e "esse" normalmente se referem a ele.

Resposta final: uma ou duas frases curtas em português dizendo o que mudou, sem listas nem markdown.`;

const DESFAZER = /^\s*(desfaz|desfazer|desfa[cç]a|volta|voltar)\b/i;
const REFAZER = /^\s*(refaz|refazer|refa[cç]a)\b/i;

export class Agente {
  constructor(n, app) {
    this.n = n;
    this.app = app;
    this.ocupado = false;
    this.ultimo = null;
    this.claudeRecusado = false;
    // null fora do claude.ai (arquivo local) ou quando a página não declara o recurso
    this._sample = Promise.resolve(globalThis.claude?.use?.("sample") ?? null).catch(() => null);
  }

  /** "claude" | "local", decidido quando o recurso responde. */
  async modo() {
    if (this.claudeRecusado) return "local";
    const s = await this._sample;
    if (!s) return "local";
    try {
      const lim = await s.limits();
      return lim?.tools ? "claude" : "local";
    } catch {
      return "local";
    }
  }

  /** Mensagens anteriores no formato de turnos (as 12 últimas). */
  turnos() {
    return this.n.conversa().slice(-12).map(m => ({
      role: m.papel === "usuario" ? "user" : "assistant",
      content: m.papel === "usuario" ? m.texto : [m.texto, ...(m.acoes?.length ? [`(Ações feitas: ${m.acoes.join("; ")})`] : [])].join("\n"),
    })).filter(t => t.content.trim());
  }

  /**
   * Envia um pedido. callbacks: { aoTexto(texto), aoAcao(linha), aoModo(modo) }.
   * Devolve { resposta, acoes, via }.
   */
  async enviar(pedido, opcoes = {}) {
    const rapido = this.comandoRapido(pedido.trim());
    if (rapido?.resposta) return { resposta: rapido.resposta, acoes: [], via: "local" };
    return this.enviarTexto(rapido?.texto ?? pedido, opcoes);
  }

  /** Comandos rápidos "/auditar", "/react"… viram o pedido em português correspondente. */
  comandoRapido(t) {
    if (!t.startsWith("/")) return null;
    const [cmd, ...resto] = t.slice(1).trim().split(/\s+/);
    const arg = resto.join(" ");
    const sem = cmd.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const mapa = {
      auditar: "audita a interface", corrigir: "corrige a acessibilidade", docs: "gera a documentacao dos sinais",
      react: "exporta react", vue: "exporta vue", webcomponent: "exporta web component", tema: "exporta tokens de tema", storybook: "exporta storybook", testes: "exporta testes visuais",
      explicar: `explica ${arg}`.trim(), desfazer: "desfaz", refazer: "refaz",
      unir: "une as formas", subtrair: "subtrai as formas", intersecao: "interseccao das formas", vetor: "converte em vetor",
    };
    if (mapa[sem]) return { texto: mapa[sem] };
    if (sem === "ajuda" || sem === "?") return { resposta: `Comandos rápidos: ${Object.keys(mapa).map(k => "/" + k).join("  ")}. Qualquer outra coisa, escreva normalmente.` };
    // "/botao Enviar", "/menu suspenso": o resto é um pedido de criação
    return { texto: `cria ${sem} ${arg}`.trim() };
  }

  async enviarTexto(pedido, { signal, rapido = true, aoTexto, aoAcao, aoModo } = {}) {
    const texto = pedido.trim();
    if (!texto || this.ocupado) return null;

    // desfazer/refazer não são turnos: navegam no histórico
    if (DESFAZER.test(texto) && texto.split(/\s+/).length <= 3) {
      const ok = this.n.desfazer();
      return { resposta: ok ? "Desfeito." : "Nada para desfazer.", acoes: [], via: "local", navegou: true };
    }
    if (REFAZER.test(texto) && texto.split(/\s+/).length <= 3) {
      const ok = this.n.refazer();
      return { resposta: ok ? "Refeito." : "Nada para refazer.", acoes: [], via: "local", navegou: true };
    }

    this.ocupado = true;
    const anteriores = this.turnos();
    let saida = { resposta: "", acoes: [], via: "local" };
    try {
      await this.n.turno(texto, async () => {
        this.n.anotar("usuario", texto);
        const acoes = [];
        const registrar = linha => { acoes.push(linha); aoAcao?.(linha); };
        const ferramentas = criarFerramentas(this.n, this.app, registrar).map(f => ({
          ...f,
          execute: (entrada, ctx) => {
            if (ctx?.signal?.aborted) throw new Error("cancelado");
            if (this.n.pendenteCompleto()) throw new Error("há uma pergunta aberta na tela; peça ao usuário para responder antes");
            const r = f.execute(entrada);
            if (r?.id) this.ultimo = r.id;
            else if (entrada?.id && entrada.id !== "__canvas") this.ultimo = String(entrada.id);
            return r;
          },
        }));

        let via = await this.modo();
        aoModo?.(via);
        let resposta = "";
        if (via === "claude") {
          try {
            resposta = await this.perguntarClaude(texto, anteriores, ferramentas, { signal, rapido, aoTexto });
          } catch (e) {
            const code = e?.code ?? "upstream_error";
            if (code === "cancelled") resposta = e.text ? `${e.text}\n(Parado.)` : "Parado.";
            else if (["not_granted", "sampling_disabled", "tools_unavailable", "not_declared", "capability_disabled", "capability_removed"].includes(code)) {
              this.claudeRecusado = true;
              via = "local";
              aoModo?.(via);
            } else if (code === "rate_limited") resposta = "O Claude está ocupado ou o limite de uso foi atingido. Tente de novo em instantes.";
            else if (code === "session_expired") resposta = "Sua sessão expirou. Entre de novo no claude.ai e repita o pedido.";
            else if (code === "refused") resposta = "O Claude recusou esse pedido. Tente descrever de outro jeito.";
            else resposta = (e.text ? `${e.text}\n` : "") + "A conexão com o Claude falhou. Tente de novo.";
          }
        }
        if (via === "local") resposta = this.executarLocal(texto, ferramentas, acoes);

        resposta = limpar(resposta) || (acoes.length ? "Pronto." : "Não fiz nenhuma mudança.");
        this.n.anotar("agente", resposta, { acoes, via });
        saida = { resposta, acoes, via };
      });
    } finally {
      this.ocupado = false;
    }
    return saida;
  }

  async perguntarClaude(texto, anteriores, ferramentas, { signal, rapido, aoTexto }) {
    const sample = await this._sample;
    const estado = JSON.stringify(resumoDocumento(this.n));
    const turnos = [
      { role: "user", content: REGRAS },
      ...anteriores,
      { role: "user", content: `Estado atual do documento:\n${estado}\n\nPedido: ${texto}` },
    ];
    const r = await sample(turnos, {
      tools: ferramentas,
      signal,
      modelTier: rapido ? "quick" : "default",
      onText: ({ text }) => aoTexto?.(limpar(text)),
    });
    return r.truncated ? `${r.text}\n(Resposta cortada.)` : r.text;
  }

  executarLocal(texto, ferramentas, acoes) {
    const plano = interpretar(texto, this.n, { ultimo: this.ultimo });
    const porNome = Object.fromEntries(ferramentas.map(f => [f.name, f]));
    const erros = [];
    let pergunta = false;
    for (const a of plano.acoes) {
      try {
        const r = porNome[a.nome].execute(a.entrada, {});
        if (r?.pergunta_pendente) { pergunta = true; break; }
      } catch (e) {
        erros.push(e.message);
      }
    }
    if (plano.resposta) return plano.resposta;
    if (erros.length) return `Não consegui: ${erros.join("; ")}.`;
    if (pergunta) return "Fiz o que podia. Responda a pergunta na tela sobre o que você tinha definido antes.";
    return acoes.length ? "Pronto." : "Não fiz nenhuma mudança.";
  }
}

/** Tira marcações de markdown simples da resposta. */
function limpar(t) {
  return String(t ?? "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").trim();
}

