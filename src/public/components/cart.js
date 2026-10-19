export function getCustomerCartMarkup() {
  return `
        <div class="customer-cart-container sticky-top">
          <div class="card border-0 shadow-lg rounded-4 p-2">
            <div class="card-body">
              <h4 class="fw-bold mb-4"><i class="bi bi-bag-check-fill text-warning me-2"></i> Il tuo ordine <span class="fs-6 fw-normal text-secondary d-block mt-1" id="restaurantName"></span></h4>
              
              <!-- Lista Piatti nel carrello -->
              <div id="cartItemsContainer" class="cart-items-container d-flex flex-column gap-3 mb-3 overflow-y-auto">
                <!-- Messaggio carrello vuoto di default -->
                <div class="text-center text-secondary small py-4" id="emptyCartMsg">
                  <i class="bi bi-cart-x fs-1 d-block mb-2 opacity-50"></i>
                  Il carrello è vuoto.<br>Aggiungi i piatti che desideri!
                </div>
              </div>
              <button type="button" class="btn btn-outline-danger btn-sm px-2 py-1 d-none" id="emptyCartBtn" title="Svuota carrello">
                <i class="bi bi-trash3"></i>
              </button>

              <!-- Checkout Footer -->
              <div class="border-top pt-3 mt-3">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <span class="fw-semibold text-secondary">Totale</span>
                  <span class="fs-4 fw-bold">€ <span id="cartTotalPrice">0.00</span></span>
                </div>
                <button type="button" class="btn btn-amber w-100 fw-bold py-2 shadow-sm" id="checkoutBtn" disabled>
                  Vai al Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
  `;
}