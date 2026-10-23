// Atualiza a queda, a quebra e a aparência das caixas.
function atualizarCaixa(item, segundos, dificuldade) {
  if (item.quebrada) {
    item.tempoQuebrada += segundos;
    return;
  }

  item.y = Math.min(chao - item.altura, item.y + dificuldade.velocidadeCaixa * segundos);

  // Verifica a colisão antes de transformar a caixa em destroços inofensivos.
  if (colidiu(item)) {
    gameOver();
    return;
  }

  if (item.y + item.altura >= chao) {
    item.y = chao - item.altura;
    item.quebrada = true;
  }
}

function desenharCaixa(item) {
  definirAsset(item.imagem, item.quebrada ? 'caixa-quebrada' : 'caixa-caindo');
  if (item.quebrada) {
    item.imagem.classList.add('caixa-quebrada');
  }
}
