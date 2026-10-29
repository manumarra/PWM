import mongoose from "mongoose";
import { ALLERGENS, detectAllergens } from "../public/utils/common/allergens.js";

const { Schema } = mongoose;

const productSchema = new Schema({
  restaurantId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, "Ristorante obbligatorio"] 
  },
  mealId: { 
    type: Schema.Types.ObjectId, 
    ref: "Meal", 
    default: null  //se è un piatto originale inventato dal ristoratore || si modifica un piatto dal catalogo
  },
  nameMeal: { type: String, required: true, trim: true },
  category: { type: String, required: true, default: "Altro"},
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "/assets/defaultMeal.jpeg"},
  ingredients: [{ type: String, trim: true, required: [true, "Minimo un ingrediente"] }],
  allergens: [{ type: String, enum: ALLERGENS }], // calcolati dagli ingredienti, mai dal client

  available: { type: Boolean, default: false }, // Per gestire l'esaurito a menu
  discount: { type: Number, default: 0, min: [0, "Lo sconto non può essere minore di 0"], max: [100, "Lo sconto non può essere maggiore di 100"]}
}, { timestamps: true });


// Gli allergeni sono sempre derivati dagli ingredienti a ogni creazione/salvataggio
productSchema.pre("validate", async function () {
  this.allergens = detectAllergens(this.ingredients);
});

export default mongoose.model("Product", productSchema);