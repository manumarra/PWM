import { getStoredUser } from "/utils/common/session.js";
import { confirmPayment } from "/services/paymentService.js";

const el = (id) => document.getElementById(id);

// Mostra l'esito (icone e colori sono costanti: nessun dato dell'utente finisce nell'HTML)
function showResult({ icon, color, title, message }) {
  el("paymentIcon").innerHTML = `<i class="bi ${icon} ${color}"></i>`;
  el("paymentTitle").textContent = title;
  el("paymentMessage").textContent = message;
  el("paymentSpinner").classList.add("d-none");
  el("paymentActions").classList.remove("d-none");
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = getStoredUser();
  if (!user || user.role !== "customer") {
    window.location.href = "/pages/common/login.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);

  // Il cliente è tornato indietro dalla pagina di Stripe senza pagare
  if (params.get("canceled")) {
    showResult({
      icon: "bi-x-circle-fill",
      color: "text-warning",
      title: "Pagamento annullato",
      message: "Il tuo ordine è stato salvato ma non è ancora stato pagato. " +
               "Puoi completare il pagamento dallo storico ordini entro circa 30 minuti, poi l'ordine scade."
    });
    return;
  }

  const sessionId = params.get("session_id");
  if (!sessionId) {
    window.location.href = "/pages/customer/home.html";
    return;
  }

  try {
    // Il server chiede a Stripe se la sessione è stata pagata davvero
    const result = await confirmPayment(sessionId);

    if (result.paymentStatus === "completato") {
      showResult({
        icon: "bi-check-circle-fill",
        color: "text-success",
        title: "Pagamento riuscito!",
        message: "Il ristorante ha ricevuto il tuo ordine. Puoi seguirne lo stato dalla pagina dei tuoi ordini."
      });
    } else if (result.paymentStatus === "in_attesa") {
      showResult({
        icon: "bi-hourglass-split",
        color: "text-warning",
        title: "Pagamento in elaborazione",
        message: "Stripe non ha ancora confermato il pagamento. Controlla lo stato nella pagina dei tuoi ordini fra qualche istante."
      });
    } else {
      showResult({
        icon: "bi-exclamation-triangle-fill",
        color: "text-danger",
        title: "Pagamento non completato",
        message: "Il pagamento non risulta andato a buon fine. Se ti è stato addebitato qualcosa, controlla lo stato dell'ordine."
      });
    }
  } catch (error) {
    showResult({
      icon: "bi-exclamation-triangle-fill",
      color: "text-danger",
      title: "Impossibile verificare il pagamento",
      message: error.message
    });
  }
});