// Protegge dall'inserimento di HTML nei testi mostrati con innerHTML
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const ALLERGEN_LABELS = {
  glutine: "Glutine",
  crostacei: "Crostacei",
  uova: "Uova",
  pesce: "Pesce",
  arachidi: "Arachidi",
  soia: "Soia",
  latte: "Latte",
  frutta_a_guscio: "Frutta a guscio",
  sedano: "Sedano",
  senape: "Senape",
  sesamo: "Sesamo",
  solfiti: "Solfiti",
  lupini: "Lupini",
  molluschi: "Molluschi"
};

// Badge degli allergeni da mettere nelle card
export function allergenBadgesMarkup(allergens) {
  if (!Array.isArray(allergens) || allergens.length === 0) return "";
  const badges = allergens
    .map((a) => `<span class="allergen-badge">${escapeHtml(ALLERGEN_LABELS[a] || a)}</span>`)
    .join("");
  return `
    <div class="allergen-badges mb-2" title="Allergeni indicativi: verifica sempre con il ristorante">
      <i class="bi bi-exclamation-triangle-fill me-1"></i>${badges}
    </div>`;
}

// Elenco di checkbox degli allergeni; onChange riceve l'array degli id selezionati
export function renderAllergenCheckboxes(container, onChange) {
  container.innerHTML = Object.entries(ALLERGEN_LABELS)
    .map(([id, label]) => `
      <div class="form-check">
        <input class="form-check-input allergen-check" type="checkbox" value="${id}" id="allergen-${id}">
        <label class="form-check-label" for="allergen-${id}">${label}</label>
      </div>`)
    .join("");

  container.addEventListener("change", () => onChange(getCheckedAllergens(container)));
}

export function getCheckedAllergens(container) {
  return [...container.querySelectorAll(".allergen-check:checked")].map((el) => el.value);
}