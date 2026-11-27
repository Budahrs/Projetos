import { gerarHTML } from './compilador.js';
import { ligarRuntime, dadosRuntime } from './runtime.js';
import { motorMenus } from './motorMenus.js';
import { listar } from './exportar.js';

/** Pacote aditivo: versões anteriores continuam lendo documento/histórico normalmente. */
export function pacoteProjeto(doc, documentos) {
  const html=gerarHTML(doc), elementos=listar(doc);
  const arquivos={
    'interface/index.html':html,
    'motor/runtime.js':`export const motorMenus = ${motorMenus.toString()};\nexport const ligarRuntime = ${ligarRuntime.toString()};\n`,
    'motor/eventos.json':JSON.stringify(dadosRuntime(elementos),null,2),
    'recursos/dependencias.json':JSON.stringify({urls:[...new Set(html.match(/https?:\/\/[^\s"'<>\\)]+/g)||[])],observacao:'URLs são referências detectadas no código, não comprovação de disponibilidade. Recursos inline seguem no HTML. Motores nativos e dependências externas exigem distribuição e validação próprias.'},null,2),
    ...documentos,
  };
  return {formato:'hefestus.pacote-projeto',versao:1,
    manifesto:{entrada:'interface/index.html',documento:'$.documento',historico:'$.historico',motor:'motor/runtime.js',eventos:'motor/eventos.json',documentacao:'documentos/README.md',recursos:'recursos/dependencias.json',plataforma:'web; aplicação nativa gerada na exportação Tauri',arquivos:Object.keys(arquivos)},
    arquivos};
}
