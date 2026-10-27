// Itens de coleta com contadores independentes, sem alterar as regras dos perigos.

function coletavelSeguro(item) {
  const centroRobo = robo.x + robo.largura / 2;
  const centroItem = item.x + item.largura / 2;
  return obstaculos.every(perigo => {
    if (perigo.quebrada || obstaculoExpirou(perigo)) return true;
    if (perigo.tipo === 'parede') {
      return item.x >= perigo.largura + 20 && item.x + item.largura <= largura - perigo.largura - 20;
    }
    if (perigo.tipo === 'serra') {
      const previsto = perigo.x + perigo.direcao * perigo.velocidade * .5;
      return item.y + item.altura < chao - perigo.altura / 2 - 16 ||
        item.x + item.largura < Math.min(previsto, perigo.x) - 20 ||
        item.x > Math.max(previsto, perigo.x) + perigo.largura + 20;
    }
    const [inicio, fim] = faixaOcupada(perigo);
    if (perigo.tipo === 'laser' &&
        (centroRobo < inicio && centroItem > inicio || centroRobo > fim && centroItem < fim)) return false;
    return item.x + item.largura < inicio - 20 || item.x > fim + 20;
  });
}

function criarColetavel(tipo) {
  if (coletaveis.filter(item => item.tipo === tipo).length >= (tipo === 'moeda' ? 5 : 2)) return false;
  const item = { tipo, largura: tipo === 'moeda' ? 36 : 28, altura: tipo === 'moeda' ? 36 : 48, idade: 0 };
  let posicionado = false;
  for (let tentativa = 0; tentativa < 24; tentativa++) {
    item.x = 20 + Math.random() * Math.max(0, largura - item.largura - 40);
    const alturaPulo = Math.min(70, Math.max(0, chao - robo.altura - 100));
    item.y = chao - item.altura - 28 - Math.floor(Math.random() * 3) * alturaPulo / 2;
    const sobreposto = coletaveis.some(outro => item.x < outro.x + outro.largura + 20 &&
      item.x + item.largura > outro.x - 20 && item.y < outro.y + outro.altura + 12 && item.y + item.altura > outro.y - 12);
    if (!sobreposto && Math.abs(item.x + item.largura / 2 - robo.x - robo.largura / 2) > robo.largura * .7 && coletavelSeguro(item)) {
      posicionado = true;
      break;
    }
  }
  if (!posicionado) return false;
  item.imagem = document.createElement('div');
  item.imagem.className = 'sprite coletavel ' + tipo;
  item.imagem.style.width = item.largura + 'px';
  item.imagem.style.height = item.altura + 'px';
  item.imagem.setAttribute('role', 'img');
  item.imagem.setAttribute('aria-label', tipo === 'moeda' ? 'Moeda' : 'Bateria');
  jogo.appendChild(item.imagem);
  coletaveis.push(item);
  desenharColetavel(item);
  return true;
}

function tocouColetavel(item) {
  return robo.x + robo.largura * .12 < item.x + item.largura &&
    robo.x + robo.largura * .88 > item.x &&
    robo.y + robo.altura * .1 < item.y + item.altura &&
    robo.y + robo.altura * .96 > item.y;
}

function atualizarColetaveis(segundos) {
  coletaveis = coletaveis.filter(item => {
    item.idade += segundos;
    const tocou = tocouColetavel(item);
    // Retira recompensas que passaram a ficar em uma área ameaçada.
    const seguro = coletavelSeguro(item);
    if (tocou && seguro && item.idade < 12) {
      if (item.tipo === 'moeda') moedas++;
      else baterias++;
    }
    if (tocou || !seguro || item.idade >= 12) {
      item.imagem.remove();
      return false;
    }
    return true;
  });
  ultimaMoeda += segundos;
  ultimaBateria += segundos;
  if (ultimaMoeda >= 2.8) {
    criarColetavel('moeda');
    ultimaMoeda = 0;
  }
  if (ultimaBateria >= 9) {
    criarColetavel('bateria');
    ultimaBateria = 0;
  }
}

function desenharColetavel(item) {
  definirAsset(item.imagem, item.tipo);
  item.imagem.style.transform = `translate(${item.x}px, ${item.y}px)`;
  item.imagem.style.opacity = item.idade > 10 ? .55 : 1;
}

function desenharColetaveis() {
  coletaveis.forEach(desenharColetavel);
  document.getElementById('moedas').textContent = moedas;
  document.getElementById('baterias').textContent = baterias;
}

function reposicionarColetaveis(larguraAnterior, chaoAnterior) {
  for (const item of coletaveis) {
    item.x = Math.max(0, Math.min(largura - item.largura, item.x / Math.max(1, larguraAnterior - item.largura) * (largura - item.largura)));
    item.y = Math.max(80, Math.min(chao - item.altura - 12, item.y + chao - chaoAnterior));
  }
}
