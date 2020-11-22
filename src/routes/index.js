// Moduls que farem servir
const express = require('express');
const router = express.Router(); // creem una miniaplicacio de aquesta ruta

// HTTP GET
router.get('/', (req, res) => {
    res.render('Index');
});

module.exports = router;
