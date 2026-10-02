const footer = `
    <!-- FOOTER FINALE -->
        <div class="container">
            <!-- Griglia responsive a 4 colonne Bootstrap -->
            <div class="row g-4 mb-5">
            
            <!-- Colonna 1: Brand e Mission -->
            <div class="col-12 col-md-6 col-lg-3">
                <div class="footer-brand mb-3">
                <img src="/assets/doremi.png" width="70" height="60" alt="Doremi">
                <span class="footer-logo">Doremi</span>
                </div>
                <p class="footer-text">
                Il tuo cibo preferito, consegnato caldo e veloce direttamente a casa tua.
                </p>
            </div>

            <!-- Colonna 2: Scopri di più -->
            <div class="col-6 col-md-6 col-lg-3">
                <h3 class="footer-heading">Scopri Doremi</h3>
                <ul class="footer-links">
                <li><a href="#">Chi siamo</a></li>
                <li><a href="#">I nostri locali</a></li>
                <li><a href="#">Diventa un Rider</a></li>
                <li><a href="#">News & Promozioni</a></li>
                </ul>
            </div>

            <!-- Colonna 3: Note Legali -->
            <div class="col-6 col-md-6 col-lg-3">
                <h3 class="footer-heading">Note Legali</h3>
                <ul class="footer-links">
                <li><a href="#">Termini e Condizioni</a></li>
                <li><a href="#">Informativa Privacy</a></li>
                <li><a href="#">Policy sui Cookie</a></li>
                <li><a href="#">Sicurezza alimentare</a></li>
                </ul>
            </div>

            <!-- Colonna 4: Assistenza e Contatti -->
            <div class="col-12 col-md-6 col-lg-3">
                <h3 class="footer-heading">Aiuto</h3>
                <ul class="footer-links">
                <li><a href="#">Domande frequenti</a></li>
                <li><a href="#">Supporto Clienti</a></li>
                <li><a href="#">Segnala un problema</a></li>
                </ul>
            </div>

            </div>

            <!-- Barra inferiore: Copyright e Social -->
            <div class="footer-bottom">
            <p class="mb-0 copyright-text">
                &copy; 2026 Doremi Inc. Tutti i diritti riservati.
            </p>

            <div class="social-links">
                <a href="#" class="social-icon" aria-label="Instagram" >
                    <img src="/assets/IG.png" alt="Instagram" width="24" height="24">
                </a>
                <a href="#" class="social-icon" aria-label="Facebook">
                    <img src="/assets/FB.png" alt="Facebook" width="24" height="24">
                </a>
                <a href="#" class="social-icon" aria-label="X">
                    <img src="/assets/WA.png" alt="X" width="24" height="24">
                </a>
            </div>
            </div>
        </div>

`
function getFooter() {
    const container = document.getElementById("homeFooter");
    container.innerHTML = footer;
}