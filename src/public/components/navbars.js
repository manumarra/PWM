const navbars = [`
        <nav class="navbar navbar-expand-lg custom-navbar">
            <div class="container trasparent">
                <a class="navbar-brand brand-logo" href="/index.html">
                    <img src="/assets/doremi.png" alt="Logo" width="45" height="36" class="d-inline-block align-text-top">
                    Doremi
                </a>
                <div class="nav-actions">
                    <a class="btn-night" href="/login.html">Accedi</a>
                    <a class="btn-amber" href="/pages/singUp.html">Iscriviti</a>

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