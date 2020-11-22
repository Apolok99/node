// Moduls que necesitarem
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy; // Strategy del passsport

// Agafem el model d'usuari de la nostra base de dades
const User = require('../models/users'); 

// Creem la nova Strategy d'autentificació
passport.use(new LocalStrategy({
  usernameField: 'correo',
  passwordField: 'pswd'
}, async (correo, pswd, done) => {
  // Busquem l'usuari amb el correu determinat
  const user = await User.findOne({email: correo});
  if (!user) {
    return done(null, false, { message: 'Usuari no trobat' });
  } else {
    // Comprovem que la contrasenya es la correcta
    const match = await user.matchPassword(pswd);
    if(match) {
      return done(null, user);
    } else {
      return done(null, false, { message: 'Incorrect Password.' });
    }
  }
}));

// Autentifiquem al usuari
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Treiem la autentificació al usuari
passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

