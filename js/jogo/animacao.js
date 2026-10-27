// Executa a simulação em passos fixos e desenha cada quadro.
function atualizar(segundos) {
  tempo += segundos;
  ultimaCaixa += segundos;
  ultimoEspinho += segundos;
  if (tempo >= 18) ultimaSerra += segundos;
  if (tempo >= 35) ultimoLaser += segundos;
  ultimaParede += segundos;

  atualizarRobo(segundos);
  atualizarObstaculos(segundos);
  if (!acabou) atualizarColetaveis(segundos);
}

function animar(agora) {
  let segundos = 0;
  if (quadroAnterior !== null) {
    segundos = Math.max(0, (agora - quadroAnterior) / 1000);
  }
  quadroAnterior = agora;

  if (!pausado && !acabou && !carregando) {
    acumulador += segundos;
    // A pequena tolerância compensa o arredondamento dos números decimais.
    while (acumulador + 1e-9 >= PASSO && !acabou) {
      atualizar(PASSO);
      acumulador = Math.max(0, acumulador - PASSO);
    }
  }

  desenhar();
  if (!acabou) {
    requestAnimationFrame(animar);
  }
}
