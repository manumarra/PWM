// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

/* ------------------------------------------------------------------ */
/*  Sottoschema condiviso                                              */
/* ------------------------------------------------------------------ */

const addressFields = {
  street: {
    type: String,
    required: [true, "Via obbligatoria"],
    trim: true,
    match: [
      /^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s'-]+(?:\s+\d+[a-zA-Z]?)?$/,
      "Formato indirizzo non valido (es. 'Via Roma 12', 'Roma 12' o 'Roma')"
    ]
  },
  city: {
    type: String,
    required: [true, "Città obbligatoria"],
    trim: true,
    match: [/^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s\-']{2,50}$/, "Nome città può contenere solo caratteri"]
  },
  zip: {
    type: String,
    required: [true, "CAP obbligatorio"],
    match: [/^\d{5}$/, "CAP non valido (5 cifre)"]
  },
  country: {
    type: String,
    default: "ITA",
    uppercase: true,
    required: [true, "Stato obbligatorio"],
    minlength: [2, "Stato: minimo 2 caratteri"],
    maxlength: [3, "Stato: massimo 3 caratteri"]
  }
};

const addressSchema = new Schema(addressFields, { _id: false });

/* ------------------------------------------------------------------ */
/*  Schema BASE: solo ciò che è comune a clienti e ristoratori        */
/* ------------------------------------------------------------------ */

const userSchema = new Schema(
  {
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
      minlength: [6, "La password deve contenere almeno 6 caratteri"],
      select: false // esclusa di default
    },
    phone: {
      type: String,
      required: [true, "Numero di telefono obbligatorio"],
      trim: true,
      match: [/^[0-9]{6,15}$/, "Numero di telefono non valido (senza il + e unito)"]
    },
    active: { type: Boolean, default: true } // disattivazione profilo
  },
  { timestamps: true, discriminatorKey: "role" }
);

// Hook e metodi vanno definiti PRIMA di mongoose.model(): i discriminator li ereditano.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Login: cerca per email e include la password. Restituisce già l'istanza
// del discriminator corretto (Customer o Restaurant).
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: String(email).toLowerCase() }).select("+password");
};

const User = mongoose.model("User", userSchema);

/* ------------------------------------------------------------------ */
/*  CUSTOMER  (role = "customer")                                      */
/* ------------------------------------------------------------------ */

const customerSchema = new Schema({
  name: {
    type: String,
    required: [true, "Nome obbligatorio"],
    trim: true,
    minlength: [2, "Il nome deve contenere almeno 2 caratteri"],
    maxlength: [80, "Il nome deve contenere al massimo 80 caratteri"],
    match: [/^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s'-]+$/, "Il nome può contenere solo caratteri alfabetici"]
  },
  surname: {
    type: String,
    required: [true, "Il cognome è obbligatorio per i clienti"],
    trim: true,
    minlength: [2, "Il cognome deve contenere almeno 2 caratteri"],
    maxlength: [80, "Il cognome deve contenere al massimo 80 caratteri"],
    match: [/^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s'-]+$/, "Il cognome può contenere solo caratteri alfabetici"]
  },
  // Indirizzo opzionale: serve solo come precompilazione al checkout
  address: addressSchema,

  // Metodo di pagamento associato al profilo. NON si salva mai il numero completo.
  // Reso opzionale per non rompere l'attuale signup: rendilo `required`
  // quando il form di registrazione lo invia.
  paymentMethod: {
    type: {
      type: String,
      enum: { values: ["credit_card", "prepaid_card"], message: "Metodo di pagamento non valido" }
    },
    last4Digits: { type: String, match: [/^\d{4}$/, "Ultime 4 cifre non valide"] },
    _id: false
  },

  // Preferenze per le offerte in bacheca (es. categorie di piatti)
  preferences: [{ type: String, trim: true }]
});

/* ------------------------------------------------------------------ */
/*  RESTAURANT  (role = "restaurateur")                                */
/* ------------------------------------------------------------------ */

const restaurantSchema = new Schema({
  // Nome del ristorante: niente regex "solo lettere" (es. "Burger & Co", "Pizza 2000")
  name: {
    type: String,
    required: [true, "Nome del ristorante obbligatorio"],
    trim: true,
    minlength: [2, "Il nome deve contenere almeno 2 caratteri"],
    maxlength: [80, "Il nome deve contenere al massimo 80 caratteri"]
  },
  ivaNumber: {
    type: String,
    required: [true, "Partita IVA obbligatoria"],
    trim: true,
    match: [/^\d{11}$/, "La Partita IVA deve contenere esattamente 11 cifre numeriche"]
  },
  // Indirizzo obbligatorio: serve per la ricerca per luogo e per il calcolo distanza
  address: { type: addressSchema, required: [true, "Indirizzo obbligatorio"] },

  // Coordinate calcolate una volta sola (geocoding in registrazione/modifica indirizzo)
  location: {
    lat: { type: Number, min: -90, max: 90 },
    lon: { type: Number, min: -180, max: 180 },
    _id: false
  },

  image: { type: String, default: "/assets/defaultAvatar.jpeg" }
});

restaurantSchema.index({ "address.city": 1 });
restaurantSchema.index({ name: 1 });

/* ------------------------------------------------------------------ */
/*  Registrazione dei discriminator                                    */
/*  Il valore della chiave `role` è il nome passato come 1° argomento. */
/* ------------------------------------------------------------------ */

export const Customer = User.discriminator("customer", customerSchema);
export const Restaurant = User.discriminator("restaurateur", restaurantSchema);

// Mappa ruolo -> modello, utile in signup
export const MODEL_BY_ROLE = {
  customer: Customer,
  restaurateur: Restaurant
};

// Campi che l'utente può modificare da sé (whitelist anti mass-assignment).
// `role`, `active`, `email`, `_id` NON sono modificabili da qui.
export const UPDATABLE_FIELDS = {
  customer: ["name", "surname", "phone", "address", "paymentMethod", "preferences", "password"],
  restaurateur: ["name", "phone", "address", "image", "ivaNumber", "password"]
};

export default User;