const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Usa os mesmos scripts, na mesma ordem, que o navegador carrega.
function carregarPagina(pagina, context, antesDeCarregar = () => {}) {
  const html = fs.readFileSync(path.join(__dirname, '..', pagina), 'utf8');
  for (const [, arquivo] of html.matchAll(/<script src="([^"]+)" defer><\/script>/g)) {
    antesDeCarregar(arquivo);
    const source = fs.readFileSync(path.join(__dirname, '..', arquivo), 'utf8');
    vm.runInContext(source, context, { filename: arquivo });
  }
}

function game({ carregarImagens = false, falharImagem = false } = {}) {
  const elements = new Map();
  const listeners = new Map();
  const quadros = [];
  const timers = [];
  const imagens = [];
  function element() {
    return {
      clientWidth: 128, clientHeight: 119, offsetWidth: 128, offsetHeight: 119,
      dataset: {}, style: { setProperty() {} }, hidden: false, removed: false,
      classList: { add() {}, toggle() {} },
      appendChild() {}, setAttribute() {}, querySelector() { return null; },
      addEventListener(name, fn) { this[name] = fn; },
      remove() { this.removed = true; }
    };
  }
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    createElement: element, addEventListener(name, fn) { listeners.set(name, fn); }
  };
  document.getElementById('jogo').clientWidth = 1000;
  document.getElementById('jogo').clientHeight = 700;
  const properties = { '--area-inferior': '130', '--espinho-largura': '116', '--caixa-tamanho': '68' };
  let seed = 12345;
  const math = Object.create(Math);
  math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
  const context = vm.createContext({
    document, console, Math: math, performance: { now: () => 0 },
    screen: { orientation: { addEventListener() {} } },
    window: {
      addEventListener(name, fn) { listeners.set(name, fn); },
      setTimeout(callback, delay) { timers.push({ callback, delay }); },
      location: { href: '' }
    },
    getComputedStyle: () => ({ getPropertyValue: name => properties[name] }),
    requestAnimationFrame(callback) { quadros.push(callback); },
    Image: class {
      set src(caminho) {
        imagens.push(caminho);
        if (carregarImagens) {
          if (falharImagem) this.onerror();
          else this.onload();
        }
      }
    }
  });
  carregarPagina('game.html', context, arquivo => {
    if (arquivo === 'js/game.js' && !carregarImagens) {
      vm.runInContext('precarregarAssets = () => new Promise(() => {});', context);
    }
  });
  const run = code => vm.runInContext(code, context);
  if (!carregarImagens) run('carregando = false;');
  return { run, document, listeners, properties, quadros, timers, imagens };
}

test('um segundo em quadros lentos mantém o cronômetro e os 280 pixels de movimento', () => {
  for (const fps of [10, 30, 60, 144]) {
    const { run } = game();
    run('robo.x = 0; teclas.ArrowRight = true; animar(100);');
    for (let frame = 1; frame <= fps; frame++) run(`animar(${100 + frame * 1000 / fps});`);
    assert.ok(Math.abs(run('tempo') - 1) < .009, `${fps} FPS: cronômetro`);
    assert.ok(Math.abs(run('robo.x') - 280) < 2.4, `${fps} FPS: velocidade`);
  }
});

test('resize preserva os obstáculos, suas idades e o aviso dos espinhos', () => {
  const { run, document, properties } = game();
  run("criarObstaculo('caixa'); criarObstaculo('espinho'); obstaculos[0].y = 200; obstaculos[1].idade = .7; globalThis.anteriores = [...obstaculos];");
  document.getElementById('jogo').clientWidth = 400;
  document.getElementById('jogo').clientHeight = 550;
  document.getElementById('robo').offsetWidth = 108;
  document.getElementById('robo').offsetHeight = 100;
  properties['--caixa-tamanho'] = '60';
  properties['--espinho-largura'] = '100';
  run('ajustarTela();');
  assert.equal(run('obstaculos.length'), 2);
  assert.equal(run('obstaculos[0] === anteriores[0] && obstaculos[1] === anteriores[1]'), true);
  assert.equal(run('obstaculos[1].idade'), .7);
  assert.equal(run('obstaculos.some(item => item.imagem.removed || item.aviso?.removed)'), false);
  assert.ok(run('obstaculos.every(item => item.x >= 0 && item.x + item.largura <= largura)'));
  assert.equal(run('obstaculos[1].y + obstaculos[1].altura'), run('chao'));
  assert.equal(run('obstaculos[0].largura'), 60);
});

test('pausar e continuar sem quadros intermediários não contabiliza a pausa', () => {
  const { run } = game();
  run('animar(100); animar(200); pausar(); pausar(); animar(5200);');
  assert.ok(Math.abs(run('tempo') - .1) < .009);
});

test('o primeiro quadro com timestamp zero também é uma referência válida', () => {
  const { run } = game();
  run('animar(0); animar(100);');
  assert.ok(Math.abs(run('tempo') - .1) < .009);
});

test('uma engasgada de 500 ms mantém a mesma queda, pulo e tempo que 60 FPS', () => {
  function simulate(frames) {
    const { run } = game();
    run("criarObstaculo('caixa'); obstaculos[0].x = 850; pular(); animar(0);");
    for (let i = 1; i <= frames; i++) run(`animar(${i * 500 / frames});`);
    return JSON.parse(run('JSON.stringify([tempo, robo.y, robo.velocidadeY, obstaculos[0].y])'));
  }
  assert.deepEqual(simulate(1), simulate(30));
});

test('caixas atingem o robô durante uma engasgada sem atravessá-lo', () => {
  const { run } = game();
  run("criarObstaculo('caixa'); obstaculos[0].x = robo.x + 30; obstaculos[0].y = robo.y - 100; animar(0); animar(1000);");
  assert.equal(run('acabou'), true);
  assert.ok(run('tempo < 1'));
  assert.equal(run('imagemRobo.dataset.asset'), 'robo-morrendo');
});

test('a caixa ainda atinge o robô no passo em que toca o chão', () => {
  const { run } = game();
  run("criarObstaculo('caixa'); obstaculos[0].x = robo.x + 30; obstaculos[0].y = chao - obstaculos[0].altura - 1; atualizar(1 / 120);");
  assert.equal(run('acabou'), true);
});

test('caixa quebrada é inofensiva e removida depois da animação', () => {
  const { run } = game();
  run("criarObstaculo('caixa'); obstaculos[0].x = 0; obstaculos[0].y = chao - obstaculos[0].altura; atualizar(1 / 120); globalThis.caixa = obstaculos[0]; robo.x = 0; atualizar(.2);");
  assert.equal(run('acabou'), false);
  assert.equal(run('caixa.quebrada'), true);
  run('atualizar(.21);');
  assert.equal(run('obstaculos.includes(caixa)'), false);
  assert.equal(run('caixa.imagem.removed'), true);
});

test('margens vazias do robô não matam, contato com a caixa mata', () => {
  const { run } = game();
  run("criarObstaculo('caixa'); globalThis.caixa = obstaculos[0]; caixa.y = robo.y; caixa.x = robo.x + robo.largura - 10;");
  assert.equal(run('colidiu(caixa)'), false);
  run('caixa.x = robo.x + robo.largura / 2;');
  assert.equal(run('colidiu(caixa)'), true);
});

test('colisão dos espinhos segue as lâminas e permite passar acima e ao lado', () => {
  const { run } = game();
  run("criarObstaculo('espinho'); globalThis.espinho = obstaculos[0]; espinho.x = 400; robo.x = 400;");
  assert.equal(run('colidiu(espinho)'), true);
  run('robo.y = espinho.y - robo.altura;');
  assert.equal(run('colidiu(espinho)'), false);
  run('robo.x = espinho.x - robo.largura * .88 + 5; robo.y = chao - robo.altura;');
  assert.equal(run('colidiu(espinho)'), false);
});

test('espinhos só matam depois de 1,25 s de aviso', () => {
  const { run } = game();
  run("criarObstaculo('espinho'); obstaculos[0].x = robo.x; atualizar(1.24);");
  assert.equal(run('acabou'), false);
  run('atualizar(.02);');
  assert.equal(run('acabou'), true);
});

test('espinho expirado desaparece sem causar colisão adicional', () => {
  const { run } = game();
  run("criarObstaculo('espinho'); globalThis.espinho = obstaculos[0]; espinho.x = robo.x; espinho.idade = espinho.tempoAviso + espinho.duracao - .001; atualizar(.01);");
  assert.equal(run('acabou'), false);
  assert.equal(run('obstaculos.length'), 0);
  assert.equal(run('espinho.aviso.removed'), true);
});

test('dificuldade cresce gradualmente, tem limite e dá mais intervalo no celular', () => {
  const { run } = game();
  const difficulty = t => JSON.parse(run(`tempo = ${t}; JSON.stringify(dificuldadeAtual());`));
  const start = difficulty(0), middle = difficulty(45), end = difficulty(90);
  assert.ok(start.intervaloCaixa > middle.intervaloCaixa && middle.intervaloCaixa > end.intervaloCaixa);
  assert.ok(start.velocidadeCaixa < middle.velocidadeCaixa && middle.velocidadeCaixa < end.velocidadeCaixa);
  assert.ok(end.intervaloCaixa >= .65 && end.velocidadeCaixa <= 360);
  assert.deepEqual(end, difficulty(900));
  run('largura = 400;');
  assert.ok(difficulty(90).intervaloCaixa >= end.intervaloCaixa * 2);
});

test('surgimentos preservam uma faixa de fuga e limitam a uma armadilha de chão', () => {
  const { run } = game();
  run("largura = 400; for (let i = 0; i < 40; i++) criarObstaculo(i % 2 ? 'caixa' : 'espinho');");
  assert.ok(run('obstaculos.length > 0'));
  assert.ok(run("obstaculos.filter(item => item.tipo === 'espinho').length <= 1"));
  const lanes = JSON.parse(run('JSON.stringify(obstaculos.map(item => [item.x, item.x + item.largura]).sort((a,b) => a[0] - b[0]))'));
  let end = 0, biggestGap = 0;
  for (const [start, right] of lanes) { biggestGap = Math.max(biggestGap, start - end); end = Math.max(end, right); }
  biggestGap = Math.max(biggestGap, 400 - end);
  assert.ok(biggestGap >= 128 + 24);
});

test('tela cheia preserva estado da partida, caixas quebradas e avisos', () => {
  const { run, document, listeners } = game();
  run("criarObstaculo('caixa'); criarObstaculo('espinho'); obstaculos[0].quebrada = true; obstaculos[0].tempoQuebrada = .2; tempo = 12; robo.velocidadeY = -200; globalThis.caixa = obstaculos[0];");
  document.getElementById('jogo').clientHeight = 900;
  listeners.get('fullscreenchange')();
  assert.equal(run('obstaculos.length'), 2);
  assert.equal(run('caixa.quebrada && caixa.tempoQuebrada === .2'), true);
  assert.equal(run('caixa.y + caixa.altura'), run('chao'));
  assert.equal(run('robo.velocidadeY'), -200);
  assert.equal(run('tempo'), 12);
});

test('a página inicia a animação somente depois de carregar as imagens', async () => {
  const { run, document, quadros, imagens } = game({ carregarImagens: true });
  assert.equal(run('carregando'), true);
  assert.equal(quadros.length, 0);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(run('carregando'), false);
  assert.equal(quadros.length, 1);
  assert.match(document.getElementById('aviso').textContent, /Use as setas/);
  assert.ok(imagens.length > 0);
  for (const imagem of imagens) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', imagem)), imagem);
  }
});

test('falha no carregamento mantém a partida parada e mostra o aviso', async () => {
  const { run, document, quadros } = game({ carregarImagens: true, falharImagem: true });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(run('carregando'), true);
  assert.equal(quadros.length, 0);
  assert.match(document.getElementById('aviso').textContent, /Algumas imagens não carregaram/);
});

test('teclado move, pula e pausa depois de carregar os scripts separados', () => {
  const { run, document, listeners } = game();
  const xInicial = run('robo.x');
  listeners.get('keydown')({ code: 'KeyD', repeat: false });
  run('atualizar(.1);');
  assert.equal(run('robo.x'), xInicial + 28);
  listeners.get('keyup')({ code: 'KeyD' });
  run('atualizar(.1);');
  assert.equal(run('robo.x'), xInicial + 28);
  let preveniu = false;
  listeners.get('keydown')({ code: 'Space', repeat: false, preventDefault() { preveniu = true; } });
  assert.equal(preveniu, true);
  assert.equal(run('robo.velocidadeY'), -540);
  listeners.get('keydown')({ code: 'KeyP', repeat: false });
  assert.equal(run('pausado'), true);
  assert.equal(document.getElementById('pausa').hidden, false);
  document.getElementById('pausar').click();
  assert.equal(run('pausado'), false);
});

test('desenho preserva o aviso dos espinhos e a pose das caixas quebradas', () => {
  const { run } = game();
  run("criarObstaculo('espinho'); criarObstaculo('caixa'); globalThis.espinho = obstaculos[0]; globalThis.caixa = obstaculos[1]; desenhar();");
  assert.equal(run('espinho.aviso.hidden'), false);
  assert.equal(run('espinho.imagem.dataset.asset'), 'espinhos');
  assert.equal(run('caixa.imagem.dataset.asset'), 'caixa-caindo');
  run('espinho.idade = espinho.tempoAviso; caixa.quebrada = true; desenhar();');
  assert.equal(run('espinho.aviso.hidden'), true);
  assert.equal(run('caixa.imagem.dataset.asset'), 'caixa-quebrada');
});

test('derrota abre a tela de resultado uma única vez com o tempo da partida', () => {
  const { run, timers } = game();
  run('tempo = 12.34; gameOver(); gameOver();');
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 650);
  timers[0].callback();
  assert.equal(run('window.location.href'), 'gameover.html?tempo=12.3');
});

test('sensor calibra a inclinação, move o robô e pode ser desativado', async () => {
  const { run, document, listeners } = game();
  run('window.isSecureContext = true; window.DeviceOrientationEvent = globalThis.DeviceOrientationEvent = function () {};');
  const botao = document.getElementById('sensor');
  await botao.click();
  assert.equal(run('sensorAtivo'), true);
  listeners.get('deviceorientation')({ gamma: 10, beta: 0 });
  const xInicial = run('robo.x');
  run('atualizar(.1);');
  assert.equal(run('robo.x'), xInicial);
  listeners.get('deviceorientation')({ gamma: 30, beta: 0 });
  run('atualizar(.1);');
  assert.equal(run('robo.x'), xInicial + 28);
  await botao.click();
  assert.equal(run('sensorAtivo'), false);
  run('atualizar(.1);');
  assert.equal(run('robo.x'), xInicial + 28);
});

function resultado(search, storage) {
  const elementos = { resultado: {}, recorde: {} };
  const context = vm.createContext({
    URLSearchParams,
    window: { location: { search } },
    document: { getElementById: id => elementos[id] },
    localStorage: storage
  });
  carregarPagina('gameover.html', context);
  return elementos;
}

test('placar mostra o tempo da URL e mantém o melhor resultado no navegador', () => {
  let salvo = '20';
  const storage = {
    getItem(chave) { assert.equal(chave, 'robo-recorde'); return salvo; },
    setItem(chave, valor) { assert.equal(chave, 'robo-recorde'); salvo = valor; }
  };
  const primeiro = resultado('?tempo=12.3', storage);
  assert.equal(primeiro.resultado.textContent, '12.3');
  assert.equal(primeiro.recorde.textContent, '20.0');
  assert.equal(salvo, '20');
  const segundo = resultado('?tempo=25.6', storage);
  assert.equal(segundo.resultado.textContent, '25.6');
  assert.equal(segundo.recorde.textContent, '25.6');
  assert.equal(salvo, '25.6');
});

test('placar funciona sem armazenamento e rejeita tempos inválidos', () => {
  const bloqueado = { getItem() { throw new Error('Armazenamento bloqueado'); } };
  const valido = resultado('?tempo=8.2', bloqueado);
  assert.equal(valido.resultado.textContent, '8.2');
  assert.equal(valido.recorde.textContent, '8.2');
  for (const search of ['', '?tempo=abc', '?tempo=-1', '?tempo=Infinity']) {
    const invalido = resultado(search, bloqueado);
    assert.equal(invalido.resultado.textContent, '0.0');
    assert.equal(invalido.recorde.textContent, '0.0');
  }
});
