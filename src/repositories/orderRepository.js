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

// CREATE: Salva un nuovo ordine nel database
export const createOrder = (orderData) => Order.create(orderData);

// READ: Storico ordini per il RISTORATORE (Dashboard)
export const getOrdersByRestaurant = (restaurantId) => 
  Order.find({ restaurantId })
       .sort({ createdAt: -1 })
       .populate("customerId", "name phone email") // Recupera i dati del cliente
       .lean();

export const getOrderById = (id) =>
    Order.find({id}).lean();

// UPDATE: Aggiornamento dello stato dell'ordine
export const updateOrderStatus = (id, status) => 
  Order.findByIdAndUpdate(
    id, 
    { $set: { status: status } }, 
    { new: true, runValidators: true }
  ).lean();