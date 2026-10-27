// Duas esferas alinhadas carregam, disparam um feixe vertical e desaparecem.
function criarEmissoresLaser(item) {
  item.feixe = document.createElement('div');
  item.feixe.className = 'laser-feixe';
  item.imagem.appendChild(item.feixe);
  item.emissores = ['topo', 'chao'].map(posicao => {
    const emissor = document.createElement('div');
    emissor.className = 'sprite emissor-laser emissor-' + posicao;
    item.imagem.appendChild(emissor);
    return emissor;
  });
}

function laserPerigoso(item) {
  return item.idade >= item.tempoAviso && item.idade < item.tempoAviso + item.duracao;
}

function atualizarLaser(item) {
  const ativo = item.idade - item.tempoAviso;
  item.abertura = Math.max(0, Math.min(1, ativo / .18, (item.duracao - ativo) / .25));
  item.visibilidade = Math.max(0, Math.min(1, item.idade / .3,
    (item.tempoAviso + item.duracao + .35 - item.idade) / .35));
}

function desenharLaser(item) {
  const aviso = item.idade < item.tempoAviso;
  item.imagem.classList.toggle('laser-aviso', aviso);
  item.imagem.style.transform = `translate(${item.x}px, ${item.y}px)`;
  item.imagem.style.opacity = item.visibilidade;
  item.imagem.style.setProperty('--emissor-tamanho', item.tamanhoEmissor + 'px');
  item.imagem.style.setProperty('--abertura', item.abertura);
  item.imagem.style.setProperty('--carga', Math.min(1, item.idade / item.tempoAviso));
  item.feixe.hidden = !aviso && !laserPerigoso(item);
  for (const emissor of item.emissores) {
    emissor.style.width = emissor.style.height = item.tamanhoEmissor + 'px';
  }
}
