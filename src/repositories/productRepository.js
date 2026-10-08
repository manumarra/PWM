// src/repositories/productRepository.js
import Product from "../models/Product.js";

// CREATE: salva un nuovo prodotto nel menù
export const createProduct = (productData) => Product.create(productData);

// READ: recupera tutti i prodotti di uno specifico ristorante
export const getProductsByRestaurant = (restaurantId) =>
  Product.find({ restaurantId }).sort({ createdAt: -1 }).lean();

// READ: recupera un singolo prodotto tramite ID
export const getProductById = (id) => Product.findById(id).lean();

// UPDATE: aggiorna dati, prezzo o ingredienti di un prodotto
export const updateProduct = (id, updates) =>
  Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();

// DELETE: rimuove un piatto dal menù
export const deleteProduct = (id) => Product.findByIdAndDelete(id);