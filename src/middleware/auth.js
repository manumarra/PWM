import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET mancante nel file .env");
}

const COOKIE_NAME = "token";
const EXPIRES_IN = "2h";

const COOKIE_OPTIONS = {
  httpOnly: true,                                   // non leggibile da JavaScript
  sameSite: "strict",                               // non inviato da siti terzi (protezione CSRF)
  secure: process.env.NODE_ENV === "production",    // HTTPS obbligatorio solo in produzione
  maxAge: 2 * 60 * 60 * 1000
};

export function setAuthCookie(res, user) {
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: EXPIRES_IN }
  );
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
}

// Richiede un utente autenticato: popola req.user = { id, role }
export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ status: "fail", message: "Autenticazione richiesta" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ status: "fail", message: "Sessione scaduta o non valida" });
  }
}

// Da usare DOPO requireAuth: requireRole("restaurateur")
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ status: "fail", message: "Operazione non consentita" });
    }
    next();
  };
}