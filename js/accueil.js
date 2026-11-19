/* ==========================================================================
   accueil.js - PAGE D'ACCUEIL
   Affiche les catégories et les produits de la catégorie choisie.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const zoneCategories = document.getElementById("categories");
  const listeProduits = document.getElementById("productList");
  const titreProduits = document.getElementById("productHeading");
  const admin = estAdmin();

  // Catégorie affichée au départ : la première de la liste
  let categorieChoisie = CATEGORIES[0].nom;

  // --- Affiche les boutons de catégories ---
  function afficherCategories() {
    zoneCategories.innerHTML = CATEGORIES.map(c => `
      <button class="category ${c.nom === categorieChoisie ? "selected" : ""}" data-category="${echapper(c.nom)}">
        <span class="emoji">${c.emoji}</span>
        <strong>${echapper(c.nom)}</strong>
        <small>${echapper(c.description)}</small>
      </button>`).join("");
  }

  // --- Affiche les produits de la catégorie choisie ---
  function afficherProduits() {
    titreProduits.textContent = "2. Produits disponibles : " + categorieChoisie;

    const produits = db.produits.filter(p => p.categorie === categorieChoisie);

    listeProduits.innerHTML = produits.map(p => {
      const source = echapper(imageProduit(p));

      // Pastille de stock : rouge (0), orange (1 à 3), verte (4 et plus)
      const niveau = p.stock === 0 ? "out" : (p.stock <= 3 ? "low" : "ok");
      const texteStock = p.stock === 0 ? "Rupture" : p.stock + " en stock";

      // Boutons : si le stock est vide, on ne peut plus acheter ni échanger
      const boutons = p.stock === 0
        ? '<span class="btn btn-disabled">Rupture de stock</span>'
        : `<a class="btn btn-primary" href="achat.html?produit=${p.id}">🛒 Acheter</a>
           <a class="btn btn-secondary" href="echange.html?produit=${p.id}">🔄 Échanger</a>`;

      return `
      <article class="product">
        <div class="product-image">
          <img class="bg" src="${source}" alt="" aria-hidden="true" loading="lazy" onerror="imageIndisponible(this)">
          <img class="main" src="${source}" alt="${echapper(p.nom)}" loading="lazy" onerror="imageIndisponible(this)">
          <span class="chip">${echapper(p.categorie)}</span>
          <span class="fallback">${emojiCategorie(p.categorie)}</span>
        </div>
        <div class="product-body">
          <h3>${echapper(p.nom)}</h3>
          <div class="product-meta">
            <div class="price">${monnaie(p.prix)}</div>
            <span class="stock-pill ${niveau}">${texteStock}</span>
          </div>
        </div>
        <div class="actions">
          ${boutons}
          ${admin ? `<a class="btn btn-neutral" href="stock.html?modifier=${p.id}">✏️ Modifier</a>` : ""}
        </div>
      </article>`;
    }).join("")
      || '<div class="empty">Aucun produit dans cette catégorie.</div>';
  }

  // --- Clic sur une catégorie ---
  zoneCategories.addEventListener("click", evenement => {
    const bouton = evenement.target.closest("[data-category]");
    if (!bouton) return;
    categorieChoisie = bouton.dataset.category;
    afficherCategories();
    afficherProduits();
  });

  // Premier affichage
  afficherCategories();
  afficherProduits();
});
