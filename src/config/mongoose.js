import mongoose from "mongoose";

// Opzioni di connessione raccomandate
const opts = { 
  maxPoolSize: 10, 
  serverSelectionTimeoutMS: 5000, 
  socketTimeoutMS: 45000, 
  family: 4 // IPv4
};

export async function connectMongoose() { 
  mongoose.set("strictQuery", true); // ignora campi extra
  
  mongoose.connection.on("connected", () => console.log("✅ Mongoose connesso"));
  mongoose.connection.on("error", (err) => console.error("❌ Mongoose errore:", err));
  mongoose.connection.on("disconnected", () => console.warn("⚠️ Mongoose disconnesso"));

  await mongoose.connect(
    process.env.MONGODB_URI, opts
    );
}

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Connessione chiusa per terminazione app");
  process.exit(0);
});