// Controla movimento, pulo, gravidade, poses e sombra do robô.
const VELOCIDADE_ROBO = 280;
const FORCA_PULO = 540;
const GRAVIDADE = 1400;

function pular() {
  if (carregando || acabou || pausado) {
    return;
  }

  const noChao = robo.y + robo.altura >= chao - 1;
  if (noChao) {
    robo.velocidadeY = -FORCA_PULO;
  }
}

function atualizarRobo(segundos) {
  const direita = teclas.ArrowRight || teclas.KeyD ? 1 : 0;
  const esquerda = teclas.ArrowLeft || teclas.KeyA ? 1 : 0;
  const direcao = direita - esquerda;

  if (direcao !== 0) {
    olhandoEsquerda = direcao < 0;
  }

  robo.x += direcao * VELOCIDADE_ROBO * segundos;
  robo.x = Math.max(0, Math.min(robo.x, largura - robo.largura));

  robo.velocidadeY += GRAVIDADE * segundos;
  robo.y += robo.velocidadeY * segundos;
  if (robo.y + robo.altura >= chao) {
    robo.y = chao - robo.altura;
    robo.velocidadeY = 0;
  }
}

function escolherPoseRobo() {
  const noAr = robo.y + robo.altura < chao - 1;
  if (noAr) {
    return robo.velocidadeY < 0 ? 'robo-pulando' : 'robo-caindo';
  }

  const movendo = teclas.ArrowRight || teclas.KeyD || teclas.ArrowLeft || teclas.KeyA;
  if (!movendo) {
    return 'robo-parado';
  }

  const quadro = Math.floor(tempo / 0.12) % 2;
  return quadro === 0 ? 'robo-andando-direito' : 'robo-andando-esquerdo';
}

function desenharRobo() {
  if (!acabou) {
    definirAsset(imagemRobo, escolherPoseRobo());
  }

  imagemRobo.style.transform = `translate(${robo.x}px, ${robo.y}px) scaleX(${olhandoEsquerda ? -1 : 1})`;
  desenharSombraRobo();
}

function desenharSombraRobo() {
  const distanciaChao = Math.max(0, chao - robo.y - robo.altura);
  const x = robo.x + (robo.largura - sombraRobo.clientWidth) / 2;
  const escala = Math.max(0.45, 1 - distanciaChao / 240);

  sombraRobo.style.transform = `translate(${x}px, ${chao - 8}px) scale(${escala})`;
  sombraRobo.style.opacity = Math.max(0.25, 0.7 - distanciaChao / 300);
}
