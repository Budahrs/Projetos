/** Inventário verificável para a fábrica de programas; não confunde referência com implementação. */
export function guiaConstrucao(doc) {
  const especificacao=doc?.elementos?.__canvas?.especificacaoSoftware||doc?.especificacaoSoftware||{};
  const elementos=Object.entries(doc?.elementos||{}).filter(([id])=>!id.startsWith('__')).map(([id,e])=>({id,...e}));
  const referencias=(especificacao.referencias||[]).map((r,i)=>typeof r==='string'?{id:`REF${i+1}`,origem:r,estado:'a analisar'}:{id:`REF${i+1}`,estado:'a analisar',...r});
  return {
    formato:'hefestus.guia-construcao',versao:1,nome:doc?.elementos?.__canvas?.nome||'Programa',
    referencias,
    componentes:elementos.map(e=>({id:e.id,nome:e.nome||e.rotulo||e.texto||e.id,tipo:e.tipo,pai:e.pai||null,estado:'presente no projeto',eventos:(e.eventos||[]).map((v,i)=>({id:`${e.id}:${i}`,gatilho:v.tipo,acao:v.acao||'sinal',alvo:v.alvo||null,sinal:v.dispara||null,ativo:!v.suspenso,implementacao:v.acao?'ação visual do runtime':'verificar ligação com o motor'}))})),
    requisitos:especificacao.requisitos||[],motores:especificacao.motores||[],
    roteiro:[
      'Analisar cada referência e registrar telas, todos os menus, submenus, ferramentas, atalhos e estados observados.',
      'Separar comportamento confirmado, hipótese e informação pendente. Vincular cada requisito à evidência.',
      'Definir entradas, saídas, erros, cancelamento e efeitos de cada ferramenta antes da integração.',
      'Reutilizar implementações do banco por versão; implementar os motores que faltam com base nos requisitos definidos.',
      'Montar interface e comportamentos na Forja; refinar aparência individual e em grupos no Designer.',
      'Medir desempenho e consumo em casos reais; escolher ou substituir tecnologia com base nas medições.',
      'Testar ferramentas, salvar/reabrir, acessibilidade, redimensionamento e recuperação de falhas.',
      'Compilar e testar o aplicativo independente e o instalador; documentar dependências e limitações verificadas.',
    ],
    engenharia:{principio:'Escolher tecnologia pela operação e pelo ambiente; não prometer desempenho apenas pela linguagem.',candidatos:[{uso:'cálculo, processamento intenso e serviços nativos',tecnologia:'Rust; Wasm quando o mesmo motor precisar rodar no navegador'},{uso:'interface visual editável e composição',tecnologia:'HTML/CSS/JavaScript e host Tauri quando adequados aos requisitos'},{uso:'motores Windows já existentes',tecnologia:'reaproveitar contratos e implementações .NET/C# validados; medir antes de reescrever'}],validacao:'Benchmarks e testes precisam de ambiente, entrada, versão, resultado e evidência. Nenhum foi executado por este gerador.'},
  };
}

export function documentosGuiaConstrucao(doc) {
  const guia=guiaConstrucao(doc),nomes=guia.componentes.filter(c=>['menu','modal','container','botao','campo','toggle'].includes(c.tipo));
  return {
    'documentos/guia-construcao.json':JSON.stringify(guia,null,2)+'\n',
    'documentos/09-guia-construcao.md':`# ${guia.nome} — guia da fábrica\n\n## Referências\n\n${guia.referencias.length?guia.referencias.map(r=>`- ${r.id}: ${r.origem||r.titulo||'Origem a preencher'} — ${r.estado}`).join('\n'):'Nenhuma referência foi declarada. Imagens, links e documentos precisam ser analisados antes de atribuir comportamentos a eles.'}\n\n## Roteiro\n\n${guia.roteiro.map((r,i)=>`${i+1}. ${r}`).join('\n')}\n\n## Inventário do projeto atual\n\n${nomes.map(c=>`- ${c.id}: ${c.nome} (${c.tipo}); ${c.eventos.length} evento(s).`).join('\n')||'Sem componentes criados.'}\n\nOs detalhes de cada gatilho, alvo, sinal e estado estão em guia-construcao.json. A presença de um botão não comprova a implementação do motor.\n\n## Tecnologias e desempenho\n\n${guia.engenharia.principio}\n\n${guia.engenharia.candidatos.map(c=>`- ${c.uso}: ${c.tecnologia}.`).join('\n')}\n\n${guia.engenharia.validacao}\n`,
  };
}
