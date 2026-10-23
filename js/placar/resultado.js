// Lê e valida o tempo recebido pela URL da página de resultado.
function lerTempoResultado() {
  const parametros = new URLSearchParams(window.location.search);
  const valor = Number(parametros.get('tempo'));
  return Number.isFinite(valor) && valor > 0 ? valor : 0;
}
