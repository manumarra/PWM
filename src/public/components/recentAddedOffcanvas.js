export function getRecentAddedOffcanvasMarkup() {
  return `
    <div class="offcanvas-header menu-offcanvas-header">
      <h5 class="offcanvas-title fw-bold">Aggiunti di Recente</h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Chiudi"></button>
    </div>
    <div class="offcanvas-body d-flex flex-column justify-content-between p-3">
      <div id="recentAddedList" class="d-flex flex-column gap-2 overflow-y-auto">
        <div class="menu-empty-msg" id="emptyRecentAddedMsg">
          Nessun piatto aggiunto in questa sessione.
        </div>
      </div>
      <div class="menu-offcanvas-footer d-flex flex-column gap-2">
        <button type="button" class="btn-amber w-100" id="btnSaveEntireMenu">
          <i class="bi bi-cloud-arrow-up me-2"></i>Salva Menù
        </button>
        <button type="button" class="btn-night w-100" data-bs-dismiss="offcanvas">
          Continua a Scegliere
        </button>
      </div>
    </div>
  `;
}