import Product from "../models/Product.js";
import { Restaurant } from "../models/User.js";
import { ALLERGENS } from "../public//utils/common/allergens.js";
import { escapeRegex, splitList } from "../public/utils/common/regex.js";

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

// UPDATE: solo se il prodotto appartiene al ristorante. .save per l'hook degli allergeni
export const updateProduct = async (id, restaurantId, updates) => {
  const product = await Product.findOne({ _id: id, restaurantId });
  if (!product) return null;

  for (const field of PRODUCT_UPDATABLE_FIELDS) {
    if (updates[field] === undefined) continue;
    product[field] = field === "category" ? categoryFormatter(updates[field]) : updates[field];
  }

  await product.save();
  return product;
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

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

const SORTS = {
  name: { nameMeal: 1 },
  price_asc: { price: 1, nameMeal: 1 },
  price_desc: { price: -1, nameMeal: 1 }
};

// SEARCH: ricerca pubblica dei piatti in vendita (solo disponibili) di tutti i ristoranti
export const searchProducts = async (q = {}) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 12, 1), 50);

  // Solo ristoranti esistenti, eventualmente di una certa città
  const restaurantFilter = {};
  const city = String(q.city ?? "").trim();
  if (city) {
    restaurantFilter["address.city"] = { $regex: `^${escapeRegex(city)}$`, $options: "i" };
  }
  const restaurantIds = await Restaurant.distinct("_id", restaurantFilter);

  const filter = { available: true, restaurantId: { $in: restaurantIds } };

  const search = String(q.search ?? "").trim();
  if (search) filter.nameMeal = { $regex: escapeRegex(search), $options: "i" };

  const category = String(q.category ?? "").trim();
  if (category) filter.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };

  const min = parseFloat(q.minPrice);
  const max = parseFloat(q.maxPrice);
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    filter.price = {};
    if (!Number.isNaN(min)) filter.price.$gte = min;
    if (!Number.isNaN(max)) filter.price.$lte = max;
  }

  // Ingredienti: il piatto deve contenerli tutti
  const ingredients = splitList(q.ingredient);
  if (ingredients.length > 0) {
    filter.$and = ingredients.map((i) => ({
      ingredients: { $regex: escapeRegex(i), $options: "i" }
    }));
  }

  // Allergie: il piatto non deve contenere nessuno degli allergeni indicati
  const avoid = splitList(q.avoidAllergens).map((a) => a.toLowerCase());
  const invalid = avoid.filter((a) => !ALLERGENS.includes(a));
  if (invalid.length > 0) throw badRequest(`Allergene non valido: ${invalid.join(", ")}`);
  if (avoid.length > 0) filter.allergens = { $exists: true, $nin: avoid };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(SORTS[q.sort] || SORTS.name)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("restaurantId", "name image address")
      .lean(),
    Product.countDocuments(filter)
  ]);

  const data = products.map(({ restaurantId, ...p }) => ({
    ...p,
    restaurantId: restaurantId._id,
    restaurant: restaurantId
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};