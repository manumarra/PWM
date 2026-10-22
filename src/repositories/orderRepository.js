import Order from "../models/Order.js";

// CREATE: Salva un nuovo ordine nel database
export const createOrder = (orderData) => Order.create(orderData);

// READ: Storico ordini per il CLIENTE (Macro-scenario 3)
export const getOrdersByCustomer = (customerId) => 
  Order.find({ customerId })
       .sort({ createdAt: -1 })
       .populate("restaurantId", "name phone address") // Recupera i dati del ristorante associato
       .lean();

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