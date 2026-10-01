import {Router} from "express";
import * as userRepo from "../repositories/userRepository.js";

const router = Router();

router.post("/singup", async (req, res, next) => {
    try {
        const userData = req.body;

        const existingUser = await userRepo.getUserByEmail(userData.email);
        if (existingUser) {
            return res.status(409).json({ 
                status: "error",
                message: "Email già registrata" });
        }

        const newUser = await userRepo.createUser(userData);
        res.status(201).json({ message: "Utente registrato con successo", userId: newUser._id });

    } catch (error) {
        // Gestione errori di validazione dello Schema Mongoose
        if (error.name === "ValidationError") {
            return res.status(400).json({
                status: "fail",
                message: error.message
            });
        }
        // Gestione duplicato MongoDB (indice univoco email)
        if (error.code === 11000) {
            return res.status(409).json({
                status: "fail",
                message: "Email già registrata"
            });
        }
        next(error);
    }

    
});

export default router;