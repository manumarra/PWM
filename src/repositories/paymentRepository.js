import Order from "../models/Order.js";
import { stripeEnabled } from "../public/services/stripeService.js";

const UNPAID_TIMEOUT_MINUTES = 35;     // oltre la scadenza della sessione Stripe (31 minuti)
const CLEANUP_EVERY_MS = 5 * 60 * 1000;

const METHOD_BY_FUNDING = { prepaid: "prepaid_card", debit: "debit_card" };

// Segna l'ordine come pagato. Idempotente: se è già "completato" non cambia nulla.
// Da "fallito" si può passare a "completato": se Stripe ha incassato, l'ordine va onorato.
export const markOrderPaid = async (orderId, session) => {
  const intent = session.payment_intent;
  const card = intent?.payment_method?.card;

  const fields = {
    "payment.status": "completato",
    "payment.paidAt": new Date()
  };
  const intentId = typeof intent === "string" ? intent : intent?.id;
  if (intentId) fields["payment.transactionId"] = intentId;
  if (card?.last4) fields["payment.last4Digits"] = card.last4;
  if (card?.funding) fields["payment.method"] = METHOD_BY_FUNDING[card.funding] || "credit_card";

  return Order.findOneAndUpdate(
    { _id: orderId, "payment.status": { $in: ["in_attesa", "fallito"] } },
    { $set: fields },
    { returnDocument: "after" }
  );
};

// Gli ordini Stripe non pagati entro il tempo limite diventano "fallito"
export const expireUnpaidOrders = async () => {
  const limit = new Date(Date.now() - UNPAID_TIMEOUT_MINUTES * 60 * 1000);
  const result = await Order.updateMany(
    { "payment.provider": "stripe", "payment.status": "in_attesa", createdAt: { $lt: limit } },
    { $set: { "payment.status": "fallito" } }
  );
  if (result.modifiedCount > 0) {
    console.log(`🧹 ${result.modifiedCount} ordini non pagati scaduti`);
  }
};

export const startPaymentCleanup = () => {
  if (!stripeEnabled) return;
  expireUnpaidOrders().catch(console.error);
  setInterval(() => expireUnpaidOrders().catch(console.error), CLEANUP_EVERY_MS).unref();
};