// Moduls que necesitarem
const express = require('express');
const router = express.Router(); // creem una miniaplicació de aquesta ruta

// Agafem el mètode d'autentificació
const { isAuthenticated } = require("../helpers/auth");

// HTTP GET (només deixa entrar a usuaris autentificats)
router.get('/profiles/profile', isAuthenticated, (req, res) => {
    // Comprovem que la partida no estigui començada
    if(!inGame){  
        res.render('profiles/profile');
    }
    else
    {
        req.flash("error_msg", "La partida està en curs!!! No pots entrar :( Espera a que acabi.");
        res.redirect("/profiles/waitroom");
    }
});

// HTTP GET (només deixa entrar a usuaris autentificats)
router.get('/profiles/waitroom', isAuthenticated, (req, res) => {
    res.render('profiles/waitroom');
});



module.exports = router;
