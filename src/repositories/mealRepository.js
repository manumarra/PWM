import Meal from "../models/Meal.js";
import { escapeRegex, splitList } from "../public/utils/common/regex.js";

export const getPaginatedMeals = async ({ category, search, ingredient, page = 1, limit = 12 } = {}) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (category && String(category).trim()) {
    filter.category = { $regex: `^${escapeRegex(String(category).trim())}$`, $options: "i" };
  }

  if (search && String(search).trim()) {
    filter.nameMeal = { $regex: escapeRegex(String(search).trim()), $options: "i" };
  }

  const ingredients = splitList(ingredient);
  if (ingredients.length > 0) {
    filter.$and = ingredients.map((i) => ({
      ingredients: { $regex: escapeRegex(i), $options: "i" }
    }));
  }

  const [data, total] = await Promise.all([
    Meal.find(filter)
      .sort({ nameMeal: 1 })
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