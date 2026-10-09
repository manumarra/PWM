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

    if (!restaurantId || !nameMeal || price === undefined || ingredients.length === 0) {
        return res.status(400).json({status: "fail", message: "Dati incompleti: restaurantId, nome, prezzo e ingredienti sono obbligatori" });
    }

    const newProduct = await productRepo.createProduct({
        restaurantId,
        nameMeal: nameMeal,
        price: parseFloat(price),
        ingredients: ingredients,
        category: category || "Altro",
        image: image || "/assets/defaultMeal.jpeg",
        mealId: mealId || null
    });
    
    res.status(201).json({status: "ok", data: newProduct });
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