import User from "../models/User.js";

export const createUser = (userData) => User.create(userData);

export const getUserByEmail = (email) => User.findByEmail(email);

export const comparePassword = async (user, password) => {
    return await user.comparePassword(password);
};