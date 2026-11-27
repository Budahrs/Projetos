// Cópia exata de js/app/areasHephaestus.js antes da fase S1 do App Shell (#43), usada só como referência
// de equivalência em testes/areas-shell.test.mjs. Não é carregada pelo editor.
import {normalizarVisaoCodigo} from '../../js/app/representacoesCodigo.js';
const ABAS_DESIGNER = ["arquivo","inicio","inserir","modificar","aparencia","layout","exibir"];
const ABAS_SCRIPT = ["gatilhos","acoes","logica","variaveis","componentes","compilar"];
export function iniciarAreas(ui) {
  if (!ui.hephaestusLayout) {
    Object.assign(ui,{hephaestusLayout:1,areaAtiva:"designer",hibrido:false,modo:"designer",aba:"inserir",esq:"camadas",dir:["inspetor"],qat:["_salvar","_desfazer","_refazer"],qatAbaixo:false,temaUI:"ambar",ribbonRecolhido:false,estiloMenu:"faixa",inspetorFixo:true,vsPainelFechado:true,vsAba:"depurador",vsMobile:"nao",barraFerr:false});
  }
  ui.codigoVisao=normalizarVisaoCodigo(ui.codigoVisao);
  trocarArea(ui,ui.areaAtiva||"designer");
  return ui;
}
export function trocarArea(ui,area) {
  const script=["codigo","code","visual-script","visualscript","forja","web"].includes(area);
  const anterior=ui.areaAtiva||"designer";
  ui.abasPorArea??={}; if(ui.aba)ui.abasPorArea[anterior]=ui.aba;
  ui.areaAtiva=script?"visual-script":"designer";
  ui.hibrido=script;ui.modo="designer";
  const permitidas=script?ABAS_SCRIPT:ABAS_DESIGNER;
  ui.aba=ui.abasPorArea[ui.areaAtiva]||ui.aba;
  if(!permitidas.includes(ui.aba))ui.aba=script?"gatilhos":"inserir";
  ui.flyout=null;ui.grupoAberto=null;
  if(script) {ui.vsGrafo??="designer-objetos";ui.vsPainelFechado??=true;}
  return ui;
}
export { ABAS_DESIGNER, ABAS_SCRIPT };
