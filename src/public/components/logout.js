const logoutButton = `
        <div class="card-bottom-link offCanvasCredential ">
            <p class="mb-1">Modifica o elimina il tuo &nbsp;</p>
            <a href="#" class="link-amber" role="button" data-bs-toggle="modal" data-bs-dismiss="modal" data-bs-target="#editCredentialModal">account &rarr;</a>
        </div>
        <a class="btn btn-outline-danger" id="btnLogout" role="button" href="/index.html">
            <i class="bi bi-box-arrow-right"></i> Esci
        </a>
`;

const credentialForm = `
<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable text-white">
    <div class="modal-content profile-modal-content border border-secondary shadow-lg">

        <div class="modal-header border-secondary">
          <h5 class="modal-title fw-bold" id="editCredentialModalLabel">Modifica Credenziali</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Chiudi"></button>
        </div>

        <div class="modal-body p-4">
            <form id="editCredentialForm" novalidate>
                <div class="mb-3">
                  <label class="form-label" for="editNewPassword">Nuova Password</label>
                  <input type="password" class="form-control" id="editNewPassword" name="password" required>
                </div>

                <div class="mb-3">
                  <label class="form-label" for="editConfirmPassword">Conferma Nuova Password</label>
                  <input type="password" class="form-control" id="editConfirmPassword" name="confirmPassword" required>
                </div>

                <hr class="profile-divider">
                <div class="mb-3">
                  <label class="form-label" for="editCurrentPassword">Password corrente</label>
                  <input type="password" class="form-control" id="editCurrentPassword" name="currentPassword" autocomplete="off" required>
                </div>
            </form>
        </div>
                
        <div class="modal-footer border-secondary">
            <!-- Pulsante che apre il secondo modal ed esce dal primo -->
            <button type="button" class="btn btn-outline-danger btn-modal-footer credential-footer" data-bs-target="#deleteModalToggle2" data-bs-toggle="modal">
              Elimina account
            </button>
            <button type="submit" form="editCredentialForm" class="btn btn-night btn-modal-footer credential-footer">Salva Modifiche</button>
        </div>
    </div>
</div>
`;

const deleteAccountModal = `
<div class="modal-dialog modal-dialog-centered text-white">
    <div class="modal-content profile-modal-content border border-danger shadow-lg">

        <div class="modal-header border-secondary">
          <h5 class="modal-title fw-bold text-danger" id="deleteModalToggle2Label">Elimina Account</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Chiudi"></button>
        </div>

        <div class="modal-body p-4">
          <p class="mb-0">Sei sicuro di voler eliminare definitivamente il tuo account? Tutti i dati andranno persi.</p>

            <hr class="profile-divider">
            <form id="deleteProfileForm" novalidate>
                <div class="mb-3">
                    <label class="form-label" for="editCurrentPassword">Conferma password</label>
                    <input type="password" class="form-control" id="password" name="password" autocomplete="off" required>
                </div>
            </form>

        </div>
                
        <div class="modal-footer border-secondary">
            <!-- Tasto per tornare indietro al primo modal -->
            <button type="button" class="btn btn-secondary btn-modal-footer credential-footer" data-bs-target="#editCredentialModal" data-bs-toggle="modal">
              Torna indietro
            </button>
            
            <button type="submit" form="deleteProfileForm" id="confirmDeleteAccountBtn" class="btn btn-danger btn-modal-footer credential-footer">
              Conferma eliminazione
            </button>
        </div>
    </div>
</div>
`;

function getFooterLogoutAndForm() {
    const footerContainer = document.getElementById("footerLogout");
    const editFormContainer = document.getElementById("editCredentialModal");
    const deleteFormContainer = document.getElementById("deleteModalToggle2");

    if (footerContainer || !editFormContainer || !deleteFormContainer) {
        console.error("Elemento/i non trovato nel DOM");
        return;
    }

    editFormContainer.innerHTML = credentialForm;
    deleteFormContainer.innerHTML = deleteAccountModal;
    footerContainer.innerHTML = logoutButton;

}