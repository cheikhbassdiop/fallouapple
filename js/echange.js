/* ==========================================================================
   echange.js - PAGE NOUVEL ECHANGE
   Un client rend un ancien produit (avec photo) et prend un nouveau produit.
   Il paie la différence ; ce qui n'est pas payé devient une dette.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  // --- Éléments de la page ---
  const formulaire = document.getElementById("exchangeForm");
  const choixProduit = document.getElementById("exchangeProduct");
  const champPhoto = document.getElementById("exchangePhoto");
  const apercu = document.getElementById("photoPreview");
  const champQuantite = document.getElementById("exchangeQty");
  const champPrix = document.getElementById("exchangePrice");
  const champReprise = document.getElementById("tradeValue");
  const champVerse = document.getElementById("exchangePaid");

  // Zones d'affichage du résumé
  const affichageTotal = document.getElementById("exchangeTotal");
  const affichageReprise = document.getElementById("exchangeTrade");
  const affichageDifference = document.getElementById("exchangeDifference");
  const affichageReste = document.getElementById("exchangeDue");

  // Photo de l'ancien produit (une fois réduite)
  let photo = "";

  // Remplit la liste déroulante avec tous les produits
  choixProduit.innerHTML = db.produits.map(p =>
    `<option value="${p.id}">${echapper(p.nom)} — ${monnaie(p.prix)} (stock ${p.stock})</option>`
  ).join("");

  // Si on vient de l'accueil (?produit=NUMERO), ce produit est déjà choisi
  const parametres = new URLSearchParams(location.search);
  if (parametres.get("produit")) choixProduit.value = parametres.get("produit");

  function produitChoisi() {
    return trouverProduit(choixProduit.value);
  }


  // --- Calcul du résumé ---
  //   total      = prix du nouveau produit × quantité
  //   différence = total - valeur de reprise de l'ancien produit
  //   reste dû   = différence - montant déjà versé
  function calculer() {
    const total = (Number(champQuantite.value) || 0) * (Number(champPrix.value) || 0);
    const reprise = Number(champReprise.value) || 0;
    const verse = Number(champVerse.value) || 0;
    const difference = Math.max(0, total - reprise);

    affichageTotal.textContent = monnaie(total);
    affichageReprise.textContent = monnaie(reprise);
    affichageDifference.textContent = monnaie(difference);
    affichageReste.textContent = monnaie(Math.max(0, difference - verse));
  }

  function synchroniserPrix() {
    const produit = produitChoisi();
    if (produit) champPrix.value = produit.prix;
    calculer();
  }

  choixProduit.addEventListener("change", synchroniserPrix);
  [champQuantite, champPrix, champReprise, champVerse].forEach(champ => champ.addEventListener("input", calculer));
  synchroniserPrix();


  // --- Choix de la photo de l'ancien produit ---
  champPhoto.addEventListener("change", async () => {
    photo = "";
    apercu.style.display = "none";
    if (!champPhoto.files[0]) return;

    try {
      photo = await redimensionnerImage(champPhoto.files[0], 900, 0.72);
      apercu.src = photo;
      apercu.style.display = "block";
    } catch (erreur) {
      notifier("Impossible de lire cette image.");
      champPhoto.value = "";
    }
  });


  // --- Envoi du formulaire ---
  formulaire.addEventListener("submit", evenement => {
    evenement.preventDefault();

    const produit = produitChoisi();
    if (!produit) return;

    if (!photo) {
      notifier("La photo de l'ancien produit est obligatoire.");
      return;
    }

    const quantite = Number(champQuantite.value);
    const prix = Number(champPrix.value);
    const reprise = Number(champReprise.value);
    const verse = Number(champVerse.value);
    const client = document.getElementById("exchangeClient").value.trim();
    const telephone = document.getElementById("exchangePhone").value.trim();
    const ancienNom = document.getElementById("oldName").value.trim();
    const total = quantite * prix;
    const difference = Math.max(0, total - reprise);

    // Vérifications
    if (!Number.isSafeInteger(quantite) || quantite < 1 || quantite > produit.stock) {
      notifier("Quantité invalide ou stock insuffisant.");
      return;
    }
    if (!Number.isSafeInteger(prix) || prix <= 0 || !Number.isSafeInteger(reprise) || reprise < 0 || reprise > total || !Number.isSafeInteger(verse) || verse < 0 || verse > difference || !Number.isSafeInteger(total)) {
      notifier("Vérifiez les montants saisis.");
      return;
    }

    // Enregistrement de l'échange
    const reference = nouvelleReference("ECH");
    db.echanges.unshift({
      id: nouveauId(),
      reference,
      client,
      telephone,
      nouveauProduit: produit.nom,
      produitId: produit.id,
      quantite,
      prix,
      total,
      ancienNom,
      ancienneCategorie: document.getElementById("oldCategory").value,
      etat: document.getElementById("oldCondition").value,
      description: document.getElementById("oldDescription").value.trim(),
      photo,
      reprise,
      difference,
      verse,
      date: maintenant()
    });

    // Le stock diminue
    produit.stock -= quantite;

    // S'il reste une somme à payer, on crée une dette
    if (difference - verse > 0) {
      db.dettes.unshift({
        id: nouveauId(),
        client,
        telephone,
        origine: reference,
        montant: difference - verse,
        paye: 0,
        date: maintenant()
      });
    }

    ajouterHistorique("Échange", ancienNom + " contre " + produit.nom, client, difference);

    if (!sauvegarder()) return;
    notifier("Échange enregistré avec la photo.");
    location.href = "echanges.html";
  });
});
