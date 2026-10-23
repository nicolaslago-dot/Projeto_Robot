// Exibe a animação de derrota e abre o resultado com o tempo da partida.
function gameOver() {
  if (acabou) {
    return;
  }

  acabou = true;
  definirAsset(imagemRobo, 'robo-morrendo');
  imagemRobo.classList.add('robo-morrendo');
  const efeito = document.createElement('div');
  efeito.className = 'sprite efeito-colisao';
  jogo.appendChild(efeito);
  definirAsset(efeito, 'efeito-colisao');
  efeito.style.left = (robo.x + robo.largura / 2 - efeito.clientWidth / 2) + 'px';
  efeito.style.top = (robo.y + robo.altura / 2 - efeito.clientHeight / 2) + 'px';
  // A URL transporta o resultado mesmo se o armazenamento estiver bloqueado.
  window.setTimeout(() => {
    window.location.href = 'gameover.html?tempo=' + tempo.toFixed(1);
  }, 650);
}
