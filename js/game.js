// Ponto de entrada: prepara a arena, carrega as imagens e inicia a animação.
async function iniciarJogo() {
  ajustarTela();
  robo.x = (largura - robo.largura) / 2;

  const resultados = await precarregarAssets();
  if (!resultados.every(Boolean)) {
    console.error('Algumas imagens não carregaram. Recarregue a página.');
    return;
  }
  carregando = false;
  requestAnimationFrame(animar);
}

iniciarJogo();
