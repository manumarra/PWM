import Order from "../models/Order.js";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import { Restaurant } from "../models/User.js";
import { geocode, drivingRoute } from "../public/services/geoService.js";

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
const BASE_PREP_MINUTES = 10;        // tempo minimo di preparazione
const MINUTES_PER_ITEM = 2;          // minuti per ogni piatto in coda, compresi quelli del nuovo ordine
const TRAVEL_MINUTES_PER_KM = 3;     // tempo di viaggio per le consegne
const MAX_ITEM_QUANTITY = 20;
const QUEUE_STATUSES = ["ordinato", "in preparazione"];

const DELIVERY_MIN_FEE = 1.5;        // costo minimo di consegna (€)
const DELIVERY_FEE_PER_KM = 1.5;     // tariffa per km (€)
const MAX_DELIVERY_KM = 25;          // oltre questa distanza non si consegna

const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;
const badRequest = (message) => Object.assign(new Error(message), { status: 400 });
const countItems = (items) => items.reduce((sum, i) => sum + i.quantity, 0);

// Coordinate del ristorante: geocodificate una volta e salvate nel profilo
async function getRestaurantCoords(restaurantId) {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw badRequest("Ristorante non valido");

  if (restaurant.location?.lat == null || restaurant.location?.lon == null) {
    try {
      const coords = await geocode(restaurant.address.street, restaurant.address.city);
      restaurant.location = coords;
      await restaurant.save();
    } catch (err) {
      if (err.status === 400) throw badRequest("Impossibile localizzare il ristorante");
      throw err;
    }
  }
  return { lat: restaurant.location.lat, lon: restaurant.location.lon };
}

// Preventivo: prezzi, consegna, totale e attesa, tutto calcolato dal server
export const buildQuote = async ({ restaurantId, items, orderType, deliveryAddress }) => {
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

  // Consegna: distanza stradale (OSRM) e costo in base ai km
  let distanceKm = 0;
  let deliveryFee = 0;
  let route = null;

  if (orderType === "delivery") {
    const street = String(deliveryAddress?.street ?? "").trim();
    const city = String(deliveryAddress?.city ?? "").trim();
    if (!street || !city) throw badRequest("Indirizzo di consegna obbligatorio");

    const restaurantCoords = await getRestaurantCoords(restaurantId);
    const customerCoords = await geocode(street, city);
    const result = await drivingRoute(restaurantCoords, customerCoords);

    distanceKm = round1(result.km);
    if (distanceKm > MAX_DELIVERY_KM) {
      throw badRequest(`Indirizzo fuori dall'area di consegna (massimo ${MAX_DELIVERY_KM} km)`);
    }
    deliveryFee = round2(Math.max(DELIVERY_MIN_FEE, distanceKm * DELIVERY_FEE_PER_KM));
    route = { method: result.method, path: result.path, restaurant: restaurantCoords, customer: customerCoords };
  }

  // Attesa: piatti già in coda al ristorante + quelli di questo ordine (+ viaggio se consegna)
  const queued = await Order.find({ restaurantId, status: { $in: QUEUE_STATUSES } })
    .select("items.quantity")
    .lean();
  const queuedItems = queued.reduce((sum, o) => sum + countItems(o.items), 0);
  const estimatedTimeMinutes =
    BASE_PREP_MINUTES +
    MINUTES_PER_ITEM * (queuedItems + countItems(orderItems)) +
    Math.round(distanceKm * TRAVEL_MINUTES_PER_KM);

  return {
    items: orderItems,
    subtotal,
    distanceKm,
    deliveryFee,
    totalAmount: round2(subtotal + deliveryFee),
    estimatedTimeMinutes,
    route
  };
};

// CREATE: salva l'ordine usando solo i valori del preventivo calcolato dal server
export const createOrder = async (customerId, data) => {
  const quote = await buildQuote(data);
  const { restaurantId, orderType, deliveryAddress, payment } = data;

  return Order.create({
    customerId,
    restaurantId,
    orderType,
    items: quote.items,
    deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
    distanceKm: quote.distanceKm,
    deliveryFee: quote.deliveryFee,
    subtotal: quote.subtotal,
    totalAmount: quote.totalAmount,
    estimatedTimeMinutes: quote.estimatedTimeMinutes,
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