/* ==========================================================================
   stock.js - PAGE PRODUITS ET STOCK

   Tout le monde peut consulter la liste du stock.
   L'administrateur (connecté) peut en plus :
     - AJOUTER un article (avec une photo)
     - MODIFIER un article
     - SUPPRIMER un article
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const admin = estAdmin();

  // --- Éléments de la page ---
  const formulaire = document.getElementById("productForm");
  const titreFormulaire = document.getElementById("formTitle");
  const boutonEnvoyer = document.getElementById("productSubmit");
  const boutonAnnuler = document.getElementById("productCancel");
  const recherche = document.getElementById("stockSearch");
  const tableau = document.getElementById("stockTable");

  const champId = document.getElementById("productId");
  const champNom = document.getElementById("productName");
  const champCategorie = document.getElementById("productCategory");
  const champPrix = document.getElementById("productPrice");
  const champStock = document.getElementById("productStock");
  const champUrl = document.getElementById("productImageUrl");
  const champFichier = document.getElementById("productImageFile");
  const apercu = document.getElementById("imagePreview");

  // Image choisie sur l'appareil (texte) et image déjà enregistrée (en cas de modification)
  let imageFichier = "";
  let imageActuelle = "";

  // La liste déroulante des catégories vient de CATEGORIES (donnees.js)
  champCategorie.innerHTML = CATEGORIES.map(c =>
    `<option>${echapper(c.nom)}</option>`).join("");


  /* ------------------------------------------------------------------------
     APERCU DE L'IMAGE
     ------------------------------------------------------------------------ */

  // Image à montrer : fichier choisi, sinon lien saisi, sinon image déjà enregistrée
  function imageChoisie() {
    return imageFichier || champUrl.value.trim() || imageActuelle;
  }

  function mettreAJourApercu() {
    const source = imageChoisie();
    if (source) {
      apercu.src = source;
      apercu.style.display = "block";
    } else {
      apercu.style.display = "none";
    }
  }

  // Si le lien ne mène pas à une image, on cache l'aperçu
  apercu.addEventListener("error", () => { apercu.style.display = "none"; });

  champUrl.addEventListener("input", mettreAJourApercu);

  // Choix d'une photo sur l'appareil : on la réduit avant de la garder
  champFichier.addEventListener("change", async () => {
    imageFichier = "";
    if (champFichier.files[0]) {
      try {
        imageFichier = await redimensionnerImage(champFichier.files[0], 700, 0.75);
      } catch (erreur) {
        notifier("Impossible de lire cette image.");
        champFichier.value = "";
      }
    }
    mettreAJourApercu();
  });


  /* ------------------------------------------------------------------------
     AFFICHAGE DE LA LISTE DU STOCK
     ------------------------------------------------------------------------ */
  function afficherListe() {
    const texte = normaliserRecherche(recherche.value);
    const produits = db.produits.filter(p => normaliserRecherche(p.nom + " " + p.categorie).includes(texte));

    // Nombre de colonnes (la colonne "Actions" n'existe que pour l'administrateur)
    const colonnes = admin ? 6 : 5;

    tableau.innerHTML = produits.map(p => `
      <tr>
        <td data-label="Image">
          <img class="thumb" src="${echapper(imageProduit(p))}" alt="" loading="lazy"
               onerror="this.style.visibility='hidden'">
        </td>
        <td data-label="Produit">${echapper(p.nom)}</td>
        <td data-label="Catégorie">${echapper(p.categorie)}</td>
        <td data-label="Prix">${monnaie(p.prix)}</td>
        <td data-label="Stock">${p.stock}</td>
        ${admin ? `
        <td data-label="Actions">
          <button class="btn btn-neutral btn-small" data-action="modifier" data-id="${p.id}">✏️ Modifier</button>
          <button class="btn btn-danger btn-small" data-action="supprimer" data-id="${p.id}">🗑 Supprimer</button>
        </td>` : ""}
      </tr>`).join("")
      || `<tr><td colspan="${colonnes}" class="empty">Aucun produit.</td></tr>`;
  }


  /* ------------------------------------------------------------------------
     MODIFIER / SUPPRIMER (boutons de la liste, réservés à l'administrateur)
     ------------------------------------------------------------------------ */

  // Remplit le formulaire avec les informations d'un produit existant
  function commencerModification(id) {
    const produit = trouverProduit(id);
    if (!produit) return;

    champId.value = produit.id;
    champNom.value = produit.nom;
    champCategorie.value = produit.categorie;
    champPrix.value = produit.prix;
    champStock.value = produit.stock;

    // Image : un lien est montré dans le champ ; une photo enregistrée est simplement gardée
    const image = produit.image || "";
    champUrl.value = image.startsWith("http") ? image : "";
    imageActuelle = image.startsWith("data:") ? image : "";
    imageFichier = "";
    champFichier.value = "";

    titreFormulaire.textContent = "Modifier l'article";
    boutonEnvoyer.textContent = "Enregistrer les modifications";
    boutonAnnuler.hidden = false;

    mettreAJourApercu();
    formulaire.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Remet le formulaire en mode "ajout"
  function reinitialiserFormulaire() {
    formulaire.reset();
    champId.value = "";
    imageFichier = "";
    imageActuelle = "";
    titreFormulaire.textContent = "Ajouter un article";
    boutonEnvoyer.textContent = "Ajouter l'article";
    boutonAnnuler.hidden = true;
    mettreAJourApercu();
  }

  // Supprime un produit après confirmation
  function supprimerProduit(id) {
    const produit = trouverProduit(id);
    if (!produit) return;
    if (!confirm('Supprimer définitivement "' + produit.nom + '" ?')) return;

    const anciensProduits = db.produits;
    const ancienHistorique = db.historique;
    db.produits = db.produits.filter(p => p.id !== produit.id);
    ajouterHistorique("Stock", "Suppression du produit : " + produit.nom, "—", 0);
    if (!sauvegarder()) {
      db.produits = anciensProduits;
      db.historique = ancienHistorique;
      return;
    }
    afficherListe();
    notifier("Produit supprimé.");
  }

  // Clics sur les boutons "Modifier" et "Supprimer" de la liste
  tableau.addEventListener("click", evenement => {
    const bouton = evenement.target.closest("[data-action]");
    if (!bouton || !admin) return;

    if (bouton.dataset.action === "modifier") commencerModification(bouton.dataset.id);
    if (bouton.dataset.action === "supprimer") supprimerProduit(bouton.dataset.id);
  });

  boutonAnnuler.addEventListener("click", reinitialiserFormulaire);


  /* ------------------------------------------------------------------------
     ENVOI DU FORMULAIRE (ajout ou modification)
     ------------------------------------------------------------------------ */
  formulaire.addEventListener("submit", evenement => {
    evenement.preventDefault();
    if (!admin) return;   // sécurité : seul l'administrateur peut enregistrer

    const nom = champNom.value.trim();
    const categorie = champCategorie.value;
    const prix = Number(champPrix.value);
    const stock = Number(champStock.value);
    const lien = champUrl.value.trim();

    // --- Vérifications ---
    if (!nom || prix <= 0 || stock < 0 || !Number.isInteger(stock)) {
      notifier("Vérifiez les informations du produit.");
      return;
    }
    if (lien && !/^https?:\/\//i.test(lien)) {
      notifier("Le lien de l'image doit commencer par http:// ou https://");
      return;
    }

    // Image finale : photo de l'appareil, sinon lien, sinon image déjà enregistrée.
    // Si rien n'est donné, l'image par défaut de la catégorie sera utilisée.
    const image = imageFichier || lien || imageActuelle;

    if (champId.value) {
      // --- MODIFICATION d'un produit existant ---
      const produit = trouverProduit(champId.value);
      if (!produit) {
        notifier("Ce produit n'existe plus. Actualisez la page.");
        return;
      }
      produit.nom = nom;
      produit.categorie = categorie;
      produit.prix = prix;
      produit.stock = stock;
      produit.image = image;
      ajouterHistorique("Stock", "Modification du produit : " + nom, "—", 0);
    } else {
      // --- AJOUT d'un nouveau produit ---
      db.produits.push({ id: nouveauId(), nom, categorie, prix, stock, image });
      ajouterHistorique("Stock", "Ajout du produit : " + nom, "—", 0);
    }

    if (!sauvegarder()) return;   // en cas d'échec, un message est déjà affiché

    const etaitModification = Boolean(champId.value);
    reinitialiserFormulaire();
    afficherListe();
    notifier(etaitModification ? "Produit modifié." : "Produit ajouté : il apparaît sur l'accueil.");
  });


  /* ------------------------------------------------------------------------
     DEMARRAGE
     ------------------------------------------------------------------------ */
  recherche.addEventListener("input", afficherListe);
  afficherListe();

  // Depuis l'accueil, le bouton "Modifier" ouvre cette page avec ?modifier=NUMERO
  const idAModifier = new URLSearchParams(location.search).get("modifier");
  if (admin && idAModifier) commencerModification(idAModifier);
});
