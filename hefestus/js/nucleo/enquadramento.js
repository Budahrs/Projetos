// Geometria da vista; nunca altera as coordenadas ou o tamanho dos elementos.
export function enquadrar(retangulos, largura, altura, margem = 40) {
  const caixas = retangulos.filter(r => [r.x,r.y,r.largura,r.altura].every(Number.isFinite) && r.largura > 0 && r.altura > 0);
  if (!caixas.length || largura <= margem * 2 || altura <= margem * 2) return null;
  const x = Math.min(...caixas.map(r=>r.x)), y = Math.min(...caixas.map(r=>r.y));
  const direita = Math.max(...caixas.map(r=>r.x+r.largura)), baixo = Math.max(...caixas.map(r=>r.y+r.altura));
  return { zoom: Math.max(.1,Math.min(2,Math.floor(Math.min((largura-margem*2)/(direita-x),(altura-margem*2)/(baixo-y))*100)/100)), centro:[(x+direita)/2,(y+baixo)/2] };
}
