// Cria, dimensiona, distribui, atualiza e remove os obstáculos da arena.
function removerObstaculo(item) {
  item.imagem.remove();
  item.aviso?.remove();
}

function dimensionarObstaculo(item) {
  if (item.tipo === 'serra') {
    item.largura = item.altura = Math.min(112, robo.altura * 1.08);
  } else if (item.tipo === 'laser') {
    item.largura = Math.min(10, robo.largura * .07);
    item.tamanhoEmissor = Math.min(18, robo.largura * .14);
    item.x = largura * (item.direcao > 0 ? item.fracao : 1 - item.fracao) - item.largura / 2;
    item.y = Math.min(90, chao * .2);
    item.altura = chao - item.y;
  } else if (item.tipo === 'parede') {
    item.largura = Math.max(0, Math.min(320, largura * item.fracao,
      (largura - 2 * (robo.largura + 24)) / 2));
    item.x = item.y = 0;
    item.altura = chao;
  } else {
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
  }

  item.alturaRecolhida = item.altura * 0.3;
  item.imagem.style.width = item.largura + 'px';
  item.imagem.style.height = item.altura + 'px';
  if (item.aviso) {
    item.aviso.style.width = (item.largura + 16) + 'px';
  }
}

function faixaOcupada(item) {
  if (item.tipo === 'laser') {
    const centro = item.x + item.largura / 2;
    return [centro - item.tamanhoEmissor / 2, centro + item.tamanhoEmissor / 2];
  }
  return [item.x, item.x + item.largura];
}

// Reserva uma faixa livre para o robô, mesmo com várias ameaças na arena.
function temEspacoSeguro(candidato) {
  // A serra se move e pode ser pulada; não reserva uma faixa fixa da arena.
  const ativos = obstaculos.filter(item => !item.quebrada && item.tipo !== 'serra');
  const faixas = [...ativos, candidato].flatMap(item => item.tipo === 'parede'
    ? [[0, item.largura], [largura - item.largura, largura]]
    : [faixaOcupada(item)]);
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
    const sobreposto = obstaculos.some(outro => {
      if (outro.quebrada || outro.tipo === 'serra') return false;
      if (outro.tipo === 'parede') {
        return item.x < outro.largura + 16 || item.x + item.largura > largura - outro.largura - 16;
      }
      const [inicio, fim] = faixaOcupada(outro);
      return item.x < fim + 16 && item.x + item.largura > inicio - 16;
    });

    if (!sobreposto && temEspacoSeguro(item)) {
      return true;
    }
  }

  return false;
}

function criarObstaculo(tipo) {
  const espinho = tipo === 'espinho';
  const serra = tipo === 'serra';
  const laser = tipo === 'laser';
  const parede = tipo === 'parede';
  const especial = espinho || serra || laser || parede;

  // Cada tipo tem seu próprio intervalo. Só impede duplicatas do mesmo perigo.
  if (especial && obstaculos.some(item => item.tipo === tipo)) {
    return false;
  }

  const dificuldade = dificuldadeAtual();
  const imagem = document.createElement('div');
  imagem.className = 'sprite obstaculo ' + tipo;
  imagem.setAttribute('aria-hidden', 'true');

  const item = {
    tipo,
    imagem,
    aviso: espinho || serra ? criarAvisoEspinho() : undefined,
    idade: 0,
    quebrada: false,
    tempoQuebrada: 0,
    tempoAviso: parede ? dificuldade.avisoParede : serra ? dificuldade.avisoSerra : laser ? dificuldade.avisoLaser : dificuldade.avisoEspinho,
    duracao: parede ? dificuldade.duracaoParede : laser ? dificuldade.duracaoLaser : dificuldade.duracaoEspinho,
    direcao: Math.random() < .5 ? 1 : -1,
    velocidade: dificuldade.velocidadeSerra,
    fracao: dificuldade.fracaoLaser,
    abertura: 0,
    visibilidade: 0
  };

  dimensionarObstaculo(item);
  if (serra) {
    item.x = item.direcao > 0 ? 24 : largura - item.largura - 24;
    item.aviso.classList.add('aviso-serra');
    item.aviso.textContent = item.direcao > 0 ? 'SERRA → · PULE' : '← SERRA · PULE';
  } else if (laser) {
    if (!temEspacoSeguro(item)) return false;
    criarEmissoresLaser(item);
  } else if (parede) {
    if (item.largura < 16 || !temEspacoSeguro(item)) return false;
    criarParedes(item);
  } else if (!posicionarObstaculo(item)) {
    return false;
  }

  item.y = laser || parede ? item.y : serra ? chao : espinho ? chao - item.altura : -item.altura;
  jogo.appendChild(imagem);
  if (item.aviso) {
    jogo.appendChild(item.aviso);
  }
  obstaculos.push(item);
  desenharObstaculo(item);
  return true;
}

function gerarObstaculos(dificuldade) {
  // Tenta primeiro os lasers para que a serra não monopolize os especiais.
  if (tempo >= 35 && ultimoLaser >= dificuldade.intervaloLaser && criarObstaculo('laser')) {
    ultimoLaser = 0;
  }
  if (tempo >= 12 && ultimaParede >= dificuldade.intervaloParede && criarObstaculo('parede')) {
    ultimaParede = 0;
  }
  if (tempo >= 18 && ultimaSerra >= dificuldade.intervaloSerra && criarObstaculo('serra')) {
    ultimaSerra = 0;
  }
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
  if (item.tipo === 'laser' || item.tipo === 'parede') {
    return item.idade >= item.tempoAviso + item.duracao + .35;
  }
  if (item.tipo === 'serra') {
    return item.direcao > 0 ? item.x > largura : item.x + item.largura < 0;
  }
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
    if (item.tipo === 'serra') atualizarSerra(item, segundos);
    if (item.tipo === 'laser') atualizarLaser(item);
    if (item.tipo === 'parede') atualizarParede(item);
    const perigoso = (item.tipo === 'espinho' && espinhoPerigoso(item)) ||
      (item.tipo === 'serra' && serraPerigosa(item)) ||
      (item.tipo === 'laser' && laserPerigoso(item)) ||
      (item.tipo === 'parede' && laserPerigoso(item));

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
