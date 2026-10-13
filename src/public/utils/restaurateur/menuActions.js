import { updateProduct } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";

let resetDiscountTimer = null;
let disableAllTimer = null;

export function initMenuMassActions({ getProducts, onComplete }) {
  const btnResetAllDiscounts = document.getElementById("btnResetAllDiscounts");
  const btnDisableAllProducts = document.getElementById("btnDisableAllProducts");

  btnResetAllDiscounts?.addEventListener("click", () => handleResetAllDiscounts(btnResetAllDiscounts, getProducts, onComplete));
  btnDisableAllProducts?.addEventListener("click", () => handleDisableAllProducts(btnDisableAllProducts, getProducts, onComplete));
}

async function handleResetAllDiscounts(btn, getProducts, onComplete) {
  const allProducts = getProducts();
  const discounted = allProducts.filter((p) => (p.discount || 0) > 0);
  if (discounted.length === 0) {
    showAlert("danger", "Nessun piatto ha sconti attivi al momento");
    return;
  }

  if (!btn.classList.contains("is-confirming-discount")) {
    btn.classList.add("is-confirming-discount");
    btn.innerHTML = `<i class="bi bi-question-circle-fill"></i> Confermi azzeramento?`;

    resetDiscountTimer = setTimeout(() => {
      btn.classList.remove("is-confirming-discount");
      btn.innerHTML = `<i class="bi bi-tag"></i> Annulla tutti gli sconti`;
    }, 4000);
    return;
  }

  clearTimeout(resetDiscountTimer);
  btn.classList.remove("is-confirming-discount");
  btn.innerHTML = `<i class="bi bi-tag"></i> Annulla tutti gli sconti`;

  try {
    btn.disabled = true;
    await Promise.all(discounted.map((p) => updateProduct(p._id, { discount: 0 })));
    discounted.forEach((p) => { p.discount = 0; });
    showAlert("success", "Tutti gli sconti sono stati annullati con successo!");
    onComplete();
  } catch (err) {
    showAlert("danger", err.message || "Errore durante l'azzeramento degli sconti");
  } finally {
    btn.disabled = false;
  }
}

async function handleDisableAllProducts(btn, getProducts, onComplete) {
  const allProducts = getProducts();
  const available = allProducts.filter((p) => p.available === true);
  if (available.length === 0) {
    showAlert("danger", "Tutti i piatti sono già fuori menù");
    return;
  }

  if (!btn.classList.contains("is-confirming-disable")) {
    btn.classList.add("is-confirming-disable");
    btn.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Confermi disattivazione?`;

    disableAllTimer = setTimeout(() => {
      btn.classList.remove("is-confirming-disable");
      btn.innerHTML = `<i class="bi bi-eye-slash"></i> Rendi tutto non disponibile`;
    }, 4000);
    return;
  }

  clearTimeout(disableAllTimer);
  btn.classList.remove("is-confirming-disable");
  btn.innerHTML = `<i class="bi bi-eye-slash"></i> Rendi tutto non disponibile`;

  try {
    btn.disabled = true;
    await Promise.all(available.map((p) => updateProduct(p._id, { available: false })));
    available.forEach((p) => { p.available = false; });
    showAlert("success", "Tutti i piatti sono stati impostati come non disponibili");
    onComplete();
  } catch (err) {
    showAlert("danger", err.message || "Errore durante la disattivazione dei piatti");
  } finally {
    btn.disabled = false;
  }
}