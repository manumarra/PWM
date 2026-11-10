// Rende innocuo il testo digitato dall'utente prima di usarlo in una regex
export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "a, b,c" -> ["a", "b", "c"]
export const splitList = (value, max = 10) =>
  String(value ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, max);