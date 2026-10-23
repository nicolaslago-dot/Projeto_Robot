// Exibe o recorte de uma imagem, preservando sua proporção.
function definirAsset(elemento, nome) {
  const larguraTela = elemento.clientWidth;
  const alturaTela = elemento.clientHeight;
  const renderizacao = nome + ':' + larguraTela + ':' + alturaTela;
  if (elemento.dataset.renderizacao === renderizacao) {
    return;
  }

  const asset = RECURSOS[nome];
  const [x, y, largura, altura] = asset.recorte;
  const escala = Math.min(larguraTela / largura, alturaTela / altura);

  let imagem = elemento.querySelector('img');
  if (!imagem) {
    imagem = document.createElement('img');
    imagem.alt = '';
    imagem.draggable = false;
    elemento.appendChild(imagem);
  }
  imagem.src = asset.caminho;
  // Mantém a proporção original e alinha a base do desenho ao chão.
  imagem.style.width = (asset.largura * escala) + 'px';
  imagem.style.height = (asset.altura * escala) + 'px';
  imagem.style.left = ((larguraTela - largura * escala) / 2 - x * escala) + 'px';
  imagem.style.top = (alturaTela - altura * escala - y * escala) + 'px';
  // Limita a exibição à área do recorte, em porcentagens da imagem original.
  const topo = y / asset.altura * 100;
  const direita = (asset.largura - x - largura) / asset.largura * 100;
  const base = (asset.altura - y - altura) / asset.altura * 100;
  const esquerda = x / asset.largura * 100;
  imagem.style.clipPath = `inset(${topo}% ${direita}% ${base}% ${esquerda}%)`;

  elemento.dataset.asset = nome;
  elemento.dataset.renderizacao = renderizacao;
}
