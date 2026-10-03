import {Router} from "express";
import * as userRepo from "../repositories/userRepository.js";
import { asyncWrapper as AW} from "../utils/asyncWrapper.js";
const router = Router();

router.post("/signup", AW(async (req, res) => {
    const user = await userRepo.createUser(req.body);
    res.status(201).json({status: "ok", data: user});
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

router.put("/update", AW(async (req, res) => {
  const {password, id, updates} = req.body;

  const checkUser = await userRepo.getUserById(id);
  if (!checkUser) {
      return res.status(401).json({
      status: "fail",
      message: "Credenziali non valide"
    });
  }

  const checkPassword = await userRepo.comparePassword(checkUser, password);
  if (!checkPassword) {
    return res.status(401).json({
      status: "fail",
      message: "Password non valida"
    });
  }

  const user = await userRepo.updateUser(id, updates);
  return res.status(200).json({
    status: "ok",
    message: "Modifica avvenuta con successo",
    data: userRepo.toPublicJSON(user)
  });

}));

export default router;