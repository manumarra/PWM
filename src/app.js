import "dotenv/config";
import express from "express";
import { connectMongoose } from "./config/mongoose.js";
import { seedDatabase } from "./config/seed.js";
import userRoutes from "./routes/users.js";
import mealRoutes from "./routes/meals.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes, { stripeWebhook } from "./routes/payments.js";
import { startPaymentCleanup } from "./repositories/paymentRepository.js";
import { stripeEnabled } from "./public/services/stripeService.js";
import { mongoErrorHandler } from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";

const app = express();
const port = process.env.PORT || 3000;

// Il webhook di Stripe ha bisogno del corpo grezzo: va montato PRIMA di express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json());
app.use(cookieParser());
app.use(express.static("./src/public"));
app.use("/api/users", userRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use(mongoErrorHandler);

async function startServer(){
    try {
        await connectMongoose();
        app.listen(port, () => {
            console.log(`Server in ascolto sulla porta ${port}`);
            seedDatabase();
            startPaymentCleanup();
            if (!stripeEnabled) {
                console.log("💳 Pagamenti: simulati (nessuna chiave Stripe)");
            } else if (process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
                console.warn("⚠️  Stripe: è in uso una chiave REALE (live)!");
            } else {
                console.log("💳 Pagamenti: Stripe attivo (modalità test)");
            }
        });
    } catch (error) {
        console.error("Errore durante l'avvio del server:", error);
        process.exit(1);
    }
}

startServer();