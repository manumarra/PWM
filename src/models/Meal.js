import mongoose from "mongoose";

const {Schema} = mongoose;

const mealSchema = new Schema({
    
    idMeal: {type: String, required: true},
    strMeal: {type: String, required: true},
    strCategory: {type: String},
    strArea: {type: String},
    strInstructions: {type: String},
    strMealThumb: {type: String},
    ingredients: [{type: String}]
}, {timestamps: true});

export default mongoose.model("Meal", mealSchema);