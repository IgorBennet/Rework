const app = require('./app');
const { port } = require('./config');

app.listen(port, () => {
  console.log(`Servidor Rework executando na porta ${port}`);
});
