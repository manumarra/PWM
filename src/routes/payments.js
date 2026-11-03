import { Router } from "express";
import { asyncWrapper as AW } from "../utils/asyncWrapper.js";
import * as orderRepo from "../repositories/orderRepository.js";
import * as userRepo from "../repositories/userRepository.js";
import * as paymentRepo from "../repositories/paymentRepository.js";
import * as stripeService from "../public/services/stripeService.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const fail = (res, status, message) => res.status(status).json({ status: "fail", message });

// GET /api/payments/config (pubblica): il frontend sa se i pagamenti online sono attivi
router.get("/config", (req, res) => {
  res.json({ status: "ok", data: { stripeEnabled: stripeService.stripeEnabled } });
});

// POST /api/payments/checkout/:orderId
// Nuova sessione di pagamento per un ordine Stripe ancora in attesa ("Riprendi pagamento")
router.post("/checkout/:orderId", requireAuth, requireRole("customer"), AW(async (req, res) => {
  if (!stripeService.stripeEnabled) return fail(res, 503, "Pagamenti online non attivi");

  const order = await orderRepo.getOrderById(req.params.orderId);
  if (!order || String(order.customerId) !== req.user.id) {
    return fail(res, 404, "Ordine non trovato");
  }
  if (order.payment?.provider !== "stripe" || order.payment?.status !== "in_attesa") {
    return fail(res, 400, "Questo ordine non è in attesa di pagamento");
  }

  const customer = await userRepo.getUserById(req.user.id);
  const session = await stripeService.createCheckoutSession(order, customer?.email);
  await orderRepo.setCheckoutSession(order._id, session.id);

  res.json({ status: "ok", checkoutUrl: session.url });
}));

// POST /api/payments/confirm { sessionId }
// Chiamata dalla pagina di esito: chiede a Stripe se la sessione è stata pagata
router.post("/confirm", requireAuth, requireRole("customer"), AW(async (req, res) => {
  if (!stripeService.stripeEnabled) return fail(res, 503, "Pagamenti online non attivi");

  const { sessionId } = req.body;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return fail(res, 400, "Sessione di pagamento non valida");
  }

  const session = await stripeService.retrieveSession(sessionId);
  const order = session.metadata?.orderId ? await orderRepo.getOrderById(session.metadata.orderId) : null;

  if (!order || String(order.customerId) !== req.user.id) {
    return fail(res, 404, "Ordine non trovato");
  }
  if (session.amount_total !== Math.round(order.totalAmount * 100)) {
    return fail(res, 400, "Importo del pagamento non coerente con l'ordine");
  }

  if (session.payment_status === "paid") {
    await paymentRepo.markOrderPaid(order._id, session);
  }

  const updated = await orderRepo.getOrderById(order._id);
  res.json({ status: "ok", data: { orderId: updated._id, paymentStatus: updated.payment.status } });
}));

const PAID_EVENTS = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];

// Webhook di Stripe (montato in app.js con il corpo grezzo, prima di express.json)
export const stripeWebhook = async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeService.stripeEnabled || !secret) {
    return fail(res, 501, "Webhook non configurato");
  }

  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, req.headers["stripe-signature"]);
  } catch {
    return fail(res, 400, "Firma del webhook non valida");
  }

  try {
    const session = event.data.object;
    if (PAID_EVENTS.includes(event.type) && session.payment_status === "paid" && session.metadata?.orderId) {
      const full = await stripeService.retrieveSession(session.id); // con i dettagli della carta
      await paymentRepo.markOrderPaid(session.metadata.orderId, full);
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Errore nel webhook Stripe:", err.message);
    res.status(500).json({ status: "fail", message: "Errore nell'elaborazione dell'evento" });
  }
};

export default router;