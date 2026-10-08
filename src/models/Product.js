// src/models/Product.js
import mongoose from "mongoose";
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
    default: null // null se è un piatto originale inventato dal ristoratore
  },
  nameMeal: { type: String, required: true, trim: true },
  category: { type: String, required: true, default: "Altro"},
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "/assets/defaultMeal.jpeg"},
  ingredients: [{ type: String, trim: true }],
  
  available: { type: Boolean, default: true }, // Per gestire l'esaurito a menu
  discount: {type: Number, default: 0, min: 0}
}, { timestamps: true });

export default mongoose.model("Product", productSchema);