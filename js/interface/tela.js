// Adapta a arena, o robô e os obstáculos ao tamanho da janela.
function ajustarTela() {
  const larguraAnterior = largura;
  const chaoAnterior = chao;
  const roboLarguraAnterior = robo.largura;
  const alturaAnterior = robo.altura;
  const estilo = getComputedStyle(jogo);
  const margemInferior = parseFloat(estilo.getPropertyValue('--area-inferior'));

  largura = jogo.clientWidth;
  robo.largura = imagemRobo.offsetWidth;
  robo.altura = imagemRobo.offsetHeight;
  chao = Math.max(robo.altura + 60, jogo.clientHeight - margemInferior);
  document.getElementById('chao').style.top = chao + 'px';

  let posicaoX = 0;
  if (larguraAnterior !== undefined) {
    posicaoX = robo.x / Math.max(1, larguraAnterior - roboLarguraAnterior);
  }
  robo.x = Math.max(0, Math.min(posicaoX * Math.max(0, largura - robo.largura), largura - robo.largura));

  if (chaoAnterior === undefined) {
    robo.y = chao - robo.altura;
  } else {
    robo.y += chao - chaoAnterior + alturaAnterior - robo.altura;
  }
  robo.y = Math.min(robo.y, chao - robo.altura);

  reposicionarObstaculos(larguraAnterior, chaoAnterior);
  definirAsset(imagemRobo, imagemRobo.dataset.asset || 'robo-parado');
  definirAsset(sombraRobo, 'sombra-robo');
  desenhar();
}

function reposicionarObstaculos(larguraAnterior, chaoAnterior) {
  for (const item of obstaculos) {
    const proporcaoX = item.x / Math.max(1, larguraAnterior - item.largura);
    const progressoQueda = (item.y + item.altura) / chaoAnterior;
    dimensionarObstaculo(item);
    item.x = proporcaoX * Math.max(0, largura - item.largura);
    if (item.tipo === 'espinho' || item.quebrada) {
      item.y = chao - item.altura;
    } else {
      item.y = progressoQueda * chao - item.altura;
    }
  }
}

window.addEventListener('resize', ajustarTela);
