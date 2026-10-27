// A lâmina emerge antes de começar a atravessar a arena.
function serraPerigosa(item) {
  return item.idade >= item.tempoAviso && !obstaculoExpirou(item);
}

function atualizarSerra(item, segundos) {
  const subida = Math.max(0, Math.min(1, (item.idade - item.tempoAviso) / .35));
  // O centro termina na linha do piso; a metade inferior fica subterrânea.
  item.y = chao - item.altura / 2 * subida;
  if (item.idade >= item.tempoAviso + .35) {
    item.x += item.direcao * item.velocidade * segundos;
  }
}

function desenharSerra(item) {
  definirAsset(item.imagem, 'serra-circular');
  item.imagem.hidden = item.idade < item.tempoAviso;
  item.imagem.style.clipPath = `inset(0 0 ${Math.max(0, item.y + item.altura - chao)}px 0)`;
  item.imagem.style.setProperty('--rotacao', (item.idade * 720 * item.direcao) + 'deg');
  item.aviso.hidden = item.idade >= item.tempoAviso;
  item.aviso.style.transform = `translate(${item.x - 28}px, ${chao - item.altura - 48}px)`;
}
