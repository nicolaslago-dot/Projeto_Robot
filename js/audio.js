// Um controlador compartilhado pelas páginas, sem depender do carregamento dos sons.
const AudioJogo = (() => {
  if (typeof Audio === 'undefined') {
    return { efeito() {}, pausar() {}, encerrar() {}, iniciar() {} };
  }

  const arquivos = {
    menu: ['musica-de-menu.mp3', .3, true],
    jogo: ['so-durante-jogo.mp3', .25, true],
    gameover: ['som-de-tela-de-gameover.mp3', .35, false],
    pulo: ['som-pulo.mp3', .5, false],
    morte: ['som-de-morte.mp3', .65, false]
  };
  const sons = {};
  let mudo = false;
  let pausado = false;
  let encerrado = false;
  const botao = document.getElementById('som');
  const pagina = botao?.dataset.musica;
  // A partida só toca depois de terminar o carregamento das imagens.
  let pronto = pagina !== 'jogo';
  try { mudo = localStorage.getItem('robo-som-mudo') === 'true'; } catch {}

  for (const [nome, [arquivo, volume, loop]] of Object.entries(arquivos)) {
    const som = new Audio('midia/' + arquivo);
    som.volume = volume;
    som.loop = loop;
    som.preload = 'auto';
    sons[nome] = som;
  }

  function tocar(som) {
    if (!som || mudo || pausado || document.hidden) return;
    // Autoplay pode ser bloqueado; a próxima interação tenta novamente.
    try { som.play()?.catch(() => {}); } catch {}
  }

  function musica() {
    if (pronto && !encerrado && sons[pagina]?.paused && !sons[pagina].ended) tocar(sons[pagina]);
  }

  function atualizarBotao() {
    if (!botao) return;
    botao.textContent = mudo ? 'Som: desligado' : 'Som: ligado';
    botao.setAttribute('aria-pressed', String(mudo));
    botao.setAttribute('aria-label', mudo ? 'Ativar som' : 'Desativar som');
    botao.title = mudo ? 'Ativar som' : 'Desativar som';
  }

  botao?.addEventListener('click', () => {
    mudo = !mudo;
    try { localStorage.setItem('robo-som-mudo', String(mudo)); } catch {}
    if (mudo) Object.values(sons).forEach(som => som.pause());
    else musica();
    atualizarBotao();
  });
  document.addEventListener('pointerdown', musica);
  document.addEventListener('keydown', musica);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) Object.values(sons).forEach(som => som.pause());
    else musica();
  });
  window.addEventListener('pagehide', () => Object.values(sons).forEach(som => som.pause()));
  atualizarBotao();
  musica();

  return {
    iniciar() { pronto = true; musica(); },
    efeito(nome) {
      const som = sons[nome];
      if (!som || mudo || pausado || document.hidden) return;
      som.currentTime = 0;
      tocar(som);
    },
    pausar(valor) {
      pausado = valor;
      if (valor) Object.values(sons).forEach(som => som.pause());
      else musica();
    },
    encerrar() {
      encerrado = true;
      Object.values(sons).forEach(som => som.pause());
    }
  };
})();
