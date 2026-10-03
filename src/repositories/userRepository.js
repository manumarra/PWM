import User from "../models/User.js";

export const createUser = (userData) => User.create(userData);

export const getUserByEmail = (email) => User.findByEmail(email);

export const getUserById = (id) => User.findById(id).select("+password");

export const comparePassword = async (user, password) => {
    return await user.comparePassword(password);
};

export const toPublicJSON = (user) => user.toPublicJSON();

export const updateUser = (id, updates) =>
  User.findByIdAndUpdate(
    id,
    { $set: updates },
    {returnDocument: 'after', runValidators: true}
  );