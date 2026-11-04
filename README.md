# Sky Trap

## Como jogar

## Link do jogo: https://nicolaslago-dot.github.io/Projeto_Robot/

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
