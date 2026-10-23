// Lê as teclas de movimento, pulo e pausa.
function pressionarTecla(evento) {
  if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(evento.code)) {
    evento.preventDefault();
  }

  teclas[evento.code] = true;
  if (evento.repeat) {
    return;
  }

  if (['Space', 'ArrowUp', 'KeyW'].includes(evento.code)) {
    pular();
  }

  if (evento.code === 'KeyP') {
    pausar();
  }
}

function soltarTecla(evento) {
  teclas[evento.code] = false;
}

window.addEventListener('keydown', pressionarTecla);
window.addEventListener('keyup', soltarTecla);
