// Desenha o cronômetro, o robô e todos os obstáculos.
function desenharObstaculo(item) {
  if (item.tipo === 'espinho') {
    desenharEspinho(item);
  } else {
    desenharCaixa(item);
  }

  item.imagem.style.transform = `translate(${item.x}px, ${item.y}px)`;
}

function desenhar() {
  tempoTexto.textContent = tempo.toFixed(1);
  desenharRobo();
  obstaculos.forEach(desenharObstaculo);
}
