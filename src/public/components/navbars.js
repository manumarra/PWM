const navbars = [`
    <nav class="navbar navbar-expand-md custom-navbar">
      <div class="container-fluid">
        
        <!-- Logo Brand -->
        <a class="navbar-brand brand-logo" href="/index.html">
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
`]

function getNavbar(index) {
    if (index < 0 || index >= navbars.length) {
        throw new Error("Indice del navbar non valido");
    }   
    const container = document.getElementById("homeNavBar");
    container.innerHTML = navbars[index];

}