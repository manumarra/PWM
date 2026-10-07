import { getStoredUser } from "/utils/session.js";
const USER = getStoredUser();
const isRestaurateur = USER.role === "restaurateur" ? true : false;

const canvas = `
      <div class="offcanvas-header border-bottom border-secondary">
        <h5 class="offcanvas-title fw-bold" id="userOffcanvasLabel">
          <i class="bi bi-shop me-2 text-warning"></i> ${isRestaurateur ? `Area Ristoratore` : 'Area Clienti'}
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Chiudi"></button>
      </div>
      
      <div class="offcanvas-body d-flex flex-column justify-content-between p-4">
        
        <div id="canvasBodyContent"></div>

        <!-- Logout in fondo -->
        <div class="pt-3 border-top border-secondary" id="footerLogout"></div>
      </div>
`;

const modalData = `
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable text-white">
    <div class="modal-content profile-modal-content border border-secondary shadow-lg">
      
      <div class="modal-header border-secondary">
        <h5 class="modal-title fw-bold" id="editProfileModalLabel">Modifica Dati Personali</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Chiudi"></button>
      </div>

      <div class="modal-body p-4">
        <form id="editProfileForm">

          <div class="mb-3">
            <label class="form-label" for="editName">Nome Attività</label>
            <input type="text" class="form-control" id="editName" name="nameUser" required>
          </div>

          ${isRestaurateur ? `
          <div class="mb-3">
            <label class="form-label" for="editIva">Partita IVA</label>
            <input type="text" class="form-control" id="editIva" name="iva" >
          </div>
          ` : ''}

          <div class="mb-3">
            <label class="form-label" for="editPhone">Telefono</label>
            <input type="tel" class="form-control" id="editPhone" name="phone" autocomplete="phone" ...>
          </div>

          <hr class="profile-divider">
          <div class="row g-2 mb-3">
            <div class="col-12">
              <label class="form-label" for="editStreet">Via / Piazza</label>
              <input type="text" class="form-control" id="editStreet" name="street" required>
            </div>
            <div class="col-6">
              <label class="form-label" for="editCity">Città</label>
              <input type="text" class="form-control" id="editCity" name="city" required>
            </div>
            <div class="col-3">
              <label class="form-label" for="editZip">CAP</label>
              <input type="text" class="form-control" id="editZip" name="zip" required>
            </div>
            <div class="col-3">
              <label class="form-label" for="editCountry">Stato</label>
              <input type="text" class="form-control" id="editCountry" name="country" autocomplete="country" ... maxlength="3" required>
            </div>
          </div>
          <div id="modalAlert" class="alert alert-danger d-none py-2" role="alert"></div>

          <hr class="profile-divider">
          <div class="mb-3">
            <label class="form-label" for="editName">Conferma password</label>
            <input type="password" class="form-control" id="password" name="password" autocomplete="off" ... required>
          </div>

        </form>
      </div>

      <div class="modal-footer border-secondary">
        <button type="button" class="btn btn-night btn-modal-footer" data-bs-dismiss="modal">Annulla</button>
        <button type="submit" form="editProfileForm" class="btn btn-night btn-modal-footer">Salva Modifiche</button>
      </div>

    </div>
  </div>

`;

const canvasBodyContentCustomer = ` 
<!-- Dati Utente / Locale -->
<div class="profile-card d-flex align-items-center gap-3 mb-4 p-3 rounded" role="button" data-bs-toggle="modal" data-bs-target="#editProfileModal">
  <i class="bi bi-person-circle fs-1 text-warning"></i>
  <div>
    <h6 class="mb-0 fw-bold" id="nameUserContent"></h6>
    <small class="text-secondary" id="emailUserContent"></small>
  </div>
</div>

<!-- Voci di navigazione pannello -->
<ul class="nav nav-pills flex-column gap-2">
  <li class="nav-item">
    <a class="nav-link " href="#">
      <i class="bi bi-gear"></i> Impostazioni Locale
    </a>
  </li>
  <li class="nav-item">
    <a class="nav-link" href="#">
      <i class="bi bi-clock-history"></i> Orari di Apertura
    </a>
  </li>
</ul>
`;

const canvasBodyContentRestaurateur = ` 
<!-- Dati Utente / Locale -->
<div class="profile-card d-flex align-items-center gap-3 mb-4 p-3 rounded" role="button" data-bs-toggle="modal" data-bs-target="#editProfileModal">
  <i class="bi bi-person-circle fs-1 text-warning"></i>
  <div>
    <h6 class="mb-0 fw-bold" id="nameUserContent"></h6>
    <small class="text-secondary" id="emailUserContent"></small>
  </div>
</div>

<!-- Voci di navigazione pannello -->
<ul class="nav nav-pills flex-column gap-2">
  <li class="nav-item">
    <a class="nav-link " href="#">
      <i class="bi bi-gear"></i> Impostazioni Locale
    </a>
  </li>
  <li class="nav-item">
    <a class="nav-link" href="#">
      <i class="bi bi-clock-history"></i> Orari di Apertura
    </a>
  </li>
</ul>
`;

export function getCanvas() {
    const canvasContainer = document.getElementById("userOffcanvas");
    const modalContainer = document.getElementById("editProfileModal");
    if(!canvasContainer) return console.error("Documento mancante nel DOM");
    if (!modalContainer) return console.error("Elemento mancante del DOM");
    canvasContainer.innerHTML = canvas;
    modalContainer.innerHTML = modalData;

}

export function getCanvasContent() {

  const contentContainer = document.getElementById("canvasBodyContent");
  if(!contentContainer) return console.error("Documento mancante nel DOM");
  (isRestaurateur) ? contentContainer.innerHTML = canvasBodyContentRestaurateur : contentContainer.innerHTML = canvasBodyContentCustomer; 
}