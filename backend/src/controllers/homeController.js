// Resposta usada por monitoramento e testes para verificar a API.
function showHome(_request, response) {
  return response.json({ status: "ok", service: "Rework API" });
}

module.exports = {
  showHome,
};
