const { Router } = require("express");
const { showHome } = require("../controllers/homeController");

// Centraliza os endpoints de diagnóstico da API.
const router = Router();

router.get("/health", showHome);

module.exports = router;
