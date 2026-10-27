// Imagens disponíveis. Recorte: [x, y, largura, altura], em pixels.
// Cadastro local para permitir abrir o HTML diretamente, sem servidor.
const RECURSOS = {
  'moeda': {
    caminho: 'assts/coletaveis/moeda.png',
    largura: 1254,
    altura: 1254,
    recorte: [57, 61, 1146, 1143]
  },
  'bateria': {
    caminho: 'assts/coletaveis/bateria.png',
    largura: 1254,
    altura: 1254,
    recorte: [327, 92, 597, 1083]
  },
  'serra-circular': {
    caminho: 'assts/obstaculos/serra-circular.png',
    largura: 1280,
    altura: 1280,
    recorte: [0, 0, 1280, 1280]
  },
  'fundo-cenario': {
    caminho: 'assts/cenario/fundo-cenario.png',
    largura: 1672,
    altura: 941,
    recorte: [0, 0, 1672, 941]
  },
  'efeito-colisao': {
    caminho: 'assts/efeitos/efeito-colisao.png',
    largura: 1312,
    altura: 1199,
    recorte: [147, 93, 1084, 949]
  },
  'sombra-robo': {
    caminho: 'assts/efeitos/sombra-robo.png',
    largura: 2172,
    altura: 724,
    recorte: [390, 435, 1393, 157]
  },
  'icone-pausa': {
    caminho: 'assts/interface/icones/icone-pausa.png',
    largura: 1254,
    altura: 1254,
    recorte: [186, 207, 883, 856]
  },
  'icone-tela-cheia': {
    caminho: 'assts/interface/icones/icone-tela-cheia.png',
    largura: 1254,
    altura: 1254,
    recorte: [123, 141, 1009, 973]
  },
  'caixa-caindo': {
    caminho: 'assts/obstaculos/caixa-caindo.png',
    largura: 1254,
    altura: 1254,
    recorte: [123, 177, 1024, 937]
  },
  'caixa-quebrada': {
    caminho: 'assts/obstaculos/caixa-quebrada.png',
    largura: 1254,
    altura: 1254,
    recorte: [135, 99, 1003, 1084]
  },
  'robo-parado': {
    caminho: 'assts/personagem/robo-parado.png',
    largura: 528,
    altura: 496,
    recorte: [0, 0, 528, 496]
  },
  'robo-andando-direito': {
    caminho: 'assts/personagem/robo-andando-direito.png',
    largura: 528,
    altura: 496,
    recorte: [0, 0, 528, 496]
  },
  'robo-andando-esquerdo': {
    caminho: 'assts/personagem/robo-andando-esquerdo.png',
    largura: 528,
    altura: 496,
    recorte: [0, 0, 528, 496]
  },
  'robo-pulando': {
    caminho: 'assts/personagem/robo-pulando.png',
    largura: 528,
    altura: 496,
    recorte: [0, 0, 528, 496]
  },
  'robo-caindo': {
    caminho: 'assts/personagem/robo-caindo.png',
    largura: 528,
    altura: 496,
    recorte: [0, 0, 528, 496]
  },
  'robo-morrendo': {
    caminho: 'assts/personagem/robo-morrendo.png',
    largura: 528,
    altura: 496,
    recorte: [0, 0, 528, 496]
  },
  'espinhos': {
    caminho: 'assts/obstaculos/espinhos.png',
    largura: 1908,
    altura: 824,
    recorte: [84, 131, 1739, 554]
  }
};
