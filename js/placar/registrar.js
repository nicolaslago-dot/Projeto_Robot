// O tempo vem da partida; o jogador informa apenas seu nome.
(() => {
  const formulario = document.getElementById('registrar-tempo');
  if (!formulario) return;
  const nome = document.getElementById('nome-jogador');
  const salvar = document.getElementById('salvar-tempo');
  const mensagem = document.getElementById('mensagem-registro');
  const tempoPartida = lerTempoResultado();

  if (tempoPartida <= 0) {
    formulario.hidden = true;
    mensagem.textContent = 'Conclua uma partida para registrar seu tempo no ranking.';
    return;
  }

  nome.addEventListener('input', () => nome.setCustomValidity(''));
  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    if (salvar.disabled) return;
    if (!normalizarNome(nome.value)) {
      nome.setCustomValidity('Digite seu nome para registrar o tempo.');
      nome.reportValidity();
      return;
    }
    const resultado = registrarTempo(nome.value, tempoPartida);
    mensagem.textContent = resultado.mensagem;
    if (resultado.ok) {
      nome.disabled = true;
      salvar.disabled = true;
      salvar.textContent = 'Registrado';
    }
  });
})();
