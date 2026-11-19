/* ==========================================================================
   achat.js - PAGE NOUVEL ACHAT
   Enregistre la vente d'un produit à un client.
   Si le client ne paie pas tout, la différence devient une dette.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  // --- Éléments de la page ---
  const formulaire = document.getElementById("purchaseForm");
  const choixProduit = document.getElementById("purchaseProduct");
  const champQuantite = document.getElementById("purchaseQty");
  const champPrix = document.getElementById("purchasePrice");
  const champVerse = document.getElementById("purchasePaid");
  const affichageTotal = document.getElementById("purchaseTotal");
  const affichageReste = document.getElementById("purchaseDue");

  // Remplit la liste déroulante avec tous les produits
  choixProduit.innerHTML = db.produits.map(p =>
    `<option value="${p.id}">${echapper(p.nom)} — ${monnaie(p.prix)} (stock ${p.stock})</option>`
  ).join("");

  // Si on vient de l'accueil (?produit=NUMERO), ce produit est déjà choisi
  const parametres = new URLSearchParams(location.search);
  if (parametres.get("produit")) choixProduit.value = parametres.get("produit");

  // Produit actuellement choisi
  function produitChoisi() {
    return trouverProduit(choixProduit.value);
  }

  // Calcule le total et le reste à payer, puis les affiche
  function calculer() {
    const total = (Number(champQuantite.value) || 0) * (Number(champPrix.value) || 0);
    const verse = Number(champVerse.value) || 0;

    affichageTotal.textContent = monnaie(total);
    affichageReste.textContent = monnaie(Math.max(0, total - verse));
  }

  // Quand on change de produit, le prix du produit est proposé automatiquement
  function synchroniserPrix() {
    const produit = produitChoisi();
    if (produit) champPrix.value = produit.prix;
    calculer();
  }

  choixProduit.addEventListener("change", synchroniserPrix);
  [champQuantite, champPrix, champVerse].forEach(champ => champ.addEventListener("input", calculer));
  synchroniserPrix();


  // --- Envoi du formulaire ---
  formulaire.addEventListener("submit", evenement => {
    evenement.preventDefault();

    const produit = produitChoisi();
    const quantite = Number(champQuantite.value);
    const prix = Number(champPrix.value);
    const verse = Number(champVerse.value);
    const client = document.getElementById("purchaseClient").value.trim();
    const telephone = document.getElementById("purchasePhone").value.trim();
    const total = quantite * prix;

    // Vérifications
    if (!produit) {
      notifier("Choisissez un produit.");
      return;
    }
    if (!Number.isSafeInteger(quantite) || quantite < 1 || quantite > produit.stock) {
      notifier("Quantité invalide ou stock insuffisant.");
      return;
    }
    if (!Number.isSafeInteger(prix) || prix <= 0 || !Number.isSafeInteger(verse) || verse < 0 || verse > total || !Number.isSafeInteger(total)) {
      notifier("Vérifiez le prix et le montant versé.");
      return;
    }

    // Enregistrement de la vente
    const reference = nouvelleReference("VTE");
    db.ventes.unshift({
      id: nouveauId(),
      reference,
      client,
      telephone,
      produit: produit.nom,
      produitId: produit.id,
      quantite,
      prix,
      coutUnitaire: Number(produit.cout || 0),
      total,
      verse,
      mode: document.getElementById("purchaseMethod").value,
      date: maintenant()
    });

    // Le stock diminue
    produit.stock -= quantite;

    // S'il reste une somme à payer, on crée une dette
    if (total - verse > 0) {
      db.dettes.unshift({
        id: nouveauId(),
        client,
        telephone,
        origine: reference,
        montant: total - verse,
        paye: 0,
        date: maintenant()
      });
    }

    ajouterHistorique("Vente", quantite + " × " + produit.nom, client, total);

    if (!sauvegarder()) return;
    notifier("Achat enregistré.");
    location.href = "ventes.html";
  });
});
