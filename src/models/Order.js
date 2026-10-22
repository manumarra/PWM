// src/models/Order.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const deliveryAddressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zip: {
      type: String,
      required: true,
      match: [/^\d{5}$/, "CAP non valido (5 cifre)"]
    },
    notes: { type: String, trim: true }
  },
  { _id: false }
);

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    nameMeal: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Il prezzo non può essere negativo"]
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "La quantità minima ordinabile è 1"],
      default: 1
    }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Identificativo cliente obbligatorio"]
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Identificativo ristorante obbligatorio"]
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "L'ordine deve contenere almeno un piatto"
      }
    },
    orderType: {
      type: String,
      enum: {
        values: ["takeaway", "delivery"],
        message: "Tipo ordine consentito: takeaway o delivery"
      },
      required: true,
      default: "delivery"
    },
    verificationCode: {
      type: String,
      required: true,
      default: () => Math.floor(100000 + Math.random() * 900000).toString() // Genera es: "482910"
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: function () {
        return this.orderType === "delivery";
      }
    },
    distanceKm: {
      type: Number,
      min: 0,
      default: 0
    },
    deliveryFee: {
      type: Number,
      min: 0,
      default: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // ── GESTIONE PAGAMENTO ONLINE (Stripe / Gateway) ──
    payment: {
      provider: {
        type: String,
        enum: ["stripe", "mock"],
        default: "stripe"
      },
      transactionId: {
        type: String, // es. "pi_3MtwBwLkdIwHu7ix28a3tqPa" (PaymentIntent di Stripe)
        trim: true
      },
      status: {
        type: String,
        enum: ["in_attesa", "completato", "fallito", "rimborsato"],
        default: "in_attesa"
      },
      method: {
        type: String,
        enum: ["credit_card", "prepaid_card"],
        default: "credit_card"
      },
      last4Digits: {
        type: String,
        match: [/^\d{4}$/, "Ultime 4 cifre non valide"]
      }
    },

    // Stati del ciclo di vita dell'ordine richiesti dal progetto FastFood
    status: {
      type: String,
      enum: {
        values: ["ordinato", "in_preparazione", "in consegna", "consegnato"],
        message: "Stato ordine non valido"
      },
      default: "ordinato"
    },
    estimatedTimeMinutes: {
      type: Number,
      min: 0,
      default: 30
    }
  },
  {
    timestamps: true
  }
);

// Indici per query veloci
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });

export default mongoose.model("Order", orderSchema);