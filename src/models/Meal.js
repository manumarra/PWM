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

export default mongoose.model("Meal", mealSchema);