import { sincronizarMenu } from './menuEngine.js';

export function localizarBloco(p, id) {
  for (const aba of p.designer.abas) {
    if (aba.id === id) return {tipo:'aba', bloco:aba, lista:p.designer.abas, pai:null};
    for (const grupo of aba.grupos) {
      if (grupo.id === id) return {tipo:'grupo', bloco:grupo, lista:aba.grupos, pai:aba};
      for (const comando of grupo.comandos) if (comando.id === id)
        return {tipo:'comando', bloco:comando, lista:grupo.comandos, pai:grupo};
    }
  }
  return null;
}

/** Operações atômicas sobre o mesmo contrato usado pelo formulário e pelos exportadores. */
export function editarBlocosMenu(original, op) {
  const p = structuredClone(original), usados = new Set();
  for (const a of p.designer.abas) {usados.add(a.id);for (const g of a.grupos) {usados.add(g.id);for (const c of g.comandos) usados.add(c.id);}}
  const idNovo = tipo => {let i=1;while(usados.has('bloco_'+tipo+'_'+i))i++;const id='bloco_'+tipo+'_'+i;usados.add(id);return id;};
  const comando = () => ({id:idNovo('comando'),rotulo:'Novo comando',descricao:'',icone:'raio',ferramentaId:p.bancoFerramentas?.[0]?.id,templateId:p.catalogoTemplates?.find(t=>t.id==='acao-secundaria')?.id||p.catalogoTemplates?.[0]?.id});
  const grupo = () => ({id:idNovo('grupo'),nome:'Novo grupo',comandos:[comando()]});
  const destino = tipo => {
    if (tipo==='aba') {if(op.pai)throw Error('Abas se encaixam diretamente no menu.');return p.designer.abas;}
    const pai=localizarBloco(p,op.pai);
    if(pai?.tipo!==(tipo==='grupo'?'aba':'grupo'))throw Error(tipo==='grupo'?'Encaixe o grupo dentro de uma aba.':'Encaixe o comando dentro de um grupo.');
    return tipo==='grupo'?pai.bloco.grupos:pai.bloco.comandos;
  };
  let selecionado=op.id;
  const alvo=op.id&&localizarBloco(p,op.id);
  if (op.acao==='apresentacao') {
    if(!['ribbon','lateral','contextual','janela'].includes(op.tipoInterface))throw Error('Tipo de interface inválido.');
    p.designer.tipoInterface=op.tipoInterface;selecionado=p.designer.abas[0].id;
  } else if (op.acao==='adicionar') {
    if(!['aba','grupo','comando'].includes(op.tipo))throw Error('Tipo de bloco desconhecido.');
    const novo=op.tipo==='aba'?{id:idNovo('aba'),nome:'Nova aba',grupos:[grupo()]}:op.tipo==='grupo'?grupo():comando();
    destino(op.tipo).push(novo);selecionado=novo.id;
  } else {
    if(!alvo)throw Error('O bloco não existe mais.');
    if(op.acao==='mover') {
      const lista=destino(alvo.tipo);alvo.lista.splice(alvo.lista.indexOf(alvo.bloco),1);
      let indice=op.antesDe?lista.findIndex(b=>b.id===op.antesDe):Number.isInteger(op.indice)?op.indice:lista.length;
      if(indice<0)throw Error('Encaixe de destino não encontrado.');
      if(alvo.tipo==='comando'&&alvo.bloco.destaque)lista.forEach(c=>c.destaque=false);
      lista.splice(Math.min(indice,lista.length),0,alvo.bloco);
    } else if(op.acao==='remover') {
      alvo.lista.splice(alvo.lista.indexOf(alvo.bloco),1);selecionado=alvo.pai?.id||p.designer.abas[0]?.id;
    } else if(op.acao==='editar') {
      const permitidos=alvo.tipo==='comando'?['rotulo','descricao','icone','atalho','destaque','ferramentaId','templateId','comportamentos']:['nome','fixado'];
      for(const [k,v] of Object.entries(op.valores||{})) {if(!permitidos.includes(k))throw Error('Propriedade não editável por este bloco: '+k);alvo.bloco[k]=v;}
      if(alvo.tipo==='comando'&&op.valores?.destaque)alvo.lista.forEach(c=>{if(c!==alvo.bloco)c.destaque=false;});
    } else throw Error('Operação de bloco desconhecida.');
  }
  return {pacote:sincronizarMenu(p),selecionado};
}
