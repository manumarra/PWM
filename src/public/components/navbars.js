const navbars = [`
    <nav class="navbar navbar-expand-md custom-navbar">
      <div class="container-fluid">
        
        <!-- Logo Brand -->
        <a class="navbar-brand brand-logo homeNav d-flex align-items-center gap-2 me-4" href="/index.html">
          <img src="/assets/doremi.png" alt="Logo" width="45" height="36" class="d-inline-block align-text-top">
          <span class="">Doremi</span>
        </a>

        <!-- Toggler per schermi piccoli (mobile) -->
        <button class="navbar-toggler custom-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Contenitore collassabile che racchiude azioni e bottoni -->
        <div class="collapse navbar-collapse" id="mainNavbar">
          <div class="nav-actions ms-auto mt-3 mt-md-0 d-flex flex-column flex-md-row gap-2 align-items-stretch align-items-md-center">
            <a href="/pages/common/login.html" class="btn btn-night">
              Accedi
            </a>
            <a href="/pages/common/signup.html" class="btn btn-amber ">
              Iscriviti
            </a>
          </div>
        </div>

      </div>
    </nav>
`,
`
  <nav class="navbar custom-navbar restaurateur-navbar sticky-top">
    <div class="container-fluid px-3 px-md-4 d-flex align-items-center">
      
      <!-- 1. Logo a sinistra -->
      <a class="navbar-brand brand-logo d-flex align-items-center gap-2 me-4" href="/pages/restaurateur/home.html">
        <img src="/assets/doremi.png" alt="Logo" width="45" height="36" class="d-inline-block align-text-top">
        <span class="">Doremi</span>
      </a>

      <!-- 2. Link di navigazione principali -->
      <ul class="navbar-nav d-flex flex-row align-items-center gap-4">
        <li class="nav-item">
          <a class="nav-link nav-link-restaurateur" href="/pages/restaurateur/home.html">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link nav-link-restaurateur" href="/pages/restaurateur/menu.html">Menù</a>
        </li>
        <li class="nav-item">
          <a class="nav-link nav-link-restaurateur" href="/pages/restaurateur/productBuilder.html">Catalogo</a>
        </li>
        <li class="nav-item">
          <a class="nav-link nav-link-restaurateur position-relative" href="/pages/restaurateur/order.html">
            Ordini
            <!-- Pallino rosso Notifica (nascosto di default con d-none) -->
            <span id="navOrdersBadge" class="position-absolute top-25 start-100 translate-middle p-1 bg-danger border border-dark rounded-circle d-none" style="padding: 0.35rem !important;">
              <span class="visually-hidden">Nuovi ordini</span>
            </span>
          </a>
        </li>
      </ul>

      <!-- 3. Toggler a destra: apre l'offcanvas presente nella pagina -->
      <button 
        class="navbar-toggler rest-custom-toggler- ms-auto d-flex align-items-center justify-content-center" type="button" data-bs-toggle="offcanvas" data-bs-target="#userOffcanvas" aria-controls="userOffcanvas" aria-label="Apri pannello profilo">
        <img src="/assets/defaultAvatar.jpeg" alt="Foto Profilo" id="profileCardImg" class="profile-card-avatar">
      </button>

    </div>
  </nav>
`,
`
<nav class="navbar custom-navbar restaurateur-navbar sticky-top">
  <div class="container-fluid px-3 px-md-4 d-flex align-items-center">
    
    <!-- 1. Logo a sinistra -->
    <a class="navbar-brand brand-logo d-flex align-items-center gap-2 me-4" href="/pages/customer/home.html">
      <img src="/assets/doremi.png" alt="Logo" width="45" height="36" class="d-inline-block align-text-top">
      <span class="">Doremi</span>
    </a>

    <!-- 2. Link di navigazione principali -->
    <ul class="navbar-nav d-flex flex-row align-items-center gap-4">
      <li class="nav-item">
        <a class="nav-link nav-link-restaurateur" href="/pages/customer/home.html">Ristoranti</a>
      </li>
      <li class="nav-item">
        <a class="nav-link nav-link-restaurateur" href="/pages/customer/dishSearch.html">Piatti</a>
      </li>
      <li class="nav-item">
        <a class="nav-link nav-link-restaurateur" href="/pages/customer/orderHistory.html">Ordini</a>
      </li>
    </ul>

    <!-- 3. Toggler a destra: apre l'offcanvas presente nella pagina -->
    <button 
      class="navbar-toggler rest-custom-toggler- ms-auto d-flex align-items-center justify-content-center" type="button" data-bs-toggle="offcanvas" data-bs-target="#userOffcanvas" aria-controls="userOffcanvas" aria-label="Apri pannello profilo">
      <i class="bi bi-person-circle fs-4 text-white"></i>
    </button>

  </div>
</nav>
`]

// Pagine senza un link proprio nella navbar: evidenziano la voce della loro sezione
const NAV_SECTION_ALIASES = {
    "/pages/customer/restaurantMenu.html": "/pages/customer/home.html",
    "/pages/customer/checkout.html": "/pages/customer/home.html",
    "/pages/restaurateur/orderHistory.html": "/pages/restaurateur/order.html"
};

// Evidenzia nella navbar la voce che corrisponde alla pagina corrente
function highlightActiveNavLink(container) {
    const currentPath = window.location.pathname;
    const activePath = NAV_SECTION_ALIASES[currentPath] || currentPath;

    container.querySelectorAll(".nav-link").forEach((link) => {
        const href = link.getAttribute("href") || "";
        const isActive = href.startsWith("/") && link.pathname === activePath;

        link.classList.toggle("active", isActive);
        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

function getNavbar(index, navBar) {
    if (index < 0 || index >= navbars.length) {
        throw new Error("Indice del navbar non valido");
    }
    const container = document.getElementById(navBar);
    if (!container) {
        console.error("Elemento con id 'homeNavBar' non trovato nel DOM!");
        return;
    }
    container.innerHTML = navbars[index];
    highlightActiveNavLink(container);

    // Navbar del ristoratore: pallino ordini e notifiche su tutte le sue pagine
    if (index === 1) {
        window.updateNavBadge();
        import("/utils/restaurateur/orderNotifier.js").catch(console.error);
    }
}

// Funzione globale per aggiornare il pallino rosso leggendo il localStorage
window.updateNavBadge = function() {
    const newOrders = parseInt(localStorage.getItem("newOrdersCount") || "0");
    const navOrdersBadge = document.getElementById("navOrdersBadge");
    
    if (navOrdersBadge) {
        if (newOrders > 0) {
            navOrdersBadge.classList.remove("d-none");
        } else {
            navOrdersBadge.classList.add("d-none");
        }
    }
};

// Ascolta le modifiche fatte da ALTRE SCHEDE del browser in tempo reale
window.addEventListener("storage", (event) => {
    if (event.key === "newOrdersCount") {
        window.updateNavBadge();
    }
});