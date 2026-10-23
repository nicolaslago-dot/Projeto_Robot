// Calcula os intervalos e velocidades conforme o tempo e a largura da arena.
function dificuldadeAtual() {
  const progresso = Math.min(1, tempo / 90);
  const intervaloTela = Math.max(1, Math.min(2, 800 / largura));
  return {
    intervaloCaixa: (1.25 - 0.6 * progresso) * intervaloTela,
    velocidadeCaixa: 200 + 160 * progresso,
    intervaloEspinho: 6 - progresso,
    avisoEspinho: 1.25,
    duracaoEspinho: 2.5 + 0.5 * progresso
  };
}
