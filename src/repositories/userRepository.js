import User from "../models/User.js";
import Product from "../models/Product.js";

export const createUser = (userData) => {
  if(userData.role === "restaurateur") userData.image = "/assets/defaultAvatar.jpeg";
  return User.create(userData);
}

export const getUserByEmail = (email) => User.findByEmail(email);

export const getUserById = (id) => User.findById(id).select("+password");

export const comparePassword = async (user, password) => {
    return await user.comparePassword(password);
};

export const toPublicJSON = (user) => user.toPublicJSON();

export const updateUser = async (id, updates) => {
  // Se il payload contiene la password, usiamo .save() per attivare .pre("save")
  if (updates.password) {
    const user = await User.findById(id);
    if (!user) return null;
    // Assegna tutte le proprietà arrivate nel payload
    Object.assign(user, updates);
    await user.save();
    return user;
  }

  // Altrimenti usiamo il consueto findByIdAndUpdate delle slide
  return User.findByIdAndUpdate(
    id, 
    { $set: updates }, 
    { returnDocument: 'after', runValidators: true }
  );
};

export const deleteUser = async (id) => {
  const deletedUser = await User.findByIdAndDelete(id);

  if (!deletedUser) return null;

  if (deletedUser.role === "restaurateur") await Product.deleteMany({restaurantId: id});

  return deleteUser;
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