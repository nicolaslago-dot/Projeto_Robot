// Posições em pixels e velocidades em pixels por segundo.
const robo = {
  x: 0,
  y: 0,
  largura: 128,
  altura: 119,
  velocidadeY: 0
};

let obstaculos = [];
let largura;
let chao;
let olhandoEsquerda = false;

// Cronômetro e intervalo desde o último obstáculo.
let tempo = 0;
let ultimaCaixa = 0;
let ultimoEspinho = 0;
let ultimaSerra = 0;
let ultimoLaser = 0;
let ultimaParede = 0;

let coletaveis = [];
let moedas = 0;
let baterias = 0;
let ultimaMoeda = 0;
let ultimaBateria = 0;

// Passos curtos preservam o tempo decorrido e impedem saltos nas colisões.
const PASSO = 1 / 120;
let quadroAnterior = null;
let acumulador = 0;

// Controles.
const teclas = {};

// Situação da partida.
let pausado = false;
let acabou = false;
let carregando = true;
