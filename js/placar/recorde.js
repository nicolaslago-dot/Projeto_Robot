// Consulta e salva o melhor tempo no navegador, quando permitido.
function atualizarRecorde(tempo) {
  let recorde = tempo;
  try {
    const salvo = Number(localStorage.getItem('robo-recorde'));
    if (Number.isFinite(salvo)) {
      recorde = Math.max(tempo, salvo);
    }
    localStorage.setItem('robo-recorde', String(recorde));
  } catch {
    // Se o navegador bloquear o armazenamento, mostra o tempo desta partida.
  }
  return recorde;
}
