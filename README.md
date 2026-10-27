# Robô em Fuga

## Como jogar

Abra `menu.html` no navegador e clique em **Jogar**. Use **A/D** ou **←/→** para mover, **Espaço**, **W** ou **↑** para pular e **P** para pausar.

- O botão **Som** ativa ou desativa músicas e efeitos e salva a preferência neste navegador. Se o navegador bloquear a música automática, clique na página ou pressione uma tecla.
- As músicas do menu e da partida e os efeitos de pulo, morte e Game Over vêm de `midia/`.
- A dificuldade aumenta durante 90 segundos, até o nível 6: caixas caem mais rápido e os obstáculos aparecem com maior frequência.
- A serra entra após os primeiros 18 segundos e seu intervalo inicial. Ela avisa onde vai subir e atravessa a arena girando, com apenas a metade superior acima do chão. Pule para escapar.
- As paredes entram após 12 segundos e seu intervalo inicial. As faixas amarelas avisam onde elas vão fechar. Duas paredes vermelhas avançam das laterais, deixam o centro livre e depois recuam até desaparecer. Saia das bordas antes de fecharem.
- O laser entre bolinhas é outro obstáculo, disponível após 35 segundos e seu intervalo inicial. Duas bolinhas pequenas (até 18 pixels), uma perto do teto e outra junto ao chão, carregam e disparam uma barreira vertical vermelha por alguns segundos. O raio desliga e as bolinhas desaparecem. Saia da linha pontilhada antes do disparo.
- Caixas continuam surgindo durante toda a partida. Serra, espinhos, paredes e laser têm intervalos independentes e podem aparecer juntos. Há no máximo uma serra, um espinho, um laser e um conjunto de paredes por vez. As caixas respeitam as faixas das paredes e do laser para preservar espaço de fuga.
- **Moedas:** surgem a cada 2,8 segundos, em posições diferentes pelo cenário, e aumentam o contador ao serem coletadas.
- **Baterias:** surgem a cada 9 segundos e aumentam seu próprio contador. Moedas e baterias são apenas itens de coleta: não ativam poderes nem mudam velocidades, pulo ou colisões.
- Os contadores de coleta aparecem na tela. A pausa congela os itens. Coletáveis somem após 12 segundos ou quando um perigo passa a ameaçar sua posição; não ficam atrás de um laser bloqueando o caminho.

Os sprites `assts/obstaculos/serra-circular.png` e `assts/obstaculos/emissor-laser.png` foram gerados com a ferramenta de imagens integrada. Direção visual: metal prateado e cinza-azulado, contornos escuros e detalhes amarelos no estilo dos assets existentes; lâmina circular frontal completa e emissor esférico com núcleo vermelho, ambos com fundo transparente.
Os prompts completos estão em `assts/obstaculos/sprites-origem.json`.
O sprite detalhado do emissor foi preservado como material alternativo; o laser atual usa bolinhas simples desenhadas pelo próprio jogo.

Os coletáveis usam sprites PNG transparentes em `assts/coletaveis/moeda.png` e `assts/coletaveis/bateria.png`, gerados com a ferramenta de imagens integrada. Eles seguem o estilo dos assets do robô e das caixas: contornos escuros, volumes metálicos e amarelo, cinza-azulado e ciano. Os prompts completos estão em `assts/coletaveis/sprites-origem.json`.

Os tempos e velocidades podem ser ajustados em `js/jogo/dificuldade.js`.

## Verificação

Com Node.js instalado, execute `node --test tests/*.test.cjs`. Os testes de áudio e dos novos obstáculos verificam avisos, colisões, pulo, desligamento, pausa, redimensionamento e escalonamento dos perigos. Os testes dos coletáveis verificam sprites, contadores, coleta, expiração e preservação das regras anteriores.

## Atividade para os alunos

Vamos deixar o jogo mais divertido! Contribua com ideias e materiais para o projeto:

- **Músicas:** sugira uma música para o menu ou para acompanhar o jogo.
- **Efeitos sonoros:** pense em sons para ações como pular, pegar um item, encontrar um obstáculo, vencer ou perder.
- **Imagens:** crie ou sugira imagens para o jogo. Se usar a marca SENAI, utilize uma versão autorizada e mantenha o logo sem alterações.


## O que mais o robô poderia falar?

Algumas ideias para inspirar:

- Ao abrir o jogo: “Olá! Vamos começar?”
- Ao iniciar uma fase: “Prepare-se para a aventura!”
- Ao encontrar um desafio: “Cuidado! Tem um obstáculo!”
- Ao pegar um item: “Boa! Consegui!”
- Ao precisar de ajuda: “Você pode me ajudar?”
- Ao vencer: “Conseguimos! Parabéns!”
- Ao perder: “Quase lá! Vamos tentar de novo?”

Você também pode inventar falas engraçadas, dicas para o jogador, mensagens para cada fase ou frases relacionadas a tecnologia, criatividade e aprendizagem.

## Como enviar sua contribuição

1. Converse com a turma e escolha uma ideia.
2. Explique em poucas palavras onde ela poderia aparecer no jogo.
3. Para arquivos de música, som ou imagem, coloque-os na pasta `midia/`.
4. Informe o nome do arquivo e a autoria. Use somente materiais próprios, autorizados ou com licença que permita o uso.
5. Para sugerir uma fala, escreva a frase e diga em que situação o robô deveria falar.

sla

