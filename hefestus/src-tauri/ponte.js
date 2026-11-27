// Ponte entre o Hefestus (JS) e o motor (Rust). Roda antes de qualquer script do Hefestus.
// Não altera o código do editor: só espelha o projeto no disco e controla a abertura da janela.
(() => {
  if (window.top !== window) return;
  const CHAVE = "hefestus.projeto.v1";
  const RECUPERACAO = `${CHAVE}.pendente-disco`;
  const inicio = performance.now();
  const invoke = (comando, args) => window.__TAURI_INTERNALS__.invoke(comando, args);
  let pendente = null;
  let espera = null;
  let gravando = false;
  let falhas = 0;
  let mensagem = "";
  let aviso;
  const avisar = texto => {
    mensagem = texto;
    if (!document.body) return;
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.setAttribute("role", "status");
      aviso.setAttribute("aria-live", "polite");
      aviso.style.cssText = "position:fixed;bottom:16px;left:16px;right:16px;z-index:2147483647;padding:12px 16px;background:#422006;color:#fff;border:1px solid #fbbf24;border-radius:8px;font:14px system-ui;box-shadow:0 4px 20px #0006";
      document.body.append(aviso);
    }
    aviso.textContent = texto;
    aviso.hidden = !texto;
  };
  const valido = texto => {
    try { const d = JSON.parse(texto); return d?.formato === "hefestus" && !!d.documento?.elementos; }
    catch { return false; }
  };

  // 1. Uma gravação não confirmada tem prioridade sobre a cópia antiga do disco.
  try {
    const disco = window.__HEFESTUS_DISCO__;
    const local = localStorage.getItem(CHAVE);
    if (localStorage.getItem(RECUPERACAO) && valido(local)) {
      pendente = local;
      avisar("Recuperamos alterações locais. Tentando salvar no disco…");
    } else if (valido(disco)) localStorage.setItem(CHAVE, disco);
  } catch (e) {
    console.error("[Hefestus] não foi possível carregar o projeto do disco", e);
  }

  // 2. Toda vez que o Hefestus salvar no localStorage, grava também no disco (com pausa de 0,4 s).
  const agendar = ms => { clearTimeout(espera); espera = setTimeout(gravar, ms); };
  const gravar = async () => {
    if (pendente === null || gravando) return;
    gravando = true;
    const conteudo = pendente;
    try {
      await invoke("salvar_disco", { conteudo });
      falhas = 0;
      if (pendente === conteudo) {
        pendente = null;
        try { localStorage.removeItem(RECUPERACAO); } catch (e) { console.error("[Hefestus] marcador de recuperação", e); }
        avisar("");
      }
    } catch (e) {
      falhas += 1;
      console.error("[Hefestus] falha ao salvar no disco", e);
      avisar("Não foi possível salvar no disco. As alterações permanecem neste dispositivo; tentaremos novamente. Use Salvar como para guardar outra cópia.");
    } finally {
      gravando = false;
      if (pendente !== null) agendar(falhas ? Math.min(30000, 1000 * 2 ** Math.min(falhas - 1, 5)) : 0);
    }
  };
  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function (chave, valor) {
    if (this === window.localStorage && chave === CHAVE) {
      // Se a cota acabar, o núcleo precisa receber o erro para reduzir o histórico.
      // Marcar antes evita que um fechamento entre as duas escritas perca a recuperação.
      try {
        original.call(this, RECUPERACAO, "1");
        original.call(this, chave, valor);
      } catch (e) {
        avisar("O armazenamento local está indisponível ou cheio. Use Salvar como para guardar uma cópia do projeto.");
        throw e;
      }
      pendente = String(valor);
      agendar(400);
    } else original.call(this, chave, valor);
  };
  window.addEventListener("beforeunload", gravar);
  window.addEventListener("online", () => { if (pendente !== null) agendar(0); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") void gravar(); });
  if (pendente !== null) agendar(400);
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", () => avisar(mensagem));

  // 3. Só mostra a janela depois do primeiro desenho: abre sem piscar em branco.
  const mostrar = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    invoke("mostrar_janela").catch(() => {});
    console.info(`[Hefestus] pronto em ${Math.round(performance.now() - inicio)} ms`);
  }));
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", mostrar);
  else mostrar();

  // 4. Atalho para o motor, para usar no console ou em ferramentas: await hefestusMotor.info()
  window.hefestusMotor = { info: () => invoke("info_motor") };
})();
