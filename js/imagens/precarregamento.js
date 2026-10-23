// Carrega as imagens antes de iniciar a partida.
function carregarImagem(caminho) {
  return new Promise(resolve => {
    const imagem = new Image();
    imagem.onload = () => resolve(true);
    imagem.onerror = () => resolve(false);
    imagem.src = caminho;
  });
}

function precarregarAssets() {
  const caminhos = Object.values(RECURSOS).map(asset => asset.caminho);
  const caminhosUnicos = [...new Set(caminhos)];

  return Promise.all(caminhosUnicos.map(carregarImagem));
}
