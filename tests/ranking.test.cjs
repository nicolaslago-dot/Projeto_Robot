const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function placar(storage = new Map()) {
  const context = vm.createContext({ localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value)
  } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/placar/ranking.js'), 'utf8'), context);
  return { run: source => vm.runInContext(source, context), storage };
}

test('salva nome e tempo, ordena do maior para o menor e persiste ao reabrir', () => {
  const { run, storage } = placar();
  run("registrarTempo('Ana', 12.3); registrarTempo('Bia', 35.7); registrarTempo('Caio', 20);");
  assert.equal(run('JSON.stringify(lerRanking())'), JSON.stringify([
    { nome: 'Bia', tempo: 35.7 }, { nome: 'Caio', tempo: 20 }, { nome: 'Ana', tempo: 12.3 }
  ]));
  assert.equal(placar(storage).run('lerRanking()[0].nome'), 'Bia');
});

test('mantém só o melhor tempo por nome, ignorando espaços extras e maiúsculas', () => {
  const { run } = placar();
  run("registrarTempo('  Ana   Silva  ', 20); registrarTempo('ana silva', 10); registrarTempo('ANA SILVA', 30);");
  assert.equal(run('lerRanking().length'), 1);
  assert.equal(run('lerRanking()[0].tempo'), 30);
});

test('recusa nomes vazios, longos e tempos inválidos sem gravar', () => {
  const { run, storage } = placar();
  for (const source of ["registrarTempo('   ', 10)", "registrarTempo('x'.repeat(31), 10)",
    "registrarTempo('Ana', -1)", "registrarTempo('Ana', 0)", "registrarTempo('Ana', Infinity)",
    "registrarTempo('Ana', NaN)", "registrarTempo('Ana', '12')"]) {
    assert.equal(run(source).ok, false);
  }
  assert.equal(storage.size, 0);
});

test('ranking vazio ou corrompido não derruba a página; registros inválidos são ignorados', () => {
  const { run, storage } = placar();
  for (const data of ['{', 'null', '{}']) {
    storage.set('robo-ranking', data);
    assert.equal(run('lerRanking().length'), 0);
  }
  storage.set('robo-ranking', JSON.stringify([null, { nome: '', tempo: 1 },
    { nome: 'Ana', tempo: -5 }, { nome: 'Bia', tempo: 15 }]));
  assert.equal(run('JSON.stringify(lerRanking())'), JSON.stringify([{ nome: 'Bia', tempo: 15 }]));
});

test('armazenamento bloqueado informa que o resultado não foi salvo', () => {
  const { run } = placar();
  run("localStorage.getItem = localStorage.setItem = () => { throw new Error('Bloqueado'); };");
  assert.equal(run('lerRanking().length'), 0);
  assert.equal(run("registrarTempo('Ana', 12)").ok, false);
});

function pagina(arquivo, search = '', storage = new Map()) {
  const elementos = new Map();
  function elemento() {
    return {
      textContent: '', value: '', hidden: false, disabled: false, filhos: [], eventos: {},
      appendChild(filho) { this.filhos.push(filho); },
      addEventListener(nome, callback) { this.eventos[nome] = callback; },
      setCustomValidity(valor) { this.validade = valor; }, reportValidity() {}
    };
  }
  const document = {
    getElementById(id) {
      if (!elementos.has(id)) elementos.set(id, elemento());
      return elementos.get(id);
    }, createElement: elemento
  };
  const context = vm.createContext({ document, URLSearchParams,
    window: { location: { search } },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, valor) => storage.set(key, valor) }
  });
  const html = fs.readFileSync(path.join(__dirname, '..', arquivo), 'utf8');
  for (const [, script] of html.matchAll(/<script src="([^"]+)" defer><\/script>/g)) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', script), 'utf8'), context);
  }
  return { document, storage };
}

test('fluxo da derrota registra o tempo real e mostra o nome no ranking ao reabrir', () => {
  const { document, storage } = pagina('gameover.html', '?tempo=42.7');
  document.getElementById('nome-jogador').value = 'Ana';
  const form = document.getElementById('registrar-tempo');
  form.eventos.submit({ preventDefault() {} });
  assert.equal(document.getElementById('salvar-tempo').disabled, true);
  assert.match(document.getElementById('mensagem-registro').textContent, /1º lugar/);
  form.eventos.submit({ preventDefault() {} });
  const ranking = pagina('ranking.html', '', storage).document;
  const linhas = ranking.getElementById('lista-ranking').filhos;
  assert.equal(linhas.length, 1);
  assert.deepEqual(linhas[0].filhos.map(item => item.textContent), ['1º', 'Ana', '42.7 s']);
  assert.equal(ranking.getElementById('ranking-vazio').hidden, true);
  assert.equal(ranking.getElementById('tabela-ranking').hidden, false);
});

test('sem partida não permite registro e ranking vazio exibe orientação', () => {
  const { document } = pagina('gameover.html');
  assert.equal(document.getElementById('registrar-tempo').hidden, true);
  const ranking = pagina('ranking.html').document;
  assert.equal(ranking.getElementById('ranking-vazio').hidden, false);
  assert.equal(ranking.getElementById('tabela-ranking').hidden, true);
});

test('nomes são renderizados como texto, inclusive quando contêm marcação HTML', () => {
  const storage = new Map([['robo-ranking', JSON.stringify([{ nome: '<img src=x onerror=alert(1)>', tempo: 12 }])]]);
  const { document } = pagina('ranking.html', '', storage);
  assert.equal(document.getElementById('lista-ranking').filhos[0].filhos[1].textContent, '<img src=x onerror=alert(1)>');
});
