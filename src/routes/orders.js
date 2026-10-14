// src/routes/orders.js
import { Router } from "express";
import { asyncWrapper as AW } from "../utils/asyncWrapper.js";
import * as orderRepo from "../repositories/orderRepository.js";

const router = Router();

// POST /api/orders/create - Creazione di un nuovo ordine
router.post(
  "/create",
  AW(async (req, res) => {
    const {
      customerId,
      restaurantId,
      items,
      orderType,
      deliveryAddress,
      totalAmount
    } = req.body;

    // Controllo parametri obbligatori a livello HTTP
    if (!customerId || !restaurantId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: "fail",
        message: "Dati incompleti: cliente, ristorante e almeno un piatto sono obbligatori"
      });
    }

    if (orderType === "delivery" && (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.zip)) {
      return res.status(400).json({
        status: "fail",
        message: "Per la consegna a domicilio sono obbligatori via, città e CAP"
      });
    }

    if (totalAmount === undefined || totalAmount === null) {
      return res.status(400).json({
        status: "fail",
        message: "Importo totale dell'ordine mancante"
      });
    }

    const newOrder = await orderRepo.createOrder(req.body);

    res.status(201).json({
      status: "ok",
      message: "Ordine registrato con successo",
      data: newOrder
    });
  })
);

// GET /api/orders/detail/:id - Dettaglio singolo ordine per ID
router.get(
  "/detail/:id",
  AW(async (req, res) => {
    const order = await orderRepo.getOrderById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: "fail",
        message: "Ordine non trovato"
      });
    }

    res.json({
      status: "ok",
      data: order
    });
  })
);

// GET /api/orders/my-orders/:customerId?page=1&limit=10 - Storico cliente
router.get(
  "/my-orders/:customerId",
  AW(async (req, res) => {
    const { page, limit } = req.query;
    const result = await orderRepo.getOrdersByCustomer(req.params.customerId, {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10
    });

    res.json({
      status: "ok",
      data: result.data,
      pagination: result.pagination
    });
  })
);

// GET /api/orders/restaurant/:restaurantId?status=... - Ordini ricevuti dal ristorante
router.get(
  "/restaurant/:restaurantId",
  AW(async (req, res) => {
    const { status } = req.query;
    const orders = await orderRepo.getOrdersByRestaurant(
      req.params.restaurantId,
      status || null
    );

    res.json({
      status: "ok",
      data: orders
    });
  })
);

// PATCH /api/orders/status/:id - Avanzamento del ciclo di vita
router.patch(
  "/status/:id",
  AW(async (req, res) => {
    const { status } = req.body;

    const validStatuses = ["ordinato", "in preparazione", "in consegna", "consegnato"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: `Stato non valido. Valori consentiti: ${validStatuses.join(", ")}`
      });
    }

    const updatedOrder = await orderRepo.updateOrderStatus(req.params.id, status);

    if (!updatedOrder) {
      return res.status(404).json({
        status: "fail",
        message: "Ordine non trovato"
      });
    }

    res.json({
      status: "ok",
      message: "Stato dell'ordine aggiornato con successo",
      data: updatedOrder
    });
  })
);

// PATCH /api/orders/payment/:id - Aggiornamento stato transazione
router.patch(
  "/payment/:id",
  AW(async (req, res) => {
    const { status, transactionId, last4Digits } = req.body;

    if (!status) {
      return res.status(400).json({
        status: "fail",
        message: "Stato del pagamento obbligatorio"
      });
    }

    const updatedOrder = await orderRepo.updatePaymentStatus(req.params.id, {
      status,
      transactionId,
      last4Digits
    });

    if (!updatedOrder) {
      return res.status(404).json({
        status: "fail",
        message: "Ordine non trovato"
      });
    }

    res.json({
      status: "ok",
      message: "Pagamento registrato",
      data: updatedOrder
    });
  })
);

// GET /api/orders/stats/:restaurantId - Statistiche vendite per il ristoratore
router.get(
  "/stats/:restaurantId",
  AW(async (req, res) => {
    const stats = await orderRepo.getRestaurantSalesStats(req.params.restaurantId);

    res.json({
      status: "ok",
      data: stats
    });
  })
);

export default router;