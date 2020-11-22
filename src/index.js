const express = require('express'); // Middelware que controla les sol·licituds o peticions que es fan per mitjà dels mètodes del protocol HTTP
const path = require('path'); // Middelware que proporciona utilitats per a treballar amb rutes d'arxius i directoris
const exphbs = require('express-handlebars'); // Middelware que proporciona els metodes necessaris per a permetre't construir plantilles semàntiques en HTML
const methodOverride = require('method-override'); // Middelware que et permet usar verbs HTTP com PUT o DELETE en llocs on el client no el suporta
const session = require('express-session'); // Middelware que ajuda a guardar les dades de la cookie en la forma de valor clau
const flash = require('connect-flash'); // Middelware que ens permet mostrar missatges en la pantalla sota unes certes condicions
const passport = require('passport'); // Middelware de autentificacio
const cookieParser = require('cookie-parser'); // Middelware que controla les cookies

// Iniciem l'aplicació 
const app = express();
require('./database');
require('./config/passport');

// Ajustos de la connexió i del hbs (en comptes del visualitzador de Jade)
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: 'hbs'
}));
app.set('view engine', '.hbs');


//Funciones que seran ejecutadas antes de llegar al server
app.use(cookieParser());// creem la cookie
app.use(express.urlencoded({extended: false}));
app.use(methodOverride('_method'));
app.use(session({ // creem una sessió
    secret: 'aplicacion secreta',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize()); // creem la strategy del Passport
app.use(passport.session());
app.use(flash()); // inicialitzem el flash

// Variables Globals 
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});

// Rutas de l'aplicació
app.use(require('./routes/index'));
app.use(require('./routes/users'));
app.use(require('./routes/profile'));
app.use(require('./routes/gameInfo'));

// Arxius estàtics
app.use(express.static(path.join(__dirname,'public')));

// Iniciació del server
app.listen(app.get('port'), () => {
    console.log('Server en puerto', app.get('port'));
});