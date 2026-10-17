import { updateProduct } from "/services/productService.js";
import { showAlert } from "/components/alerts.js";

/**
 * Crea l'elemento DOM (colonna + card) per un singolo piatto del menù
 */
export function createMenuCardElement(product, options = {}) {
  // Estraiamo le funzioni e il flag per la vista cliente
  const { onCardClick, onProductUpdated, isCustomerView = false } = options;

  const col = document.createElement("div");
  col.className = "col d-flex"; // Mantiene le card allineate in altezza
  col.dataset.productId = product._id;

  const isAvailable = Boolean(product.available);
  const discountVal = Number(product.discount) || 0;
  const basePrice = Number(product.price) || 0;
  const hasDiscount = discountVal > 0;
  const finalPrice = hasDiscount 
    ? (basePrice - (basePrice * discountVal / 100)).toFixed(2) 
    : basePrice.toFixed(2);

  let statusBadgeMarkup = "";
  if (hasDiscount && isAvailable) {
    statusBadgeMarkup = `<span class="badge-status-pill status-discount"><i class="bi bi-tag-fill me-1"></i>In Offerta</span>`;
  } else if (isAvailable) {
    statusBadgeMarkup = `<span class="badge-status-pill status-active"><i class="bi bi-check-circle-fill me-1"></i>Disponibile</span>`;
  } else {
    statusBadgeMarkup = `<span class="badge-status-pill status-inactive"><i class="bi bi-dash-circle me-1"></i>Esaurito</span>`;
  }

  // Se siamo nella vista cliente, NON generiamo il blocco comandi in basso
  const dockMarkup = isCustomerView ? '' : `
    <div class="menu-card-dock">
      <button type="button" class="btn-availability-pill ${isAvailable ? 'is-active' : ''} availability-toggle-btn" title="Clicca per cambiare disponibilità">
        <span class="d-flex align-items-center gap-2">
          <i class="bi ${isAvailable ? 'bi-toggle-on text-success fs-5' : 'bi-toggle-off text-secondary fs-5'}"></i>
          <span>${isAvailable ? 'In Menù: Clicca per disattivare' : 'Fuori Menù: Clicca per attivare'}</span>
        </span>
        <span class="status-indicator-dot"></span>
      </button>

      <div class="discount-dock-row">
        <div class="discount-field-wrapper">
          <input name="discountInput" type="number" min="0" max="100" class="form-control menu-search-input text-center discount-input" value="${discountVal}" placeholder="0">
          <span class="discount-percent-symbol">%</span>
        </div>
        <button class="btn btn-amber btn-save-discount save-discount-btn" type="button" title="Applica sconto">
          <i class="bi bi-check-lg me-1"></i>Salva
        </button>
      </div>
    </div>
  `;

  let cardTooltip = "";
  if (isCustomerView) {
    cardTooltip = isAvailable ? "Clicca per aggiungere al carrello" : "Piatto al momento esaurito";
  } else {
    cardTooltip = "Clicca per personalizzare il piatto";
  }
  col.innerHTML = `
    <div class="card h-100 menu-item-card-modern ${!isAvailable ? 'is-unavailable' : ''} w-100" title="${cardTooltip}">
      <div class="menu-item-img-wrapper">
        <img src="${product.image || '/assets/defaultMeal.jpeg'}" class="w-100 h-100 object-fit-cover" alt="${product.nameMeal}">
        
        <div class="position-absolute top-0 start-0 m-2">
          ${statusBadgeMarkup}
        </div>

        ${hasDiscount ? `
          <div class="position-absolute top-0 end-0 m-2 discount-circle-badge">
            -${discountVal}%
          </div>
        ` : ''}
      </div>

      <div class="card-body d-flex flex-column p-3 flex-grow-1">
        <span class="badge align-self-start mb-2 px-2 py-1 small menu-item-category-badge">
          ${product.category || 'Altro'}
        </span>
        
        <h5 class="card-title fw-bold mb-1 text-truncate text-white" title="${product.nameMeal}">
          ${product.nameMeal}
        </h5>
        
        <p class="card-text small flex-grow-1 text-truncate-2 mb-3 menu-item-ingredients">
          ${Array.isArray(product.ingredients) ? product.ingredients.join(", ") : ""}
        </p>

        <div class="d-flex align-items-baseline gap-2 mb-1 mt-auto">
          ${hasDiscount ? `
            <span class="small menu-price-original">€${basePrice.toFixed(2)}</span>
            <span class="fs-4 fw-bold menu-price-discounted">€${finalPrice}</span>
          ` : `
            <span class="fs-4 fw-bold text-white">€${basePrice.toFixed(2)}</span>
          `}
        </div>
      </div>
      
      ${dockMarkup}
    </div>
  `;

  // Agganciamo i controlli del ristoratore SOLO se non è un cliente
  if (!isCustomerView) {
    const availabilityBtn = col.querySelector(".availability-toggle-btn");
    availabilityBtn?.addEventListener("click", async () => {
      const newStatus = !product.available;
      try {
        await updateProduct(product._id, { available: newStatus });
        product.available = newStatus;
        showAlert("success", "Operazione completata", newStatus ? "Piatto inserito nel menù" : "Piatto escluso dal menù");
        if (onProductUpdated && !isCustomerView) onProductUpdated();
      } catch (err) {
        showAlert("danger", "Attenzione", err.message || "Errore aggiornamento disponibilità");
      }
    });

    const discountBtn = col.querySelector(".save-discount-btn");
    const discountInp = col.querySelector(".discount-input");
    discountBtn?.addEventListener("click", async () => {
      const val = parseInt(discountInp.value, 10) || 0;
      if (!Number.isInteger(val) || val > 100 || val < 0) {
        return showAlert("danger", "Attenzione", "Inserire uno sconto valido [0,100]");
      }
      try {
        await updateProduct(product._id, { discount: val });
        product.discount = val;
        showAlert("success", "Operazione completata", "Percentuale di sconto applicata!");
        if (onProductUpdated && !isCustomerView) onProductUpdated();
      } catch (err) {
        showAlert("danger", "Attenzione", err.message || "Errore salvataggio sconto");
      }
    });

    // Ferma la propagazione sul dock per non aprire la modale cliccando i tasti
    const dock = col.querySelector(".menu-card-dock");
    dock?.addEventListener("click", (e) => e.stopPropagation());
  }

  // Click generale sulla card (funziona sia per ristoratore che per cliente)
  const cardElement = col.querySelector(".menu-item-card-modern");
  cardElement?.addEventListener("click", () => {
    // Passiamo onCardClick in base a chi lo sta chiamando
    if (onCardClick) onCardClick(product);
  });

  return col;
}