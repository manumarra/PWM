import "dotenv/config";
import express from "express";
import { connectMongoose } from "./config/mongoose.js";
import { seedDatabase } from "./config/seed.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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