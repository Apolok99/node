// Moduls que necesitarem
const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const async = require('async'); // Middelware que proporciona funcions senzilles i potents per a treballs síncrons
const crypto = require('crypto'); // Middelware que proporciona funcionalitats de criptografia
const nodemailer = require('nodemailer'); // Middelware per enviar correus electronics
const Recaptcha = require('express-recaptcha').RecaptchaV3; // Middelware que proporciona el captcha
const bodyParser = require('body-parser'); // Middelware que proporciona diferents analitzadors del cos de les peticions
const fetch = require('node-fetch');
const sha1 = require('js-sha1');

var recaptcha = new Recaptcha('SITE_KEY', 'SECRET_KEY',{callback:'cb'}); // Recaptcha - no funciona

// Apliquem els analitzadors a la miniaplicació
router.use(bodyParser.json());
router.use(bodyParser.urlencoded());

// Agafem el model d'usuari de la nostra base de dades
const User = require('../models/users');
const { info } = require('console');

/*---------------------------------- SIGN IN ---------------------------------- */

// HTTP GET
router.get('/users/signin', recaptcha.middleware.renderWith({'hl':'fr'}), (req, res)=> {
    res.render('users/signin', { captcha:res.recaptcha });
});

// HTTP POST (mira d'autentificar a l'usuari. Si ho aconsegueix, entrem a la plana corresponent. Altrament retornem a la mateixa)
router.post('/users/signin', passport.authenticate('local', {
    successRedirect: '/profiles/waitroom',
    failureRedirect: '/users/signin',
    failureFlash: true
}));

/*---------------------------------- SIGN UP ---------------------------------- */

// HTTP GET
router.get('/users/signup', (req, res)=> {
    res.render('users/signup');
});

// HTTP POST (crear un usuari i el guarda a la base de dades)
router.post('/users/signup', async (req, res)=> {
  const {nombres, apellidos, correo, pswd, conf_pswd} = req.body;
  const errors = [];

  // Comprovació dels camps entrats
  if(nombres.length == 0)
  {
      errors.push({text: 'Has d\'introduïr un nom!'});
  }
  if(apellidos.length == 0)
  {
      errors.push({text: 'Has d\'introduïr un cognom!'});
  }
  if(pswd != conf_pswd)
  {
      errors.push({text: 'Les contrasenyes no coincideixen, mira-les!'});
  }
  if(pswd.length < 8)
  {
      errors.push({text: 'La contrasenya ha de tenir MÍNIM 8 caràcters!'});
  }

  // Comprovació API have i been pwned?
  var hashPswd = sha1(pswd.toUpperCase());
  var prefix = hashPswd.slice(0, 5);
  var suffix = hashPswd.slice(5, hashPswd.length).toUpperCase();
  var URLHIBP = "https://api.pwnedpasswords.com/range/"+ prefix;
  
  await fetch(URLHIBP)
  .then(response => response.text())
  .then(data => {
    var hashes = data.split('\n');
    var breached = false;

    for(let i = 0; i < hashes.length; i++){
      var hash = hashes[i];
      var h = hash.split(':');

      if(h[0] === suffix){
        errors.push({text: 'Compte! Aquesta contrasenya ha estat filtrada ' + h[1] + ' vegades en diferents pagines web!'});
        breached = true;
        break;
      }
    }
  });

  if(errors.length > 0) // comprovem si hi ha errros
  {
      res.render('users/signup', {errors, nombres, apellidos, correo, pswd, conf_pswd});
  }else{
      // Comprovem que no hi hagi cap usuari amb el correu entrat
      const emailUser = await User.findOne({ email: correo });
      if (emailUser) {
          req.flash("error_msg", "El correu que estas introduint ja té una compte associada");
          res.redirect("/users/signup");
      }else{
          // Creeem un nou usuari guardant la informació entrada (encriptant la informació)
          const newUser = new User({name:nombres, surnames: apellidos, email: correo, password: pswd});
          newUser.password = await newUser.encryptPassword(pswd);
          await newUser.save();

          req.flash('success_msg', 'Tot correcte! Ja estas registrat');
          res.redirect('/users/signin');
      }
  }
});

/*---------------------------------- LOG OUT ---------------------------------- */

// HTTP GET
router.get('/users/logout', (req, res) => {
  // Si un usuari se'n va, reiniciem totes les variables globals del joc
  let cookie = req.cookies["connect.sid"];
  playersReady = 0;
  inGame = false;
  changeStatus = false;
  isInterTime = false;
  isAfterRoundTime = false;
  isRoundTime = false;
  isResultsTime = false;

  // Eliminem de la llista de jugadors
  let posCookieArray = playersCookies.find(element => element == cookie);
  playersCookies.splice(posCookieArray,1);
  
  req.logout();
  res.render('./');
});

/*---------------------------------- FUNCIÓ DE RECUPERACIÓ ---------------------------------- */

/* Entrada del correu de la compte a recuperar la contrasenya */ 

// HTTP GET 
router.get('/users/forgot', (req, res)=> {
    res.render('users/forgot');
});

// HTTP POST 
router.post('/users/forgot', function(req, res, next) {
  async.waterfall([
    function(done) { // Crea un token per traquejar el canvi de contrasenya
      crypto.randomBytes(20, function(err, buf) {
        const token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) { // Comprova que el correu entrat tingui una compte 
      User.findOne({ email: req.body.correo }, function(err, user) {
        if (!user) {
          req.flash('error_msg', 'No hi ha cap compte amb el correu que has introduit');
          return res.redirect('/users/forgot');
        }

        // Assigna el token al usuari del canvi de contrasenya
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) { // Crea un correu i l'envia al correu del canvi de contrasenya (envia un enllaç on canviar-la)
      const smtpTransport = nodemailer.createTransport({
        service: "hotmail",
        auth: {
            user: "jo_jo_iv_multi@hotmail.com",
            pass: "Multijugador"
        },
        tls: {
          rejectUnauthorized: false
        }
    });  
      const mailOptions = {
        to: user.email,
        from: 'jo_jo_iv_multi@hotmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'Hem enviat un e-mail a ' + user.email + ' amb les instruccions a seguir.');
        done(err, 'done');
      });
    }      
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/forgot');
  });
});

/* Arribem a la pàgina de canviar la constrasenya */ 

// HTTP GET (busquem l'usuari amb el token de canvi de contrasenya)
router.get('/users/reset/:token', function(req, res) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'La fitxa de restabliment de la contrasenya no és vàlida o ha caducat');
        return res.redirect('/users/forgot');
      }

      res.render('users/reset', {
        user: req.user
      });
    });
  });
 

// HTTP POST (mirem de canviar al contrasenya)  
router.post('/users/reset/:token', function(req, res) {
async.waterfall([
    function(done) { // Tornem a buscar l'usuari
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, async function(err, user) {
        if (!user) {
          req.flash('error', 'La fitxa de restabliment de la contrasenya no és vàlida o ha caducat.');
          return res.redirect('back');
        }

        // Comprovem que la nova contrasenya és valida
        if(req.body.pswd != req.body.conf_pswd)
        {
          req.flash('error_msg', 'Les contrasenyes no coincideixen, mira-les!');
          return res.redirect('back');
        }
        if(req.body.pswd.length < 8)
        {
            req.flash('error_msg', 'La contrasenya ha de tenir MÍNIM 8 caràcters!');
            return res.redirect('back');
        }

        // Canviem la contrasenya del usuari i eliminem el token 
        user.password = await user.encryptPassword(req.body.pswd);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save(function(err) {
          req.logIn(user, function(err) {
              done(err, user);
          });
        });
      });
    },
    function(user, done) { // Envia un correu de confirmació del canvi de contrasenya
        const smtpTransport = nodemailer.createTransport({
          service: "hotmail",
          auth: {
            user: "jo_jo_iv_multi@hotmail.com",
            pass: "Multijugador"
          },
          tls: {
            rejectUnauthorized: false
          }
    });  
    const mailOptions = {
        to: user.email,
        from: 'jo_jo_iv_multi@hotmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
    };
    smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'Tot bé! S\'ha modificat correctament la teva contrasenya.');
        done(err, 'done');
    });
  }
], function(err) {
    res.redirect('/');
  });
});

module.exports = router;