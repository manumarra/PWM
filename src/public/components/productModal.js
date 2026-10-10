export function getProductModalMarkup() {
  return `
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content menu-modal-content">
      
        <div class="modal-header menu-modal-header">
          <h5 class="modal-title fw-bold text-white" id="customizeMealModalLabel">Personalizza Piatto</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Chiudi"></button>
        </div>

        <form id="customizeProductForm">
          <div class="modal-body p-4">
            <div class="row g-3">
              <!-- Colonna Sinistra: Anteprima e Caricamento Foto -->
              <div class="col-12 col-md-4 text-center">
                <img 
                  id="modalMealImg" 
                  src="/assets/defaultMeal.jpeg" 
                  class="img-fluid rounded border border-secondary" 
                  alt="Anteprima piatto" 
                  style="height: 160px; width: 100%; object-fit: cover;" 
                  onerror="this.src='/assets/defaultMeal.jpeg'"
                >

                <div class="mt-2 text-start">
                  <label class="form-label menu-modal-label small" for="modalMealFileInput">Carica dal Computer</label>
                  <input 
                    type="file" 
                    id="modalMealFileInput" 
                    class="form-control menu-search-input form-control-sm" 
                    accept="image/*"
                  >
                </div>

                <div class="mt-2 text-start" id="modalImageUrlContainer">
                  <label class="form-label menu-modal-label small" for="modalMealImageUrl">Oppure URL Immagine</label>
                  <input 
                    type="url" 
                    id="modalMealImageUrl" 
                    class="form-control menu-search-input form-control-sm" 
                    placeholder="https://..."
                  >
                </div>
              </div>

              <!-- Colonna Destra: Dati Piatto -->
              <div class="col-12 col-md-8">
                <div class="mb-3">
                  <label class="form-label menu-modal-label" for="modalMealName">Nome Piatto *</label>
                  <input 
                    type="text" 
                    id="modalMealName" 
                    class="form-control menu-search-input" 
                    placeholder="es. Risotto ai Funghi Porcini" 
                    required
                  >
                </div>

                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label class="form-label menu-modal-label" for="modalMealPrice">Prezzo (€) *</label>
                    <input 
                      type="number" 
                      id="modalMealPrice" 
                      class="form-control menu-search-input" 
                      step="0.10" 
                      min="0.50" 
                      placeholder="es. 8.50" 
                      required
                    >
                  </div>
                  <div class="col-6">
                    <label class="form-label menu-modal-label" for="modalMealCategory">Categoria *</label>
                    <select id="modalMealCategory" class="form-select menu-filter-select">
                      <option value="Beef">Beef</option>
                      <option value="Chicken">Chicken</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Pasta">Pasta</option>
                      <option value="Seafood">Seafood</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Altro">Altro</option>
                      <option value="custom">Altra categoria...</option>
                    </select>
                  </div>
                </div>

                <div class="mb-3 d-none" id="modalCustomCategoryContainer">
                  <input 
                    type="text" 
                    id="modalCustomCategoryInput" 
                    class="form-control menu-search-input" 
                    placeholder="Scrivi la tua categoria..."
                  >
                </div>

                <div class="mb-2">
                  <label class="form-label menu-modal-label" for="customIngredientInput">Ingredienti</label>
                  <div class="ingredient-tags-container mb-3" id="modalIngredientsList"></div>

                  <div class="input-group">
                    <input 
                      type="text" 
                      id="customIngredientInput" 
                      class="form-control menu-search-input" 
                      placeholder="Aggiungi ingrediente..."
                    >
                    <button class="btn btn-add-ingredient" type="button" id="btnAddIngredient">
                      <i class="bi bi-plus-lg"></i> Aggiungi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer menu-modal-footer">
            <button type="button" class="btn btn-night" data-bs-dismiss="modal">Annulla</button>
            <button type="submit" class="btn btn-amber" id="modalSubmitBtn">Aggiungi al Menù</button>
          </div>
        </form>

      </div>
    </div>
  `;
}