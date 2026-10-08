import mongoose from "mongoose";

const {Schema} = mongoose;

const mealSchema = new Schema({
    
    mealId: {type: String, required: true},
    nameMeal: {type: String, required: true},
    category: {type: String},
    area: {type: String},
    instructions: {type: String},
    image: {type: String},
    ingredients: [{type: String}],
    measures: [{type: String}]
}, {timestamps: true});

export const getPaginatedMeals = async ({ filter = {}, page = 1, limit = 12 } = {}) => {
  const skip = (page - 1) * limit;

  // Eseguiamo query e conteggio in parallelo per massimizzare le performance
  const [data, total] = await Promise.all([
    Meal.find(filter)
      .skip(skip)
      .limit(limit)
      .lean(), // Oggetti POJO: +30% di velocità in lettura
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

export default mongoose.model("Meal", mealSchema);