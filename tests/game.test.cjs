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

test('serra avisa, emerge do chão, atravessa a arena e desaparece', () => {
  const { run } = game();
  assert.equal(run("criarObstaculo('serra')"), true);
  run('globalThis.serra = obstaculos[0]; robo.x = largura / 2;');
  assert.equal(run('serraPerigosa(serra)'), false);
  const inicio = run('serra.x');
  run('serra.idade = serra.tempoAviso + .35; atualizarSerra(serra, 0);');
  assert.equal(run('serraPerigosa(serra)'), true);
  assert.ok(run('serra.largura > 100'));
  assert.equal(run('serra.y + serra.altura / 2'), run('chao'));
  run('desenharSerra(serra);');
  assert.equal(run('serra.imagem.dataset.asset'), 'serra-circular');
  run('serra.idade += .1; atualizarSerra(serra, .1);');
  assert.notEqual(run('serra.x'), inicio);
  run('robo.x = serra.x; robo.y = chao - robo.altura;');
  assert.equal(run('colidiu(serra)'), true);
  run('robo.y -= 100;');
  assert.equal(run('colidiu(serra)'), false);
  run('for (let i = 0; i < 2000 && !obstaculoExpirou(serra); i++) { serra.idade += PASSO; atualizarSerra(serra, PASSO); }');
  assert.equal(run('obstaculoExpirou(serra)'), true);
});

test('duas esferas carregam, disparam uma barreira vertical e somem após desligar', () => {
  const { run } = game();
  assert.equal(run("criarObstaculo('laser')"), true);
  run('globalThis.laser = obstaculos[0]; robo.x = laser.x - robo.largura / 2;');
  assert.equal(run('laser.emissores.length'), 2);
  assert.ok(run('laser.tamanhoEmissor <= 18'));
  assert.equal(run('laserPerigoso(laser)'), false);
  run('laser.idade = laser.tempoAviso + .5; atualizarLaser(laser);');
  assert.equal(run('laserPerigoso(laser)'), true);
  assert.equal(run('colidiu(laser)'), true);
  run('robo.x = (largura - robo.largura) / 2;');
  assert.equal(run('colidiu(laser)'), false);
  run('robo.x = 0;');
  assert.equal(run('colidiu(laser)'), false);
  run('robo.x = largura - robo.largura;');
  assert.equal(run('colidiu(laser)'), false);
  run('laser.idade = laser.tempoAviso + laser.duracao; atualizarLaser(laser);');
  assert.equal(run('laserPerigoso(laser)'), false);
  assert.equal(run('obstaculoExpirou(laser)'), false);
  run('laser.idade += .36; atualizarObstaculos(0);');
  assert.equal(run('obstaculoExpirou(laser)'), true);
  assert.equal(run('obstaculos.includes(laser)'), false);
  assert.equal(run('laser.imagem.removed'), true);
});

test('ameaças entram aos poucos e tipos diferentes podem surgir juntos', () => {
  const { run } = game();
  run('ultimaSerra = ultimoLaser = 100; gerarObstaculos(dificuldadeAtual());');
  assert.equal(run("obstaculos.some(item => item.tipo === 'serra' || item.tipo === 'laser')"), false);
  run("tempo = 20; ultimaSerra = 100; gerarObstaculos(dificuldadeAtual());");
  assert.equal(run("obstaculos.some(item => item.tipo === 'serra')"), true);
  assert.equal(run("criarObstaculo('laser')"), true);
  assert.equal(run("criarObstaculo('espinho')"), true);
  assert.equal(run("criarObstaculo('serra')"), false);
  assert.equal(run("criarObstaculo('laser')"), false);
});

test('resize e pausa preservam serra, laser e paredes sem avançar os perigos', () => {
  for (const tipo of ['serra', 'laser', 'parede']) {
    const { run, document } = game();
    run(`criarObstaculo('${tipo}'); globalThis.item = obstaculos[0]; item.idade = item.tempoAviso + .7;`);
    run(tipo === 'serra' ? 'atualizarSerra(item, .1);' : tipo === 'laser' ? 'atualizarLaser(item);' : 'atualizarParede(item);');
    const idade = run('item.idade');
    document.getElementById('jogo').clientWidth = 360;
    run('ajustarTela(); pausar(); animar(0); animar(10000);');
    assert.equal(run('item.idade'), idade);
    assert.equal(run('obstaculos.includes(item)'), true);
    assert.ok(run('Number.isFinite(item.x) && Number.isFinite(item.y)'));
    if (tipo === 'parede') {
      assert.ok(run('largura - 2 * item.largura >= robo.largura + 24'));
    } else if (tipo === 'laser') {
      assert.ok(run('Math.max(item.x, largura - item.x - item.largura) >= robo.largura + 24'));
    } else {
      assert.equal(run('item.y + item.altura / 2'), run('chao'));
    }
  }
});

test('partida de cinco minutos mantém caixas e serras em todos os minutos com perigos simultâneos', () => {
  for (const tamanho of [360, 390, 1000, 1920]) {
    const { run, document } = game();
    document.getElementById('jogo').clientWidth = tamanho;
    if (tamanho < 520) {
      document.getElementById('robo').offsetWidth = 108;
      document.getElementById('robo').offsetHeight = 100;
    }
    run('ajustarTela();');
    // A geração usa o código real; somente a morte fica suspensa nesta simulação.
    const resultado = JSON.parse(run(`
      colidiu = () => false;
      globalThis.minutos = Array.from({ length: 5 }, () => ({}));
      globalThis.criados = new Set();
      globalThis.combinacoes = new Set();
      for (let i = 0; i < 300 * 120; i++) {
        atualizar(PASSO);
        for (const item of obstaculos) {
          if (!criados.has(item)) {
            criados.add(item);
            const minuto = minutos[Math.min(4, Math.floor(tempo / 60))];
            minuto[item.tipo] = (minuto[item.tipo] || 0) + 1;
          }
        }
        if (obstaculos.some(item => item.tipo === 'serra')) {
          for (const item of obstaculos) if (!item.quebrada) combinacoes.add(item.tipo);
        }
        for (const tipo of ['serra', 'espinho', 'laser', 'parede']) {
          if (obstaculos.filter(item => item.tipo === tipo).length > 1) throw Error('Perigo duplicado: ' + tipo);
        }
      }
      JSON.stringify({ minutos, combinacoes: [...combinacoes].sort() });
    `));
    for (const minuto of resultado.minutos) {
      assert.ok(minuto.caixa >= 10, `${tamanho}px: ${JSON.stringify(resultado)}`);
      assert.ok(minuto.serra >= 1, `${tamanho}px: ${JSON.stringify(resultado)}`);
    }
    assert.deepEqual(resultado.combinacoes, ['caixa', 'espinho', 'laser', 'parede', 'serra']);
  }
});

test('novas caixas respeitam a barreira e o espaço dos emissores do laser', () => {
  const { run } = game();
  run("criarObstaculo('laser'); globalThis.laser = obstaculos[0]; for (let i = 0; i < 40; i++) criarObstaculo('caixa');");
  assert.ok(run("obstaculos.some(item => item.tipo === 'caixa')"));
  assert.equal(run("obstaculos.filter(item => item.tipo === 'caixa').every(item => item.x + item.largura <= laser.x + laser.largura / 2 - laser.tamanhoEmissor / 2 - 16 || item.x >= laser.x + laser.largura / 2 + laser.tamanhoEmissor / 2 + 16)"), true);
});

test('avisos dos novos perigos são inofensivos; contato após ativar encerra a partida', () => {
  for (const tipo of ['serra', 'laser', 'parede']) {
    const { run } = game();
    run(`criarObstaculo('${tipo}'); globalThis.item = obstaculos[0]; robo.x = ${tipo === 'serra' ? 'item.x' : tipo === 'parede' ? '0' : 'item.x - robo.largura / 2'}; atualizarObstaculos(.01);`);
    assert.equal(run('acabou'), false, tipo + ': aviso');
    run('item.idade = item.tempoAviso + .2; atualizarObstaculos(PASSO);');
    assert.equal(run('acabou'), true, tipo + ': ativação');
  }
});

test('paredes fecham pelas duas laterais, deixam o centro livre e recuam antes de sumir', () => {
  const { run } = game();
  assert.equal(run("criarObstaculo('parede')"), true);
  run('globalThis.parede = obstaculos[0];');
  assert.equal(run('parede.paredes.length'), 2);
  assert.equal(run('laserPerigoso(parede)'), false);
  run('parede.idade = parede.tempoAviso + .2; atualizarParede(parede);');
  const inicio = run('parede.largura * parede.abertura');
  run('parede.idade += .6; atualizarParede(parede);');
  const fechamento = run('parede.largura * parede.abertura');
  assert.ok(fechamento > inicio);
  for (const x of ['0', 'largura - robo.largura']) {
    run(`robo.x = ${x};`);
    assert.equal(run('colidiu(parede)'), true);
  }
  run('robo.x = (largura - robo.largura) / 2;');
  assert.equal(run('colidiu(parede)'), false);
  run('parede.idade = parede.tempoAviso + parede.duracao - .4; atualizarParede(parede);');
  assert.ok(run('parede.largura * parede.abertura') < fechamento);
  run('parede.idade = parede.tempoAviso + parede.duracao; atualizarParede(parede);');
  assert.equal(run('parede.abertura'), 0);
  assert.equal(run('laserPerigoso(parede)'), false);
  run('parede.idade += .36; atualizarObstaculos(0);');
  assert.equal(run('obstaculos.includes(parede)'), false);
  assert.equal(run('parede.imagem.removed'), true);
});

test('paredes começam a ficar disponíveis aos 12 segundos, antes do laser entre bolinhas', () => {
  const { run } = game();
  run('ultimaParede = 12; tempo = 11.9; gerarObstaculos(dificuldadeAtual());');
  assert.equal(run("obstaculos.some(item => item.tipo === 'parede')"), false);
  run('tempo = 12; gerarObstaculos(dificuldadeAtual());');
  assert.equal(run("obstaculos.some(item => item.tipo === 'parede')"), true);
  assert.equal(run("obstaculos.some(item => item.tipo === 'laser')"), false);
});

test('caixas reservam o corredor de fuga entre as paredes e as bolinhas continuam sendo outro obstáculo', () => {
  const { run } = game();
  run("criarObstaculo('parede'); globalThis.parede = obstaculos[0]; for (let i = 0; i < 40; i++) criarObstaculo('caixa');");
  assert.ok(run("obstaculos.some(item => item.tipo === 'caixa')"));
  assert.equal(run("obstaculos.filter(item => item.tipo === 'caixa').every(item => item.x >= parede.largura + 16 && item.x + item.largura <= largura - parede.largura - 16)"), true);
  assert.equal(run("criarObstaculo('laser')"), true);
  run("obstaculos.forEach(removerObstaculo); obstaculos = []; criarObstaculo('laser');");
  assert.equal(run('obstaculos[0].emissores.length'), 2);
  assert.ok(run('obstaculos[0].tamanhoEmissor <= 18'));
});

test('serra pendente não suspende caixas durante parede e laser', () => {
  const { run } = game();
  run("tempo = 120; criarObstaculo('parede'); criarObstaculo('laser'); ultimaSerra = 100; ultimaCaixa = 10; gerarObstaculos(dificuldadeAtual());");
  assert.ok(run("obstaculos.some(item => item.tipo === 'caixa')"));
  assert.ok(run("obstaculos.some(item => item.tipo === 'serra')"));
  assert.ok(run("obstaculos.some(item => item.tipo === 'parede')"));
  assert.ok(run("obstaculos.some(item => item.tipo === 'laser')"));
});

test('caixas podem nascer enquanto a serra está atravessando', () => {
  const { run } = game();
  run("criarObstaculo('serra'); obstaculos[0].idade = obstaculos[0].tempoAviso + .5;");
  assert.equal(run("criarObstaculo('caixa')"), true);
  assert.equal(run("criarObstaculo('espinho')"), true);
});

test('pulo permite ultrapassar uma serra vindo de qualquer lado, inclusive na dificuldade máxima', () => {
  for (const direcao of [-1, 1]) {
    for (const t of [0, 90]) {
      const { run } = game();
      run(`
        tempo = ${t}; criarObstaculo('serra'); globalThis.serra = obstaculos[0];
        serra.direcao = ${direcao};
        serra.idade = serra.tempoAviso + .35;
        serra.x = serra.direcao > 0 ? robo.x + robo.largura * .12 - serra.largura - 30 : robo.x + robo.largura * .88 + 30;
        pular();
        for (let i = 0; i < 90; i++) {
          atualizarRobo(PASSO);
          atualizarObstaculos(PASSO);
          if (acabou) break;
        }
      `);
      assert.equal(run('acabou'), false, `lado ${direcao}, tempo ${t}`);
    }
  }
});

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

test('moedas e baterias usam sprites PNG e são coletadas uma única vez', () => {
  const { run } = game();
  for (const tipo of ['moeda', 'bateria']) {
    assert.equal(run(`criarColetavel('${tipo}')`), true);
    assert.equal(run('coletaveis[0].imagem.dataset.asset'), tipo);
    const caminho = run(`RECURSOS['${tipo}'].caminho`);
    const png = fs.readFileSync(path.join(__dirname, '..', caminho));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.match(caminho, /^assts\/coletaveis\//);
    run('globalThis.item = coletaveis[0]; item.x = robo.x + 40; item.y = robo.y + 40; atualizarColetaveis(0);');
    assert.equal(run('coletaveis.length'), 0);
    assert.equal(run('item.imagem.removed'), true);
  }
  run('atualizarColetaveis(0); desenhar();');
  assert.equal(run('moedas'), 1);
  assert.equal(run('baterias'), 1);
});

test('coletar bateria preserva dificuldade, movimento e pulo anteriores', () => {
  const { run } = game();
  run(`tempo = 90; criarColetavel('bateria'); coletaveis[0].x = robo.x + 40;
    coletaveis[0].y = robo.y + 40; atualizarColetaveis(0);
    robo.x = 0; teclas.KeyD = true; criarObstaculo('caixa');
    obstaculos[0].x = 850; atualizar(.5);`);
  assert.equal(run('dificuldadeAtual().nivel'), 6);
  assert.equal(run('robo.x'), 140);
  assert.equal(run('obstaculos[0].y + obstaculos[0].altura'), 180);
  run('pular(); atualizarRobo(.1); globalThis.velocidade = robo.velocidadeY; pular();');
  assert.equal(run('robo.velocidadeY'), run('velocidade'));
  assert.equal(run('typeof poderes'), 'undefined');
});

test('bateria não protege contra colisões', () => {
  const { run } = game();
  run(`criarColetavel('bateria'); coletaveis[0].x = robo.x + 40;
    coletaveis[0].y = robo.y + 40; atualizarColetaveis(0);
    criarObstaculo('caixa'); obstaculos[0].x = robo.x + 30;
    obstaculos[0].y = robo.y; atualizarObstaculos(PASSO);`);
  assert.equal(run('baterias'), 1);
  assert.equal(run('acabou'), true);
});

test('coletáveis respeitam perigos, pausa, redimensionamento e expiração', () => {
  const { run, document } = game();
  run("criarColetavel('moeda'); criarColetavel('bateria'); globalThis.itens = [...coletaveis]; pausar(); animar(0); animar(10000);");
  assert.equal(run('coletaveis[0].idade'), 0);
  document.getElementById('jogo').clientWidth = 390;
  document.getElementById('jogo').clientHeight = 550;
  run('ajustarTela();');
  assert.equal(run('coletaveis.length'), 2);
  assert.ok(run('coletaveis.every(item => Number.isFinite(item.x) && Number.isFinite(item.y) && item.x >= 0 && item.x + item.largura <= largura && item.y + item.altura <= chao)'));
  run(`coletaveis[0].idade = 12; coletaveis[0].x = robo.x + 40;
    coletaveis[0].y = robo.y + 40; atualizarColetaveis(0);`);
  assert.equal(run('itens[0].imagem.removed'), true);
  assert.equal(run('moedas'), 0);
  run(`obstaculos = [{ tipo: 'caixa', x: coletaveis[0].x, y: 0, largura: 68, altura: 68, tempoQuebrada: 0 }]; atualizarColetaveis(0);`);
  assert.equal(run('coletaveis.length'), 0);
  assert.equal(run('baterias'), 0);
});
