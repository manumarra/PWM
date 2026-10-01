import User from "../models/User.js";

export const createUser = (userData) => User.create(userData);

export const getUserByEmail = (email) => 
    User.findOne({ email: email.toLowerCase()
}).select("+password");