document.addEventListener("DOMContentLoaded", () => {
  const switchBtn = document.getElementById("switchBtn");
  const card = document.getElementById("signupCard");
  const hero = document.getElementById("signupHero");
  const infoTitle = document.getElementById("infoTitle");
  const infoDesc = document.getElementById("infoDesc");
  const nameLabel = document.getElementById("nameLabel");
  const formEmoji = document.getElementById("formEmoji");
  const restOwner = document.getElementById("restOwner");
  if (!switchBtn || !card || !hero) return;

  let isCustomer = false;

  switchBtn.addEventListener("click", () => {
    isCustomer = !isCustomer;

    // 1. Inverte i pannelli e attiva la dissolvenza incrociata dello sfondo
    card.classList.toggle("is-customer");
    hero.classList.toggle("is-customer");

    // 2. Sfuma il testo prima di cambiarlo
    formEmoji.classList.add("is-fading");
    infoTitle.classList.add("is-fading");
    infoDesc.classList.add("is-fading");

    // 3. A metà animazione aggiorna i contenuti e li fa riapparire
    setTimeout(() => {
      if (isCustomer) {
        restOwner.setAttribute("id", "customer");
        formEmoji.textContent = "🍔🍕🥗";
        infoTitle.textContent = "Registrati come Cliente";
        infoDesc.textContent = "Ordina dai migliori ristoranti e ricevi il cibo caldo e veloce a casa tua.";
        nameLabel.textContent = "Nome Utente";
      } else { 
        restOwner.setAttribute("id", "");
        formEmoji.textContent = "👨‍🍳🍳👩‍🍳";
        infoTitle.textContent = "Registrati come Ristoratore";
        infoDesc.textContent = "Porta i tuoi piatti a migliaia di nuovi clienti nella tua città.";
        nameLabel.textContent = "Nome Utente";
      }

      formEmoji.classList.remove("is-fading");
      infoTitle.classList.remove("is-fading");
      infoDesc.classList.remove("is-fading");
    }, 280);
  });
});