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

// READ: Storico ordini per il RISTORATORE (Dashboard)
export const getOrdersByRestaurant = (restaurantId) => 
  Order.find({ restaurantId })
       .sort({ createdAt: -1 })
       .populate("customerId", "name phone email")
       .lean();

export const getOrderById = (id) => Order.findById(id).lean();

// UPDATE: Aggiornamento dello stato dell'ordine con Regole di Business
export const updateOrderStatus = async (id, status, verificationCode) => {
  // Se lo stato è "consegnato", verifica l'OTP
  if (status === "consegnato") {
    const order = await Order.findById(id).lean();
    
    if (!order) {
      throw new Error("Ordine non trovato");
    }
    
    // Controllo strict con conversione a stringa e pulizia spazi
    if (String(order.verificationCode).trim() !== String(verificationCode).trim()) {
      throw new Error("Codice di verifica errato. Consegna rifiutata.");
    }
  }

  // Se i controlli passano (o se lo stato non è "consegnato"), esegue l'aggiornamento
  return Order.findByIdAndUpdate(
    id, 
    { $set: { status: status } }, 
    { returnDocument: 'after', runValidators: true }
  ).lean();
};