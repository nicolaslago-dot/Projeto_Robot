// Cria o aviso dos espinhos e controla seu período de perigo e sua aparência.
function criarAvisoEspinho() {
  const avisoEspinho = document.createElement('div');
  avisoEspinho.className = 'aviso-espinho';
  avisoEspinho.setAttribute('aria-hidden', 'true');
  const sinal = document.createElement('span');
  sinal.className = 'sinal-alerta';
  sinal.textContent = '!';
  avisoEspinho.appendChild(sinal);
  return avisoEspinho;
}

function espinhoPerigoso(item) {
  return item.idade >= item.tempoAviso && item.idade < item.tempoAviso + item.duracao;
}

function desenharEspinho(item) {
  definirAsset(item.imagem, 'espinhos');
  const levantado = item.idade >= item.tempoAviso;
  item.imagem.classList.toggle('espinho-ativo', levantado);
  const abertura = Math.max(0, Math.min(1, (item.idade - item.tempoAviso + 0.18) / 0.18));
  item.imagem.style.setProperty('--abertura', abertura);
  item.aviso.hidden = levantado;
  item.aviso.style.transform = `translate(${item.x - 8}px, ${chao - item.alturaRecolhida - 42}px)`;
}
