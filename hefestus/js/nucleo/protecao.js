// Skill: Melhoria na Execução — v2.1
// Aplica o que foi pedido, protege o que não foi e verifica o resultado
// no DOCUMENTO REAL (não na memória) antes de entregar.
//
// A interpretação de linguagem natural é trabalho do agente (LLM): esta skill
// recebe o pedido já estruturado (referências, propriedades, tipo).
// ============================================================
// UTILITÁRIOS
// ============================================================
const SEP = "::";
const chave = (alvo, prop) => `${alvo}${SEP}${prop}`;
const separar = (k) => {
    const i = k.indexOf(SEP);
    return { alvo: k.slice(0, i), propriedade: k.slice(i + SEP.length) };
};
export function clonar(v) {
    return v === undefined ? v : structuredClone(v);
}
export function iguais(a, b) {
    if (a === b)
        return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null)
        return false;
    if (Array.isArray(a) !== Array.isArray(b))
        return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length)
        return false;
    return ka.every(k => iguais(a[k], b[k]));
}
/** Achata objetos aninhados em caminhos: { estilo: { cor } } → "estilo.cor". Arrays são folhas. */
function achatar(obj, prefixo = "", saida = new Map()) {
    for (const [k, v] of Object.entries(obj)) {
        const caminho = prefixo ? `${prefixo}.${k}` : k;
        if (v !== null && typeof v === "object" && !Array.isArray(v)) {
            achatar(v, caminho, saida);
        }
        else {
            saida.set(caminho, v);
        }
    }
    return saida;
}
function definir(obj, caminho, valor) {
    const partes = caminho.split(".");
    let atual = obj;
    for (const p of partes.slice(0, -1)) {
        if (typeof atual[p] !== "object" || atual[p] === null)
            atual[p] = {};
        atual = atual[p];
    }
    const ultima = partes[partes.length - 1];
    if (valor === undefined)
        delete atual[ultima];
    else
        atual[ultima] = clonar(valor);
}
const cobre = (padrao, prop) => padrao === "*" || padrao === prop || prop.startsWith(padrao + ".");
// ============================================================
// MEMÓRIA POR PROJETO
// ============================================================
export class Memoria {
    decisoes = [];
    aliases = {};
    seq = 0;
    ativas(alvo, prop) {
        return this.decisoes.filter(d => (d.status === "protegida" || d.status === "implicita") &&
            (alvo === undefined || d.alvo === alvo) &&
            (prop === undefined || d.propriedade === prop));
    }
    protegida(alvo, prop) {
        return this.ativas(alvo).find(d => d.status === "protegida" && (cobre(d.propriedade, prop) || cobre(prop, d.propriedade)));
    }
    indiceAtivas() {
        const indice = new Map();
        for (const d of this.decisoes) {
            if (d.status !== "protegida" && d.status !== "implicita") continue;
            const chave = JSON.stringify([d.alvo, d.propriedade]);
            if (!indice.has(chave)) indice.set(chave, d);
        }
        return indice;
    }
    registrar(alvo, propriedade, valor, origem, pedido, indice) {
        const chave = JSON.stringify([alvo, propriedade]);
        const anterior = indice ? indice.get(chave) : this.ativas(alvo, propriedade)[0];
        const nova = {
            id: `dec_${String(++this.seq).padStart(3, "0")}`,
            timestamp: new Date().toISOString(),
            alvo,
            propriedade,
            valor: clonar(valor),
            origem,
            status: origem === "usuario" ? "protegida" : "implicita",
            pedidoOriginal: pedido,
        };
        if (anterior) {
            // Mudança do agente não rebaixa decisão do usuário: ela fica protegida.
            if (anterior.status === "protegida" && origem === "agente")
                return anterior;
            anterior.status = "substituida";
            anterior.substituidaPor = nova.id;
            nova.substitui = anterior.id;
        }
        this.decisoes.push(nova);
        indice?.set(chave, nova);
        return nova;
    }
    /** Torna protegida uma decisão implícita aprovada pelo usuário ("gostei, mantém"). */
    promover(id) {
        const d = this.decisoes.find(x => x.id === id);
        if (d && d.status === "implicita") {
            d.status = "protegida";
            d.origem = "usuario";
        }
    }
    removerElemento(alvo) {
        for (const d of this.ativas(alvo))
            d.status = "removida";
    }
    /** Resolve uma referência. Mais de um resultado = ambíguo; nenhum = não encontrado. */
    resolver(ref, doc) {
        if (this.aliases[ref])
            return this.aliases[ref].filter(id => id in doc.elementos);
        return ref in doc.elementos ? [ref] : [];
    }
}
// ============================================================
// PROJETO (estado + memória + histórico, isolado por projeto)
// ============================================================
export class Projeto {
    id;
    doc;
    memoria = new Memoria();
    historico = [];
    cursor = 0;
    pendente;
    perguntasIgnoradas = new Set();
    recalcular;
    seqEvento = 0;
    /** Variações guardadas: cada uma é um caminho completo de eventos (os eventos são compartilhados, não copiados). */
    ramos = [];
    seqRamo = 0;
    constructor(id, doc, recalcular = () => { }) {
        this.id = id;
        this.doc = doc;
        this.recalcular = recalcular;
    }
    novoEventoId() {
        return `evt_${String(++this.seqEvento).padStart(4, "0")}`;
    }
    /** Grava um evento atômico. Uma ação nova descarta o "refazer". */
    gravar(ev) {
        // o futuro que seria descartado vira uma variação, em vez de se perder
        if (this.cursor < this.historico.length)
            this.guardarRamo(undefined, this.historico.slice());
        this.historico = this.historico.slice(0, this.cursor);
        this.historico.push(ev);
        this.cursor = this.historico.length;
    }
    /** Guarda um caminho de eventos como variação (sem repetir uma que termina no mesmo evento). */
    guardarRamo(nome, eventos = this.historico.slice()) {
        if (!eventos.length)
            return null;
        const fim = eventos[eventos.length - 1].id;
        this.ramos = this.ramos.filter(r => r.eventos[r.eventos.length - 1].id !== fim);
        const ramo = { id: `ramo_${++this.seqRamo}`, nome: nome ?? `Variação ${this.seqRamo}`, criadoEm: Date.now(), eventos };
        this.ramos.push(ramo);
        if (this.ramos.length > 8)
            this.ramos.shift();
        return ramo;
    }
    /** Troca a linha atual pela variação; a linha atual (se tiver conteúdo) vira outra variação. */
    trocarRamo(id) {
        const r = this.ramos.find(x => x.id === id);
        if (!r)
            return false;
        this.ramos = this.ramos.filter(x => x !== r);
        this.guardarRamo(undefined, this.historico.slice());
        this.historico = r.eventos.slice();
        this.cursor = this.historico.length;
        const ev = this.historico[this.cursor - 1];
        this.doc = clonar(ev.docDepois);
        this.memoria.decisoes = clonar(ev.memDepois);
        this.pendente = undefined;
        return true;
    }
    removerRamo(id) {
        this.ramos = this.ramos.filter(x => x.id !== id);
    }
    renomearRamo(id, nome) {
        const r = this.ramos.find(x => x.id === id);
        if (r && String(nome).trim())
            r.nome = String(nome).trim().slice(0, 40);
    }
    /** Documento no ponto `indice` do caminho dado (0 = antes do primeiro evento). */
    docEm(eventos, indice) {
        if (!eventos.length)
            return this.doc;
        return indice <= 0 ? eventos[0].docAntes : eventos[Math.min(indice, eventos.length) - 1].docDepois;
    }
    /** Desfaz o pedido inteiro, inclusive as correções automáticas feitas nele. */
    desfazer() {
        if (this.cursor === 0)
            return false;
        const ev = this.historico[this.cursor - 1];
        this.doc = clonar(ev.docAntes);
        this.memoria.decisoes = clonar(ev.memAntes);
        this.cursor--;
        return true;
    }
    refazer() {
        if (this.cursor === this.historico.length)
            return false;
        const ev = this.historico[this.cursor];
        this.doc = clonar(ev.docDepois);
        this.memoria.decisoes = clonar(ev.memDepois);
        this.cursor++;
        return true;
    }
}
// ============================================================
// SKILL
// ============================================================
export class SkillMelhoriaExecucao {
    id = "melhoria_execucao";
    versao = "2.1.0";
    tentativasCorrecao = 2;
    /** Snapshot do DOCUMENTO REAL, achatado em alvo::propriedade. */
    snapshot(doc) {
        const mapa = new Map();
        for (const [id, el] of Object.entries(doc.elementos)) {
            for (const [prop, v] of achatar(el))
                mapa.set(chave(id, prop), v);
        }
        return mapa;
    }
    noEscopo(escopo, alvo, prop, excluidos = []) {
        return (escopo.some(i => i.alvo === alvo && cobre(i.propriedade, prop)) &&
            !excluidos.some(e => e.alvo === alvo && (cobre(e.propriedade, prop) || cobre(prop, e.propriedade))));
    }
    diff(antes, depois, escopo, excluidos = []) {
        const difs = [];
        for (const k of new Set([...antes.keys(), ...depois.keys()])) {
            const a = antes.get(k);
            const d = depois.get(k);
            if (!iguais(a, d)) {
                const { alvo, propriedade } = separar(k);
                difs.push({ alvo, propriedade, antes: a, depois: d, noEscopo: this.noEscopo(escopo, alvo, propriedade, excluidos) });
            }
        }
        return difs;
    }
    // ----------------------------------------------------------
    // ENTRADA PRINCIPAL
    // ----------------------------------------------------------
    executar(projeto, pedido, aplicar) {
        const avisos = [];
        // Um pedido novo com pergunta em aberto = pergunta ignorada. Registra para não repetir.
        if (projeto.pendente) {
            projeto.perguntasIgnoradas.add(projeto.pendente.pergunta.chave);
            projeto.pendente = undefined;
        }
        // 1. Resolver alvos
        let alvos;
        if (pedido.alvos)
            alvos = pedido.alvos;
        else if (pedido.amplo)
            alvos = Object.keys(projeto.doc.elementos);
        else {
            alvos = [];
            for (const ref of pedido.referencias ?? []) {
                const candidatos = projeto.memoria.resolver(ref, projeto.doc);
                if (candidatos.length !== 1) {
                    const opcoes = (candidatos.length ? candidatos : Object.keys(projeto.doc.elementos)).map(id => ({ id, rotulo: id }));
                    return this.perguntar(projeto, "ambigua", pedido, aplicar, [], {
                        chave: `ambigua:${ref}`,
                        contexto: candidatos.length
                            ? `"${ref}" pode ser ${candidatos.length} elementos.`
                            : `Não encontrei "${ref}".`,
                        pergunta: "Qual deles?",
                        opcoes: [...opcoes, { id: "cancelar", rotulo: "Cancelar" }],
                        padrao: "cancelar",
                    });
                }
                alvos.push(candidatos[0]);
            }
        }
        // 2. Situações que exigem pergunta ANTES de aplicar
        if (pedido.irreversivel) {
            return this.perguntar(projeto, "confirmar", pedido, aplicar, [], {
                chave: `irreversivel:${pedido.texto}`,
                contexto: `"${pedido.texto}" não pode ser desfeito.`,
                pergunta: "Confirma?",
                opcoes: [{ id: "cancelar", rotulo: "Cancelar (recomendado)" }, { id: "confirmar", rotulo: "Confirmar" }],
                padrao: "cancelar",
            });
        }
        if (pedido.alternativas?.length) {
            return this.perguntar(projeto, "contraditoria", pedido, aplicar, [], {
                chave: `contraditoria:${pedido.texto}`,
                contexto: `"${pedido.texto}" tem leituras que se contradizem.`,
                pergunta: "Qual prevalece?",
                opcoes: [
                    ...pedido.alternativas.map((a, i) => ({ id: `alt_${i}`, rotulo: a.rotulo })),
                    { id: "cancelar", rotulo: "Cancelar" },
                ],
                padrao: "cancelar",
            });
        }
        // 3. Escopo
        const props = pedido.tipo === "remover" ? ["*"] : pedido.propriedades;
        let escopo = alvos.flatMap(alvo => props.map(propriedade => ({ alvo, propriedade })));
        // 4. Pedido amplo: decisões protegidas que ele atinge sem citar ficam FORA do escopo.
        //    Se o pedido de fato mudar alguma delas, a verificação restaura e vira conflito.
        let excluidos = [];
        if (pedido.amplo) {
            excluidos = projeto.memoria
                .ativas()
                .filter(d => d.status === "protegida" && escopo.some(i => i.alvo === d.alvo && cobre(i.propriedade, d.propriedade)))
                .map(d => ({ alvo: d.alvo, propriedade: d.propriedade }));
        }
        escopo.push(...(pedido.escopoExtra ?? []));
        // 5–8. Transação: aplicar, verificar, corrigir, registrar
        const r = this.transacao(projeto, pedido, aplicar, escopo, excluidos);
        if (r.acao !== "aplicado")
            return r;
        r.avisos.push(...avisos);
        // Só é conflito o protegido que o pedido realmente tentou mudar.
        const ehExcluido = (d) => excluidos.some(e => e.alvo === d.alvo && cobre(e.propriedade, d.propriedade));
        const conflitos = r.regressoesCorrigidas
            .filter(ehExcluido)
            .map(d => ({ alvo: d.alvo, propriedade: d.propriedade }));
        r.regressoesCorrigidas = r.regressoesCorrigidas.filter(d => !ehExcluido(d));
        if (pedido.tipo === "remover")
            r.avisos.push("Removido. Dá para desfazer.");
        if (conflitos.length) {
            const chaveP = `conflito:${conflitos.map(c => chave(c.alvo, c.propriedade)).sort().join(",")}`;
            if (projeto.perguntasIgnoradas.has(chaveP)) {
                r.avisos.push(`Mantive ${conflitos.map(c => c.alvo).join(", ")} como estava (pergunta anterior ignorada).`);
                return r;
            }
            const lista = conflitos.map(c => `${c.alvo}.${c.propriedade}`).join(", ");
            const p = this.perguntar(projeto, "conflito", { ...pedido, amplo: false }, aplicar, conflitos, {
                chave: chaveP,
                contexto: `Apliquei o resto. ${lista} foi definido por você antes.`,
                pergunta: "Também deve mudar?",
                opcoes: [{ id: "manter", rotulo: "Manter (recomendado)" }, { id: "aplicar", rotulo: "Mudar também" }],
                padrao: "manter",
            });
            return { ...r, acao: "aplicado_parcial", pergunta: p.pergunta };
        }
        return r;
    }
    // ----------------------------------------------------------
    // TRANSAÇÃO ATÔMICA
    // ----------------------------------------------------------
    transacao(projeto, pedido, aplicar, escopo, excluidos = []) {
        const docAntes = clonar(projeto.doc);
        const memAntes = clonar(projeto.memoria.decisoes);
        const antes = this.snapshot(projeto.doc);
        aplicar(projeto.doc);
        projeto.recalcular(projeto.doc);
        let difs = this.diff(antes, this.snapshot(projeto.doc), escopo, excluidos);
        const corrigidas = [];
        const regressoes = (ds) => ds.filter(d => !d.noEscopo && projeto.memoria.protegida(d.alvo, d.propriedade));
        for (let t = 0; t < this.tentativasCorrecao; t++) {
            const atuais = regressoes(difs);
            if (!atuais.length)
                break;
            for (const r of atuais) {
                if (!projeto.doc.elementos[r.alvo])
                    projeto.doc.elementos[r.alvo] = clonar(docAntes.elementos[r.alvo]);
                else
                    definir(projeto.doc.elementos[r.alvo], r.propriedade, r.antes);
            }
            projeto.recalcular(projeto.doc);
            difs = this.diff(antes, this.snapshot(projeto.doc), escopo, excluidos);
            const restantes = regressoes(difs);
            for (const r of atuais) {
                if (!restantes.some(x => x.alvo === r.alvo && x.propriedade === r.propriedade) && !corrigidas.includes(r))
                    corrigidas.push(r);
            }
        }
        const naoCorrigidas = regressoes(difs);
        if (naoCorrigidas.length) {
            // Nada de regressão silenciosa: desfaz o pedido inteiro e pergunta.
            projeto.doc = docAntes;
            projeto.memoria.decisoes = memAntes;
            const lista = naoCorrigidas.map(d => `${d.alvo}.${d.propriedade}`).join(", ");
            const extra = naoCorrigidas.map(d => ({ alvo: d.alvo, propriedade: d.propriedade }));
            return this.perguntar(projeto, "falha_correcao", { ...pedido, escopoExtra: [...(pedido.escopoExtra ?? []), ...extra] }, aplicar, extra, {
                chave: `falha:${lista}`,
                contexto: `"${pedido.texto}" altera ${lista}, que você definiu, e não consegui evitar. Nada foi aplicado.`,
                pergunta: "Como seguir?",
                opcoes: [
                    { id: "cancelar", rotulo: "Não aplicar (recomendado)" },
                    { id: "aceitar", rotulo: "Aplicar e aceitar a mudança" },
                ],
                padrao: "cancelar",
            });
        }
        // O índice é local a esta transação: undo e importação não deixam caches antigos.
        const indiceRegistro = projeto.memoria.indiceAtivas();
        // Registrar
        const removidos = new Set();
        for (const d of difs) {
            if (d.noEscopo && !projeto.doc.elementos[d.alvo]) {
                removidos.add(d.alvo);
                continue;
            }
            if (d.noEscopo)
                projeto.memoria.registrar(d.alvo, d.propriedade, d.depois, "usuario", pedido.texto, indiceRegistro);
            else
                projeto.memoria.registrar(d.alvo, d.propriedade, d.depois, "agente", pedido.texto, indiceRegistro);
        }
        for (const alvo of removidos)
            projeto.memoria.removerElemento(alvo);
        const id = projeto.novoEventoId();
        projeto.gravar({
            id,
            pedido: pedido.texto,
            docAntes,
            docDepois: clonar(projeto.doc),
            memAntes,
            memDepois: clonar(projeto.memoria.decisoes),
        });
        return { acao: "aplicado", evento: id, regressoesCorrigidas: corrigidas, avisos: [] };
    }
    // ----------------------------------------------------------
    // PERGUNTAS
    // ----------------------------------------------------------
    perguntar(projeto, tipo, pedido, aplicar, envolvidos, pergunta) {
        projeto.pendente = { tipo, pergunta, pedido, aplicar, envolvidos };
        return { acao: "perguntado", pergunta, regressoesCorrigidas: [], avisos: [] };
    }
    /** Responde a pergunta em aberto do projeto. */
    responder(projeto, opcaoId) {
        const p = projeto.pendente;
        if (!p)
            throw new Error("Não há pergunta em aberto.");
        projeto.pendente = undefined;
        if (opcaoId === "cancelar" || opcaoId === "manter") {
            return { acao: "cancelado", regressoesCorrigidas: [], avisos: [] };
        }
        switch (p.tipo) {
            case "ambigua":
                return this.executar(projeto, { ...p.pedido, alvos: [opcaoId] }, p.aplicar);
            case "confirmar":
                return this.executar(projeto, { ...p.pedido, irreversivel: false }, p.aplicar);
            case "contraditoria": {
                const i = Number(opcaoId.replace("alt_", ""));
                const alt = p.pedido.alternativas?.[i];
                if (!alt)
                    throw new Error(`Opção inválida: ${opcaoId}`);
                return this.executar(projeto, alt.pedido, p.aplicar);
            }
            case "conflito":
                return this.executar(projeto, { ...p.pedido, alvos: p.envolvidos.map(e => e.alvo), amplo: false }, p.aplicar);
            case "falha_correcao":
                return this.executar(projeto, p.pedido, p.aplicar);
        }
    }
}
