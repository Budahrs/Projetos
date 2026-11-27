// Ações da App ligadas ao armazém e aos containers conceituais: abrir o painel do armazém, reconhecer
// componentes na seleção (construção assistida: propõe, a pessoa aceita), vincular a uma ferramenta e
// avisar quando o contrato de um elemento é desrespeitado.
import { h, avisar } from "../ui/dom.js";
import { CATALOGO } from "../nucleo/catalogo.js";
import { TIPOS_RECONHECIDOS } from "../nucleo/classificador.js";

export class ArmazemApp {
  async abrirProjetoDoBanco(programa) {
    try {
      await this.bancoPronto;
      const {dados}=await this.armazem.resolver(`modelo/${programa}/projeto`);
      if(dados?.formato!=='hefestus.projeto-reutilizavel'||typeof dados.texto!=='string')throw Error('O banco não contém um projeto editável deste programa.');
      this.confirmarDescartar('Abrir projeto '+programa,()=>{
        this.n.abrirTexto(dados.texto);
        this.setModo('designer');
        this.area.enquadrarConteudo();
        this.render();
        this.mensagem('Projeto aberto do banco de ferramentas.','ok');
      });
    } catch(e) {avisar(e.message,'alerta');}
  }

  abrirArmazem(secao = "armazem") {
    this.painelArmazem.abrirSecao(secao);
    this.abrirPainelEsq("armazem");
  }

  /** Mostra o que o classificador reconheceu na seleção; nada muda sem a pessoa escolher. */
  reconhecerComponente() {
    const ids = this.n.selecionados();
    if (!ids.length) { avisar("Selecione as formas que formam o componente.", "alerta"); return; }
    const props = this.n.reconhecerComponentes(ids).slice(0, 3);
    if (!props.length) { avisar("Não reconheci um componente com segurança. Ajuste ou agrupe manualmente.", "info"); return; }
    this.dialogo({
      titulo: "Reconhecer componente", icone: "buscar",
      texto: `${this.n.descreverGrupo(ids)} parece ser:`,
      corpo: h("ul", { class: "rec-lista" }, props.map(p => h("li", {}, h("b", {}, `${p.nome} (${Math.round(p.confianca * 100)}%)`), ` — ${p.motivos.join(", ")}`))),
      opcoes: [
        ...props.map((p, i) => ({ id: `rec-${p.tipo}`, rotulo: `É ${p.nome.toLowerCase()}`, primario: i === 0, fazer: () => {
          const id = this.n.aplicarReconhecimento(p);
          this.mensagem(`${this.n.rotulo(id)}: tipo ${TIPOS_RECONHECIDOS[p.tipo].nome} fixado. Renomear não muda o tipo; mudar exige migração.`, "ok");
        } })),
        { id: "cancelar", rotulo: "Não é nenhum", fazer: () => {} },
      ],
    });
  }

  /** Liga um evento do elemento selecionado a uma ferramenta do armazém (referência versionada). */
  async vincularSelecao() {
    await this.bancoPronto;
    const ids = this.n.selecionados();
    if (ids.length !== 1) { avisar("Selecione um elemento para vincular.", "alerta"); return; }
    const el = this.n.elemento(ids[0]);
    await this.armazem.abrir();
    const ultimas = new Map();
    for (const e of this.armazem.listar({ tipo: "ferramenta" })) ultimas.set(`${e.programa}/${e.id}`, e);
    if (!ultimas.size) {
      avisar("O armazém não tem ferramentas. Sincronize um programa primeiro.", "alerta");
      this.abrirArmazem("sincronizar");
      return;
    }
    const ferr = h("select", { class: "cp-entrada", "aria-label": "Ferramenta" }, [...ultimas.values()].map(e => h("option", { value: `${e.programa}/${e.id}@${e.versao}` }, `${e.programa} · ${e.id} ${e.versao} (${e.runtime ?? "?"})`)));
    const eventos = CATALOGO[el.tipo]?.eventos ?? ["onClick", "onHover", "onFocus"];
    const ev = h("select", { class: "cp-entrada", "aria-label": "Quando" }, eventos.map(t => h("option", { value: t }, t)));
    const faixa = h("select", { class: "cp-entrada", "aria-label": "Versões aceitas" }, [["^", "compatíveis (mesma versão principal)"], ["~", "só correções"], ["=", "exatamente esta"]].map(([v, r]) => h("option", { value: v }, r)));
    this.dialogo({
      titulo: `Vincular ${el.nome}`, icone: "link",
      texto: "O vínculo guarda a referência versionada, não uma cópia do código. Na interface exportada ele emite um sinal; quem consome chama a ferramenta.",
      corpo: h("div", { class: "cp" }, h("span", { class: "cp-rotulo" }, "Ferramenta"), ferr, h("span", { class: "cp-rotulo" }, "Quando"), ev, h("span", { class: "cp-rotulo" }, "Aceitar versões"), faixa),
      opcoes: [
        { id: "vincular", rotulo: "Vincular", primario: true, fazer: () => {
          const [base, versao] = ferr.value.split("@");
          const ref = `ferramenta/${base}@${faixa.value === "=" ? versao : `${faixa.value}${versao}`}`;
          try {
            this.n.vincular(el.id ?? ids[0], { evento: ev.value, ref });
            this.painelArmazem.marcarUsos().then(() => this.render());
            this.mensagem(`Vinculado: ${ref}.`, "ok");
          } catch (e) { avisar(e.message, "alerta"); }
        } },
        { id: "cancelar", rotulo: "Cancelar", fazer: () => {} },
      ],
    });
  }

  /** Depois de cada mudança: avisa na barra de estado se a seleção saiu do contrato (não bloqueia). */
  conferirContratoDaSelecao() {
    for (const id of this.n.selecionados()) {
      const avisos = this.n.limitesViolados(id, {});
      if (avisos.length) { this.mensagem(`Contrato de ${this.n.rotulo(id)}: ${avisos[0].mensagem}. A auditoria oferece o ajuste.`, "alerta"); return true; }
    }
    return false;
  }
}
