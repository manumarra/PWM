const navbars = [`
    <nav class="navbar navbar-expand-md custom-navbar">
      <div class="container-fluid">
        
        <!-- Logo Brand -->
        <a class="navbar-brand brand-logo" href="/pages/restaurateur/home.html">
            <img src="/assets/doremi.png" alt="Logo" width="45" height="36 class="d-inline-block align-text-top">
          Doremi
        </a>

        <!-- Toggler per schermi piccoli (mobile) -->
        <button 
          class="navbar-toggler custom-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#mainNavbar" 
          aria-controls="mainNavbar" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Contenitore collassabile che racchiude azioni e bottoni -->
        <div class="collapse navbar-collapse" id="mainNavbar">
          <div class="nav-actions ms-auto mt-3 mt-md-0 d-flex flex-column flex-md-row gap-2 align-items-stretch align-items-md-center">
            <a href="/pages/login.html" class="btn btn-night">
              Accedi
            </a>
            <a href="/pages/signup.html" class="btn btn-amber ">
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
      <a class="navbar-brand brand-logo d-flex align-items-center gap-2 me-4" href="/index.html">
        <a class="navbar-brand brand-logo" href="/index.html">
              <img src="/assets/doremi.png" alt="Logo" width="45" height="36 class="d-inline-block align-text-top">
        </a>
      </a>

      <!-- 2. Link di navigazione principali -->
      <ul class="navbar-nav d-flex flex-row align-items-center gap-4">
        <li class="nav-item">
          <a class="nav-link nav-link-restaurateur active" aria-current="page" href="/pages/restaurateur/home.html">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link nav-link-restaurateur" href="#">Menu</a>
        </li>
        <li class="nav-item">
          <a class="nav-link nav-link-restaurateur" href="#">Ordini</a>
        </li>
      </ul>

      <!-- 3. Toggler a destra: apre l'offcanvas presente nella pagina -->
      <button 
        class="navbar-toggler rest-custom-toggler- ms-auto d-flex align-items-center justify-content-center" 
        type="button" 
        data-bs-toggle="offcanvas" 
        data-bs-target="#restaurantUserOffcanvas" 
        aria-controls="restaurantUserOffcanvas"
        aria-label="Apri pannello profilo"
      >
        <i class="bi bi-person-circle fs-4 text-white"></i>
      </button>

    </div>
  </nav>
`]

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

}