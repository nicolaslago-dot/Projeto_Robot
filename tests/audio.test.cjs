const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function audio(pagina = 'jogo', { mudo = false, bloqueado = false, autoplay = true } = {}) {
  const sons = [];
  const eventos = new Map();
  const atributos = {};
  const botao = {
    dataset: { musica: pagina },
    addEventListener(nome, callback) { eventos.set('botao:' + nome, callback); },
    setAttribute(nome, valor) { atributos[nome] = valor; }
  };
  const documento = {
    hidden: false, getElementById: () => botao,
    addEventListener(nome, callback) { eventos.set(nome, callback); }
  };
  const storage = new Map([['robo-som-mudo', String(mudo)]]);
  const context = vm.createContext({
    document: documento,
    window: { addEventListener(nome, callback) { eventos.set(nome, callback); } },
    localStorage: {
      getItem(nome) { if (bloqueado) throw Error('bloqueado'); return storage.get(nome); },
      setItem(nome, valor) { if (bloqueado) throw Error('bloqueado'); storage.set(nome, valor); }
    },
    Audio: class {
      constructor(src) { this.src = src; this.paused = true; this.plays = 0; sons.push(this); }
      play() {
        this.plays++;
        if (!autoplay) return Promise.reject(Error('Autoplay bloqueado'));
        this.paused = false;
        return Promise.resolve();
      }
      pause() { this.paused = true; }
    }
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8'), context);
  return {
    run: source => vm.runInContext(source, context), eventos, botao, documento, atributos, storage,
    som: nome => sons.find(som => som.src.endsWith(nome))
  };
}

test('áudio usa arquivos existentes e só inicia a música da partida quando pronta', () => {
  const { run, som } = audio();
  assert.equal(som('so-durante-jogo.mp3').plays, 0);
  run('AudioJogo.iniciar();');
  assert.equal(som('so-durante-jogo.mp3').paused, false);
  assert.equal(som('so-durante-jogo.mp3').loop, true);
  run("AudioJogo.efeito('pulo');");
  assert.equal(som('som-pulo.mp3').plays, 1);
  assert.equal(som('som-pulo.mp3').loop, false);
  for (const nome of ['so-durante-jogo.mp3', 'musica-de-menu.mp3', 'som-pulo.mp3', 'som-de-morte.mp3', 'som-de-tela-de-gameover.mp3']) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', som(nome).src)));
  }
});

test('pausa suspende música e efeitos, retoma a música e derrota toca uma vez', () => {
  const { run, som, eventos } = audio();
  run("AudioJogo.iniciar(); AudioJogo.efeito('pulo'); AudioJogo.pausar(true); AudioJogo.efeito('pulo');");
  assert.equal(som('so-durante-jogo.mp3').paused, true);
  assert.equal(som('som-pulo.mp3').paused, true);
  assert.equal(som('som-pulo.mp3').plays, 1);
  run("AudioJogo.pausar(false); AudioJogo.encerrar(); AudioJogo.efeito('morte');");
  eventos.get('keydown')();
  assert.equal(som('so-durante-jogo.mp3').paused, true);
  assert.equal(som('som-de-morte.mp3').plays, 1);
});

test('botão silencia, mantém a preferência e permite reativar', () => {
  const { run, som, eventos, atributos, storage } = audio('menu', { mudo: true });
  assert.equal(som('musica-de-menu.mp3').plays, 0);
  assert.equal(atributos['aria-pressed'], 'true');
  eventos.get('botao:click')();
  assert.equal(som('musica-de-menu.mp3').paused, false);
  assert.equal(storage.get('robo-som-mudo'), 'false');
  eventos.get('botao:click')();
  run("AudioJogo.efeito('pulo');");
  assert.equal(som('musica-de-menu.mp3').paused, true);
  assert.equal(som('som-pulo.mp3').plays, 0);
  assert.equal(storage.get('robo-som-mudo'), 'true');
});

test('autoplay e armazenamento bloqueados não interrompem a página', async () => {
  const { eventos, som } = audio('menu', { bloqueado: true, autoplay: false });
  eventos.get('pointerdown')();
  eventos.get('botao:click')();
  eventos.get('botao:click')();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(som('musica-de-menu.mp3').plays >= 2);
});

test('sair da página interrompe o áudio e Game Over não repete após terminar', () => {
  const { som, documento, eventos } = audio('gameover');
  const musica = som('som-de-tela-de-gameover.mp3');
  assert.equal(musica.loop, false);
  documento.hidden = true;
  eventos.get('visibilitychange')();
  assert.equal(musica.paused, true);
  documento.hidden = false;
  eventos.get('visibilitychange')();
  assert.equal(musica.paused, false);
  eventos.get('pagehide')();
  musica.ended = true;
  eventos.get('pointerdown')();
  assert.equal(musica.paused, true);
});
