import mongoose from "mongoose";
import { ALLERGENS } from "../public/utils/common/allergens.js";

const {Schema} = mongoose;

const mealSchema = new Schema({
    
    mealId: {type: String, required: true},
    nameMeal: {type: String, required: true},
    category: {type: String},
    area: {type: String},
    instructions: {type: String},
    image: {type: String},
    ingredients: [{type: String}],
    measures: [{type: String}],
    measures: [{type: String}],
    allergens: [{ type: String, enum: ALLERGENS }]
}, {timestamps: true});


export default mongoose.model("Meal", mealSchema);