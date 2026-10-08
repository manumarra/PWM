import fs from "fs";
import Meal from "../models/Meal.js";

export async function seedDatabase() {
  try {
    const count = await Meal.countDocuments();
    
    if (count === 0) {
      console.log("⏳ Database vuoto, caricamento sincrono del file JSON...");

      const fileData = fs.readFileSync("./meals.json", "utf-8"); 
      const parsedData = JSON.parse(fileData);

      const cleanData = parsedData.map(meal => {
        return {
          mealId: meal.idMeal,
          nameMeal: meal.strMeal,
          category: meal.strCategory,
          area: meal.strArea,
          instructions: meal.strInstructions,
          image: meal.strMealThumb,
          ingredients: meal.ingredients || [],
          measures: meal.measures || []
        };
      });

      await Meal.insertMany(cleanData);
      console.log("✅ Dati iniziali caricati con successo!");
    } else {
      console.log(`ℹ️ Database già popolato (${count} piatti presenti).`);
    }
  } catch (error) {
    console.error("❌ Errore durante il caricamento dati:", error);
  }
}
//mealId, nameMeal,category, area, instructions, image, ingriedients, measures