import User, { MODEL_BY_ROLE, UPDATABLE_FIELDS } from "../models/User.js";
import Product from "../models/Product.js";

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
  const limit = Math.max(1, parseInt(queryParams.limit, 10) || 12);
  const skip = (page - 1) * limit;

  const filter = { role: "restaurateur" };

  if (queryParams.city && queryParams.city.trim()) {
    filter["address.city"] = { $regex: `^${queryParams.city.trim()}$`, $options: "i" };
  }

  if (queryParams.search && queryParams.search.trim()) {
    filter.name = { $regex: queryParams.search.trim(),$options: "i" };
  }

  const [data, total] = await Promise.all([
    User.find(filter)
      .select("name image phone address")
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