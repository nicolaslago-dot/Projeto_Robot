// As paredes ocupam as laterais inteiras e deixam um corredor no centro.
function criarParedes(item) {
  item.paredes = ['esquerda', 'direita'].map(lado => {
    const painel = document.createElement('div');
    painel.className = 'parede-laser parede-' + lado;
    item.imagem.appendChild(painel);
    return painel;
  });
}

function atualizarParede(item) {
  const ativo = item.idade - item.tempoAviso;
  item.abertura = Math.max(0, Math.min(1, ativo / .8, (item.duracao - ativo) / .8));
}

function desenharParede(item) {
  const aviso = item.idade < item.tempoAviso;
  item.imagem.classList.toggle('parede-aviso', aviso);
  item.imagem.style.width = largura + 'px';
  item.imagem.style.height = chao + 'px';
  item.imagem.hidden = !aviso && item.abertura <= 0;
  const alcance = aviso ? item.largura : item.largura * item.abertura;
  for (const painel of item.paredes) painel.style.width = alcance + 'px';
}
