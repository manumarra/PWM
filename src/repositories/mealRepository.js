// src/repositories/mealRepository.js
import Meal from "../models/Meal.js";

// READ paginato con filtri e conteggio (per menuBuilder)
export const getPaginatedMeals = async ({ filter = {}, page = 1, limit = 12 } = {}) => {
  const skip = (page - 1) * limit;

  // Esegue query e conteggio totale in parallelo
  const [data, total] = await Promise.all([
    Meal.find(filter)
      .skip(skip)
      .limit(limit)
      .lean(), // Restituisce oggetti JS semplici, velocizzando la lettura (+30%)
    Meal.countDocuments(filter)
  ]);

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

// READ per singolo piatto (utile quando il ristoratore clicca su un piatto per vederne i dettagli)
export const getMealById = (id) => Meal.findById(id).lean();