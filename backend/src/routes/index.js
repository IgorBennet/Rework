const { Router } = require("express");
const { showHome } = require("../controllers/homeController");

// Centraliza os endereços disponíveis na API.
const router = Router();

router.get("/", showHome);

module.exports = router;
