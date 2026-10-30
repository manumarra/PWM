import { escapeHtml } from "/utils/common/dishUi.js";
let modalElement = null;
let modalInstance = null;
let activeModalMeal = null;
let currentIngredients = [];
let editingIndex = null;
let onSubmitProductCallback = null;

/**
 * Inizializza gli ascoltatori della modale (categoria custom, file upload, form submit, ingredienti)
 */
export function initProductModal({ modalId = "customizeMealModal", onSubmitProduct }) {
  modalElement = document.getElementById(modalId);
  if (!modalElement) return;

  modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
  onSubmitProductCallback = onSubmitProduct;

  // 1. Gestione Categoria Personalizzata
  const modalCategorySelect = document.getElementById("modalMealCategory");
  const modalCustomCatContainer = document.getElementById("modalCustomCategoryContainer");
  const modalCustomCatInput = document.getElementById("modalCustomCategoryInput");

  modalCategorySelect?.addEventListener("change", (e) => {
    if (e.target.value === "custom") {
      modalCustomCatContainer?.classList.remove("d-none");
      modalCustomCatInput?.focus();
    } else {
      modalCustomCatContainer?.classList.add("d-none");
      if (modalCustomCatInput) modalCustomCatInput.value = "";
    }
  });

  modalCustomCatInput?.addEventListener("blur", (e) => {
    if (e.target.value.trim()) {
      e.target.value = formatCategory(e.target.value);
    }
  });

  // 2. Caricamento Immagine Locale (Base64)
  const modalMealFileInput = document.getElementById("modalMealFileInput");
  const modalMealImg = document.getElementById("modalMealImg");
  const modalMealImageUrl = document.getElementById("modalMealImageUrl");

  modalMealFileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        modalMealImg.src = event.target.result;
        if (modalMealImageUrl) modalMealImageUrl.value = "";
      };
      reader.readAsDataURL(file);
    }
  });

  // 3. Immagine da URL Web
  modalMealImageUrl?.addEventListener("input", (e) => {
    const val = e.target.value.trim();
    modalMealImg.src = val || "/assets/defaultMeal.jpeg";
    if (val && modalMealFileInput) modalMealFileInput.value = "";
  });

  // 4. Aggiunta ingredienti
  const btnAddIngredient = document.getElementById("btnAddIngredient");
  const customIngredientInput = document.getElementById("customIngredientInput");

  btnAddIngredient?.addEventListener("click", addCustomIngredient);
  customIngredientInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomIngredient();
    }
  });

  // 5. Submit del form di personalizzazione/creazione
  const form = document.getElementById("customizeProductForm");
  form?.addEventListener("submit", handleFormSubmit);
}

/**
 * Apre la modale per personalizzare un piatto del catalogo Meals
 */
export function openCustomizeModal(meal) {
  activeModalMeal = meal;
  editingIndex = null;
  currentIngredients = [...(meal.ingredients || [])];

  document.getElementById("customizeMealModalLabel").textContent = "Personalizza Piatto";
  const modalBtn = document.getElementById("modalSubmitBtn");
  if (modalBtn) modalBtn.textContent = "Aggiungi al Menù";

  const mealTitle = meal.nameMeal || meal.strMeal || "";
  const mealImg = meal.image || meal.strMealThumb || "/assets/defaultMeal.jpeg";
  const mealCat = meal.category || meal.strCategory || "Altro";

  document.getElementById("modalMealName").value = mealTitle;
  document.getElementById("modalMealPrice").value = "";

  const catSelect = document.getElementById("modalMealCategory");
  const customContainer = document.getElementById("modalCustomCategoryContainer");
  const customInput = document.getElementById("modalCustomCategoryInput");

  const existsInOptions = Array.from(catSelect.options).some((o) => o.value === mealCat);
  if (existsInOptions) {
    catSelect.value = mealCat;
    customContainer?.classList.add("d-none");
    if (customInput) customInput.value = "";
  } else {
    catSelect.value = "custom";
    customContainer?.classList.remove("d-none");
    if (customInput) customInput.value = mealCat;
  }

  document.getElementById("modalMealImg").src = mealImg;
  if (document.getElementById("modalMealFileInput")) document.getElementById("modalMealFileInput").value = "";
  if (document.getElementById("modalMealImageUrl")) document.getElementById("modalMealImageUrl").value = mealImg.startsWith("data:") ? "" : mealImg;
  if (document.getElementById("customIngredientInput")) document.getElementById("customIngredientInput").value = "";

  renderIngredientPills();
  modalInstance?.show();
}

/**
 * Apre la modale per creare un piatto da zero
 */
export function openCreateNewMealModal() {
  activeModalMeal = null;
  editingIndex = null;
  currentIngredients = [];

  document.getElementById("customizeMealModalLabel").textContent = "Crea Nuovo Piatto";
  const modalBtn = document.getElementById("modalSubmitBtn");
  if (modalBtn) modalBtn.textContent = "Aggiungi al Menù";

  document.getElementById("modalMealName").value = "";
  document.getElementById("modalMealPrice").value = "";
  document.getElementById("modalMealCategory").value = "Altro";
  document.getElementById("modalCustomCategoryContainer")?.classList.add("d-none");
  if (document.getElementById("modalCustomCategoryInput")) {
    document.getElementById("modalCustomCategoryInput").value = "";
  }

  document.getElementById("modalMealImg").src = "/assets/defaultMeal.jpeg";
  if (document.getElementById("modalMealFileInput")) document.getElementById("modalMealFileInput").value = "";
  if (document.getElementById("modalMealImageUrl")) document.getElementById("modalMealImageUrl").value = "";
  if (document.getElementById("customIngredientInput")) document.getElementById("customIngredientInput").value = "";

  renderIngredientPills();
  modalInstance?.show();
}

/**
 * Apre la modale per modificare un piatto già aggiunto temporaneamente alla lista di destra
 */
export function openCustomizeModalForEdit(product, index = null) {
  editingIndex = index;
  // Preserva il riferimento al catalogo o ai dati prima della modifica
  activeModalMeal = product.originalMeal || {
    _id: product.mealId || null,
    nameMeal: product.nameMeal,
    category: product.category,
    image: product.image,
    ingredients: [...(product.ingredients || [])]
  };

  const mealTitle = product.nameMeal || activeModalMeal?.nameMeal || "";
  const mealPrice = product.price;
  const mealImg = product.image || activeModalMeal?.image || "/assets/defaultMeal.jpeg";
  const mealCat = formatCategory(product.category || activeModalMeal?.category || "Altro");

  currentIngredients = [...(product.ingredients || [])];

  document.getElementById("customizeMealModalLabel").textContent = "Modifica Piatto";
  const modalBtn = document.getElementById("modalSubmitBtn");
  if (modalBtn) modalBtn.textContent = "Salva Modifiche";

  document.getElementById("modalMealName").value = mealTitle;
  document.getElementById("modalMealPrice").value = mealPrice;

  const catSelect = document.getElementById("modalMealCategory");

  const customContainer = document.getElementById("modalCustomCategoryContainer");
  const customInput = document.getElementById("modalCustomCategoryInput");

  const existsInOptions = Array.from(catSelect.options).some(
    (o) => o.value.toLowerCase() === mealCat.toLowerCase()
  );

  if (existsInOptions) {
    // Seleziona l'opzione esistente corrispondente (evitando discrepanze maiuscole/minuscole)
    const matchingOption = Array.from(catSelect.options).find(
      (o) => o.value.toLowerCase() === mealCat.toLowerCase()
    );
    catSelect.value = matchingOption ? matchingOption.value : mealCat;
    customContainer?.classList.add("d-none");
    if (customInput) customInput.value = "";
  } else {
    catSelect.value = "custom";
    customContainer?.classList.remove("d-none");
    if (customInput) customInput.value = mealCat; // Mostra la categoria formattata (es. "Pizza")
  }

  document.getElementById("modalMealImg").src = mealImg;
  if (document.getElementById("modalMealFileInput")) document.getElementById("modalMealFileInput").value = "";
  if (document.getElementById("modalMealImageUrl")) document.getElementById("modalMealImageUrl").value = mealImg.startsWith("data:") ? "" : mealImg;

  renderIngredientPills();
  modalInstance?.show();
}

/**
 * Gestione invio form modale
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const price = document.getElementById("modalMealPrice").value;
  const name = document.getElementById("modalMealName").value.trim();

  // 1. Risoluzione categoria
  const catSelect = document.getElementById("modalMealCategory");
  const selectedOptionValue = catSelect ? catSelect.value : "";
  const customCatInput = document.getElementById("modalCustomCategoryInput");
  const customCatText = customCatInput ? customCatInput.value.trim() : "";

  let finalCategory = "Altro";
  if (selectedOptionValue === "custom") {
    finalCategory = customCatText ? formatCategory(customCatText) : "Altro";
  } else if (selectedOptionValue) {
    finalCategory = formatCategory(selectedOptionValue);
  }

  // 2. Risoluzione immagine
  const image = document.getElementById("modalMealImg").src || "/assets/defaultMeal.jpeg";

  // 3. Risoluzione mealId: conservato solo se non sono state fatte modifiche rispetto al catalogo
  let preservedMealId = null;
  if (activeModalMeal && activeModalMeal._id) {
    const originalTitle = (activeModalMeal.nameMeal || "").trim();
    const originalCat = (activeModalMeal.category  || "Altro").trim();
    const originalImg = activeModalMeal.image || "/assets/defaultMeal.jpeg";
    const originalIngs = activeModalMeal.ingredients || [];

    const isTitleSame = name === originalTitle;
    const isCategorySame = finalCategory === originalCat;
    const isImageSame = image === originalImg;
    const areIngsSame = areIngredientsEqual(currentIngredients, originalIngs);

    if (isTitleSame && isCategorySame && isImageSame && areIngsSame) {
      preservedMealId = activeModalMeal._id;
    } else preservedMealId = null
  }

  const productData = {
    nameMeal: name,
    category: finalCategory,
    price: parseFloat(price),
    image: image,
    ingredients: [...currentIngredients],
    mealId: preservedMealId,
    originalMeal: activeModalMeal
  };

  if (typeof onSubmitProductCallback === "function") {
    onSubmitProductCallback(productData, editingIndex);
  }

  modalInstance?.hide();
}

/**
 * Renderizza le pillole nel contenitore
 */
function renderIngredientPills() {
  const container = document.getElementById("modalIngredientsList");
  if (!container) return;

  container.innerHTML = "";
  if (currentIngredients.length === 0) {
    container.innerHTML = `<span class="text-secondary small">Nessun ingrediente inserito.</span>`;
    return;
  }

  currentIngredients.forEach((ing, index) => {
    const pill = document.createElement("span");
    pill.className = "ingredient-pill";
    pill.innerHTML = `
      <span>${escapeHtml(ing)}</span>
      <button type="button" class="btn-remove-tag" aria-label="Rimuovi">&times;</button>
    `;

    pill.querySelector(".btn-remove-tag").addEventListener("click", () => {
      currentIngredients.splice(index, 1);
      renderIngredientPills();
    });

    container.appendChild(pill);
  });
}

/**
 * Inserisce un nuovo ingrediente digitato dall'utente
 */
function addCustomIngredient() {
  const input = document.getElementById("customIngredientInput");
  if (!input) return;

  const newIng = input.value.trim();
  if (!newIng) return;

  if (!currentIngredients.includes(newIng)) {
    currentIngredients.push(newIng);
    renderIngredientPills();
  }

  input.value = "";
  input.focus();
}

/**
 * Verifica se due liste di ingredienti sono identiche (stessi elementi nello stesso ordine)
 */
function areIngredientsEqual(arr1 = [], arr2 = []) {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((val, index) => val.trim() === (arr2[index] || "").trim());
}

const formatCategory = (cat) => {
  const str = String(cat || "").trim();
  if (!str) return "Altro";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Aggiorna dinamicamente le opzioni del select categoria nella modale
 */
export function updateModalCategories(categories = []) {
  const select = document.getElementById("modalMealCategory");
  if (!select) return;

  // Unisce le categorie passate rimuovendo duplicati e formattando
  const uniqueCats = [...new Set(categories.map(formatCategory).filter(Boolean))].sort();

  // Rigenera le opzioni
  select.innerHTML = "";

  uniqueCats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

  // Aggiunge sempre l'opzione finale per la categoria personalizzata
  const customOpt = document.createElement("option");
  customOpt.value = "custom";
  customOpt.textContent = "Altra categoria...";
  select.appendChild(customOpt);
}