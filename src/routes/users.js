import {Router} from "express";
import * as userRepo from "../repositories/userRepository.js";
import { asyncWrapper as AW} from "../utils/asyncWrapper.js";
import { requireAuth, setAuthCookie, clearAuthCookie } from "../middleware/auth.js";

const router = Router();

// GET /api/users/restaurants (con eventuali filtri via query string: ?city=...&page=...&search=...)
router.get("/restaurants", AW(async (req, res) => {
  const result = await userRepo.getPaginatedRestaurants(req.query);
  res.status(200).json({ status: "ok", ...result });
}));

// GET /api/users/restaurants/:id
router.get("/restaurants/:id", AW(async (req, res) => {
  const restaurant = await userRepo.getRestaurantById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ status: "fail", message: "Ristorante non trovato" });
  }
  res.status(200).json({ status: "ok", data: restaurant });
}));

router.post("/signup", AW(async (req, res) => {
  
  const { email } = req.body;
  const existingUser = await userRepo.getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      status: "fail",
      message: "Email già registrata"
    });
  }

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
  setAuthCookie(res, user);

  // 4. Risposta per il frontend (include il ruolo per il redirect)
  res.status(200).json({
    status: "ok",
    message: "Accesso eseguito con successo",
    data: userRepo.toPublicJSON(user)
  });
}));

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ status: "ok", message: "Logout eseguito" });
});

// Restituisce l'utente della sessione corrente (utile per verificare il cookie)
router.get("/me", requireAuth, AW(async (req, res) => {
  const user = await userRepo.getUserById(req.user.id);
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ status: "fail", message: "Utente non trovato" });
  }
  res.status(200).json({ status: "ok", data: userRepo.toPublicJSON(user) });
}));

router.put("/update", requireAuth, AW(async (req, res) => {
  const { currentPassword, updates } = req.body;
  const id = req.user.id;

  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ status: "fail", message: "Dati da modificare mancanti" });
  }

  const checkUser = await userRepo.getUserById(id);
  if (!checkUser) {
    clearAuthCookie(res);
    return res.status(401).json({ status: "fail", message: "Utente non trovato" });
  }

  const checkPassword = await userRepo.comparePassword(checkUser, currentPassword);
  if (!checkPassword) {
    return res.status(403).json({ status: "fail", message: "Password non valida" });
  }

  if (req.body.confirmPassword) {
    if (req.body.confirmPassword !== updates.password) {
      return res.status(400).json({ status: "fail", message: "Le nuove password devono coincidere" });
    }
  }

  const user = await userRepo.updateUser(id, updates);
  return res.status(200).json({
    status: "ok",
    message: "Modifica avvenuta con successo",
    data: userRepo.toPublicJSON(user)
  });
}));

router.delete("/delete", requireAuth, AW(async (req, res) => {
  const { password } = req.body;
  const id = req.user.id;

  const checkUser = await userRepo.getUserById(id);
  if (!checkUser) {
    clearAuthCookie(res);
    return res.status(401).json({ status: "fail", message: "Utente non trovato" });
  }

  const checkPassword = await userRepo.comparePassword(checkUser, password);
  if (!checkPassword) {
    return res.status(403).json({ status: "fail", message: "Password non valida" });
  }

  const deleted = await userRepo.deleteUser(id);
  if (!deleted) {
    return res.status(404).json({ status: "fail", message: "Utente non trovato" });
  }
  clearAuthCookie(res);
  res.status(200).json({ status: "ok", message: "Account eliminato con successo" });
}));

export default router;