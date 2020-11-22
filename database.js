// Moduls que necesitraem
const mongoose = require('mongoose');

// Fem la connexió amb la nostra base de dades de MongoDB
mongoose.connect('mongodb://localhost/pract-db-form', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false
})
 .then(db => console.log('DB se ha conectado'))
 .catch(err => console.error(err));