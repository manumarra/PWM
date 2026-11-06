import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { load as loadYaml } from "js-yaml";
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
// Documentazione delle API (OpenAPI/Swagger): src/docs/openapi.yaml
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const openApiSpec = loadYaml(fs.readFileSync(path.join(__dirname, "docs", "openapi.yaml"), "utf-8"));
const port = process.env.PORT || 3000;

// Il webhook di Stripe ha bisogno del corpo grezzo
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/users", userRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// Swagger UI su http://localhost:3000/api-docs (e la specifica grezza su /api-docs.json)
app.get("/api-docs.json", (req, res) => res.json(openApiSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: "FastFood API" }));

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