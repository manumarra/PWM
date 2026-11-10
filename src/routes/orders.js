import { Router } from "express";
import { asyncWrapper as AW } from "../utils/asyncWrapper.js";
import * as orderRepo from "../repositories/orderRepository.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as userRepo from "../repositories/userRepository.js";
import * as stripeService from "../public/services/stripeService.js";

const router = Router();

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 12, 1), 50);
  return { page, limit };
};

// POST /api/orders/create (solo clienti; il cliente è quello del token)
router.post("/create", requireAuth, requireRole("customer"), AW(async (req, res) => {
  const newOrder = await orderRepo.createOrder(req.user.id, req.body);
  // Pagamento simulato (nessuna chiave Stripe): l'ordine è già valido
  if (newOrder.payment.provider !== "stripe") {
    return res.status(201).json({ status: "ok", data: newOrder });
  }

  // Stripe: crea la sessione di pagamento e indica al browser dove mandare il cliente
  try {
    const customer = await userRepo.getUserById(req.user.id);
    const session = await stripeService.createCheckoutSession(newOrder, customer?.email);
    await orderRepo.setCheckoutSession(newOrder._id, session.id);
    return res.status(201).json({ status: "ok", data: newOrder, checkoutUrl: session.url });
  } catch (error) {
    // L'ordine resta "in attesa di pagamento": il cliente può riprovare dallo storico
    return res.status(502).json({ status: "fail", message: error.message, orderId: newOrder._id });
  }
}));

// GET /api/orders/customer/:customerId (solo i propri ordini)
router.get("/customer/:customerId", requireAuth, requireRole("customer"), AW(async (req, res) => {
  if (req.params.customerId !== req.user.id) {
    return res.status(403).json({ status: "fail", message: "Operazione non consentita" });
  }
  const { page, limit } = parsePagination(req.query);
  const result = await orderRepo.getOrdersByCustomer(req.user.id, page, limit);
  res.json({ status: "ok", ...result });
}));

// GET /api/orders/restaurant/:restaurantId (ordini del proprio ristorante)
router.get("/restaurant/:restaurantId", requireAuth, requireRole("restaurateur"), AW(async (req, res) => {
  if (req.params.restaurantId !== req.user.id) {
    return res.status(403).json({ status: "fail", message: "Operazione non consentita" });
  }
  const orders = await orderRepo.getOrdersByRestaurant(req.user.id);
  res.json({ status: "ok", data: orders });
}));

// PATCH /api/orders/update-status/:id (solo il ristorante proprietario)
router.patch("/update-status/:id", requireAuth, requireRole("restaurateur"), AW(async (req, res) => {
  const { status, verificationCode } = req.body;

  if (!status) {
    return res.status(400).json({ status: "fail", message: "Stato mancante nel payload" });
  }

  try {
    const updatedOrder = await orderRepo.updateOrderStatus(req.params.id, req.user.id, status, verificationCode);

    if (!updatedOrder) {
      return res.status(404).json({ status: "fail", message: "Ordine non trovato" });
    }
    res.json({ status: "ok", data: updatedOrder });
  } catch (error) {
    return res.status(error.status || 400).json({ status: "fail", message: error.message });
  }
}));

// GET /api/orders/restaurant/:restaurantId/history
router.get("/restaurant/:restaurantId/history", requireAuth, requireRole("restaurateur"), AW(async (req, res) => {
  if (req.params.restaurantId !== req.user.id) {
    return res.status(403).json({ status: "fail", message: "Operazione non consentita" });
  }
  const { page, limit } = parsePagination(req.query);
  const result = await orderRepo.getRestaurantOrderHistory(req.user.id, page, limit);
  res.json({ status: "ok", ...result });
}));

// POST /api/orders/quote (anteprima di prezzi, consegna e attesa)
router.post("/quote", requireAuth, requireRole("customer"), AW(async (req, res) => {
  const quote = await orderRepo.buildQuote(req.body);
  res.json({ status: "ok", data: quote });
}));

// GET /api/orders/restaurant/:restaurantId/stats?days=30 (solo il proprio ristorante)
router.get("/restaurant/:restaurantId/stats", requireAuth, requireRole("restaurateur"), AW(async (req, res) => {
  if (req.params.restaurantId !== req.user.id) {
    return res.status(403).json({ status: "fail", message: "Operazione non consentita" });
  }
  const stats = await orderRepo.getRestaurantStats(req.user.id, req.query.days);
  res.json({ status: "ok", data: stats });
}));

export default router;