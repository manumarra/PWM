import { Router } from "express";
import { asyncWrapper as AW } from "../utils/asyncWrapper.js";
import * as repo from "../repositories/mealRepository.js";

const router = Router();

// GET /api/meals/catalog?page=1&limit=12&category=...&search=...
router.get(
  "/catalog",
  AW(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const { category, search } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (search) filter.nameMeal = { $regex: search, $options: "i" };

    const result = await repo.getPaginatedMeals({ filter, page, limit });
    res.json({
      status: "ok",
      data: result.data,
      pagination: result.pagination
    });
  })
);

// GET /api/meals/detail/:id
router.get(
  "/detail/:id",
  AW(async (req, res) => {
    const { id } = req.params;
    const meal = await repo.getMealById(id);

    if (!meal) {
      return res.status(404).json({
        status: "fail",
        message: "Piatto non trovato nel ricettario comune"
      });
    }

    res.json({
      status: "ok",
      data: meal
    });
  })
);

export default router;