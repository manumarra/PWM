export function getCurrentProductsOffcanvasMarkup() {
  return `
    <div class="offcanvas-header menu-offcanvas-header">
      <h5 class="offcanvas-title fw-bold">I Tuoi Prodotti</h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Chiudi"></button>
    </div>
    <div class="offcanvas-body d-flex flex-column justify-content-between p-3">
      <div id="currentMenuList" class="d-flex flex-column gap-3 overflow-y-auto">
        <div class="menu-empty-msg" id="emptyCurrentMenuMsg">
          Il tuo menù è ancora vuoto.<br>Aggiungi i tuoi primi piatti dal catalogo!
        </div>
      </div>
      <div class="menu-offcanvas-footer d-flex flex-column gap-2">
        <button type="button" class="btn btn-outline-danger w-100" id="deleteAllBtn">
          <i class="bi bi-exclamation-triangle me-2"></i>Elimina Menù
        </button>
        <a href="./home.html" class="btn-amber w-100 text-center">
          Concludi e vai alla Home
        </a>
      </div>
    </div>
  `;
}

export function getDeleteMenuConfirmModalMarkup() {
  return `
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content menu-modal-content text-center p-3 border-0 shadow-lg">         
        <div class="modal-body">
          <div class="mb-3">
            <i class="bi bi-exclamation-triangle-fill text-danger display-4"></i>
          </div>
          <h5 class="modal-title fw-bold text-white mb-2" id="deleteAllMenuConfirmModalLabel">Eliminare il Menù?</h5>
          <p class="text-secondary small mb-4">
            Tutti i piatti salvati nel tuo menù verranno rimossi definitivamente. Questa azione è irreversibile.
          </p>
          <div class="d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-night px-3" data-bs-dismiss="modal">Annulla</button>
            <button type="button" class="btn btn-danger px-3" id="confirmDeleteAllMenuBtn">Elimina Tutto</button>
          </div>
        </div>
      </div>
    </div>
  `;
}