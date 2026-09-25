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
        // Estraiamo il campo _id problematico e teniamo tutto il resto in 'restoDelPiatto'
        const { _id, ...restoDelPiatto } = meal; 
        return restoDelPiatto; // Ritorniamo l'oggetto pulito senza _id
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