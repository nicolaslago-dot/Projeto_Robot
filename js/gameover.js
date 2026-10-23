// Preenche o placar da página de resultado.
const tempo = lerTempoResultado();
const recorde = atualizarRecorde(tempo);

document.getElementById('resultado').textContent = tempo.toFixed(1);
document.getElementById('recorde').textContent = recorde.toFixed(1);
