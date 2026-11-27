// O Hefestus como perfil do App Shell (#43). Mesmo conteúdo de perfis/hefestus.perfil.json
// (o bundler não importa JSON); testes/perfil.test.mjs garante que os dois são iguais.
export const PERFIL_HEFESTUS = {
  formato: "hefestus.perfil",
  versao: 1,
  id: "hefestus",
  nome: "Hephaestus",
  descricao: "O próprio editor descrito como perfil do shell (fase S0 do #43). Espelha js/app/areasHephaestus.js; o teste perfil.test.mjs acusa se os dois divergirem.",
  projeto: "prj-hefestus",
  areas: [
    { id: "designer", nome: "Designer", abas: ["arquivo", "inicio", "inserir", "modificar", "aparencia", "layout", "exibir"], abaInicial: "inserir" },
    { id: "visual-script", nome: "Código", abas: ["gatilhos", "acoes", "logica", "variaveis", "componentes", "compilar"], abaInicial: "gatilhos" },
  ],
  areaInicial: "designer",
  paineis: { esquerda: ["camadas"], direita: ["inspetor"] },
  acessoRapido: ["_salvar", "_desfazer", "_refazer"],
  temaPadrao: "automatico",
  destinos: ["web", "desktop", "android"],
  motor: { tipo: "js", entrada: "js/app.js" },
  mcp: { comando: "node", args: ["ferramentas/hefestus-mcp.mjs"] },
  estado: "implementado",
};
