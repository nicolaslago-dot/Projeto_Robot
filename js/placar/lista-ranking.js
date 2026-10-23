const registros = lerRanking();
const lista = document.getElementById('lista-ranking');
document.getElementById('ranking-vazio').hidden = registros.length > 0;
document.getElementById('tabela-ranking').hidden = registros.length === 0;

registros.forEach((registro, indice) => {
  const linha = document.createElement('tr');
  for (const valor of [`${indice + 1}º`, registro.nome, `${registro.tempo.toFixed(1)} s`]) {
    const celula = document.createElement('td');
    celula.textContent = valor;
    linha.appendChild(celula);
  }
  lista.appendChild(linha);
});
