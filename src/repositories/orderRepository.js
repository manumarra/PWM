import Order from "../models/Order.js";

/**
 * CREATE: Salva un nuovo ordine nel database
 * @param {Object} orderData Dati dell'ordine conformi a orderSchema
 * @returns {Promise<Object>} Ordine creato
 */
export const createOrder = async (orderData) => {
  return await Order.create(orderData);
};

/**
 * READ: Recupera un singolo ordine per ID con i riferimenti popolati
 * @param {string} orderId
 * @returns {Promise<Object|null>}
 */
export const getOrderById = async (orderId) => {
  return await Order.findById(orderId)
    .populate("customerId", "name email address phone")
    .populate("restaurantId", "name email address phone")
    .lean();
};

/**
 * READ: Storico ordini effettuati da uno specifico cliente (con paginazione opzionale)
 * @param {string} customerId ID dell'utente cliente
 * @param {Object} options Parametri di paginazione
 * @returns {Promise<{data: Array, pagination: Object}>}
 */
export const getOrdersByCustomer = async (
  customerId,
  { page = 1, limit = 10 } = {}
) => {
  const skip = (page - 1) * limit;
  const filter = { customerId };

  const [data, total] = await Promise.all([
    Order.find(filter)
      .populate("restaurantId", "name email address phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter)
  ]);

  return {
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

/**
 * READ: Elenco degli ordini ricevuti da un ristorante con filtro per stato (per la cucina/dashboard)
 * @param {string} restaurantId ID del ristorante
 * @param {string} [status] Filtro opzionale ("ordinato", "in preparazione", ecc.)
 * @returns {Promise<Array>}
 */
export const getOrdersByRestaurant = async (restaurantId, status = null) => {
  const filter = { restaurantId };
  if (status) {
    filter.status = status;
  }

  return await Order.find(filter)
    .populate("customerId", "name email address phone")
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * UPDATE: Aggiorna lo stato di avanzamento dell'ordine nel ciclo di vita
 * @param {string} orderId ID dell'ordine
 * @param {string} newStatus "ordinato" | "in preparazione" | "in consegna" | "consegnato"
 * @returns {Promise<Object|null>}
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  return await Order.findByIdAndUpdate(
    orderId,
    { $set: { status: newStatus } },
    { returnDocument: "after", runValidators: true }
  ).lean();
};

/**
 * UPDATE: Aggiorna lo stato della transazione di pagamento (es. dopo webhook/conferma Stripe)
 * @param {string} orderId ID dell'ordine
 * @param {Object} paymentUpdates Dati di stato (status, transactionId, etc.)
 * @returns {Promise<Object|null>}
 */
export const updatePaymentStatus = async (orderId, paymentUpdates) => {
  return await Order.findByIdAndUpdate(
    orderId,
    {
      $set: {
        "payment.status": paymentUpdates.status,
        "payment.transactionId": paymentUpdates.transactionId,
        ...(paymentUpdates.last4Digits && { "payment.last4Digits": paymentUpdates.last4Digits })
      }
    },
    { returnDocument: "after", runValidators: true }
  ).lean();
};

/**
 * AGGREGATION: Statistiche vendite per ristorante (coerente con la slide Modulo 4 Aggregate)
 * Raggruppa per stato e calcola incassi totali e media d'ordine
 * @param {string} restaurantId
 * @returns {Promise<Array>}
 */
export const getRestaurantSalesStats = async (restaurantId) => {
  return await Order.aggregate([
    {
      $match: {
        restaurantId: new Order.base.Types.ObjectId(restaurantId),
        "payment.status": "completato"
      }
    },
    {
      $group: {
        _id: "$status",
        totalRevenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: "$totalAmount" }
      }
    }
  ]);
};