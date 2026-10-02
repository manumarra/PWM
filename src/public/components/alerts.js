// public/components/alert.js

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