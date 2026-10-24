function alertElement() {
  let alertBox = document.getElementById("statusAlert");

  if (!alertBox) {
    alertBox = document.createElement("div");
    alertBox.id = "statusAlert";
    alertBox.className = "custom-alert d-none";
    alertBox.setAttribute("role", "alert");

    alertBox.innerHTML = `
      <span id="statusAlertIcon" class="alert-icon"></span>
      <div class="alert-content">
        <strong id="statusAlertTitle"></strong>
        <p id="statusAlertMsg" class="mb-0"></p>
      </div>
      <button type="button" class="btn-close-alert" id="statusAlertClose">&times;</button>
    `;

    document.body.appendChild(alertBox);

    const closeBtn = alertBox.querySelector("#statusAlertClose");
    closeBtn.addEventListener("click", () => {
      alertBox.classList.add("d-none");
    });
  }

  return alertBox;
}

let timeoutId = null;

export function showAlert(type, title, message) {
  const alertBox = alertElement();

  const alertIcon = alertBox.querySelector("#statusAlertIcon");
  const alertTitle = alertBox.querySelector("#statusAlertTitle");
  const alertMsg = alertBox.querySelector("#statusAlertMsg");
  // Reset del timer se c'era un alert precedente attivo
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  // Configurazione grafica in base al tipo ('success' | 'danger')
  alertBox.className = `custom-alert alert-${type}`;
  alertIcon.textContent = type === "success" ? "✓" : "⚠";
  alertTitle.textContent = title;
  alertMsg.textContent = message;

  // Mostra il banner
  alertBox.classList.remove("d-none");

  // Chiusura automatica dopo 4 secondi (in particolare per gli errori)
  timeoutId = setTimeout(() => {
    alertBox.classList.add("d-none");
  }, 4000);
}

/**
 * Mostra un Toast Bootstrap 5 in un contenitore specifico.
 * @param {string} title Titolo del toast (es. "Nuovo Ordine!")
 * @param {string} message Messaggio o corpo del toast (es. "Marco Rossi ha appena ordinato")
 * @param {string} type Colore/icona: "success", "warning", "info", "danger"
 * @param {string} containerId L'ID del div dove appendere i toast (default: "alert-container")
 */
export function showToast(title, message, type = "info", containerId = "alert-container") {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!container.classList.contains("toast-container")) {
    container.className = "toast-container position-fixed top-0 end-0 p-3";
    container.style.zIndex = "1080"; // Sopra la navbar
  }

  // Seleziona colore e icona
  let iconClass = "bi-info-circle text-info";
  if (type === "success") iconClass = "bi-check-circle text-success";
  if (type === "warning") iconClass = "bi-exclamation-triangle text-warning";
  if (type === "danger") iconClass = "bi-x-circle text-danger";

  // 1. Crea l'elemento HTML del toast
  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");
  // Nasconde automaticamente il toast dopo 5 secondi
  toastEl.setAttribute("data-bs-delay", "5000");

  toastEl.innerHTML = `
    <div class="toast-header bg-dark text-white border-bottom border-secondary">
      <i class="bi ${iconClass} me-2 fs-5"></i>
      <strong class="me-auto">${title}</strong>
      <small class="text-secondary">Adesso</small>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Chiudi"></button>
    </div>
    <div class="toast-body bg-dark text-white">
      ${message}
    </div>
  `;

  // 2. Aggiungi il toast al contenitore
  container.appendChild(toastEl);

  // 3. Inizializza e mostra il toast via Javascript (Bootstrap 5 API)
  const bsToast = new bootstrap.Toast(toastEl);
  bsToast.show();

  // 4. Pulisci il DOM quando il toast viene nascosto
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}