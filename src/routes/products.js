import { Router } from "express";
import { asyncWrapper as AW } from "../utils/asyncWrapper.js";
import * as productRepo from "../repositories/productRepository.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// POST /api/products/create (solo ristoratori; il ristorante è quello del token)
router.post("/create", requireAuth, requireRole("restaurateur"), AW(async (req, res) => {
  const { nameMeal, price, ingredients } = req.body;

  if (!nameMeal || price === undefined || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({
      status: "fail",
      message: "Dati incompleti: nome, prezzo e ingredienti sono obbligatori"
    });
  }

  const newProduct = await productRepo.createProduct({ ...req.body, restaurantId: req.user.id });
  res.status(201).json({ status: "ok", data: newProduct });
}));

// GET /api/products/restaurant/:restaurantId (pubblica: i clienti vedono il menu)
router.get("/restaurant/:restaurantId", AW(async (req, res) => {
  const products = await productRepo.getProductsByRestaurant(req.params.restaurantId);
  res.json({ status: "ok", data: products });
}));

// PUT /api/products/update/:id
router.put("/update/:id", requireAuth, requireRole("restaurateur"), AW(async (req, res) => {
  const updated = await productRepo.updateProduct(req.params.id, req.user.id, req.body);
  if (!updated) {
    return res.status(404).json({ status: "fail", message: "Prodotto non trovato" });
  }
  res.json({ status: "ok", data: updated });
}));

// DELETE /api/products/remove/:id
router.delete("/remove/:id", requireAuth, requireRole("restaurateur"), AW(async (req, res) => {
  const deleted = await productRepo.deleteProduct(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ status: "fail", message: "Prodotto non trovato" });
  }
  res.json({ status: "ok", message: "Prodotto rimosso con successo" });
}));

// DELETE /api/products/restaurant/:restaurantId (svuota il proprio menu)
router.delete("/restaurant/:restaurantId", requireAuth, requireRole("restaurateur"), AW(async (req, res) => {
  if (req.params.restaurantId !== req.user.id) {
    return res.status(403).json({ status: "fail", message: "Operazione non consentita" });
  }
  await productRepo.deleteAllProduct(req.user.id);
  res.json({ status: "ok", message: "Lista prodotti eliminata con successo" });
}));

export default router;