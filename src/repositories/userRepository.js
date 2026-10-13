import User from "../models/User.js";
import Product from "../models/Product.js";
export const createUser = (userData) => User.create(userData);

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