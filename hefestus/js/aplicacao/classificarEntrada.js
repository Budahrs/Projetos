/**
 * Classificação estática de entradas do importador. Não executa código, não faz
 * requisições e não afirma que um formato seja editável pelo núcleo.
 */
const EXTENSOES = Object.freeze({
  html:'html',htm:'html',xhtml:'html',css:'css',js:'javascript',mjs:'javascript',
  json:'json',svg:'svg',png:'imagem',jpg:'imagem',jpeg:'imagem',
  gif:'imagem',webp:'imagem',avif:'imagem',mp4:'video',webm:'video',
  mp3:'audio',wav:'audio',ogg:'audio'
});
const MIME = Object.freeze({
  'text/html':'html','application/xhtml+xml':'html','text/css':'css',
  'text/javascript':'javascript','application/javascript':'javascript',
  'application/json':'json','image/svg+xml':'svg',
  'image/png':'imagem','image/jpeg':'imagem','image/gif':'imagem',
  'image/webp':'imagem','image/avif':'imagem',
  'video/mp4':'video','video/webm':'video',
  'audio/mpeg':'audio','audio/wav':'audio','audio/ogg':'audio'
});
const MODOS = Object.freeze({
  html:'nativo-parcial',css:'fonte-preservada',javascript:'fonte-preservada',
  json:'dados-preservados',svg:'fonte-preservada',imagem:'recurso',
  video:'recurso',audio:'recurso',desconhecido:'fonte-preservada'
});
const AVISO = 'Classificação não implica conversão nativa, segurança de execução ou fidelidade visual.';
export function classificarEntrada({nome='',mime='',conteudo=null}={}){
  if(typeof nome!=='string'||typeof mime!=='string')
    throw new TypeError('Nome e MIME devem ser textos.');
  if(conteudo!==null&&typeof conteudo!=='string')
    throw new TypeError('Conteúdo deve ser texto ou null.');
  const tipoMime=MIME[mime.split(';')[0].trim().toLowerCase()]||null;
  const ext=nome.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  const tipoExt=EXTENSOES[ext]||null;
  const divergencia=Boolean(tipoMime&&tipoExt&&tipoMime!==tipoExt);
  const tipo=divergencia?'desconhecido':tipoMime||tipoExt||'desconhecido';
  const avisos=[AVISO];
  if(divergencia)avisos.push('MIME e extensão divergentes: requer confirmação antes de importar.');
  if(tipo==='html')avisos.push('Somente o subconjunto HTML inline pode gerar objetos nativos.');
  return {tipo,modo:MODOS[tipo],origem:tipoMime?'mime':tipoExt?'extensao':'desconhecida',
    divergencia,contemConteudo:conteudo!==null,avisos};
}
