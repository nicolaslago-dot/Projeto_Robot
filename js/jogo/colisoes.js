// Verifica o contato do robô com as caixas e as lâminas dos espinhos.
function colidiu(item) {
  const limites = {
    esquerda: robo.x + robo.largura * 0.12,
    direita: robo.x + robo.largura * 0.88,
    topo: robo.y + robo.altura * 0.10,
    base: robo.y + robo.altura * 0.96
  };

  if (item.tipo === 'espinho') {
    return colidiuEspinho(item, limites);
  }

  return colidiuCaixa(item, limites);
}

function colidiuEspinho(item, limites) {
  // Cinco triângulos acompanham as lâminas, ignorando os cantos vazios.
  const topoLamina = item.y + item.altura * 0.02;
  const baseLamina = item.y + item.altura * 0.64;
  if (limites.base <= topoLamina || limites.topo >= baseLamina) {
    return false;
  }

  const abertura = Math.min(1, (limites.base - topoLamina) / (baseLamina - topoLamina));
  const meiaLargura = item.largura * 0.057 * abertura;
  const posicoesLaminas = [0.153, 0.328, 0.503, 0.677, 0.853];

  return posicoesLaminas.some(posicao => {
    const centro = item.x + item.largura * posicao;
    return limites.esquerda < centro + meiaLargura && limites.direita > centro - meiaLargura;
  });
}

function colidiuCaixa(item, limites) {
  // Usa a proporção real da caixa, alinhada à base por definirAsset().
  const recorte = RECURSOS['caixa-caindo'].recorte;
  const escala = Math.min(item.largura / recorte[2], item.altura / recorte[3]);
  const larguraCaixa = recorte[2] * escala;
  const alturaCaixa = recorte[3] * escala;
  const x = item.x + (item.largura - larguraCaixa) / 2;
  const y = item.y + item.altura - alturaCaixa;

  return limites.esquerda < x + larguraCaixa * 0.96 &&
    limites.direita > x + larguraCaixa * 0.04 &&
    limites.topo < y + alturaCaixa * 0.96 &&
    limites.base > y + alturaCaixa * 0.04;
}
