// Regras compartilhadas do Designer: objetos invisíveis ou bloqueados por um pai
// não participam da seleção por retângulo nem dos comandos de seleção em massa.
export function podeSelecionar(el, elementos) {
  const vistos = new Set();
  for (let atual = el; atual; atual = elementos[atual.pai]) {
    if (vistos.has(atual) || atual.travado || atual.visivel === false) return false;
    vistos.add(atual);
  }
  return true;
}

export function selecionarNoRetangulo(elementos, r, tocar = false) {
  const porId = Object.fromEntries(elementos.map(el => [el.id, el]));
  const dentro = elementos.filter(el => podeSelecionar(el, porId) && (tocar
    ? el.x < r.x + r.largura && el.x + el.largura > r.x && el.y < r.y + r.altura && el.y + el.altura > r.y
    : el.x >= r.x && el.y >= r.y && el.x + el.largura <= r.x + r.largura && el.y + el.altura <= r.y + r.altura));
  const ids = new Set(dentro.map(el => el.id));
  return dentro.filter(el => {
    const vistos = new Set();
    for (let pai = porId[el.pai]; pai && !vistos.has(pai); pai = porId[pai.pai]) {
      if (ids.has(pai.id)) return false;
      vistos.add(pai);
    }
    return true;
  }).map(el => el.id);
}
