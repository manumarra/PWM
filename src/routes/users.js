import {Router} from "express";
import * as userRepo from "../repositories/userRepository.js";
import { asyncWrapper as AW} from "../utils/asyncWrapper.js";
const router = Router();

router.post("/signup", AW(async (req, res) => {
    const user = await userRepo.createUser(req.body);
    res.status(201).json({status: "ok", data: user})
}));

router.post("/login", AW(async (req, res) => {
  const { email, password } = req.body;
    // 1. Controllo presenza parametri
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Email e password sono obbligatorie"
      });
  }

  // 2. Ricerca utente tramite il repository
  const user = await userRepo.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({
      status: "fail",
      message: "Credenziali non valide"
    });
  }

  // 3. Verifica hash tramite il metodo d'istanza di User.js
  const isMatch = await userRepo.comparePassword(user, password);
  if (!isMatch) {
    return res.status(401).json({
      status: "fail",
      message: "Credenziali non valide"
    });
  }

  // 4. Risposta per il frontend (include il ruolo per il redirect)
  res.status(200).json({
    status: "ok",
    message: "Accesso eseguito con successo",
    data: userRepo.toPublicJSON(user)
  });
}));
export default router;