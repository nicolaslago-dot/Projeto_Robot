// Calcula os intervalos e velocidades conforme o tempo e a largura da arena.
function dificuldadeAtual() {
  const progresso = Math.min(1, tempo / 90);
  const intervaloTela = Math.max(1, Math.min(2, 800 / largura));
  return {
    nivel: 1 + Math.floor(progresso * 5),
    intervaloCaixa: (1.25 - 0.6 * progresso) * intervaloTela,
    velocidadeCaixa: 200 + 160 * progresso,
    intervaloEspinho: 6 - progresso,
    avisoEspinho: 1.25,
    duracaoEspinho: 2.5 + 0.5 * progresso,
    intervaloSerra: 13 - 4 * progresso,
    velocidadeSerra: 340 + 100 * progresso,
    avisoSerra: 1.6 - .3 * progresso,
    intervaloLaser: 18 - 5 * progresso,
    avisoLaser: 2.2 - .3 * progresso,
    duracaoLaser: 3 + progresso,
    fracaoLaser: .18 + .06 * progresso,
    intervaloParede: 12 - 3 * progresso,
    avisoParede: 2.4,
    duracaoParede: 4 + progresso
  };
}
