import { compilar } from './compilador.js';
import { dadosRuntime, ligarRuntime } from './runtime.js';
import { motorMenus } from './motorMenus.js';
import { codigoDosGrupos, executarCodigoGrupos } from './codigoGrupo.js';
import { REGRAS_MENUS, REPERTORIO_MENUS } from './expertiseMenus.js';
import { documentoHTMLImportado, analisarHTMLImportado } from './importarHTML.js';
import { documentosSoftware } from './especificacaoSoftware.js';

/** Documentação deriva do documento real; não estima desempenho nem inventa backend. */
export function documentosProjeto(doc, {nucleo='',projeto=null}={}) {
  const c=compilar(doc), sinais=dadosRuntime(c.elementos), grupos=codigoDosGrupos(c.elementos);
  const ferramentas={
    'runtime.txt':ligarRuntime.toString(),
    'html_importado.txt':documentoHTMLImportado.toString()+'\n\n'+analisarHTMLImportado.toString(),
    'complemento_usuario.txt':doc.elementos.__canvas?.complemento?.js || '// Sem código complementar do usuário.',
    'motor_menus.txt':motorMenus.toString(),
    'codigo_grupos.txt':executarCodigoGrupos.toString()+'\n\n// Definições\n'+JSON.stringify(grupos,null,2),
  };
  const conexoes=[{origem:'núcleo',destino:'runtime',contrato:'ligarRuntime(raiz, dadosRuntime)'},{origem:'runtime',destino:'motor_menus',contrato:'motorMenus()'},{origem:'núcleo',destino:'codigo_grupos',contrato:'executarCodigoGrupos(definições)'},{origem:'interface',destino:'integração externa',contrato:'evento hefestus:sinal; implementação do destinatário'}];
  const metricas={elementos:c.elementos.length,grupos:c.elementos.filter(e=>e.grupo).length,eventos:c.elementos.reduce((n,e)=>n+(e.eventos?.length||0),0),bytesHTML:new TextEncoder().encode(c.html).length,bytesCSS:new TextEncoder().encode(c.css).length,benchmarkExecutado:false,antares:'Documento de referência não localizado; regras não aplicadas.'};
  const bootstrap=`// Conexões com ferramentas separadas; suas implementações estão em ferramentas/.\nconst dadosRuntime = ${JSON.stringify(sinais,null,2)};\nconst grupos = ${JSON.stringify(grupos,null,2)};\nligarRuntime(document.querySelector('.hf-arte'), dadosRuntime);\nexecutarCodigoGrupos(grupos);`;
  const arquivos={
    ...documentosSoftware(doc, doc.especificacaoSoftware),
    'documentos/arquitetura.txt':'ARQUITETURA DO APLICATIVO\nInterface declarativa → HTML/CSS → runtime e ferramentas.\nO editor Hefestus não integra o aplicativo instalado.\n'+JSON.stringify(conexoes,null,2)+'\n\nRecursos e serviços remotos mantêm suas dependências. Não há backend gerado automaticamente.',
    'documentos/nucleo.txt':(nucleo?nucleo+'\n\n':'')+bootstrap,
    'documentos/interface.txt':c.html+'\n\n/* ESTILOS */\n'+c.css,
    'documentos/ferramentas.txt':Object.keys(ferramentas).map(n=>'ferramentas/'+n).join('\n'),
    'documentos/metricas.txt':JSON.stringify(metricas,null,2),
    ...Object.fromEntries(Object.entries(ferramentas).map(([n,v])=>['documentos/ferramentas/'+n,v])),
  };
  arquivos['documentos/contexto_ia.json']=JSON.stringify({formato:'hefestus-contexto-ia',versao:1,geradoEm:new Date().toISOString(),documento:doc,projeto,conexoes,metricas,regras:REGRAS_MENUS,repertorio:REPERTORIO_MENUS,arquivos,limites:['Referências não equivalem a editores Office incorporados.','Métricas estáticas não são testes de desempenho.','Antares pendente de localização.','Instalador Windows depende de compilação e validação no Windows.']},null,2);
  return arquivos;
}
