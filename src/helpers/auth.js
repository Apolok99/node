// Creem una llista de funcions que cridarem des de fora
const helpers = {};

// Comprovarem si l'usuari esta autentificat
helpers.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
      return next();
  }
  req.flash('error_msg', 'No tens Permis!!!');
  res.redirect('/users/signin');
  
};

module.exports = helpers;

