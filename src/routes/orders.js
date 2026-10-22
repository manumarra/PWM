import { Router } from "express";
import { asyncWrapper as AW } from "../utils/asyncWrapper.js";
import * as orderRepo from "../repositories/orderRepository.js";

const router = Router();

// POST /api/orders/create
router.post("/create", AW(async (req, res, next) => {
  const { customerId, restaurantId, items, orderType, totalAmount } = req.body;

  if (!customerId || !restaurantId || !items || items.length === 0 || totalAmount === undefined) {
    return res.status(400).json({
      status: "fail",
      message: "Dati incompleti: customerId, restaurantId, items e totalAmount sono obbligatori"
    });
  }

  const newOrder = await orderRepo.createOrder(req.body);
  res.status(201).json({ status: "ok", data: newOrder });
}));

// GET /api/orders/customer/:customerId
router.get("/customer/:customerId", AW(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  
  const result = await orderRepo.getOrdersByCustomer(req.params.customerId, page, limit);
  
  // result contiene già { data: [...], pagination: {...} }
  res.json({ status: "ok", ...result }); 
}));

// GET /api/orders/restaurant/:restaurantId
router.get("/restaurant/:restaurantId", AW(async (req, res, next) => {
  const orders = await orderRepo.getOrdersByRestaurant(req.params.restaurantId);
  res.json({ status: "ok", data: orders });
}));

// PATCH /api/orders/update-status/:id
router.patch("/update-status/:id", AW(async (req, res, next) => {
  const { status, verificationCode } = req.body;
  
  if (!status) {
    return res.status(400).json({ status: "fail", message: "Stato mancante nel payload" });
  }

  //  Verifica del codice per la consegna
  if (status === "consegnato") {
    const order = await orderRepo.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ status: "fail", message: "Ordine non trovato" });

    if (String(order.verificationCode).trim() !== String(verificationCode).trim()) {
      return res.status(400).json({ status: "fail", message: "Codice di verifica errato. Consegna rifiutata." });
    }
  }

  const updatedOrder = await orderRepo.updateOrderStatus(req.params.id, status);
  res.json({ status: "ok", data: updatedOrder });
}));

export default router;