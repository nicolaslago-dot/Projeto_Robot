// Controla a pausa pelo botão e quando a página perde o foco.
function pausar() {
  if (acabou || carregando) {
    return;
  }

  pausado = !pausado;
  AudioJogo.pausar(pausado);
  // A referência é refeita mesmo se o navegador parar de desenhar durante a pausa.
  quadroAnterior = null;
  document.getElementById('pausa').hidden = !pausado;
  const descricao = pausado ? 'Continuar' : 'Pausar';
  botaoPausa.setAttribute('aria-label', descricao);
  botaoPausa.title = descricao;
  botaoPausa.setAttribute('aria-pressed', String(pausado));
  for (const tecla of Object.keys(teclas)) {
    delete teclas[tecla];
  }
}
botaoPausa.addEventListener('click', pausar);

function pausarAoSair() {
  if (!pausado) {
    pausar();
  }
}

window.addEventListener('blur', pausarAoSair);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pausarAoSair();
  }
});
