import "dotenv/config";
import express from "express";
import { connectMongoose } from "./config/mongoose.js";
import { seedDatabase } from "./config/seed.js";
import userRoutes from "./routes/users.js";
import mealRoutes from "./routes/meals.js";
import productRoutes from "./routes/products.js";
import { mongoErrorHandler } from "./middleware/errorHandler.js";
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("./src/public"));
app.use("/api/users", userRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/products", productRoutes);
app.use(mongoErrorHandler);

async function startServer(){
    try {
        await connectMongoose();
        app.listen(port, () => {
            console.log(`Server in ascolto sulla porta ${port}`);
            seedDatabase();
        });
    } catch (error) {
        console.error("Errore durante l'avvio del server:", error);
        process.exit(1);
    }
}

startServer();