// src/repositories/mealRepository.js
import Meal from "../models/Meal.js";

export const getPaginatedMeals = async ({ category, search, page = 1, limit = 12 } = {}) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  const skip = (pageNum - 1) * limitNum;

  // Costruzione del filtro isolata nel repository
  const filter = {};

  if (category) {
    const formattedCategory =
      String(category).charAt(0).toUpperCase() + String(category).slice(1).toLowerCase();
    filter.category = formattedCategory;
  }

  if (search) {
    filter.nameMeal = { $regex: search, $options: "i" };
  }

  const [data, total] = await Promise.all([
    Meal.find(filter)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Meal.countDocuments(filter)
  ]);

  return {
    data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
      hasNext: pageNum * limitNum < total,
      hasPrev: pageNum > 1
    }
  };
};

export const getMealById = (id) => Meal.findById(id).lean();