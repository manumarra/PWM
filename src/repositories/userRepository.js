import User, { MODEL_BY_ROLE, UPDATABLE_FIELDS } from "../models/User.js";
import Product from "../models/Product.js";
import { escapeRegex } from "../public/utils/common/regex.js";

export const createUser = (userData) => {
  const Model = MODEL_BY_ROLE[userData.role];
  if (!Model) {
    const err = new Error("Ruolo non valido");
    err.status = 400;
    throw err;
  }
  return Model.create(userData);
};

export const getUserByEmail = (email) => User.findByEmail(email);

export const getUserById = (id) => User.findById(id).select("+password");

export const comparePassword = async (user, password) => {
    return await user.comparePassword(password);
};

export const toPublicJSON = (user) => user.toPublicJSON();

export const updateUser = async (id, updates) => {
  const user = await User.findById(id);
  if (!user) return null;

  for (const field of UPDATABLE_FIELDS[user.role]) {
    if (updates[field] !== undefined) user[field] = updates[field];
  }

  if (user.role === "restaurateur" && updates.address !== undefined) {
    user.set("location", undefined); // verrà geocodificata di nuovo al prossimo preventivo
  }

  await user.save();
  return user;
};

export const deleteUser = async (id) => {
  const deletedUser = await User.findByIdAndDelete(id);

  if (!deletedUser) return null;

  if (deletedUser.role === "restaurateur") await Product.deleteMany({restaurantId: id});

  return deletedUser;
} 

export const getPaginatedRestaurants = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(queryParams.limit, 10) || 12), 100);
  const skip = (page - 1) * limit;

  const filter = { role: "restaurateur" };

  const city = String(queryParams.city ?? "").trim();
  if (city) {
    filter["address.city"] = { $regex: `^${escapeRegex(city)}$`, $options: "i" };
  }

  const search = String(queryParams.search ?? "").trim();
  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: "i" };
  }

  // Ricerca del ristorante per piatto: ristoranti che vendono (disponibile) quel piatto
  const dish = String(queryParams.dish ?? "").trim();
  if (dish) {
    const ids = await Product.distinct("restaurantId", {
      nameMeal: { $regex: escapeRegex(dish), $options: "i" },
      available: true
    });
    filter._id = { $in: ids };
  }

  const [data, total] = await Promise.all([
    User.find(filter)
      .select("name image phone address")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter)
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

export const getRestaurantById = (id) =>
  User.findOne({ _id: id, role: "restaurateur" })
    .select("name image phone address")
    .lean();