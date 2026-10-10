// src/repositories/productRepository.js
import Product from "../models/Product.js";

// CREATE: normalizza i campi e salva il prodotto
export const createProduct = async (productData) => {
  const { restaurantId, nameMeal, price, ingredients, category, image, mealId } = productData;

  // Risoluzione e formattazione della categoria
  let resolvedCategory = (typeof category === "string") ? category.trim() : "";
  if (!resolvedCategory || resolvedCategory.toLowerCase() === "custom") {
    resolvedCategory = "Altro";
  } else {
    resolvedCategory = String(resolvedCategory).charAt(0).toUpperCase() + String(resolvedCategory).slice(1).toLowerCase();
  }

  return await Product.create({
    restaurantId,
    nameMeal: String(nameMeal).trim(),
    price: parseFloat(price),
    ingredients: Array.isArray(ingredients) ? ingredients : [],
    category: resolvedCategory,
    image: image || "/assets/defaultMeal.jpeg",
    mealId: mealId || null
  });
};

// READ: tutti i prodotti del ristorante
export const getProductsByRestaurant = (restaurantId) =>
  Product.find({ restaurantId }).sort({ createdAt: -1 }).lean();

// READ: singolo prodotto
export const getProductById = (id) => Product.findById(id).lean();

// UPDATE: aggiorna campi prodotto
export const updateProduct = (id, updates) =>
  Product.findByIdAndUpdate(
    id,
    { $set: updates },
    { returnDocument: "after", runValidators: true }
  );

// DELETE: singolo prodotto
export const deleteProduct = (id) => Product.findByIdAndDelete(id);

// DELETE: svuota menù
export const deleteAllProduct = (restaurantId) => Product.deleteMany({ restaurantId });