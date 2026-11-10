// Allergeni principali (identificatori senza spazi)
export const ALLERGENS = [
  "glutine", "crostacei", "uova", "pesce", "arachidi", "soia", "latte",
  "frutta_a_guscio", "sedano", "senape", "sesamo", "solfiti", "lupini", "molluschi"
];

// Parole chiave (inglese per il catalogo, italiano per i piatti inseriti a mano)
const KEYWORDS = {
  glutine: [
    "wheat", "flour", "bread", "breadcrumb", "pasta", "spaghetti", "linguine", "fettuccine",
    "tagliatelle", "macaroni", "lasagn[ae]", "noodle", "couscous", "bulgur", "barley", "rye",
    "semolina", "pastry", "biscuit", "cracker", "tortilla", "pita", "pitta", "naan", "bun",
    "dough", "filo", "panko", "croissant", "pizza base", "beer", "lager", "stout", "seitan",
    "soy sauce", "soya sauce", "teriyaki", "farina", "pane", "pangrattato", "pastella",
    "segale", "orzo", "semola"
  ],
  latte: [
    "milk", "butter", "buttermilk", "cheese", "cream", "cr[eè]me fra[iî]che", "yogh?urt",
    "parmesan", "mozzarella", "cheddar", "ricotta", "mascarpone", "feta", "gruy[eè]re",
    "gouda", "brie", "camembert", "emmental", "halloumi", "paneer", "custard", "ghee",
    "whey", "casein", "latte", "burro", "formaggio", "panna", "parmigiano", "pecorino",
    "gorgonzola", "grana", "provolone", "besciamella"
  ],
  uova: ["egg", "mayonnaise", "mayo", "meringue", "uovo", "uova", "maionese", "albume", "tuorlo"],
  pesce: [
    "fish", "salmon", "tuna", "cod", "anchovy", "anchovies", "haddock", "mackerel", "sardine",
    "trout", "tilapia", "herring", "snapper", "halibut", "sea bass", "bass", "plaice",
    "pollock", "swordfish", "monkfish", "eel", "caviar", "roe", "worcestershire", "pesce",
    "salmone", "tonno", "merluzzo", "acciuga", "acciughe", "sarda", "sarde", "baccal[aà]",
    "trota", "branzino", "orata"
  ],
  crostacei: [
    "prawn", "shrimp", "crab", "lobster", "crayfish", "crawfish", "langoustine", "krill",
    "gambero", "gamberi", "granchio", "aragosta", "scampi", "astice"
  ],
  molluschi: [
    "mussel", "clam", "oyster", "squid", "calamari", "octopus", "scallop", "cuttlefish",
    "snail", "escargot", "cozza", "cozze", "vongola", "vongole", "ostrica", "ostriche",
    "polpo", "seppia", "calamaro"
  ],
  arachidi: ["peanut", "groundnut", "arachide", "arachidi"],
  frutta_a_guscio: [
    "almond", "walnut", "cashew", "hazelnut", "pistachio", "pecan", "macadamia", "brazil nut",
    "pine nut", "chestnut", "praline", "marzipan", "nutella", "mandorla", "mandorle",
    "nocciola", "nocciole", "pistacchio", "pistacchi", "anacardo", "anacardi", "pinoli",
    "castagna", "castagne", "noci"
  ],
  soia: ["soy", "soya", "soybean", "soja", "tofu", "edamame", "miso", "tempeh", "tamari", "soia"],
  sedano: ["celery", "celeriac", "sedano"],
  senape: ["mustard", "senape"],
  sesamo: ["sesame", "tahini", "tahina", "sesamo", "halva", "halvah"],
  solfiti: ["wine", "vino", "sherry", "vermouth", "champagne", "prosecco", "sulphite", "sulfite"],
  lupini: ["lupin", "lupine", "lupini"]
};

// Frasi con parole "da latte" che non sono latticini (valgono solo per il latte)
const NOT_DAIRY =
  /\b(?:coconut|almond|soy|soya|oat|rice|cashew)\s+(?:milk|cream|yogh?urt)\b|\bpeanut butter\b|\bcocoa butter\b|\bshea butter\b|\bbutter beans?\b|\bcream of tartar\b|\blatte di (?:cocco|mandorla|soia|avena|riso)\b/gi;

const matchers = Object.entries(KEYWORDS).map(([allergen, words]) => ({
  allergen,
  regex: new RegExp(`\\b(?:${words.join("|")})(?:s|es)?\\b`, "i")
}));

/**
 * Deduce gli allergeni da un elenco di ingredienti.
 * Risultato indicativo: nel dubbio segnala l'allergene (meglio un falso positivo
 * che un falso negativo).
 */
export function detectAllergens(ingredients = []) {
  const found = new Set();

  for (const raw of Array.from(ingredients ?? [])) {
    const ingredient = String(raw).toLowerCase();
    for (const { allergen, regex } of matchers) {
      const subject = allergen === "latte" ? ingredient.replace(NOT_DAIRY, " ") : ingredient;
      if (regex.test(subject)) found.add(allergen);
    }
  }

  return ALLERGENS.filter((a) => found.has(a)); // ordine stabile
}