// Ponte com o motor nativo (janela Tauri). No navegador, nada aqui é usado.
// Os comandos ficam em src-tauri/src/lib.rs.

/** true quando o Hefestus roda na janela própria (Tauri). */
export function emJanelaNativa() {
  return typeof globalThis.__TAURI_INTERNALS__?.invoke === "function";
}

function chamar(comando, args) {
  return globalThis.__TAURI_INTERNALS__.invoke(comando, args);
}

/** Mostra o diálogo "Abrir" do Windows. Devolve { caminho, conteudo } ou null se cancelar. */
export function abrirComDialogo() {
  return chamar("abrir_projeto_dialogo");
}

/** Mostra o diálogo "Salvar como". Devolve o caminho escolhido ou null se cancelar. */
export function salvarComDialogo(nomeSugerido, conteudo) {
  return chamar("salvar_projeto_dialogo", { nomeSugerido, conteudo });
}

/** Grava direto num caminho já conhecido (Ctrl+S depois do primeiro "Salvar como"). */
export function gravarEm(caminho, conteudo) {
  return chamar("gravar_arquivo", { caminho, conteudo });
}

/**
 * Ferramenta do Craft (FigCraft pathops): booleana exata entre caminhos SVG `d`, na ordem de baixo para cima.
 * op: "unir" | "subtrair" | "intersectar" | "excluir". Devolve o `d` do resultado.
 */
export function craftBooleana(caminhos, operacao) {
  return chamar("craft_booleana", { caminhos, operacao });
}

/**
 * Ferramenta do Craft: converte o traço de um caminho em forma preenchida.
 * traco: { largura, posicao: dentro|centro|fora, ponta: reta|redonda|quadrada, juncao: reta|redonda|chanfrada, tracejado: [], fechado }
 */
export function craftContornarTraco(caminho, traco) {
  return chamar("craft_contornar_traco", { caminho, traco });
}

/** Nome do arquivo, sem a pasta. No Android o caminho é um content:// com a pasta codificada (%2F). */
export function nomeDoCaminho(caminho) {
  let texto = String(caminho ?? "");
  if (texto.startsWith("content://")) try { texto = decodeURIComponent(texto); } catch {}
  return texto.split(/[\\/:]/).pop();
}
