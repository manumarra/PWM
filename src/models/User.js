// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

const addressSchema = new Schema({
  street:  { type: String, required: [true, "Via obbligatoria"], trim: true,
     match: [/^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s'-]+(?:\s+\d+[a-zA-Z]?)?$/,"Formato indirizzo non valido (es. 'Via Roma 12', 'Roma 12' o 'Roma')"
  ] },
  city:    { type: String, required: [true, "Città obbligatoria"], trim: true, match: [/^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s\-']{2,50}$/, "Nome città può contenere solo caratteri"] },
  zip:     { type: String, required: [true, "CAP obbligatorio"], match: [/^\d{5}$/, "CAP non valido (5 cifre)"] },
  country: { type: String, default: "ITA", uppercase: true, required: [true, "Stato obbligatorio"], maxlength: [3, "Stato: massimo 3 caratteri"], minlength:[2, "Stato: minimo 2 caratteri"] }
}, { _id: false }); // Nessun _id per il subdocument come da slide

const userSchema = new Schema({
  name: { 
    type: String, 
    required: [true, "Nome obbligatorio"], 
    trim: true, 
    minlength: 2, 
    maxlength: 80 
  },
  email: { 
    type: String, 
    required: [true, "Email obbligatoria"], 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email non valida"] 
  },
  password: { 
    type: String, 
    required: [true, "Password obbligatoria"], 
    minlength: 6,
    select: false // Esclusa di default per sicurezza
  },
  phone: {
    type: String,
    required: [true, "Numero di telefono obbligatorio"],
    trim: true,
    match: [/^[0-9]{6,15}$/, "Numero di telefono non valido (senza il + e unito)"]
  },
  role: { 
    type: String, 
    enum: ["customer", "restaurateur"], 
    default: "restaurateur",
    required: [true, "Ruolo obbligatorio"]
  },
  // Partita IVA: gestita solo se il ruolo è ristoratore
ivaNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // se vuoto non bloccare
        return /^\d{11}$/.test(v);
      },
      message: "La Partita IVA deve contenere esattamente 11 cifre numeriche"
    }
  },
  address: addressSchema,
  active: { type: Boolean, default: true } // Per consentire disattivazione/cancellazione profilo
}, { timestamps: true });

// Middleware pre-save per cifrare la password prima del salvataggio
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.post("save", function(doc){
  console.log(`Nuovo utente creato: ${doc.email}`);
});

// Metodo di istanza per confrontare la password al login
userSchema.methods.comparePassword = 
async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Metodo statico per il login con inclusione della password
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select("+password");
};

userSchema.methods.toPublicJSON =
function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export default mongoose.model("User", userSchema);