// Ativa a tela cheia e ajusta a arena ao entrar ou sair dela.
async function alternarTelaCheia() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    } else {
      aviso.textContent = 'Tela cheia não disponível neste navegador.';
    }
  } catch {
    aviso.textContent = 'Não foi possível ativar a tela cheia.';
  }
}

function atualizarTelaCheia() {
  ajustarTela();
  const botao = document.getElementById('tela-cheia');
  const descricao = document.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia';
  botao.setAttribute('aria-label', descricao);
  botao.title = descricao;
}

document.getElementById('tela-cheia').addEventListener('click', alternarTelaCheia);
document.addEventListener('fullscreenchange', atualizarTelaCheia);
