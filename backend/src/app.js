const express = require("express");
const routes = require("./routes");

// Configura os recursos comuns e conecta as rotas da API.
const app = express();

app.use(express.json());
app.use("/", routes);

module.exports = app;
