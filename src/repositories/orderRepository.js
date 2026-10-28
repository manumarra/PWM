import Order from "../models/Order.js";

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

// CREATE: Salva un nuovo ordine nel database
export const createOrder = (orderData) => Order.create(orderData);

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