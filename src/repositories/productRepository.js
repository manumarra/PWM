// src/repositories/productRepository.js
import Product from "../models/Product.js";

const PRODUCT_UPDATABLE_FIELDS = [
  "nameMeal", "category", "price", "image", "ingredients", "mealId", "available", "discount"
];

// CREATE: normalizza i campi e salva il prodotto
export const createProduct = async (productData) => {
  const { restaurantId, nameMeal, price, ingredients, category, image, mealId } = productData;

  // Risoluzione e formattazione della categoria
  let resolvedCategory = categoryFormatter(category);

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

// UPDATE: solo se il prodotto appartiene al ristorante
export const updateProduct = (id, restaurantId, updates) => {
  const safe = {};
  for (const field of PRODUCT_UPDATABLE_FIELDS) {
    if (updates[field] !== undefined) safe[field] = updates[field];
  }
  if (safe.category) safe.category = categoryFormatter(safe.category);

  return Product.findOneAndUpdate(
    { _id: id, restaurantId },
    { $set: safe },
    { returnDocument: "after", runValidators: true }
  );
};

// DELETE: singolo prodotto, solo se del ristorante
export const deleteProduct = (id, restaurantId) =>
  Product.findOneAndDelete({ _id: id, restaurantId });

// DELETE: svuota menù
export const deleteAllProduct = (restaurantId) => Product.deleteMany({ restaurantId });

export const categoryFormatter = (category) => {
  let resolvedCategory = (typeof category === "string") ? category.trim() : "";
  if (!resolvedCategory || resolvedCategory.toLowerCase() === "custom") {
    resolvedCategory = "Altro";
  } else {
    resolvedCategory = String(resolvedCategory).charAt(0).toUpperCase() + String(resolvedCategory).slice(1).toLowerCase();
  }
  return resolvedCategory.trim();
}