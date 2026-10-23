// Cada pessoa aparece uma vez, com seu melhor tempo neste navegador.
function normalizarNome(nome) {
  return typeof nome === 'string' ? nome.trim().replace(/\s+/g, ' ') : '';
}

function registroValido(nome, tempo) {
  return nome.length > 0 && nome.length <= 30 &&
    Number.isFinite(tempo) && tempo > 0;
}

function ordenarRanking(registros) {
  return registros.sort((a, b) => b.tempo - a.tempo || a.nome.localeCompare(b.nome, 'pt-BR'));
}

function lerRanking() {
  try {
    const salvos = JSON.parse(localStorage.getItem('robo-ranking') || '[]');
    if (!Array.isArray(salvos)) return [];
    const pessoas = new Map();
    for (const salvo of salvos) {
      const nome = normalizarNome(salvo?.nome);
      if (!registroValido(nome, salvo?.tempo)) continue;
      const chave = nome.toLocaleLowerCase('pt-BR');
      const anterior = pessoas.get(chave);
      if (!anterior || salvo.tempo > anterior.tempo) {
        pessoas.set(chave, { nome, tempo: salvo.tempo });
      }
    }
    return ordenarRanking([...pessoas.values()]);
  } catch {
    return [];
  }
}

function registrarTempo(nome, tempo) {
  nome = normalizarNome(nome);
  if (!registroValido(nome, tempo)) {
    return { ok: false, mensagem: 'Informe um nome de até 30 caracteres e um tempo válido.' };
  }
  const ranking = lerRanking();
  const pessoa = ranking.find(item => item.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'));
  const melhorou = !pessoa || tempo > pessoa.tempo;
  if (!pessoa) ranking.push({ nome, tempo });
  else if (melhorou) pessoa.tempo = tempo;
  ordenarRanking(ranking);
  try {
    localStorage.setItem('robo-ranking', JSON.stringify(ranking));
  } catch {
    return { ok: false, mensagem: 'Não foi possível salvar. Permita o armazenamento do navegador e tente novamente.' };
  }
  const posicao = ranking.findIndex(item => item.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR')) + 1;
  return {
    ok: true,
    mensagem: melhorou
      ? `Tempo registrado! Você está em ${posicao}º lugar.`
      : `Seu melhor tempo foi mantido. Você está em ${posicao}º lugar.`
  };
}
