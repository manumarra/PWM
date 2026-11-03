import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

// Senza chiave il progetto funziona comunque: i pagamenti diventano simulati ("mock")
export const stripeEnabled = Boolean(secretKey);
const stripe = stripeEnabled ? new Stripe(secretKey) : null;

const APP_URL = (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/+$/, "");
const SESSION_MINUTES = 31; // Stripe richiede che la sessione viva almeno 30 minuti
const toCents = (euro) => Math.round(euro * 100);

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Sessione di pagamento per un ordine: importi e righe vengono dall'ordine salvato sul server
export async function createCheckoutSession(order, customerEmail) {
  const lineItems = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "eur",
      unit_amount: toCents(item.price),
      product_data: { name: item.nameMeal }
    }
  }));

  if (order.deliveryFee > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: toCents(order.deliveryFee),
        product_data: { name: "Consegna a domicilio" }
      }
    });
  }

  try {
    return await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "it",
      allowed_payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: customerEmail || undefined,
      client_reference_id: String(order._id),
      metadata: { orderId: String(order._id) },
      expires_at: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
      success_url: `${APP_URL}/pages/customer/paymentResult.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/pages/customer/paymentResult.html?canceled=1`
    });
  } catch (err) {
    console.error("Errore Stripe (creazione sessione):", err.message);
    throw httpError(502, "Servizio di pagamento non disponibile, riprova tra poco");
  }
}

// Legge la sessione da Stripe, con i dettagli della carta usata
export async function retrieveSession(sessionId) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.payment_method"]
    });
  } catch (err) {
    if (err.statusCode === 404) throw httpError(400, "Sessione di pagamento non valida");
    console.error("Errore Stripe (lettura sessione):", err.message);
    throw httpError(502, "Impossibile verificare il pagamento con Stripe");
  }
}

// Verifica la firma di una notifica (richiede il corpo grezzo della richiesta)
export function constructWebhookEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
}