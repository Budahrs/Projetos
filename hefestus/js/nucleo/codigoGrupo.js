// Código autoral é uma extensão explícita do modelo visual, nunca sobrescrito
// ao trocar de modo. Usa `raiz` para encontrar as peças da instância atual.
export function codigoDosGrupos(elementos) {
  return elementos.filter(e => e.codigo && !e.codigo.suspenso).map(e => ({ id: e.id, nome: e.nome, ...e.codigo }));
}

export function executarCodigoGrupos(grupos) {
  for (const grupo of grupos) {
    if(grupo.isolado)continue; // Já renderizado em iframe pelo compilador.
    const raiz = document.getElementById(grupo.id);
    if (!raiz) continue;
    try {
      if (grupo.html) {
        const conteudo = document.createElement("div");
        conteudo.className = "hf-codigo-conteudo";
        // Conteúdo autoral só é montado na prévia isolada ou no HTML exportado.
        conteudo.innerHTML = grupo.html;
        raiz.prepend(conteudo);
      }
      if (grupo.css) {
        const estilo = document.createElement("style");
        estilo.textContent = `@scope (#${CSS.escape(grupo.id)}) { ${grupo.css} }`;
        document.head.append(estilo);
      }
      if (grupo.js) new Function("raiz", grupo.js).call(raiz, raiz);
    } catch (erro) {
      raiz.dataset.erroCodigo = erro.message;
      raiz.title = `Erro em ${grupo.nome}: ${erro.message}`;
      document.dispatchEvent(new CustomEvent("hefestus:erro", { detail: { id: grupo.id, mensagem: erro.message } }));
      // O erro de um artefato não interrompe os próximos.
    }
  }
}
