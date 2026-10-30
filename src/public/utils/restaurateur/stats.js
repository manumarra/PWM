import { getStoredUser } from "/utils/common/session.js";
import { getRestaurantStats } from "/services/orderService.js";
import { showAlert } from "/components/alerts.js";
import { escapeHtml } from "/utils/common/dishUi.js";

const COLORS = {
  amber: "#F59E0B",
  amberSoft: "rgba(245, 158, 11, 0.35)",
  blue: "#38BDF8",
  grid: "rgba(255, 255, 255, 0.08)",
  text: "#CBD5E1"
};

// "Chart" arriva dallo script UMD caricato nella pagina
Chart.defaults.color = COLORS.text;
Chart.defaults.borderColor = COLORS.grid;

const charts = {};
let requestId = 0;

const el = (id) => document.getElementById(id);
const euro = (n) => `€ ${Number(n).toFixed(2)}`;
const shortDate = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

document.addEventListener("DOMContentLoaded", () => {
  const user = getStoredUser();
  if (!user || user.role !== "restaurateur") {
    window.location.href = "/pages/common/login.html";
    return;
  }

  el("periodButtons").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-days]");
    if (!button) return;

    el("periodButtons").querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
    loadStats(button.dataset.days);
  });

  loadStats(30);
});

function drawChart(canvasId, config) {
  charts[canvasId]?.destroy();
  charts[canvasId] = new Chart(el(canvasId), config);
}

function renderKpis(totals) {
  const pct = totals.orders ? Math.round((totals.delivered / totals.orders) * 100) : 0;
  el("kpiOrders").textContent = totals.orders;
  el("kpiRevenue").textContent = euro(totals.revenue);
  el("kpiAverage").textContent = euro(totals.averageOrder);
  el("kpiDelivered").textContent = `${totals.delivered} (${pct}%)`;
}

function renderDailyChart(daily) {
  drawChart("dailyChart", {
    type: "bar",
    data: {
      labels: daily.map((d) => shortDate(d.day)),
      datasets: [
        {
          type: "bar",
          label: "Incasso",
          data: daily.map((d) => d.revenue),
          backgroundColor: COLORS.amberSoft,
          borderColor: COLORS.amber,
          borderWidth: 1,
          yAxisID: "y",
          order: 2
        },
        {
          type: "line",
          label: "Ordini",
          data: daily.map((d) => d.orders),
          borderColor: COLORS.blue,
          backgroundColor: COLORS.blue,
          tension: 0.3,
          pointRadius: 2,
          yAxisID: "y1",
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.dataset.yAxisID === "y"
              ? ` ${ctx.dataset.label}: ${euro(ctx.parsed.y)}`
              : ` ${ctx.dataset.label}: ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
        y: { beginAtZero: true, position: "left", title: { display: true, text: "€" } },
        y1: {
          beginAtZero: true,
          position: "right",
          grid: { drawOnChartArea: false },
          ticks: { precision: 0 },
          title: { display: true, text: "Ordini" }
        }
      }
    }
  });
}

function renderTypeChart(totals) {
  drawChart("typeChart", {
    type: "doughnut",
    data: {
      labels: ["Consegna a domicilio", "Ritiro in locale"],
      datasets: [{
        data: [totals.deliveryOrders, totals.takeawayOrders],
        backgroundColor: [COLORS.amber, COLORS.blue],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: { legend: { position: "bottom" } }
    }
  });
}

function renderHourChart(hourly) {
  drawChart("hourChart", {
    type: "bar",
    data: {
      labels: hourly.map((h) => `${String(h.hour).padStart(2, "0")}:00`),
      datasets: [{
        label: "Ordini",
        data: hourly.map((h) => h.orders),
        backgroundColor: COLORS.amberSoft,
        borderColor: COLORS.amber,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

function renderTopDishes(dishes) {
  const box = el("topDishesList");

  if (dishes.length === 0) {
    box.innerHTML = `<p class="text-secondary small mb-0">Nessun piatto venduto nel periodo.</p>`;
    return;
  }

  const maxQty = Math.max(...dishes.map((d) => d.quantity));
  box.innerHTML = dishes.map((d, i) => `
    <div class="mb-3">
      <div class="d-flex justify-content-between align-items-baseline gap-2">
        <span class="fw-semibold text-truncate">
          <span class="text-warning me-2">${i + 1}.</span>${escapeHtml(d.name)}
        </span>
        <span class="small text-secondary text-nowrap">${d.quantity} venduti · ${euro(d.revenue)}</span>
      </div>
      <div class="stats-bar mt-1"><span data-width="${Math.round((d.quantity / maxQty) * 100)}"></span></div>
    </div>
  `).join("");

  // La larghezza delle barre è un dato: la imposta lo script, lo stile resta nel CSS
  box.querySelectorAll(".stats-bar > span").forEach((bar) => {
    bar.style.width = `${bar.dataset.width}%`;
  });
}

async function loadStats(days) {
  const user = getStoredUser();
  const myRequest = ++requestId;

  try {
    const response = await getRestaurantStats(user._id, days);
    if (myRequest !== requestId) return; // c'è una richiesta più recente

    const stats = response.data;
    el("statsEmpty").classList.toggle("d-none", stats.totals.orders > 0);

    renderKpis(stats.totals);
    renderDailyChart(stats.daily);
    renderTypeChart(stats.totals);
    renderHourChart(stats.hourly);
    renderTopDishes(stats.topDishes);
  } catch (error) {
    if (myRequest === requestId) showAlert("danger", "Errore", error.message);
  }
}