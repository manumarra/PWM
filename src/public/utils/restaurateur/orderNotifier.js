import { getStoredUser } from "/utils/common/session.js";
import { getOrdersByRestaurant } from "/services/orderService.js";
import { showToast } from "/components/alerts.js";
import { escapeHtml } from "/utils/common/dishUi.js";

const POLL_MS = 15000;           // ogni quanto interrogare il server
const MAX_INDIVIDUAL_TOASTS = 3; // oltre questa soglia un solo toast riepilogativo

// Una sola istanza per pagina
if (!window.__orderNotifierStarted) {
  window.__orderNotifierStarted = true;
  startNotifier();
}

function startNotifier() {
  const user = getStoredUser();
  if (!user || user.role !== "restaurateur") return;

  const storageKey = `knownOrderIds:${user._id}`;

  // Il pallino compare subito con l'ultimo valore noto, senza aspettare la rete
  window.updateNavBadge?.();

  // Le pagine senza contenitore per i toast ne ricevono uno
  if (!document.getElementById("alert-container")) {
    const container = document.createElement("div");
    container.id = "alert-container";
    document.body.appendChild(container);
  }

  // Ordini già "visti" in questa scheda (sopravvivono al cambio pagina)
  const loadKnown = () => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : null; // null = prima volta in questa scheda
    } catch {
      return null;
    }
  };
  const saveKnown = (ids) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify([...ids]));
    } catch { /* storage non disponibile: pazienza */ }
  };

  function notify(freshOrders) {
    if (freshOrders.length === 0) return;

    if (freshOrders.length > MAX_INDIVIDUAL_TOASTS) {
      showToast("Nuovi ordini ricevuti!", `Hai ricevuto <b>${freshOrders.length}</b> nuovi ordini.`, "success");
      return;
    }

    freshOrders.forEach((o) => {
      const customerName = escapeHtml(o.customerId?.name || "Un cliente");
      showToast(
        "Nuovo Ordine Ricevuto!",
        `Hai appena ricevuto un nuovo ordine da <b>${customerName}</b> per €${Number(o.totalAmount).toFixed(2)}.`,
        "success"
      );
    });
  }

  async function poll() {
    try {
      const response = await getOrdersByRestaurant(user._id);
      const orders = response.data || [];

      // Pallino rosso: ordini in attesa (stato "ordinato")
      const pending = orders.filter((o) => o.status === "ordinato").length;
      localStorage.setItem("newOrdersCount", pending);
      window.updateNavBadge?.();

      // Toast: solo a scheda visibile. Se è in background gli ordini restano "da segnalare"
      // e il toast compare quando l'utente torna sulla scheda.
      if (!document.hidden) {
        const known = loadKnown();
        if (known) {
          notify(orders.filter((o) => o.status === "ordinato" && !known.has(o._id)));
        }
        saveKnown(new Set(orders.map((o) => o._id)));
      }

      // Le pagine che mostrano gli ordini (home, ordini) si aggiornano da qui
      window.dispatchEvent(new CustomEvent("restaurant-orders:updated", { detail: { orders } }));
    } catch (error) {
      console.warn("Aggiornamento ordini non riuscito:", error.message);
    }
  }

  poll();
  setInterval(poll, POLL_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) poll();
  });
}