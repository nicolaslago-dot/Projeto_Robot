// Cria, dimensiona, distribui, atualiza e remove os obstáculos da arena.
function removerObstaculo(item) {
  item.imagem.remove();
  item.aviso?.remove();
}

function dimensionarObstaculo(item) {
  const espinho = item.tipo === 'espinho';
  const estilo = getComputedStyle(jogo);
  const propriedade = espinho ? '--espinho-largura' : '--caixa-tamanho';
  const tamanho = parseFloat(estilo.getPropertyValue(propriedade));

  item.largura = Math.min(largura, tamanho);
  item.altura = item.largura;
  if (espinho) {
    const recorte = RECURSOS.espinhos.recorte;
    item.altura = item.largura * recorte[3] / recorte[2];
  }

  item.alturaRecolhida = item.altura * 0.3;
  item.imagem.style.width = item.largura + 'px';
  item.imagem.style.height = item.altura + 'px';
  if (item.aviso) {
    item.aviso.style.width = (item.largura + 16) + 'px';
  }
}

// Reserva uma faixa livre para o robô, mesmo com várias ameaças na arena.
function temEspacoSeguro(candidato) {
  const ativos = obstaculos.filter(item => !item.quebrada);
  const faixas = [...ativos, candidato].map(item => [item.x, item.x + item.largura]);
  faixas.sort((a, b) => a[0] - b[0]);

  const folga = robo.largura + 24;
  let fim = 0;

  for (const [inicio, limite] of faixas) {
    if (inicio - fim >= folga) {
      return true;
    }
    fim = Math.max(fim, limite);
  }

  return largura - fim >= folga;
}

function posicionarObstaculo(item) {
  for (let tentativa = 0; tentativa < 12; tentativa++) {
    item.x = Math.random() * Math.max(0, largura - item.largura);
    const sobreposto = obstaculos.some(outro => !outro.quebrada &&
      item.x < outro.x + outro.largura + 16 && item.x + item.largura > outro.x - 16);

    if (!sobreposto && temEspacoSeguro(item)) {
      return true;
    }
  }

  return false;
}

function criarObstaculo(tipo) {
  const espinho = tipo === 'espinho';

  // Uma armadilha de chão por vez mantém uma rota de fuga legível.
  if (espinho && obstaculos.some(item => item.tipo === 'espinho')) {
    return false;
  }

  const dificuldade = dificuldadeAtual();
  const imagem = document.createElement('div');
  imagem.className = 'sprite obstaculo ' + tipo;
  imagem.setAttribute('aria-hidden', 'true');

  const item = {
    tipo,
    imagem,
    aviso: espinho ? criarAvisoEspinho() : undefined,
    idade: 0,
    quebrada: false,
    tempoQuebrada: 0,
    tempoAviso: dificuldade.avisoEspinho,
    duracao: dificuldade.duracaoEspinho
  };

  dimensionarObstaculo(item);
  if (!posicionarObstaculo(item)) {
    return false;
  }

  item.y = espinho ? chao - item.altura : -item.altura;
  jogo.appendChild(imagem);
  if (item.aviso) {
    jogo.appendChild(item.aviso);
  }
  obstaculos.push(item);
  desenharObstaculo(item);
  return true;
}

function gerarObstaculos(dificuldade) {
  if (ultimaCaixa >= dificuldade.intervaloCaixa) {
    criarObstaculo('caixa');
    ultimaCaixa -= dificuldade.intervaloCaixa;
  }
  if (ultimoEspinho >= dificuldade.intervaloEspinho) {
    criarObstaculo('espinho');
    ultimoEspinho -= dificuldade.intervaloEspinho;
  }
}

function obstaculoExpirou(item) {
  if (item.tipo === 'espinho') {
    return item.idade >= item.tempoAviso + item.duracao;
  }

  return item.tempoQuebrada > 0.4;
}

function atualizarObstaculos(segundos) {
  const dificuldade = dificuldadeAtual();
  gerarObstaculos(dificuldade);

  for (const item of obstaculos) {
    item.idade += segundos;
    if (item.tipo === 'caixa') {
      atualizarCaixa(item, segundos, dificuldade);
      if (acabou) {
        return;
      }
    }
    const perigoso = item.tipo === 'espinho' && espinhoPerigoso(item);

    if (perigoso && colidiu(item)) {
      gameOver();
      return;
    }
  }

  obstaculos = obstaculos.filter(item => {
    if (obstaculoExpirou(item)) {
      removerObstaculo(item);
      return false;
    }

    return true;
  });
}
