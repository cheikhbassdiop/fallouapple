/* ==========================================================================
   donnees.js - DONNEES ET OUTILS COMMUNS

   Ce fichier est chargé en premier sur toutes les pages.
   Il contient :
     1. Les réglages (catégories, images par défaut)
     2. Les données de départ et leur sauvegarde
     3. Des petites fonctions utilitaires utilisées partout
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. REGLAGES
   -------------------------------------------------------------------------- */

// Nom sous lequel les données sont enregistrées dans le navigateur.
// NE PAS CHANGER : sinon les données déjà enregistrées ne seraient plus retrouvées.
const STORAGE_KEY = "lebalma_gestion_v1";

// Liste des catégories de produits.
// Pour ajouter une catégorie, il suffit d'ajouter une ligne ici.
const CATEGORIES = [
  { nom: "Téléphones",  emoji: "📱", description: "Mobiles et smartphones" },
  { nom: "Vélos",       emoji: "🚲", description: "Vélos disponibles" },
  { nom: "Scooters",    emoji: "🛵", description: "Scooters et cyclomoteurs" },
  { nom: "Accessoires", emoji: "🎧", description: "Équipements divers" }
];

// Photo utilisée quand un article n'a pas d'image personnelle (une par catégorie).
const IMAGES_PAR_DEFAUT = {
  "Téléphones":  "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=700&q=85",
  "Vélos":       "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=700&q=85",
  "Scooters":    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=700&q=85",
  "Accessoires": "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=85"
};


/* --------------------------------------------------------------------------
   2. DONNEES DE DEPART ET SAUVEGARDE
   -------------------------------------------------------------------------- */

// Données utilisées la toute première fois (8 produits d'exemple).
function donneesInitiales() {
  return {
    produits: [
      { id: 1, nom: "iPhone 11",            categorie: "Téléphones",  prix: 155000, stock: 5,
        image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=700&q=85" },
      { id: 2, nom: "Samsung Galaxy A15",   categorie: "Téléphones",  prix: 95000,  stock: 8,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=85" },
      { id: 3, nom: "Redmi Note 13",        categorie: "Téléphones",  prix: 110000, stock: 6,
        image: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=700&q=85" },
      { id: 4, nom: "Vélo classique",       categorie: "Vélos",       prix: 85000,  stock: 4,
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=700&q=85" },
      { id: 5, nom: "Vélo VTT",             categorie: "Vélos",       prix: 125000, stock: 3,
        image: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=700&q=85" },
      { id: 6, nom: "Scooter 125 cc",       categorie: "Scooters",    prix: 650000, stock: 2,
        image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=700&q=85" },
      { id: 7, nom: "Casque de protection", categorie: "Accessoires", prix: 25000,  stock: 10,
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=85" },
      { id: 8, nom: "Écouteurs Bluetooth",  categorie: "Accessoires", prix: 12000,  stock: 15,
        image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=85" }
    ],
    commandes: [],    // commandes clients en attente
    ventes: [],       // achats des clients
    echanges: [],     // échanges (ancien produit contre nouveau)
    dettes: [],       // sommes restant à payer par les clients
    historique: [],   // journal de toutes les opérations
    fournisseurs: [], // répertoire des fournisseurs
    approvisionnements: [], // entrées de stock auprès des fournisseurs
    prochainId: 9     // prochain numéro disponible pour un nouvel élément
  };
}

// --- Sauvegarde de secours ---
// Certains navigateurs ouvrent chaque fichier .html comme un site séparé
// quand on double-clique dessus (sans serveur). Dans ce cas, les pages
// ne partagent pas leur stockage et un achat enregistré n'apparaît pas
// dans la page Ventes. Pour éviter de perdre les données, on garde aussi
// une copie dans "window.name", qui suit l'onglet d'une page à l'autre.
const MARQUE_SECOURS = "IDEAL_DB:";

// Devient true si on a dû utiliser la copie de secours.
let modeSecours = false;

function lireCopieSecours() {
  try {
    if (window.name.startsWith(MARQUE_SECOURS)) return window.name.slice(MARQUE_SECOURS.length);
  } catch (erreur) { /* rien */ }
  return null;
}

function ecrireCopieSecours(json) {
  try { window.name = MARQUE_SECOURS + json; } catch (erreur) { /* rien */ }
}

// Lit un texte JSON et renvoie l'objet, ou null si le texte est absent ou abîmé.
function lireJson(texte) {
  try { return texte ? JSON.parse(texte) : null; } catch (erreur) { return null; }
}

// Lit les données enregistrées.
// On compare le stockage du navigateur et la copie de secours,
// et on garde la plus récente (champ "maj" = date de dernière sauvegarde).
const API_BASE = "backend";
let modeServeur = false;
let erreurServeur = "";

function appelAPI(url, method = "GET", payload = null) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open(method, API_BASE + url, false);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    if (payload !== null) xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(payload === null ? null : JSON.stringify(payload));
    let data = {}; try { data = JSON.parse(xhr.responseText || "{}"); } catch (_) {}
    return { ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data };
  } catch (e) { return { ok: false, status: 0, data: { error: "Serveur inaccessible" } }; }
}

function chargerDonnees() {
  const serveur = appelAPI("/api/state.php");
  if (serveur.ok) {
    modeServeur = true;
    if (serveur.data.state && typeof serveur.data.state === "object") return normaliserDonnees(serveur.data.state);
    // Première connexion : proposer les données locales existantes comme point de départ.
    let anciennes = null;
    try { anciennes = lireJson(localStorage.getItem(STORAGE_KEY)); } catch (_) {}
    if (anciennes && typeof anciennes === "object") {
      const user = appelAPI("/auth.php?action=me");
      const migration = normaliserDonnees(anciennes);
      if (user.ok && user.data.user && ["admin", "manager"].includes(user.data.user.role)) {
        const sauvegardeInitiale = appelAPI("/api/state.php", "PUT", { state: migration });
        if (sauvegardeInitiale.ok) return migration;
        erreurServeur = sauvegardeInitiale.data.error || "Migration des données locales impossible.";
      }
      return migration;
    }
    return donneesInitiales();
  }
  if (serveur.status === 401) erreurServeur = "Connectez-vous pour synchroniser vos données avec MySQL.";
  else if (serveur.status === 503 || serveur.status >= 500) erreurServeur = serveur.data.error || "Backend MySQL non configuré.";
  let local = null;
  try {
    local = lireJson(localStorage.getItem(STORAGE_KEY));
  } catch (erreur) {
    modeSecours = true;   // le navigateur interdit le stockage
  }
  const secours = lireJson(lireCopieSecours());

  let choisies = local;
  if (secours && (!local || (secours.maj || 0) > (local.maj || 0))) {
    choisies = secours;
    modeSecours = true;   // la copie de secours est plus récente : le stockage n'est pas partagé
  }

  // Rien d'enregistré : on repart des données initiales
  if (!choisies || typeof choisies !== "object") return donneesInitiales();
  return normaliserDonnees(choisies);
}

function normaliserDonnees(choisies) {
  const base = donneesInitiales();
  const resultat = { ...base, ...choisies };
  // Une sauvegarde ancienne ou partiellement corrompue ne doit pas faire planter l'application.
  for (const cle of ["produits", "commandes", "ventes", "echanges", "dettes", "historique", "fournisseurs", "approvisionnements"]) {
    if (!Array.isArray(resultat[cle])) resultat[cle] = [];
  }
  const ids = [...resultat.produits, ...resultat.ventes, ...resultat.echanges, ...resultat.dettes]
    .map(element => Number(element && element.id) || 0);
  resultat.prochainId = Math.max(Number(resultat.prochainId) || 1, ...ids.map(id => id + 1));
  return resultat;
}

// "db" contient toutes les données du site pendant que la page est ouverte.
let db = chargerDonnees();

// Enregistre "db". Renvoie true si ça a marché, false si l'espace est plein.
function sauvegarder() {
  db.maj = Date.now();
  const json = JSON.stringify(db);
  if (modeServeur) {
    const resultat = appelAPI("/api/state.php", "PUT", { state: db });
    if (!resultat.ok) {
      notifier(resultat.data.error || "Échec de synchronisation avec MySQL. Vos changements ne sont pas confirmés.");
      return false;
    }
    try { localStorage.setItem(STORAGE_KEY, json); } catch (_) {}
    return true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch (erreur) {
    if (erreur && erreur.name === "QuotaExceededError") {
      notifier("Enregistrement impossible : espace plein. Utilisez des images plus légères.");
      return false;
    }
    modeSecours = true;   // stockage interdit : on se rabat sur la copie de secours
  }

  ecrireCopieSecours(json);
  return true;
}


/* --------------------------------------------------------------------------
   3. FONCTIONS UTILITAIRES
   -------------------------------------------------------------------------- */

// Écrit un nombre en argent : 155000 -> "155 000 F CFA"
function monnaie(n) {
  return Math.round(Number(n) || 0).toLocaleString("fr-FR") + " F CFA";
}

// Rend un texte sans danger avant de l'afficher dans la page
// (empêche qu'un nom contenant < ou > casse l'affichage).
function echapper(texte) {
  const remplacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(texte ?? "").replace(/[&<>"']/g, caractere => remplacements[caractere]);
}

// Date et heure actuelles, en français.
function maintenant() {
  return new Date().toLocaleString("fr-FR");
}

// Affiche un petit message en bas de l'écran pendant environ 3 secondes.
function notifier(message) {
  let element = document.getElementById("notification");

  // Si la page n'a pas encore de zone de notification, on la crée.
  if (!element) {
    element = document.createElement("div");
    element.id = "notification";
    element.className = "notice";
    document.body.appendChild(element);
  }

  element.textContent = message;
  element.style.display = "block";

  clearTimeout(window._notificationTimer);
  window._notificationTimer = setTimeout(() => { element.style.display = "none"; }, 3200);
}

// Donne un nouveau numéro unique (pour un produit, une vente, etc.).
function nouveauId() {
  return db.prochainId++;
}

// Produit une référence lisible et unique, même si plusieurs opérations
// sont enregistrées pendant la même milliseconde.
function nouvelleReference(prefixe) {
  let reference;
  const references = new Set([
    ...db.commandes.map(item => item.reference),
    ...db.ventes.map(item => item.reference),
    ...db.echanges.map(item => item.reference)
  ]);
  do {
    reference = `${prefixe}-${Date.now()}-${nouveauId()}`;
  } while (references.has(reference));
  return reference;
}

// Recherche tolérante aux majuscules et aux accents.
function normaliserRecherche(texte) {
  return String(texte ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Montant qu'il reste à payer sur une dette.
function soldeDette(dette) {
  return Math.max(0, dette.montant - dette.paye);
}

// Retrouve un produit à partir de son numéro.
function trouverProduit(id) {
  return db.produits.find(produit => produit.id === Number(id));
}

// Ajoute une ligne dans l'historique général.
function ajouterHistorique(type, detail, client, montant) {
  db.historique.unshift({ type, detail, client, montant, date: maintenant() });
}


/* --------------------------------------------------------------------------
   4. IMAGES
   -------------------------------------------------------------------------- */

// Renvoie l'image à afficher pour un produit :
// son image personnelle, sinon l'image par défaut de sa catégorie.
function imageProduit(produit) {
  return produit.image || IMAGES_PAR_DEFAUT[produit.categorie] || "";
}

// Renvoie l'emoji d'une catégorie (affiché si l'image ne charge pas).
function emojiCategorie(nomCategorie) {
  const categorie = CATEGORIES.find(c => c.nom === nomCategorie);
  return categorie ? categorie.emoji : "📦";
}

// Appelée quand une image ne se charge pas (pas de connexion, lien cassé...) :
// on retire les images de la zone et on laisse l'emoji à la place.
function imageIndisponible(image) {
  const zone = image.parentElement;
  zone.classList.add("no-img");
  zone.querySelectorAll("img").forEach(img => img.remove());
}

// Réduit une photo choisie sur l'appareil pour qu'elle prenne peu de place.
// Renvoie (via une promesse) l'image sous forme de texte, prête à être enregistrée.
//   fichier   : le fichier choisi par l'utilisateur
//   tailleMax : plus grand côté de l'image, en pixels
//   qualite   : qualité JPEG de 0 à 1
function redimensionnerImage(fichier, tailleMax = 900, qualite = 0.72) {
  return new Promise((resoudre, rejeter) => {
    // On refuse tout ce qui n'est pas une image.
    if (!fichier || !fichier.type.startsWith("image/")) {
      rejeter(new Error("Ce fichier n'est pas une image."));
      return;
    }

    const lecteur = new FileReader();
    lecteur.onerror = rejeter;

    lecteur.onload = () => {
      const image = new Image();
      image.onerror = rejeter;

      image.onload = () => {
        // Calcul du facteur de réduction (jamais d'agrandissement)
        const echelle = Math.min(1, tailleMax / Math.max(image.width, image.height));

        // On dessine l'image réduite dans un canvas, puis on la convertit en JPEG.
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * echelle);
        canvas.height = Math.round(image.height * echelle);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resoudre(canvas.toDataURL("image/jpeg", qualite));
      };

      image.src = lecteur.result;
    };

    lecteur.readAsDataURL(fichier);
  });
}
