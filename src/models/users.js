const { Schema, model } = require("mongoose"); // Afagem la nostra base de dades

const bcrypt = require("bcryptjs"); // Middelware que proporciona la lliberia de hash de Brcypt

// Creem la estructura de l'usuari que posarem a la nostra base de dades
const UserSchema = new Schema({ 
  name: { type: String },
  surname: {type: String},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  date: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// Funció d'encriptament de la contrasenya 
UserSchema.methods.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Comprovació de dues contrasenyes
UserSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = model("User", UserSchema);