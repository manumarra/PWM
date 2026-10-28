import Order from "../models/Order.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { Restaurant } from "../models/User.js";

// READ: Storico ordini per il CLIENTE
export const getOrdersByCustomer = async (customerId, page = 1, limit = 12) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Order.find({ customerId })
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit)
         .populate("restaurantId", "name phone address")
         .lean(),
    Order.countDocuments({ customerId })
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total
    }
  };
};

// Storico ristorante
export const getRestaurantOrderHistory = async (restaurantId, page = 1, limit = 12) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Order.find({ restaurantId, status: "consegnato" })
         .sort({ createdAt: -1 })
         .skip(skip)
         .limit(limit)
         .populate("customerId", "name phone email")
         .lean(),
    Order.countDocuments({ restaurantId, status: "consegnato" })
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total
    }
  };
};

// ── Parametri di calcolo (da motivare nella relazione) ──
const BASE_PREP_MINUTES = 10;   // tempo minimo di preparazione
const MINUTES_PER_ITEM = 2;     // minuti per ogni piatto in coda, compresi quelli del nuovo ordine
const MAX_ITEM_QUANTITY = 20;
const QUEUE_STATUSES = ["ordinato", "in preparazione"];

const round2 = (n) => Math.round(n * 100) / 100;
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });
const countItems = (items) => items.reduce((sum, i) => sum + i.quantity, 0);

// CREATE: prezzi, totale e tempo di attesa sono calcolati qui, non dal client
export const createOrder = async (customerId, data) => {
  const { restaurantId, items, orderType, deliveryAddress, distanceKm, deliveryFee, payment } = data;

  if (!["takeaway", "delivery"].includes(orderType)) {
    throw badRequest("Tipo ordine non valido");
  }
  if (!mongoose.isValidObjectId(restaurantId) || !(await Restaurant.exists({ _id: restaurantId }))) {
    throw badRequest("Ristorante non valido");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest("L'ordine deve contenere almeno un piatto");
  }
  if (!items.every((i) => mongoose.isValidObjectId(i?.productId))) {
    throw badRequest("Piatto non valido");
  }

  // Piatti letti dal DB, solo se appartengono a quel ristorante
  const products = await Product.find({
    _id: { $in: items.map((i) => i.productId) },
    restaurantId
  }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const orderItems = items.map(({ productId, quantity }) => {
    const p = byId.get(String(productId));
    if (!p) throw badRequest("Uno dei piatti non appartiene al ristorante selezionato");
    if (!p.available) throw badRequest(`"${p.nameMeal}" non è al momento disponibile`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      throw badRequest(`Quantità non valida per "${p.nameMeal}"`);
    }
    return {
      productId: p._id,
      nameMeal: p.nameMeal,
      price: round2(p.price - (p.price * p.discount) / 100),
      quantity
    };
  });

  const subtotal = round2(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0));

  // TODO (prossimo passo): distanza e costo di consegna calcolati dal server
  const isDelivery = orderType === "delivery";
  const fee = isDelivery ? round2(Math.max(0, Number(deliveryFee) || 0)) : 0;
  const km = isDelivery ? Math.max(0, Number(distanceKm) || 0) : 0;

  // Tempo di attesa: dipende dai piatti già in coda al ristorante
  const queued = await Order.find({ restaurantId, status: { $in: QUEUE_STATUSES } })
    .select("items.quantity")
    .lean();
  const queuedItems = queued.reduce((sum, o) => sum + countItems(o.items), 0);
  const estimatedTimeMinutes = BASE_PREP_MINUTES + MINUTES_PER_ITEM * (queuedItems + countItems(orderItems));

  return Order.create({
    customerId,
    restaurantId,
    items: orderItems,
    orderType,
    deliveryAddress: isDelivery ? deliveryAddress : undefined,
    distanceKm: km,
    deliveryFee: fee,
    subtotal,
    totalAmount: round2(subtotal + fee),
    estimatedTimeMinutes,
    payment: {
      provider: payment?.provider,
      method: payment?.method,
      last4Digits: payment?.last4Digits
    }
  });
};

// READ: Ordini per la Dashboard e Kanban (Attivi + Oggi)
export const getOrdersByRestaurant = (restaurantId) => {
  // mezzanotte di oggi
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Order.find({
    restaurantId,
    $or: [
      { status: { $ne: "consegnato" } }, // 1. Prendi TUTTI gli ordini non ancora consegnati (anche vecchi)
      { createdAt: { $gte: today } }     // 2. OPPURE prendi TUTTI gli ordini creati da stanotte in poi (serve per l'incasso)
    ]
  })
  .sort({ createdAt: -1 })
  .populate("customerId", "name phone email")
  .lean();
};

export const getOrderById = (id) => Order.findById(id).lean();

// Transizioni di stato consentite, per tipo di ordine
const FLOW = {
  delivery: {
    "ordinato": ["in preparazione"],
    "in preparazione": ["in consegna"],
    "in consegna": ["consegnato"]
  },
  takeaway: {
    "ordinato": ["in preparazione"],
    "in preparazione": ["consegnato"]
  }
};

// UPDATE: stato ordine con regole di business (solo il ristorante proprietario)
export const updateOrderStatus = async (id, restaurantId, newStatus, verificationCode) => {
  const order = await Order.findOne({ _id: id, restaurantId });
  if (!order) return null;

  const allowed = FLOW[order.orderType]?.[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Transizione non consentita: da "${order.status}" a "${newStatus}"`);
  }

  if (newStatus === "consegnato") {
    if (!verificationCode || String(order.verificationCode) !== String(verificationCode).trim()) {
      throw new Error("Codice di verifica errato. Consegna rifiutata.");
    }
  }

  order.status = newStatus;
  await order.save();
  return order.toObject();
};