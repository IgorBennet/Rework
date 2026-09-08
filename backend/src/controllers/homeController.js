// Resposta simples usada para verificar se a API está ativa.
function showHome(_request, response) {
  return response.send("API Rework funcionando");
}

module.exports = {
  showHome,
};
