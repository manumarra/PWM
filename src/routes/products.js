import { Router } from "express";
import { asyncWrapper as AW } from "../utils/asyncWrapper.js";
import * as productRepo from "../repositories/productRepository.js";

const router = Router();

// POST /api/products/create
router.post(
  "/create",
  AW(async (req, res) => {
    const { restaurantId, nameMeal, price, ingredients } = req.body;

    // Solo controllo di presenza parametri essenziali HTTP
    if (!restaurantId || !nameMeal || price === undefined || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Dati incompleti: restaurantId, nome, prezzo e ingredienti sono obbligatori"
      });
    }

    const newProduct = await productRepo.createProduct(req.body);
    res.status(201).json({ status: "ok", data: newProduct });
  })
);

// GET /api/products/restaurant/:restaurantId
router.get("/restaurant/:restaurantId", AW(async (req, res) => {
    const { restaurantId } = req.params;

    const products = await productRepo.getProductsByRestaurant(restaurantId);
    res.json({status: "ok", data: products });
  })
);

// PUT /api/products/update/:id
router.put("/update/:id", AW(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const updated = await productRepo.updateProduct(id, updates);

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
      return res.status(404).json({status: "fail", message: "Lista prodotti non trovata"});
    }
    res.json({status: "ok", message: "Lista prodotti eliminata con successo"})
  })
);

export default router;