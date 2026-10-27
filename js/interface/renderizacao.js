// Desenha o cronômetro, o robô e todos os obstáculos.
function desenharObstaculo(item) {
  if (item.tipo === 'parede') {
    desenharParede(item);
    return;
  }
  if (item.tipo === 'laser') {
    desenharLaser(item);
    return;
  }
  if (item.tipo === 'espinho') {
    desenharEspinho(item);
  } else if (item.tipo === 'serra') {
    desenharSerra(item);
  } else {
    desenharCaixa(item);
  }

  item.imagem.style.transform = `translate(${item.x}px, ${item.y}px)`;
}

function desenhar() {
  tempoTexto.textContent = tempo.toFixed(1);
  document.getElementById('nivel').textContent = dificuldadeAtual().nivel;
  desenharRobo();
  obstaculos.forEach(desenharObstaculo);
  desenharColetaveis();
}
