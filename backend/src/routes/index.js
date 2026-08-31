const { Router } = require('express');
const { showHome } = require('../controllers/homeController');

const router = Router();

router.get('/', showHome);

module.exports = router;
