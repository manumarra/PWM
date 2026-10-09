import { Router } from "express";
import { asyncWrapper as AW } from "../utils/asyncWrapper.js";
import * as productRepo from "../repositories/productRepository.js";

const router = Router();

// GET /api/products/restaurant/:restaurantId
router.get("/restaurant/:restaurantId", AW(async (req, res) => {
    const { restaurantId } = req.params;

    const products = await productRepo.getProductsByRestaurant(restaurantId);
    res.json({status: "ok", data: products });
  })
);

// POST /api/products/create
router.post("/create", AW(async (req, res) => {
    const { restaurantId, nameMeal, price, ingredients, category, image, mealId } = req.body;

    // 1. Controllo validità dei dati con verifica sicura dell'array
    if (!restaurantId || !nameMeal || price === undefined || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({status: "fail", message: "Dati incompleti: restaurantId, nome, prezzo e ingredienti sono obbligatori" });
    }

    // 2. Risoluzione categoria: pulizia spazi ed esclusione di valori non validi o 'custom'
    let resolvedCategory = (typeof category === "string") ? category.trim() : "";
    if (!resolvedCategory || resolvedCategory.toLowerCase() === "custom") {
        resolvedCategory = "Altro";
    } else resolvedCategory = String(category).charAt(0).toUpperCase().trim() + String(category).slice(1).toLowerCase().trim()

    // 3. Creazione del prodotto tramite Repository
    const newProduct = await productRepo.createProduct({
        restaurantId,
        nameMeal: nameMeal.trim(),
        price: parseFloat(price),
        ingredients: ingredients,
        category: resolvedCategory,
        image: image || "/assets/defaultMeal.jpeg",
        mealId: mealId || null
    });
    
    // 4. Risposta JSON con status 201 Created
    res.status(201).json({ status: "ok", data: newProduct });
  })
);

// PUT /api/products/update/:id
router.put("/update/:id", AW(async (req, res) => {
    const { id } = req.params;
    const updated = await productRepo.updateProduct(id, req.body);

    if (!updated) {
      return res.status(404).json({status: "fail", message: "Prodotto non trovato" });
    }

    res.json({status: "ok", data: updated });
  })
);

// DELETE /api/products/remove/:id
router.delete("/remove/:id", AW(async (req, res) => {
    const { id } = req.params;
    const deleted = await productRepo.deleteProduct(id);

    if (!deleted) {
      return res.status(404).json({status: "fail", message: "Prodotto non trovato" });
    }

    res.json({status: "ok", message: "Prodotto rimosso con successo" });
  })
);

router.delete("/restaurant/:restaurantId", AW(async(req, res) => {
    const { restaurantId } = req.params;
    const deleted = await productRepo.deleteAllProduct(restaurantId);

    if(!deleted) {
      return res.status(404).json({status: "fail", message: "Menù non trovato"});
    }
    res.json({stauts: "ok", message: "Menù eliminato con successo"})
  })
);

export default router;