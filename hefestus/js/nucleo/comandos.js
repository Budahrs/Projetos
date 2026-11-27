// Registro de intenções. O núcleo continua sendo o dono das transações e de Undo/Redo.
export class CommandRegistry {
  constructor(contexto = () => ({})) { this.contexto = contexto; this.comandos = new Map(); this.ouvintes = new Set(); }
  registrar(comando) {
    if (!comando || typeof comando.id !== 'string' || !comando.id.trim()) throw new Error('Comando precisa de ID estável.');
    this.comandos.set(comando.id, comando);
    return comando.id;
  }
  estado(id) {
    const c = this.comandos.get(id); if (!c) return { visivel: false, habilitado: false, marcado: false };
    const ctx = this.contexto();
    const ler = (v, padrao) => typeof v === 'function' ? v(ctx) : v ?? padrao;
    const visivel = !!ler(c.visivel, true);
    return { visivel, habilitado: visivel && !ler(c.desabilitado, false) && !!ler(c.contexto, true),
      marcado: !!ler(c.ativo, false), valor: ler(c.valor, undefined), rotulo: ler(c.rotulo, id) };
  }
  executar(id, ...args) {
    const c = this.comandos.get(id);
    if (!c || !this.estado(id).habilitado || typeof c.acao !== 'function') return false;
    // Não cria um segundo histórico: ações mutantes já usam as transações do Nucleo.
    const resultado = c.acao(...args); this.notificar(id); return resultado ?? true;
  }
  observar(fn) { this.ouvintes.add(fn); return () => this.ouvintes.delete(fn); }
  notificar(id = null) { for (const f of this.ouvintes) f(id); }
}
