import { showAlert } from "/components/alerts.js";
import { getStoredUser } from "/utils/common/session.js";

const USER = getStoredUser();

// Stato interno del carrello
let cart = []; // { product: {...}, qty: 1 }

// Riferimenti DOM
let containerEl = null;
let emptyMsgEl = null;
let totalPriceEl = null;
let checkoutBtnEl = null;
let emptyCartBtnEl = null;

/**
 * Inizializza i riferimenti DOM e gli eventi del carrello
 */
export function initCart(restaurant) {
  containerEl = document.getElementById("cartItemsContainer");
  emptyMsgEl = document.getElementById("emptyCartMsg");
  totalPriceEl = document.getElementById("cartTotalPrice");
  checkoutBtnEl = document.getElementById("checkoutBtn");
  emptyCartBtnEl = document.getElementById("emptyCartBtn");

  const restaurantName = document.getElementById("restaurantName");
  (restaurantName && restaurant?.name) ? restaurantName.textContent = `Il tuo ordine da ${restaurant.name}`: "Il tuo ordine";
  // Listener svuota carrello
  emptyCartBtnEl?.addEventListener("click", () => {
    if (cart.length === 0) return;
    cart = [];
    updateCartUI();
    showAlert("danger", "Carrello svuotato", "Tutti i piatti sono stati rimossi.");
  });

  checkoutBtnEl?.addEventListener("click", () => {
    window.location.href = `/pages/customer/order.html?restaurant=${restaurant}&customer=${USER}`;
  });

  updateCartUI();
}

/**
 * Aggiunge un prodotto al carrello
 */
export function addToCart(product) {
  const existingItem = cart.find(item => item.product._id === product._id);
  
  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ product: product, qty: 1 });
  }

  showAlert("success", "Aggiunto", `${product.nameMeal} inserito nel carrello!`);
  updateCartUI();
}

/**
 * Modifica la quantità di un prodotto nel carrello
 */
function changeCartQuantity(productId, delta) {
  const item = cart.find(item => item.product._id === productId);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.product._id !== productId);
  }

  updateCartUI();
}

/**
 * Aggiorna il DOM del carrello
 */
function updateCartUI() {
  if (!containerEl) return;
  containerEl.innerHTML = "";  
  let total = 0;

  if (cart.length === 0) {
    if (emptyMsgEl) {
      containerEl.appendChild(emptyMsgEl);
      emptyMsgEl.classList.remove("d-none");
    }
    if (checkoutBtnEl) checkoutBtnEl.disabled = true;
    if (emptyCartBtnEl) emptyCartBtnEl.classList.add("d-none");
  } else {
    if (emptyMsgEl) emptyMsgEl.classList.add("d-none");
    if (checkoutBtnEl) checkoutBtnEl.disabled = false;
    if (emptyCartBtnEl) emptyCartBtnEl.classList.remove("d-none");

    cart.forEach(item => {
      const p = item.product;
      const basePrice = Number(p.price) || 0;
      const discountVal = Number(p.discount) || 0;
      const finalPrice = discountVal > 0 ? basePrice - (basePrice * discountVal / 100) : basePrice;

      total += finalPrice * item.qty;

      const row = document.createElement("div");
      row.className = "d-flex justify-content-between align-items-center bg-light p-2 rounded";
      
      row.innerHTML = `
        <div class="d-flex flex-column" style="max-width: 60%;">
          <span class="fw-semibold text-truncate small">${p.nameMeal}</span>
          <span class="text-secondary small">€${(item.qty*finalPrice).toFixed(2)}</span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary px-2 py-0 fw-bold btn-decrease" data-id="${p._id}">-</button>
          <span class="fw-bold small px-1">${item.qty}</span>
          <button class="btn btn-sm btn-outline-secondary px-2 py-0 fw-bold btn-increase" data-id="${p._id}">+</button>
        </div>
      `;

      row.querySelector(".btn-decrease").addEventListener("click", () => changeCartQuantity(p._id, -1));
      row.querySelector(".btn-increase").addEventListener("click", () => changeCartQuantity(p._id, 1));

      containerEl.appendChild(row);
    });
  }

  if (totalPriceEl) {
    totalPriceEl.textContent = total.toFixed(2);
  }
}